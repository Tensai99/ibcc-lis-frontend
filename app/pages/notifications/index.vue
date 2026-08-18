<!-- app/pages/notifications/index.vue -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- ── Header (with inline stats) ─────────────────────────────────── -->
      <header
        class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0"
          >
            <font-awesome-icon :icon="['fas', 'bell']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words">
              Notifications
            </h1>
            <!-- Inline stat row — replaces the previous KPI cards -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-on-surface-variant">
              <span class="inline-flex items-center gap-1.5">
                <span class="font-bold text-on-surface">{{ items.length }}</span>
                total
              </span>
              <span v-if="counts.high > 0" class="inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-ribbon-red" />
                <span class="font-bold text-ribbon-red">{{ counts.high }}</span> high
              </span>
              <span v-if="counts.medium > 0" class="inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-ribbon-amber" />
                <span class="font-bold text-ribbon-amber">{{ counts.medium }}</span> medium
              </span>
              <span v-if="counts.low > 0" class="inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-ribbon-blue" />
                <span class="font-bold text-ribbon-blue">{{ counts.low }}</span> low
              </span>
              <span class="text-outline">·</span>
              <span class="text-outline">
                polled every minute<template v-if="lastFetchedAt"> · last {{ relativeTime(lastFetchedAt.toISOString()) }}</template>
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button class="refresh-btn" :disabled="loading" @click="reload">
            <font-awesome-icon
              :icon="['fas','arrows-rotate']"
              :class="{ 'animate-spin': loading }"
            />
            Refresh
          </button>
        </div>
      </header>

      <!-- ── Main panel: filters + list + pagination ─────────────────────── -->
      <div class="g-card p-4 sm:p-5">

        <!-- ── Compact filter bar ─────────────────────────────────────── -->
        <div class="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <!-- Search -->
          <div class="relative flex-1 min-w-0">
            <font-awesome-icon
              :icon="['fas','magnifying-glass']"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none"
            />
            <input
              v-model="q"
              type="text"
              placeholder="Search notifications…"
              class="cust-input has-icon"
            />
            <button
              v-if="q"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              aria-label="Clear search"
              @click="q = ''"
            >
              <font-awesome-icon :icon="['fas','xmark']" class="text-xs" />
            </button>
          </div>

          <!-- Urgency segmented pill group -->
          <div class="seg" role="group" aria-label="Filter by urgency">
            <button
              v-for="opt in urgencyOptions"
              :key="opt.value || 'all'"
              type="button"
              class="seg-btn"
              :class="[
                filters.urgency === opt.value ? opt.activeClass : '',
              ]"
              @click="filters.urgency = opt.value; page = 1"
            >
              <span
                v-if="opt.dotClass && filters.urgency !== opt.value"
                class="w-1.5 h-1.5 rounded-full"
                :class="opt.dotClass"
              />
              <span>{{ opt.label }}</span>
              <span
                v-if="opt.count > 0"
                class="seg-count"
                :class="{ 'seg-count-on': filters.urgency === opt.value }"
              >
                {{ opt.count }}
              </span>
            </button>
          </div>

          <!-- Type select (styled) -->
          <div class="select-wrap">
            <font-awesome-icon
              :icon="['fas', filters.object_type ? iconForType(filters.object_type) : 'layer-group']"
              class="select-icon"
              :class="{ 'text-primary': filters.object_type }"
            />
            <select
              v-model="filters.object_type"
              class="cust-select has-icon"
              @change="page = 1"
            >
              <option value="">All types</option>
              <option value="customer_proforma_invoice">Proforma invoice</option>
              <option value="customer_quotation">Quotation</option>
              <option value="asset">Asset</option>
              <option value="inventory">Inventory</option>
              <option value="patient_visit">Patient visit</option>
            </select>
            <font-awesome-icon :icon="['fas','chevron-down']" class="select-caret" />
          </div>

          <!-- Per-page select (styled) -->
          <div class="select-wrap">
            <select v-model.number="perPage" class="cust-select" @change="page = 1">
              <option :value="10">10 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
              <option :value="100">100 / page</option>
            </select>
            <font-awesome-icon :icon="['fas','chevron-down']" class="select-caret" />
          </div>
        </div>

        <!-- Active filter summary — thin, only when needed -->
        <div v-if="activeFilterCount > 0" class="mb-3 flex items-center gap-2 flex-wrap">
          <font-awesome-icon :icon="['fas','filter']" class="text-primary text-xs" />
          <span class="text-[11px] text-on-surface-variant">
            <span class="font-bold text-on-surface">{{ filteredItems.length }}</span>
            of {{ items.length }} matched
          </span>
          <button
            type="button"
            class="text-[11px] font-bold text-primary hover:text-primary-container transition-colors underline underline-offset-2"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>

        <!-- Loading -->
        <div
          v-if="loading && items.length === 0"
          class="py-12 text-center text-on-surface-variant"
        >
          <font-awesome-icon :icon="['fas','spinner']" spin class="text-2xl text-primary" />
          <p class="mt-3 text-sm">Loading notifications…</p>
        </div>

        <!-- Empty -->
        <div
          v-else-if="filteredItems.length === 0"
          class="py-12 flex flex-col items-center text-center gap-3"
        >
          <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
            <font-awesome-icon :icon="['fas','bell-slash']" class="text-outline text-2xl" />
          </div>
          <div>
            <p class="text-base font-semibold text-on-surface">Nothing to show</p>
            <p class="text-sm text-on-surface-variant mt-1">
              Try clearing your filters or check back later.
            </p>
          </div>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto scroll-area -mx-2 sm:mx-0">
          <table class="alive-tbl tbl-rainbow w-full text-sm">
            <thead>
              <tr>
                <th class="px-3 py-2.5 text-left font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Type</th>
                <th class="px-3 py-2.5 text-left font-bold uppercase text-[11px] tracking-wider">Title</th>
                <th class="px-3 py-2.5 text-left font-bold uppercase text-[11px] tracking-wider hidden md:table-cell">Details</th>
                <th class="px-3 py-2.5 text-left font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Urgency</th>
                <th class="px-3 py-2.5 text-left font-bold uppercase text-[11px] tracking-wider whitespace-nowrap hidden lg:table-cell">Process</th>
                <th class="px-3 py-2.5 text-left font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">When</th>
                <th class="px-3 py-2.5 text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Open</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="n in pagedItems"
                :key="n.uuid"
                class="cursor-pointer"
                @click="onItemClick(n)"
              >
                <td class="px-3 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      :class="iconTileClass(n.urgency)"
                    >
                      <font-awesome-icon
                        :icon="['fas', iconForType(n.object_type)]"
                        class="text-white text-xs"
                      />
                    </div>
                    <span class="text-xs font-semibold text-on-surface-variant hidden sm:inline">
                      {{ humanType(n.object_type) }}
                    </span>
                  </div>
                </td>

                <td class="px-3 py-3">
                  <p class="text-sm font-semibold text-on-surface break-words">
                    {{ n.title }}
                  </p>
                  <p
                    v-if="n.body"
                    class="text-xs text-on-surface-variant mt-0.5 break-words md:hidden"
                  >
                    {{ n.body }}
                  </p>
                </td>

                <td class="px-3 py-3 hidden md:table-cell">
                  <p v-if="n.body" class="text-xs text-on-surface-variant break-words">
                    {{ n.body }}
                  </p>
                  <span v-else class="text-xs text-outline italic">—</span>
                </td>

                <td class="px-3 py-3 whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    :class="urgencyChipClass(n.urgency)"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="urgencyDotClass(n.urgency)"
                    />
                    {{ n.urgency }}
                  </span>
                </td>

                <td class="px-3 py-3 whitespace-nowrap hidden lg:table-cell">
                  <span class="text-[11px] font-mono text-on-surface-variant">
                    {{ n.process_key }}
                  </span>
                </td>

                <td class="px-3 py-3 whitespace-nowrap">
                  <span
                    class="text-xs text-on-surface"
                    :title="new Date(n.created_at).toLocaleString()"
                  >
                    {{ relativeTime(n.created_at) }}
                  </span>
                </td>

                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <span
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Open"
                  >
                    <font-awesome-icon :icon="['fas','arrow-right']" class="text-xs" />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Pagination ───────────────────────────────────────────────── -->
        <div
          v-if="filteredItems.length > 0"
          class="mt-5 pt-4 border-t border-outline-variant/30
                 flex items-center justify-between gap-3 flex-wrap"
        >
          <p class="text-xs text-on-surface-variant">
            Showing
            <span class="font-semibold text-on-surface">{{ rangeStart }}</span>–<span
              class="font-semibold text-on-surface"
            >{{ rangeEnd }}</span>
            of
            <span class="font-semibold text-on-surface">{{ filteredItems.length }}</span>
          </p>
          <div class="flex items-center gap-1.5">
            <button class="pager-btn" :disabled="page <= 1" @click="goto(1)" aria-label="First page">
              <font-awesome-icon :icon="['fas','angles-left']" class="text-xs" />
            </button>
            <button class="pager-btn" :disabled="page <= 1" @click="goto(page - 1)" aria-label="Previous page">
              <font-awesome-icon :icon="['fas','angle-left']" class="text-xs" />
            </button>
            <span class="px-3 py-1.5 text-sm font-bold text-on-surface font-mono">
              {{ page }} <span class="text-outline font-normal">/ {{ totalPages }}</span>
            </span>
            <button class="pager-btn" :disabled="page >= totalPages" @click="goto(page + 1)" aria-label="Next page">
              <font-awesome-icon :icon="['fas','angle-right']" class="text-xs" />
            </button>
            <button class="pager-btn" :disabled="page >= totalPages" @click="goto(totalPages)" aria-label="Last page">
              <font-awesome-icon :icon="['fas','angles-right']" class="text-xs" />
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { NotificationUrgency, ServerNotification } from '~/composables/useServerNotifications'

