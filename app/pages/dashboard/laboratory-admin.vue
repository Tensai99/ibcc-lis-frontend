<!-- app/pages/dashboard/laboratory-admin.vue -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- Header (glass, gradient icon tile) -->
      <header class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'flask-vial']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words">Good {{ greeting }}, {{ displayName }}</h1>
            <p class="text-[11px] text-outline font-mono mt-0.5">
              {{ roleLabel }}{{ department ? ` · ${department}` : '' }} · Window {{ windowLabel }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-ribbon-blue/15 text-ribbon-blue">Laboratory admin</span>
          <button type="button" class="pager-btn" :disabled="loading" @click="load(true)">
            <font-awesome-icon :icon="['fas', 'rotate-right']" :class="loading ? 'animate-spin' : ''" />
          </button>
        </div>
      </header>

      <!-- ── Filters (inline, chip-driven) ─────────────────────────────────── -->
      <div class="g-card p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
              <font-awesome-icon :icon="['fas', 'sliders']" />
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Filters</h3>
              <p class="text-[11px] text-outline">Refine the window and scope of this dashboard</p>
            </div>
          </div>
          <button type="button" class="filter-toggle" @click="filtersOpen = !filtersOpen">
            <font-awesome-icon :icon="['fas', filtersOpen ? 'chevron-up' : 'chevron-down']" />
            <span>{{ filtersOpen ? 'Hide' : 'Show' }}</span>
          </button>
        </div>

        <div v-show="filtersOpen" class="flex flex-col gap-5">
          <!-- Quick range presets -->
          <div>
            <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Quick range</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="p in PRESETS" :key="p.key" type="button"
                class="preset-chip" :class="{ 'preset-chip-active': activePreset === p.key }"
                @click="applyPreset(p.key)">
                <font-awesome-icon :icon="['fas', p.icon]" class="text-[10px]" />
                <span>{{ p.label }}</span>
              </button>
            </div>
          </div>

          <!-- Custom range + sub-department -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label class="filter-label">From</label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'calendar-day']" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="filters.from" type="date" class="cust-input has-icon" @change="activePreset = 'custom'" />
              </div>
            </div>
            <div>
              <label class="filter-label">To</label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'calendar-check']" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="filters.to" type="date" class="cust-input has-icon" @change="activePreset = 'custom'" />
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="filter-label">Sub-department</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SearchSelect v-model="deptUuid" :options="departments" option-value="uuid" option-label="name"
                  icon="building" placeholder="Department…" search-placeholder="Search departments…" clearable />
                <SearchSelect v-model="filters.sub_department_id" :options="subDepartments"
                  :disabled="!deptUuid" option-value="id" option-label="name" icon="sitemap"
                  :placeholder="deptUuid ? 'Sub-department…' : 'Pick a department first'"
                  search-placeholder="Search sub-departments…" clearable />
              </div>
              <p class="text-[11px] text-outline mt-1.5">
                <font-awesome-icon :icon="['fas', 'circle-info']" class="mr-1 opacity-70" />
                Leave sub-department blank to include the whole department.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" class="btn-reset" @click="resetFilters">
              <font-awesome-icon :icon="['fas', 'rotate-left']" />
              <span>Reset</span>
            </button>
            <button type="button" class="btn-apply" @click="load(true)">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
              <span>Apply filters</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Loading ───────────────────────────────────────────────────────── -->
      <div v-if="loading" class="g-card flex flex-col items-center justify-center gap-3 py-16">
        <font-awesome-icon :icon="['fas', 'circle-notch']" class="text-3xl text-primary animate-spin" />
        <p class="text-sm sm:text-base text-on-surface-variant">Loading laboratory dashboard…</p>
      </div>

      <!-- ── Error ─────────────────────────────────────────────────────────── -->
      <div v-else-if="error" class="g-card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div class="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
          <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-2xl text-error" />
        </div>
        <p class="text-sm sm:text-base text-on-surface-variant max-w-md">{{ error }}</p>
        <button type="button" class="pager-btn !w-auto !h-auto !rounded-lg !px-3 !py-2 gap-2 text-sm font-semibold" @click="load()">
          <font-awesome-icon :icon="['fas', 'rotate-right']" />
          <span>Retry</span>
        </button>
      </div>

      <!-- ── Live data ─────────────────────────────────────────────────────── -->
      <template v-else-if="d">

        <!-- KPI tiles (ribbon accents — matches department.vue) -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          <div v-for="k in kpis" :key="k.label"
            class="g-card p-5 sm:p-6 border-l-4" :class="k.accent">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] font-bold uppercase tracking-wider" :class="k.tint">{{ k.label }}</p>
              <font-awesome-icon :icon="['fas', k.icon]" :class="k.tint" />
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface break-words">{{ k.value }}</p>
          </div>
        </div>

        <!-- Status (progress bars) + discipline + urgency -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <!-- Orders by status — progress bars replace the donut -->
          <div class="g-card p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
                <font-awesome-icon :icon="['fas', 'chart-simple']" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Orders by status</h3>
              <span class="ml-auto text-[11px] font-bold text-ribbon-blue bg-ribbon-blue/10 px-2.5 py-1 rounded-full">
                {{ fmt(statusTotal) }}
              </span>
            </div>
            <div v-if="hasStatus" class="space-y-3">
              <div v-for="(s, i) in statusEntries" :key="s.label">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs sm:text-sm font-medium break-words">{{ s.label }}</span>
                  <span class="text-xs sm:text-sm font-bold text-on-surface">{{ fmt(s.value) }} <span class="text-outline font-normal">· {{ statusPct(s.value) }}%</span></span>
                </div>
                <div class="h-2 rounded-full bg-surface-low overflow-hidden">
                  <div class="h-full rounded-full" :class="RIBBON_BAR[i % RIBBON_BAR.length]"
                    :style="{ width: statusPct(s.value) + '%' }" />
                </div>
              </div>
            </div>
            <p v-else class="empty-line">No orders in this window.</p>
          </div>

          <!-- By discipline -->
          <div class="g-card p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal">
                <font-awesome-icon :icon="['fas', 'microscope']" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Orders by discipline</h3>
            </div>
            <DistBars :data="d.by_discipline" empty="No discipline data." />
          </div>

          <!-- By urgency -->
          <div class="g-card p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-ribbon-red/15 flex items-center justify-center text-ribbon-red">
                <font-awesome-icon :icon="['fas', 'gauge']" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Orders by urgency</h3>
            </div>
            <DistBars :data="d.by_urgency" empty="No urgency data." />
          </div>
        </div>

        <!-- Turnaround · Results · Backlog -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <!-- Turnaround -->
          <div class="g-card p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal">
                <font-awesome-icon :icon="['fas', 'gauge-high']" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Turnaround</h3>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
              <MiniStat label="On-time rate" :value="pct(d.turnaround.on_time_rate)" />
              <MiniStat label="Breached" :value="fmt(d.turnaround.breached)" :danger="d.turnaround.breached > 0" />
            </div>
            <template v-if="hasEntries(d.turnaround.by_station_avg_hours)">
              <p class="sub-label">Avg hours per station</p>
              <DistBars :data="d.turnaround.by_station_avg_hours" suffix=" h" />
            </template>
            <p v-else class="empty-line">No station turnaround recorded.</p>
          </div>

          <!-- Results -->
          <div class="g-card p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple">
                <font-awesome-icon :icon="['fas', 'file-lines']" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Results</h3>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <MiniStat label="Recorded" :value="fmt(d.results.recorded)" />
              <MiniStat label="Critical" :value="fmt(d.results.critical)" :danger="d.results.critical > 0" />
              <MiniStat label="Pending technical" :value="fmt(d.results.pending_technical)" />
              <MiniStat label="Pending clinical" :value="fmt(d.results.pending_clinical)" />
            </div>
            <template v-if="hasEntries(d.results.by_flag)">
              <p class="sub-label mt-4">By flag</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="(v, key) in d.results.by_flag" :key="key"
                  class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ribbon-amber/15 text-ribbon-amber">
                  {{ titleCase(String(key)) }} · {{ v }}
                </span>
              </div>
            </template>
          </div>

          <!-- Backlog -->
          <div class="g-card p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber">
                <font-awesome-icon :icon="['fas', 'hourglass-half']" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Backlog</h3>
            </div>
            <div class="grid grid-cols-1 gap-3">
              <MiniStat label="Orders in progress" :value="fmt(d.backlog.orders_in_progress)" />
              <MiniStat label="Awaiting reporting" :value="fmt(d.backlog.awaiting_reporting)" />
              <MiniStat label="Oldest open"
                :value="d.backlog.oldest_open_days == null ? '—' : `${d.backlog.oldest_open_days} d`"
                :danger="(d.backlog.oldest_open_days ?? 0) > 7" />
            </div>
          </div>
        </div>

        <!-- Worklist -->
        <div class="g-card p-6 sm:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
                <font-awesome-icon :icon="['fas', 'list-check']" />
              </div>
              <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Worklist</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ribbon-blue/15 text-ribbon-blue">
                Open · {{ fmt(d.worklist.open_total) }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                :class="d.worklist.overdue > 0 ? 'bg-error/10 text-error' : 'bg-ribbon-teal/15 text-ribbon-teal'">
                Overdue · {{ fmt(d.worklist.overdue) }}
              </span>
            </div>
          </div>

          <div v-if="d.worklist.by_station.length" class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-blue">
              <thead>
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                  <th class="py-4 px-5">Station</th>
                  <th class="py-4 px-5 text-center">Open</th>
                  <th class="py-4 px-5 text-center">Overdue</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="(st, i) in d.worklist.by_station" :key="i">
                  <td class="py-4 px-5 font-bold break-words">{{ st.station ?? st.name ?? '—' }}</td>
                  <td class="py-4 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ribbon-blue/15 text-ribbon-blue">
                      {{ fmt(st.open ?? st.open_total ?? 0) }}
                    </span>
                  </td>
                  <td class="py-4 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      :class="(st.overdue ?? 0) > 0 ? 'bg-error/10 text-error' : 'bg-ribbon-teal/15 text-ribbon-teal'">
                      {{ fmt(st.overdue ?? 0) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-line">No open worklist items in this window.</p>
        </div>

        <!-- Received trend -->
        <div class="g-card p-6 sm:p-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple">
              <font-awesome-icon :icon="['fas', 'chart-area']" />
            </div>
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Orders received</h3>
          </div>
          <ClientOnly>
            <apexchart v-if="trendEntries.length" type="area" height="260"
              :options="trendArea.options" :series="trendArea.series" />
            <p v-else class="empty-line">No orders received in this window.</p>
            <template #fallback>
              <div class="h-[260px] flex items-center justify-center text-outline text-sm">Loading chart…</div>
            </template>
          </ClientOnly>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

// ── payload interfaces ───────────────────────────────────────────────────────
interface LabWindow   { from: string | null; to: string | null; sub_department_id: number | null }
interface LabSummary  {
  orders_received: number; tests: number; tests_verified: number
  results_recorded: number; critical_results: number; avg_station_tat_hours: number | null
}
interface LabTurnaround {
  by_tat_status: Record<string, number>; breached: number
  on_time_rate: number | null; by_station_avg_hours: Record<string, number>
}
interface LabWorklist { open_total: number; overdue: number; by_station: any[] }
interface LabResults  {
  recorded: number; by_flag: Record<string, number>; critical: number
  pending_technical: number; pending_clinical: number
}
interface LabBacklog  { orders_in_progress: number; oldest_open_days: number | null; awaiting_reporting: number }
interface LabDashboard {
  window: LabWindow
  summary: LabSummary
  by_discipline: Record<string, number>
  by_status: Record<string, number>
  by_urgency: Record<string, number>
  turnaround: LabTurnaround
  worklist: LabWorklist
  results: LabResults
  backlog: LabBacklog
  received_trend: Record<string, number>
}

// ── role / identity ──────────────────────────────────────────────────────────
const auth = useAuthStore()
const displayName = computed(() => auth.currentUser?.full_name || 'Clinician')
const roleLabel   = computed(() => auth.currentUser?.role_label || 'Laboratory')
const department  = computed(() => auth.currentUser?.department || '')

const greeting = (() => {
  const hr = new Date().getHours()
  return hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'
})()

// ── filters ──────────────────────────────────────────────────────────────────
const filters = reactive<Record<string, any>>({
  from: '2026-05-01',
  to:   '2026-06-11',
  sub_department_id: undefined,
})
const filtersOpen = ref(true)

const windowLabel = computed(() => `${filters.from || '—'} → ${filters.to || '—'}`)

// ── quick range presets ──────────────────────────────────────────────────────
const PRESETS = [
  { key: 'today',   label: 'Today',      icon: 'calendar-day' },
  { key: '7d',      label: 'Last 7 days',  icon: 'calendar-week' },
  { key: '30d',     label: 'Last 30 days', icon: 'calendar' },
  { key: 'month',   label: 'This month', icon: 'calendar-days' },
  { key: 'all',     label: 'All time',   icon: 'infinity' },
] as const
type PresetKey = typeof PRESETS[number]['key'] | 'custom'
const activePreset = ref<PresetKey>('custom')

const isoDate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const applyPreset = (key: PresetKey) => {
  activePreset.value = key
  const now = new Date()
  if (key === 'today') {
    filters.from = isoDate(now); filters.to = isoDate(now)
  } else if (key === '7d') {
    const from = new Date(now); from.setDate(from.getDate() - 6)
    filters.from = isoDate(from); filters.to = isoDate(now)
  } else if (key === '30d') {
    const from = new Date(now); from.setDate(from.getDate() - 29)
    filters.from = isoDate(from); filters.to = isoDate(now)
  } else if (key === 'month') {
    filters.from = isoDate(new Date(now.getFullYear(), now.getMonth(), 1))
    filters.to   = isoDate(now)
  } else if (key === 'all') {
    filters.from = ''
    filters.to   = ''
  }
}

const resetFilters = () => {
  filters.from = ''
  filters.to = ''
  filters.sub_department_id = undefined
  deptUuid.value = ''
  activePreset.value = 'all'
  load(true)
}

// ── department / sub-department cascade ──────────────────────────────────────
const { request } = useApi()
const departments    = ref<any[]>([])
const subDepartments = ref<any[]>([])
const deptUuid       = ref<string>('')

const loadDepartments = async () => {
  try { departments.value = (await request<any[]>('/departments')) ?? [] } catch { departments.value = [] }
}
const loadSubDepartments = async (uuid: string) => {
  try {
    const res = await request<any>(`/department/show?uuid=${uuid}`)
    subDepartments.value = res?.sub_departments ?? []
  } catch { subDepartments.value = [] }
}
watch(deptUuid, (uuid) => {
  filters.sub_department_id = undefined
  subDepartments.value = []
  if (uuid) loadSubDepartments(uuid)
})

// ── fetch ────────────────────────────────────────────────────────────────────
const d       = ref<LabDashboard | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

const buildQuery = () => {
  const p = new URLSearchParams()
  if (filters.from) p.set('from', filters.from)
  if (filters.to)   p.set('to', filters.to)
  if (filters.sub_department_id != null && filters.sub_department_id !== '') {
    p.set('sub_department_id', String(filters.sub_department_id))
  }
  const qs = p.toString()
  return qs ? `?${qs}` : ''
}

const load = async (useFilters = true) => {
  loading.value = true
  error.value = null
  try {
    const qs = useFilters ? buildQuery() : ''
    d.value = await request<LabDashboard>(`/laboratories/dashboard${qs}`)
    if (!d.value) error.value = 'The dashboard service returned no data.'
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load the laboratory dashboard. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDepartments()
  load(false) // initial fetch: no filters applied
})

// ── formatting helpers ───────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat().format(n)
const titleCase = (s: string) =>
  s.replace(/[_\-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
const pct = (v: number | null | undefined) =>
  v == null ? '—' : `${Math.round(v <= 1 ? v * 100 : v)}%`
const hoursFmt = (v: number | null | undefined) =>
  v == null ? '—' : `${v} h`
const hasEntries = (o: Record<string, unknown> | null | undefined) =>
  !!o && Object.keys(o).length > 0

// ── KPI tiles ────────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const s = d.value?.summary
  if (!s) return []
  return [
    { label: 'Orders received', value: fmt(s.orders_received),   icon: 'clipboard-list', accent: 'border-ribbon-blue',   tint: 'text-ribbon-blue' },
    { label: 'Tests',           value: fmt(s.tests),             icon: 'flask',          accent: 'border-ribbon-teal',   tint: 'text-ribbon-teal' },
    { label: 'Tests verified',  value: fmt(s.tests_verified),    icon: 'circle-check',   accent: 'border-ribbon-purple', tint: 'text-ribbon-purple' },
    { label: 'Results recorded',value: fmt(s.results_recorded),  icon: 'file-lines',     accent: 'border-ribbon-amber',  tint: 'text-ribbon-amber' },
    { label: 'Critical results',value: fmt(s.critical_results),  icon: 'triangle-exclamation', accent: 'border-ribbon-red', tint: 'text-ribbon-red' },
    { label: 'Avg station TAT', value: hoursFmt(s.avg_station_tat_hours), icon: 'clock', accent: 'border-ribbon-blue',   tint: 'text-ribbon-blue' },
  ]
})

// ── status progress bars (replaces the donut) ────────────────────────────────
const statusEntries = computed(() =>
  Object.entries(d.value?.by_status ?? {}).map(([k, v]) => ({ label: titleCase(k), value: Number(v) || 0 })),
)
const statusTotal = computed(() => statusEntries.value.reduce((a, s) => a + s.value, 0))
const hasStatus = computed(() => statusEntries.value.length > 0 && statusTotal.value > 0)
const statusPct = (v: number) => statusTotal.value > 0 ? Math.round((v / statusTotal.value) * 100) : 0

// ── received trend chart (kept as area) ──────────────────────────────────────
const trendEntries = computed(() => Object.entries(d.value?.received_trend ?? {}))
const trendArea = computed(() => ({
  series: [{ name: 'Orders received', data: trendEntries.value.map(([, v]) => v) }],
  options: {
    chart: { toolbar: { show: false }, fontFamily: 'Manrope, sans-serif' },
    colors: ['#3d7fbf'],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, gradientToColors: ['#3dae8c'] },
    },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: trendEntries.value.map(([k]) => k || 'Unknown'),
      labels: { style: { fontFamily: 'Manrope, sans-serif' } },
    },
    yaxis: { labels: { style: { fontFamily: 'Manrope, sans-serif' } } },
    grid: { borderColor: '#e0e3e5', strokeDashArray: 4 },
  },
}))

