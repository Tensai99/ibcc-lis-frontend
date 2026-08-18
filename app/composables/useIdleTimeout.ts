// app/composables/useIdleTimeout.ts
//
// Idle-timeout guard. Two phases:
//   Phase 1 — Idle period (NUXT_PUBLIC_IDLE_TIMEOUT_MS, default 60s)
//             User is silent (no mouse / key / touch / scroll). When the
//             timer elapses, the "Are you still there?" modal opens and the
//             grace period begins.
//   Phase 2 — Grace period (NUXT_PUBLIC_IDLE_GRACE_MS, default 30s)
//             Countdown runs. If the user clicks "I'm here" (or moves at all
//             — see notes below) the modal closes and Phase 1 restarts.
//             If the grace timer reaches zero, useLogout().logout() is called.
//
// Design notes:
//   • Activity listeners are throttled (max ~1 reset every 500 ms) to avoid
//     resetting on every mousemove pixel.
//   • Once the prompt is open, we intentionally STOP resetting on activity —
//     the whole point is to make the user explicitly confirm they're there.
//     Movement while the modal is up should not silently reset the timer.
//   • This is a singleton — one prompt across all pages.

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const
const ACTIVITY_THROTTLE_MS = 500

// ── Singleton state ────────────────────────────────────────────────────────
const promptOpen     = ref(false)
const secondsLeft    = ref(0)         // grace-period countdown, shown in modal

let idleTimer:      ReturnType<typeof setTimeout>  | null = null
let graceTimer:     ReturnType<typeof setTimeout>  | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
let lastActivityAt = 0
let listenersBound = false
let running        = false

const cfg = () => useRuntimeConfig().public as {
  idleTimeoutMs: number
  idleGraceMs: number
}

// ── Timer helpers ──────────────────────────────────────────────────────────
function clearAllTimers() {
  if (idleTimer)      { clearTimeout(idleTimer);      idleTimer      = null }
  if (graceTimer)     { clearTimeout(graceTimer);     graceTimer     = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

function armIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(openPrompt, cfg().idleTimeoutMs)
}

function openPrompt() {
  const { idleGraceMs } = cfg()
  promptOpen.value  = true
  secondsLeft.value = Math.ceil(idleGraceMs / 1000)

  // Grace countdown for the modal UI
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    secondsLeft.value = Math.max(0, secondsLeft.value - 1)
  }, 1000)

  // Auto-logout on grace expiry
  if (graceTimer) clearTimeout(graceTimer)
  graceTimer = setTimeout(async () => {
    promptOpen.value = false
    clearAllTimers()
    // Session ended — bring user to login with return path preserved
    await useLogout().logout({ keepRedirect: true })
  }, idleGraceMs)
}

// User confirmed presence — dismiss prompt and re-arm phase 1
function confirmPresence() {
  if (graceTimer)     { clearTimeout(graceTimer);      graceTimer     = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  promptOpen.value = false
  secondsLeft.value = 0
  armIdleTimer()
  lastActivityAt = Date.now()
}

// ── Activity handling (throttled) ──────────────────────────────────────────
function onActivity() {
  if (!running) return
  // Ignore activity while the prompt is showing — user must explicitly confirm
  if (promptOpen.value) return

  const now = Date.now()
  if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) return
  lastActivityAt = now
  armIdleTimer()
}

function bindListenersOnce() {
  if (listenersBound || typeof window === 'undefined') return
  for (const ev of ACTIVITY_EVENTS) {
    window.addEventListener(ev, onActivity, { passive: true })
  }
  listenersBound = true
}

function unbindListeners() {
  if (!listenersBound || typeof window === 'undefined') return
  for (const ev of ACTIVITY_EVENTS) {
    window.removeEventListener(ev, onActivity)
  }
  listenersBound = false
}

// ── Public API ─────────────────────────────────────────────────────────────
function start() {
  if (running) return
  running = true
  bindListenersOnce()
  lastActivityAt = Date.now()
  armIdleTimer()
}

function stop() {
  running = false
  promptOpen.value = false
  secondsLeft.value = 0
  clearAllTimers()
  unbindListeners()
}

export function useIdleTimeout() {
  return {
    // state
    promptOpen,
    secondsLeft,
    // actions
    start,
    stop,
    confirmPresence,
  }
}