definePageMeta({ layout: 'default' })

const { handleClick, lastFetchedAt } = useServerNotifications()

// ── state ─────────────────────────────────────────────────────────────────
const items    = ref<ServerNotification[]>([])
const loading  = ref(false)
const page     = ref(1)
const perPage  = ref(10)                          // default 10

const filters = reactive({ urgency: '', object_type: '' })
const q       = ref('')

// ── derived counts ────────────────────────────────────────────────────────
const counts = computed(() => {
  const c = { high: 0, medium: 0, low: 0 }
  for (const n of items.value) {
    if (n.urgency === 'critical' || n.urgency === 'high') c.high++
    else if (n.urgency === 'medium') c.medium++
    else c.low++
  }
  return c
})

// ── filter options ────────────────────────────────────────────────────────
const urgencyOptions = computed(() => [
  { value: '',       label: 'All',    count: items.value.length,  dotClass: '',                activeClass: 'seg-btn-on-primary' },
  { value: 'high',   label: 'High',   count: counts.value.high,   dotClass: 'bg-ribbon-red',   activeClass: 'seg-btn-on-red' },
  { value: 'medium', label: 'Medium', count: counts.value.medium, dotClass: 'bg-ribbon-amber', activeClass: 'seg-btn-on-amber' },
  { value: 'low',    label: 'Low',    count: counts.value.low,    dotClass: 'bg-ribbon-blue',  activeClass: 'seg-btn-on-blue' },
])