// ── tiny inline render components ────────────────────────────────────────────
const RIBBON_BAR = [
  'bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red',
]

const DistBars = (props: { data: Record<string, number>; suffix?: string; empty?: string }) => {
  const entries = Object.entries(props.data ?? {})
  if (!entries.length) return h('p', { class: 'empty-line' }, props.empty ?? 'No data.')
  const max = Math.max(...entries.map(([, v]) => Number(v) || 0), 1)
  return h('div', { class: 'space-y-3' }, entries.map(([label, val], i) =>
    h('div', { key: label }, [
      h('div', { class: 'flex items-center justify-between text-xs sm:text-sm mb-1' }, [
        h('span', { class: 'font-semibold text-on-surface truncate pr-2' }, titleCase(label)),
        h('span', { class: 'text-on-surface-variant font-semibold shrink-0' },
          `${new Intl.NumberFormat().format(Number(val))}${props.suffix ?? ''}`),
      ]),
      h('div', { class: 'h-2 rounded-full bg-surface-low overflow-hidden' }, [
        h('div', {
          class: ['h-full rounded-full', RIBBON_BAR[i % RIBBON_BAR.length]],
          style: { width: `${Math.max((Number(val) / max) * 100, 4)}%` },
        }),
      ]),
    ]),
  ))
}

