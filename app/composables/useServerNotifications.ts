// app/composables/useServerNotifications.ts
//
// Module-scoped singleton composable (per Nuxt 4 convention in this project —
// no Pinia). Owns:
//   • the notification list surfaced to the bell dropdown / page
//   • the toaster queue for in-app bottom-right toasts
//   • the polling loop (start/stop)
//   • the "seen UUIDs" set used to distinguish new vs already-shown
//   • browser Notification (push) delivery
//
// Two visibility surfaces:
//   1. In-app toast — always shown for a *new* notification (title + body).
//   2. Browser push — shown via Notification API only when tab is hidden or
//      when the user has granted permission and we're on desktop.
//
// Click routing (both toast & bell item):
//   customer_proforma_invoice → /customers/proforma-invoice/[uuid]
//   customer_quotation        → /customers/quotation/[uuid]
//   asset                     → /assets/[uuid]
//   inventory                 → /inventory/[uuid]
//   patient_visit             → /patients/[uuid]   (best-effort fallback)
//   *other*                   → /notifications
//
// Poll cadence: 30s base, ±5s jitter, paused when tab hidden, resumed on
// visibilitychange. 30s is a good balance for HIS surfaces where the
// most time-sensitive item is "visit scheduled today" / "proforma unsettled" —
// neither is second-critical. Bumping below ~15s would meaningfully raise
// backend load without a clinical win.

export type NotificationUrgency = 'low' | 'medium' | 'high' | 'critical'

export interface ServerNotification {
  type: 'notification'
  uuid: string
  object_type: string
  object_uuid: string | { parent_uuid?: string; child_uuid?: string }
  process_key: string
  urgency: NotificationUrgency
  title: string
  body: string | null
  created_at: string
  push?: {
    notification?: { title?: string; body?: string | null }
    data?: Record<string, unknown>
  }
}

interface ToastItem {
  id: string
  notification: ServerNotification
}

// ── Singleton refs (module-scoped, one instance per client tab) ────────────
const notifications = ref<ServerNotification[]>([])
const toasts        = ref<ToastItem[]>([])
const loading       = ref(false)
const lastFetchedAt = ref<Date | null>(null)

const seenUuids     = new Set<string>()
let   hasSeeded     = false           // first fetch just seeds; no toasts fired
let   pollTimer: ReturnType<typeof setTimeout> | null = null
let   visibilityBound = false

// Lazy config reader — useRuntimeConfig() needs Nuxt context, so read on demand.
const cfg = () => useRuntimeConfig().public as {
  notifPollMs: number
  notifPollJitterMs: number
  notifToastTtlMs: number
  notifMaxToasts: number
  notifBannerTtlMs: number
}

// ── Landing banner state (shown on the page the user was redirected to) ──
export interface BannerState {
  notification: ServerNotification
  targetPath: string    // path we navigated to; banner auto-clears when route leaves
  openedAt: number
}
const lastOpenedBanner = ref<BannerState | null>(null)
let bannerDismissTimer: ReturnType<typeof setTimeout> | null = null

// ── Route mapping ──────────────────────────────────────────────────────────
// REPLACE the whole function:
function routeForNotification(n: ServerNotification): string {
  switch (n.object_type) {
    case 'customer_proforma_invoice': {
      const { parent_uuid: customerUuid, child_uuid: proformaUuid } =
        (n.object_uuid ?? {}) as { parent_uuid?: string; child_uuid?: string }
      return proformaUuid
        ? `/customers/proforma-invoice/${proformaUuid}?customer_uuid=${customerUuid ?? ''}`
        : '/notifications'
    }
    case 'customer_quotation': {
      const { parent_uuid: customerUuid, child_uuid: quotationUuid } =
        (n.object_uuid ?? {}) as { parent_uuid?: string; child_uuid?: string }
      return quotationUuid
        ? `/customers/quotation/${quotationUuid}?customer_uuid=${customerUuid ?? ''}`
        : '/notifications'
    }
    case 'asset':                        return `/assets/${n.object_uuid as string}`
    case 'inventory':                    return `/inventory/${n.object_uuid as string}`
    case 'patient_visit':                return `/patients/${n.object_uuid as string}` // best-effort fallback, unchanged
    case 'laboratory_order_test_result': return `/orders/test/${n.object_uuid as string}`
    default:                             return '/notifications'
  }
}

// ── Browser push (Notification API) ────────────────────────────────────────
async function ensurePushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'default') {
    try { return await Notification.requestPermission() } catch { return 'denied' }
  }
  return Notification.permission
}