const activeFilterCount = computed(() =>
  (filters.urgency ? 1 : 0) + (filters.object_type ? 1 : 0) + (q.value.trim() ? 1 : 0)
)

// ── filtered + paged (fully client-side, department.vue pattern) ──────────
const filteredItems = computed(() => {
  const term = q.value.trim().toLowerCase()
  return items.value.filter(n => {
    if (filters.urgency) {
      // "high" also matches "critical"
      if (filters.urgency === 'high') {
        if (n.urgency !== 'high' && n.urgency !== 'critical') return false
      } else if (n.urgency !== filters.urgency) return false
    }
    if (filters.object_type && n.object_type !== filters.object_type) return false
    if (term) {
      const hay = `${n.title} ${n.body ?? ''} ${n.object_type} ${n.process_key}`.toLowerCase()
      if (!hay.includes(term)) return false
    }
    return true
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredItems.value.length / perPage.value))
)

const pagedItems = computed(() =>
  filteredItems.value.slice((page.value - 1) * perPage.value, page.value * perPage.value)
)

const rangeStart = computed(() =>
  filteredItems.value.length === 0 ? 0 : (page.value - 1) * perPage.value + 1
)
const rangeEnd = computed(() =>
  Math.min(page.value * perPage.value, filteredItems.value.length)
)

// keep page in range whenever the result set shrinks
watch([filteredItems, perPage], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

// ── loader ────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const { request } = useApi()
    const res = await request<{ data: ServerNotification[] } | ServerNotification[]>(
      '/notifications',
      { method: 'GET' }
    )
    items.value = Array.isArray(res) ? res : (res?.data ?? [])
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}
async function reload() { await load() }

async function goto(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function clearFilters() {
  filters.urgency = ''
  filters.object_type = ''
  q.value = ''
  page.value = 1
}

function onItemClick(n: ServerNotification) { handleClick(n) }

// ── literal class helpers (no dynamic concatenation) ──────────────────────
function iconTileClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber'
  return 'bg-ribbon-blue'
}
function urgencyChipClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red/15 text-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-blue/15 text-ribbon-blue'
}
function urgencyDotClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber'
  return 'bg-ribbon-blue'
}
function iconForType(t: string) {
  if (t === 'customer_proforma_invoice') return 'file-invoice-dollar'
  if (t === 'customer_quotation')        return 'file-invoice'
  if (t === 'asset')                     return 'boxes-stacked'
  if (t === 'inventory')                 return 'warehouse'
  if (t === 'patient_visit')             return 'user-doctor'
  if (t === 'laboratory_order_test_result') return 'flask-vial'
  return 'bell'
}
function humanType(t: string) {
  if (t === 'laboratory_order_test_result') return 'Lab Result'
  return t.split('_').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}
function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

onMounted(load)
</script>

<style scoped>
/* ── Glass card — identical to department.vue ─────────────────────────── */
.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.5s ease-out backwards;
}