const MiniStat = (props: { label: string; value: string; danger?: boolean }) =>
  h('div', { class: 'rounded-xl bg-white/60 border border-white/40 px-3 py-2.5' }, [
    h('p', { class: 'text-[10px] text-outline font-bold uppercase tracking-wider' }, props.label),
    h('p', { class: ['text-lg sm:text-xl font-extrabold mt-0.5', props.danger ? 'text-error' : 'text-on-surface'] },
      props.value),
  ])
</script>

<style scoped>
@reference "~/assets/css/main.css";

.g-card {
  position: relative; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem; box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05); border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.5s ease-out backwards;
}

.cust-input { width: 100%; background: var(--color-surface-low, #f2f4f6); border: none; border-radius: 0.75rem; padding: 0.65rem 1rem; font-size: 0.85rem; font-weight: 600; color: var(--color-on-surface, #191c1e); transition: all 0.2s ease; box-shadow: inset 0 0 0 1.5px transparent; }
.cust-input::placeholder { color: rgba(114, 118, 135, 0.6); }
.cust-input:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }
.cust-input.has-icon { padding-left: 2.5rem; }

/* filter chrome */
.filter-toggle { @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-ribbon-blue bg-ribbon-blue/10 hover:bg-ribbon-blue/20 transition-colors; }
.filter-label { @apply block text-[10px] font-bold uppercase tracking-wider text-ribbon-blue mb-1.5 ml-0.5; }

.preset-chip { @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant bg-white/60 border border-white/60 hover:bg-ribbon-blue/10 hover:text-ribbon-blue transition-colors; }
.preset-chip-active { @apply text-white border-transparent bg-primary-gradient shadow-md shadow-primary/20; }

.btn-apply { @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary-gradient shadow-md shadow-primary/20 hover:brightness-105 transition; }
.btn-reset { @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant bg-white/60 border border-white/60 hover:bg-white transition; }

/* alive table — ribbon blue header + hover, matches department.vue */
.alive-tbl tbody tr { transition: background 0.15s ease; }
.alive-tbl tbody tr:nth-child(even) { background: rgba(25, 28, 30, 0.018); }
.tbl-blue thead tr { background: linear-gradient(90deg, rgba(61,127,191,0.14), rgba(61,127,191,0.04)); }
.tbl-blue thead th { border-bottom: 2px solid rgba(61,127,191,0.40); }
.tbl-blue tbody tr:hover { background: rgba(61,127,191,0.09); }

.sub-label  { @apply text-[10px] font-bold uppercase tracking-wider text-ribbon-blue mt-3 mb-2; }
.empty-line { @apply text-sm text-on-surface-variant py-6 text-center; }

.pager-btn { width: 2.25rem; height: 2.25rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 0.75rem; background: rgba(255, 255, 255, 0.7); border: 1px solid var(--color-outline-variant, #c2c6d8); color: #3d7fbf; transition: background 0.15s ease; }
.pager-btn:hover:not(:disabled) { background: #fff; }
.pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@keyframes island-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>