function firePushNotification(n: ServerNotification) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  // Only fire an OS-level push when the tab isn't focused — otherwise the
  // in-app toast is the primary channel and OS pop-ups become redundant noise.
  if (document.visibilityState === 'visible' && document.hasFocus()) return

  const title = n.push?.notification?.title ?? n.title
  const body  = n.push?.notification?.body ?? n.body ?? ''

  try {
    const notif = new Notification(title, {
      body: body || undefined,
      tag:  n.uuid,                     // dedupes rapid duplicates
      icon: '/images/ibcc_logo.png',
      badge: '/images/ibcc_logo.png',
      data: { url: routeForNotification(n), ...(n.push?.data ?? {}) },
      requireInteraction: n.urgency === 'high' || n.urgency === 'critical',
    })
    notif.onclick = () => {
      window.focus()
      const url = (notif.data as { url?: string })?.url
      if (url) navigateTo(url)
      notif.close()
    }
  } catch {
    // some browsers reject when tab is background & no service worker — ignore
  }
}

// ── Toast plumbing ─────────────────────────────────────────────────────────
function pushToast(n: ServerNotification) {
  const { notifMaxToasts, notifToastTtlMs } = cfg()
  const id = `${n.uuid}-${Date.now()}`
  toasts.value.push({ id, notification: n })
  if (toasts.value.length > notifMaxToasts) {
    toasts.value.splice(0, toasts.value.length - notifMaxToasts)
  }
  setTimeout(() => dismissToast(id), notifToastTtlMs)
}

function dismissToast(id: string) {
  const i = toasts.value.findIndex(t => t.id === id)
  if (i !== -1) toasts.value.splice(i, 1)
}

// ── Fetch + diff ───────────────────────────────────────────────────────────
async function fetchOnce(silent = true) {
  loading.value = true
  try {
    const { request } = useApi()
    const data = await request<{ data: ServerNotification[] } | ServerNotification[]>(
      '/notifications',
      { method: 'GET', silent }
    )
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    notifications.value = list
    lastFetchedAt.value = new Date()

    if (!hasSeeded) {
      // seed known UUIDs so we don't toast the entire backlog on first login
      list.forEach(n => seenUuids.add(n.uuid))
      hasSeeded = true
    } else {
      // fire toasts + push for genuinely new ones (newest first, cap at 3)
      const fresh = list.filter(n => !seenUuids.has(n.uuid)).slice(0, 3)
      for (const n of fresh) {
        seenUuids.add(n.uuid)
        pushToast(n)
        firePushNotification(n)
      }
    }
  } catch {
    // silent — polling failures shouldn't spam the user
  } finally {
    loading.value = false
  }
}

// ── Poll loop with visibility pause + jitter ───────────────────────────────
function schedule() {
  if (pollTimer) clearTimeout(pollTimer)
  const { notifPollMs, notifPollJitterMs } = cfg()
  const jitter = Math.floor((Math.random() - 0.5) * 2 * notifPollJitterMs)
  pollTimer = setTimeout(async () => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      await fetchOnce(true)
    }
    if (pollTimer !== null) schedule()
  }, notifPollMs + jitter)
}

function bindVisibilityOnce() {
  if (visibilityBound || typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && pollTimer) {
      // tab came back → refresh immediately, don't wait 30s
      fetchOnce(true)
    }
  })
  visibilityBound = true
}

// ── Public API ─────────────────────────────────────────────────────────────
async function start() {
  if (pollTimer) return                 // already running
  bindVisibilityOnce()
  await ensurePushPermission()          // ok if user declines
  await fetchOnce(true)                 // initial seed
  schedule()
}

function stop() {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null }
  notifications.value = []
  toasts.value = []
  seenUuids.clear()
  hasSeeded = false
  lastFetchedAt.value = null
  // NEW ↓
  lastOpenedBanner.value = null
  if (bannerDismissTimer) { clearTimeout(bannerDismissTimer); bannerDismissTimer = null }
}

async function refresh() {
  await fetchOnce(true)
}

function markSeen(uuid: string) {
  seenUuids.add(uuid)
}

function handleClick(n: ServerNotification) {
  markSeen(n.uuid)
  const target = routeForNotification(n)

  // Strip query string when recording the "target path" the banner watches,
  // so route.path === targetPath matches even if query params differ later.
  const targetPath = target.split('?')[0]!

  lastOpenedBanner.value = {
    notification: n,
    targetPath,
    openedAt: Date.now(),
  }

  // Auto-dismiss after configured TTL — a persistent banner would become noise.
  if (bannerDismissTimer) clearTimeout(bannerDismissTimer)
  bannerDismissTimer = setTimeout(() => {
    lastOpenedBanner.value = null
  }, cfg().notifBannerTtlMs)

  navigateTo(target)
}

function dismissBanner() {
  lastOpenedBanner.value = null
  if (bannerDismissTimer) { clearTimeout(bannerDismissTimer); bannerDismissTimer = null }
}

export function useServerNotifications() {
  return {
    // state
    notifications,
    toasts,
    loading,
    lastFetchedAt,
    lastOpenedBanner,           // NEW
    // actions
    start,
    stop,
    refresh,
    dismissToast,
    dismissBanner,              // NEW
    handleClick,
    routeForNotification,
  }
}