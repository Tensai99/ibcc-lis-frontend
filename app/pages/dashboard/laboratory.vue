<!-- app/pages/dashboard/laboratory.vue -->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- ── Filters ───────────────────────────────────────────────────────── -->
    <div class="island">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h2 class="heading-inline">Filters</h2>
        <button type="button" class="filter-toggle" @click="filtersOpen = !filtersOpen">
          <font-awesome-icon :icon="['fas', 'sliders']" />
          <span>{{ filtersOpen ? 'Hide' : 'Show' }} filters</span>
        </button>
      </div>
      <LabDashboardFilterBar
        v-model="filters"
        :open="filtersOpen"
        :show-sub-department="false"
        @apply="load" />
    </div>

    <!-- ── Loading ───────────────────────────────────────────────────────── -->
    <div v-if="loading" class="island flex flex-col items-center justify-center gap-3 py-16">
      <font-awesome-icon :icon="['fas', 'circle-notch']" class="text-3xl text-primary animate-spin" />
      <p class="text-sm sm:text-base text-on-surface-variant">Loading laboratory dashboard…</p>
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="island flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div class="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-2xl text-error" />
      </div>
      <p class="text-sm sm:text-base text-on-surface-variant max-w-md">{{ error }}</p>
      <button type="button" class="btn-secondary" @click="load()">
        <font-awesome-icon :icon="['fas', 'rotate-right']" />
        <span>Retry</span>
      </button>
    </div>

    <!-- ── Live data ─────────────────────────────────────────────────────── -->
    <template v-else-if="d">

      <!-- KPI tiles -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <div v-for="k in kpis" :key="k.label"
          class="island flex flex-col gap-2 border-l-4" :class="k.accent">
          <div class="flex items-center justify-between">
            <span class="stat-card-label">{{ k.label }}</span>
            <font-awesome-icon :icon="['fas', k.icon]" :class="k.tint" />
          </div>
          <span class="stat-card-value">{{ k.value }}</span>
        </div>
      </div>

      <!-- Distributions + status donut -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Status donut -->
        <div class="island">
          <h3 class="section-heading">Orders by status</h3>
          <ClientOnly>
            <apexchart v-if="hasStatus" type="donut" height="260"
              :options="statusDonut.options" :series="statusDonut.series" />
            <p v-else class="empty-line">No orders in this window.</p>
            <template #fallback>
              <div class="h-[260px] flex items-center justify-center text-outline text-sm">Loading chart…</div>
            </template>
          </ClientOnly>
        </div>

        <!-- By discipline -->
        <div class="island">
          <h3 class="section-heading">Orders by discipline</h3>
          <DistBars :data="d.by_discipline" empty="No discipline data." />
        </div>

        <!-- By urgency -->
        <div class="island">
          <h3 class="section-heading">Orders by urgency</h3>
          <DistBars :data="d.by_urgency" empty="No urgency data." />
        </div>
      </div>

      <!-- Turnaround · Results · Backlog -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Turnaround -->
        <div class="island">
          <div class="flex items-center gap-2 mb-3">
            <font-awesome-icon :icon="['fas', 'gauge-high']" class="text-ribbon-teal" />
            <h3 class="heading-inline">Turnaround</h3>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-3">
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
        <div class="island">
          <div class="flex items-center gap-2 mb-3">
            <font-awesome-icon :icon="['fas', 'file-lines']" class="text-ribbon-purple" />
            <h3 class="heading-inline">Results</h3>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <MiniStat label="Recorded" :value="fmt(d.results.recorded)" />
            <MiniStat label="Critical" :value="fmt(d.results.critical)" :danger="d.results.critical > 0" />
            <MiniStat label="Pending technical" :value="fmt(d.results.pending_technical)" />
            <MiniStat label="Pending clinical" :value="fmt(d.results.pending_clinical)" />
          </div>
          <template v-if="hasEntries(d.results.by_flag)">
            <p class="sub-label mt-3">By flag</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="(v, key) in d.results.by_flag" :key="key" class="ribbon-chip-amber">
                {{ titleCase(String(key)) }} · {{ v }}
              </span>
            </div>
          </template>
        </div>

        <!-- Backlog -->
        <div class="island">
          <div class="flex items-center gap-2 mb-3">
            <font-awesome-icon :icon="['fas', 'hourglass-half']" class="text-ribbon-amber" />
            <h3 class="heading-inline">Backlog</h3>
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
      <div class="island">
        <div class="flex items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-2">
            <font-awesome-icon :icon="['fas', 'list-check']" class="text-ribbon-blue" />
            <h3 class="heading-inline">Worklist</h3>
          </div>
          <div class="flex gap-2">
            <span class="ribbon-chip-blue">Open · {{ fmt(d.worklist.open_total) }}</span>
            <span :class="d.worklist.overdue > 0 ? 'ribbon-chip-red' : 'ribbon-chip-teal'">
              Overdue · {{ fmt(d.worklist.overdue) }}
            </span>
          </div>
        </div>

        <div v-if="d.worklist.by_station.length" class="overflow-x-auto">
          <table class="his-table">
            <thead>
              <tr><th>Station</th><th>Open</th><th>Overdue</th></tr>
            </thead>
            <tbody>
              <tr v-for="(st, i) in d.worklist.by_station" :key="i">
                <td class="font-semibold">{{ st.station ?? st.name ?? '—' }}</td>
                <td>{{ st.open ?? st.open_total ?? 0 }}</td>
                <td>{{ st.overdue ?? 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-line">No open worklist items in this window.</p>
      </div>

      <!-- Received trend -->
      <div class="island">
        <h3 class="section-heading">Orders received</h3>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, onMounted } from 'vue'
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

// ── filters (defaults per brief) ─────────────────────────────────────────────
const filters = reactive<Record<string, any>>({
  from: '2026-05-01',
  to:   '2026-06-11',
})
const filtersOpen = ref(true)

const windowLabel = computed(() => {
  const f = filters.from || '—'
  const t = filters.to || '—'
  return `${f} → ${t}`
})

// ── fetch ────────────────────────────────────────────────────────────────────
const { request } = useApi()
const d       = ref<LabDashboard | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

const buildQuery = () => {
  const p = new URLSearchParams()
  if (filters.from) p.set('from', filters.from)
  if (filters.to)   p.set('to', filters.to)
  // standard variant: no sub_department_id
  const qs = p.toString()
  return qs ? `?${qs}` : ''
}

// First load is bare (no filter params) so the full window shows immediately;
// the user then refines via "Apply filters", which calls load() with useFilters.
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
onMounted(() => load(false)) // initial fetch: no filters applied

// ── formatting helpers ───────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat().format(n)

const titleCase = (s: string) =>
  s.replace(/[_\-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()

// on_time_rate may arrive as a fraction (0–1) or a percentage — handle both
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

// ── charts ───────────────────────────────────────────────────────────────────
const COLORS = ['#3d7fbf', '#3dae8c', '#e8a33d', '#b05fa8', '#c0395a', '#5b9bdb']

const hasStatus = computed(() => hasEntries(d.value?.by_status))
const statusDonut = computed(() => ({
  series: Object.values(d.value?.by_status ?? {}),
  options: {
    chart: { fontFamily: 'Manrope, sans-serif' },
    labels: Object.keys(d.value?.by_status ?? {}).map(titleCase),
    colors: COLORS,
    stroke: { width: 0 },
    legend: { position: 'bottom', fontFamily: 'Manrope, sans-serif' },
    dataLabels: { enabled: true, style: { fontFamily: 'Manrope, sans-serif' } },
    plotOptions: { pie: { donut: { size: '62%' } } },
  },
}))

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

// ── tiny inline render components (no shared Dashboard* files) ────────────────
const RIBBON_BAR = [
  'bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red',
]

// Horizontal distribution bars for a { label: number } map.
const DistBars = (props: { data: Record<string, number>; suffix?: string; empty?: string }) => {
  const entries = Object.entries(props.data ?? {})
  if (!entries.length) {
    return h('p', { class: 'empty-line' }, props.empty ?? 'No data.')
  }
  const max = Math.max(...entries.map(([, v]) => Number(v) || 0), 1)
  return h('div', { class: 'space-y-3' }, entries.map(([label, val], i) =>
    h('div', { key: label }, [
      h('div', { class: 'flex items-center justify-between text-xs sm:text-sm mb-1' }, [
        h('span', { class: 'font-semibold text-on-surface truncate pr-2' }, titleCase(label)),
        h('span', { class: 'text-on-surface-variant font-semibold shrink-0' },
          `${new Intl.NumberFormat().format(Number(val))}${props.suffix ?? ''}`),
      ]),
      h('div', { class: 'h-2 rounded-full bg-surface-container overflow-hidden' }, [
        h('div', {
          class: ['h-full rounded-full', RIBBON_BAR[i % RIBBON_BAR.length]],
          style: { width: `${Math.max((Number(val) / max) * 100, 4)}%` },
        }),
      ]),
    ]),
  ))
}

// Small labelled figure used inside the Turnaround/Results/Backlog cards.
const MiniStat = (props: { label: string; value: string; danger?: boolean }) =>
  h('div', { class: 'rounded-xl bg-surface-low/70 px-3 py-2.5' }, [
    h('p', { class: 'text-xs text-on-surface-variant font-medium' }, props.label),
    h('p', { class: ['text-lg sm:text-xl font-bold', props.danger ? 'text-ribbon-red' : 'text-on-surface'] },
      props.value),
  ])
</script>

<style scoped>
/* .section-heading, .ribbon-chip-* and .stat-card-* are global (main.css) — used as-is.
   Only page-local classes live here. */
.heading-inline { @apply text-base sm:text-lg md:text-xl font-semibold text-on-surface; }
.sub-label  { @apply text-xs font-semibold uppercase tracking-wide text-on-surface-variant mt-3 mb-2; }
.empty-line { @apply text-sm text-on-surface-variant py-6 text-center; }

.filter-toggle {
  @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold
         text-primary bg-primary/10 hover:bg-primary/20 transition-colors;
}
</style>