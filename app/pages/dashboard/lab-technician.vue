<!-- app/pages/dashboard/lab-technician.vue -->
<!--
  Laboratory Technician dashboard — fully self-contained (no shared components).
  Live GET /dashboard (role=lab_technician). Donut option builder is inline.
-->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Loading skeleton -->
    <template v-if="showSkeleton">
      <SkeletonStatGrid :count="5" grid-class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonPanel :bars="4" />
        <SkeletonPanel :bars="4" />
      </div>
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
        <table class="his-table">
          <thead><tr><th>Accession</th><th>Patient</th><th>Test</th><th>Priority</th><th>Received</th></tr></thead>
          <tbody><SkeletonTableRows :columns="5" :rows="4" /></tbody>
        </table>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island">
      <div class="py-10 sm:py-12 flex flex-col items-center justify-center gap-3 text-center">
        <span class="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
          <font-awesome-icon :icon="['fas','triangle-exclamation']" class="text-xl text-error" />
        </span>
        <p class="text-sm sm:text-base font-semibold text-on-surface">Couldn't load your dashboard</p>
        <p class="text-xs sm:text-sm text-on-surface-variant max-w-md break-words">{{ error }}</p>
        <button type="button" class="btn-secondary mt-1" @click="reload">
          <font-awesome-icon :icon="['fas','rotate-right']" /><span>Retry</span>
        </button>
      </div>
    </div>

    <!-- Live data -->
    <template v-else-if="d">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div v-for="k in kpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3"><span :class="['font-bold break-words text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.display }}</span></div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <!-- Pending by department (bars) -->
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Pending by Department</h2>
          <div v-if="byDept.length" class="flex flex-col gap-2.5">
            <div v-for="(row, idx) in byDept" :key="row.label" class="min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="flex items-center gap-2 min-w-0">
                  <span :class="['inline-block w-2.5 h-2.5 rounded-full shrink-0', RIBBON_BAR[idx % RIBBON_BAR.length]]" />
                  <span class="text-xs sm:text-sm font-semibold text-on-surface truncate">{{ row.label }}</span>
                </span>
                <span class="text-xs sm:text-sm font-bold text-on-surface-variant flex-shrink-0">{{ row.value.toLocaleString() }}</span>
              </div>
              <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div :class="['h-full rounded-full', RIBBON_BAR[idx % RIBBON_BAR.length]]" :style="{ width: row.pct + '%' }" />
              </div>
            </div>
          </div>
          <p v-else class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No pending samples.</p>
        </div>

        <!-- Pending by priority (donut) -->
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Pending by Priority</h2>
          <ClientOnly>
            <apexchart v-if="byPriority.series.length" type="donut" height="220" :series="byPriority.series" :options="donutOpts(byPriority.labels)" />
            <p v-else class="py-10 text-center text-sm text-on-surface-variant">No pending samples.</p>
            <template #fallback><div class="h-[220px] grid place-items-center text-sm text-on-surface-variant">Loading…</div></template>
          </ClientOnly>
        </div>
      </div>

      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="mb-4">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Workload Queue</h2>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Samples awaiting processing</p>
        </div>
        <div v-if="!d.workload_queue.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','microscope']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">Queue is clear</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Incoming samples will be listed here by turnaround priority.</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="his-table">
            <thead><tr><th>Accession</th><th>Patient</th><th>Test</th><th>Priority</th><th>Received</th></tr></thead>
            <tbody>
              <tr v-for="(row, idx) in d.workload_queue" :key="idx">
                <td class="font-mono text-xs sm:text-sm font-bold text-primary">{{ row.accession_no }}</td>
                <td class="truncate-cell">{{ row.patient_name }}</td>
                <td class="truncate-cell">{{ row.test_name }}</td>
                <td>{{ row.priority }}</td>
                <td class="whitespace-nowrap text-xs sm:text-sm">{{ row.received_at }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Quick actions -->
    <div v-if="quickActions.length"
      class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
      <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Quick actions</h2>
      <div class="flex flex-wrap gap-2 sm:gap-3">
        <NuxtLink v-for="(a, idx) in quickActions" :key="a.to" :to="a.to" :class="a.primary ? 'btn-primary' : 'btn-secondary'">
          <font-awesome-icon :icon="a.icon" :class="a.primary ? '' : RIBBON_ICON[idx % RIBBON_ICON.length]" />
          <span>{{ a.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LabInsights { pending_samples: number; partial_results: number; resulted_today: number; urgent_pending: number; overdue: number }
interface LabDashboard {
  role: string; role_label: string; user: string; generated_at: string
  insights: LabInsights
  pending_by_department: Record<string, number>
  pending_by_priority: Record<string, number>
  workload_queue: Array<{ accession_no?: string; patient_name?: string; test_name?: string; priority?: string; received_at?: string }>
}

const { data, loading, error, reload } = useDashboardData<LabDashboard>()
const { showSkeleton } = useDelayedLoading(loading)
const d = computed(() => data.value)

const auth = useAuthStore()
const { can } = usePermission()
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' })
const displayName = computed(() => auth.user?.full_name ?? 'there')
const roleLabel = computed(() => auth.user?.role_label ?? '')
const department = computed(() => auth.user?.department ?? '')
const generatedLabel = computed(() => {
  const v = d.value?.generated_at; if (!v) return ''
  const dt = new Date(v)
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString('en-MW', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
})

type Tile = { label: string; display: string; icon: [string,string]; iconBg: string; iconColor: string; accent: string }
const kpis = computed(() => {
  const i = d.value!.insights
  return [
    { label: 'Pending Samples', display: i.pending_samples.toLocaleString(), icon: ['fas','vials'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface' },
    { label: 'Partial Results', display: i.partial_results.toLocaleString(), icon: ['fas','hourglass-half'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Resulted Today', display: i.resulted_today.toLocaleString(), icon: ['fas','circle-check'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-on-surface' },
    { label: 'Urgent / STAT', display: i.urgent_pending.toLocaleString(), icon: ['fas','triangle-exclamation'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: 'text-error' },
    { label: 'Overdue', display: i.overdue.toLocaleString(), icon: ['fas','clock'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: 'text-error' },
  ] as Tile[]
})

// Distribution bars
const RIBBON_BAR = ['bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red']
const byDept = computed(() => {
  const items = Object.entries(d.value?.pending_by_department ?? {}).map(([label, value]) => ({ label: label || 'Unspecified', value }))
  const max = Math.max(1, ...items.map(i => i.value))
  return items.sort((a, b) => b.value - a.value).map(i => ({ ...i, pct: Math.round((i.value / max) * 100) }))
})

// Donut (inline ApexCharts builder)
const COLORS = ['#3d7fbf', '#3dae8c', '#e8a33d', '#b05fa8', '#c0395a', '#5b9bdb', '#a3dac6', '#e2b3da']
const baseFont = { fontFamily: 'Manrope, sans-serif' }
let _cid = 0
const cid = () => `lab-chart-${++_cid}`
function distToSeries(obj?: Record<string, number>) {
  const e = Object.entries(obj ?? {})
  return { labels: e.map(([k]) => k || 'Unspecified'), series: e.map(([, v]) => v) }
}
function donutOpts(labels: string[]) {
  return { chart: { id: cid(), type: 'donut', toolbar: { show: false }, ...baseFont }, labels, colors: COLORS, legend: { position: 'bottom', fontSize: '12px' }, dataLabels: { enabled: labels.length > 0 }, plotOptions: { pie: { donut: { size: '60%' } } }, noData: { text: 'No data yet', style: { fontSize: '13px', color: '#727687' } } }
}
const byPriority = computed(() => distToSeries(d.value?.pending_by_priority ?? {}))

const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Search patient', to: '/patients', icon: ['fas','magnifying-glass'], perm: 'patient_search', primary: true },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>