/* ── Search / select input ────────────────────────────────────────────── */
.cust-input {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}
.cust-input::placeholder { color: rgba(114, 118, 135, 0.6); }
.cust-input:focus {
  outline: none;
  box-shadow: inset 0 0 0 1.5px #3d7fbf;
  background: #f7f9fb;
}
.cust-input.has-icon { padding-left: 2.5rem; }

/* ── Styled select (Type + Per-page) ──────────────────────────────────── */
.select-wrap {
  position: relative;
  flex-shrink: 0;
}
.cust-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(194, 198, 216, 0.6);
  border-radius: 0.75rem;
  padding: 0.55rem 2rem 0.55rem 0.9rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 8.5rem;
}
.cust-select.has-icon { padding-left: 2.25rem; }
.cust-select:hover { background: #fff; border-color: rgba(61, 127, 191, 0.35); }
.cust-select:focus {
  outline: none;
  border-color: #3d7fbf;
  box-shadow: 0 0 0 3px rgba(61, 127, 191, 0.12);
}
.select-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-outline, #727687);
  font-size: 0.8125rem;
  pointer-events: none;
}
.select-caret {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-outline, #727687);
  font-size: 0.6875rem;
  pointer-events: none;
}

/* ── Segmented urgency control ────────────────────────────────────────── */
.seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(194, 198, 216, 0.6);
  border-radius: 0.75rem;
  flex-shrink: 0;
}
.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 0.55rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #424656;
  background: transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
  cursor: pointer;
}
.seg-btn:hover { color: #191c1e; background: rgba(0, 0, 0, 0.03); }

.seg-btn-on-primary { background: #3d7fbf; color: #fff; box-shadow: 0 1px 3px rgba(61, 127, 191, 0.35); }
.seg-btn-on-red     { background: #c0395a; color: #fff; box-shadow: 0 1px 3px rgba(192, 57, 90, 0.35); }
.seg-btn-on-amber   { background: #e8a33d; color: #fff; box-shadow: 0 1px 3px rgba(232, 163, 61, 0.35); }
.seg-btn-on-blue    { background: #3d7fbf; color: #fff; box-shadow: 0 1px 3px rgba(61, 127, 191, 0.35); }

.seg-btn-on-primary:hover,
.seg-btn-on-red:hover,
.seg-btn-on-amber:hover,
.seg-btn-on-blue:hover { color: #fff; }

.seg-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  background: rgba(25, 28, 30, 0.08);
  font-size: 0.6875rem;
  font-weight: 700;
  color: inherit;
}
.seg-count-on {
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
}

/* ── Refresh button (glass style) ─────────────────────────────────────── */
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(61, 127, 191, 0.25);
  color: #3d7fbf;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.15s ease, transform 0.15s ease;
}
.refresh-btn:hover:not(:disabled) { background: #fff; transform: translateY(-1px); }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Alive rainbow table ──────────────────────────────────────────────── */
.alive-tbl tbody tr { transition: background 0.15s ease; }
.alive-tbl tbody tr:nth-child(even) { background: rgba(25, 28, 30, 0.018); }
.alive-tbl tbody tr:hover { background: rgba(61, 127, 191, 0.06); }

.tbl-rainbow thead tr {
  background: linear-gradient(90deg, #3d7fbf 0%, #5b9bdb 100%);
}
.tbl-rainbow thead th {
  border-bottom: 2px solid rgba(31, 87, 140, 0.5);
  color: #ffffff;
}

.tbl-rainbow tbody td:nth-child(1) { background: rgba(61, 127, 191, 0.04); }
.tbl-rainbow tbody td:nth-child(2) { background: rgba(176, 95, 168, 0.04); }
.tbl-rainbow tbody td:nth-child(3) { background: rgba(61, 174, 140, 0.04); }
.tbl-rainbow tbody td:nth-child(4) { background: rgba(232, 163, 61, 0.05); }
.tbl-rainbow tbody td:nth-child(5) { background: rgba(46, 138, 110, 0.04); }
.tbl-rainbow tbody td:nth-child(6) { background: rgba(192, 57, 90, 0.04);  }
.tbl-rainbow tbody td:nth-child(7) { background: rgba(61, 127, 191, 0.04); }

/* ── Custom scrollbars ────────────────────────────────────────────────── */
.scroll-area::-webkit-scrollbar { width: 6px; height: 6px; }
.scroll-area::-webkit-scrollbar-thumb {
  background: rgba(61, 127, 191, 0.2);
  border-radius: 10px;
}
.scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(61, 127, 191, 0.2) transparent;
}

/* ── Pager button ─────────────────────────────────────────────────────── */
.pager-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-outline-variant, #c2c6d8);
  color: #3d7fbf;
  transition: background 0.15s ease;
}
.pager-btn:hover:not(:disabled) { background: #fff; }
.pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@keyframes island-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>