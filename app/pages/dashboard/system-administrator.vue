<!-- app/pages/dashboard/system-administrator.vue -->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Loading skeleton -->
    <template v-if="showSkeleton">
      <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
      <SkeletonStatGrid :count="3" grid-class="grid-cols-1 sm:grid-cols-3" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div class="lg:col-span-2"><SkeletonPanel :bars="4" /></div>
        <SkeletonPanel :bars="4" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonPanel :bars="3" />
        <SkeletonPanel :bars="3" />
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
      <!-- Primary + money KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="k in primaryKpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3">
            <div class="flex items-end gap-2 flex-wrap">
              <span :class="['font-bold break-words', k.money ? 'text-lg sm:text-xl md:text-2xl break-all' : 'text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.display }}</span>
              <span v-if="k.tag" :class="['text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0', k.tagClass]">{{ k.tag }}</span>
            </div>
            <p v-if="k.sub" class="text-xs sm:text-sm text-outline mt-1 break-words">{{ k.sub }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div v-for="k in moneyKpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3">
            <div class="flex items-end gap-2 flex-wrap">
              <span :class="['font-bold break-words', k.money ? 'text-lg sm:text-xl md:text-2xl break-all' : 'text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.display }}</span>
              <span v-if="k.tag" :class="['text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0', k.tagClass]">{{ k.tag }}</span>
            </div>
            <p v-if="k.sub" class="text-xs sm:text-sm text-outline mt-1 break-words">{{ k.sub }}</p>
          </div>
        </div>
      </div>

      <!-- Trend + active users -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden lg:col-span-2">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Patient Registration Trend</h2>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Monthly throughput</p>
          </div>
          <ClientOnly>
            <apexchart v-if="monthlyReg.categories.length" type="area" height="260" :series="monthlyReg.series" :options="areaOpts(monthlyReg.categories)" />
            <p v-else class="py-10 text-center text-sm text-on-surface-variant">No registrations recorded yet.</p>
            <template #fallback><div class="h-[260px] grid place-items-center text-sm text-on-surface-variant">Loading…</div></template>
          </ClientOnly>
        </div>

        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Active Users by Role</h2>
          <ClientOnly>
            <apexchart v-if="activeUsers.categories.length" type="bar" height="260" :series="activeUsers.series" :options="barOpts(activeUsers.categories, true)" />
            <p v-else class="py-10 text-center text-sm text-on-surface-variant">No active users.</p>
            <template #fallback><div class="h-[260px] grid place-items-center text-sm text-on-surface-variant">Loading…</div></template>
          </ClientOnly>
        </div>
      </div>

      <!-- Cancer distributions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Cancer Type Distribution</h2>
          <ClientOnly>
            <apexchart v-if="cancerType.series.length" type="donut" height="240" :series="cancerType.series" :options="donutOpts(cancerType.labels)" />
            <p v-else class="py-10 text-center text-sm text-on-surface-variant">No diagnoses captured yet.</p>
            <template #fallback><div class="h-[240px] grid place-items-center text-sm text-on-surface-variant">Loading…</div></template>
          </ClientOnly>
        </div>

        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Cancer Stage Distribution</h2>
          <ClientOnly>
            <apexchart v-if="cancerStage.series.length" type="donut" height="240" :series="cancerStage.series" :options="donutOpts(cancerStage.labels)" />
            <p v-else class="py-10 text-center text-sm text-on-surface-variant">No staging captured yet.</p>
            <template #fallback><div class="h-[240px] grid place-items-center text-sm text-on-surface-variant">Loading…</div></template>
          </ClientOnly>
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
// ── Payload shape (owned by this file) ─────────────────────────────────────
interface Money { MWK: string; USD: string }
interface AdminInsights {
  total_customers: number; new_customers_this_month: number
  total_patients: number; new_patients_this_month: number
  visits_today: number; active_visits: number; active_users: number; pending_lab_results: number
  insurance_covered_amount: Money; outstanding_balance: Money
}
interface AdminDashboard {
  role: string; role_label: string; user: string; generated_at: string
  insights: AdminInsights
  cancer_type_distribution: Record<string, number>
  cancer_stage_distribution: Record<string, number>
  monthly_registrations: Record<string, number>
  active_users_by_role: Record<string, number>
}

// ── Data ───────────────────────────────────────────────────────────────────
const { data, loading, error, reload } = useDashboardData<AdminDashboard>()
const d = computed(() => data.value)
const { showSkeleton } = useDelayedLoading(loading)

// ── Header ─────────────────────────────────────────────────────────────────
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

// ── KPI tiles ──────────────────────────────────────────────────────────────
type Tile = { label: string; display: string; icon: [string,string]; iconBg: string; iconColor: string; accent: string; money?: boolean; sub?: string; tag?: string; tagClass?: string }
const monthLabel = computed(() => new Date().toLocaleDateString('en-MW', { month: 'short', year: 'numeric' }))
const primaryKpis = computed(() => {
  const i = d.value!.insights
  return [
    { label: 'Total Patients', display: i.total_patients.toLocaleString(), icon: ['fas','hospital-user'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface', tag: `${i.new_patients_this_month ?? 0} new`, tagClass: 'bg-secondary-fixed text-secondary', sub: `New in ${monthLabel.value}` },
    { label: 'Total Customers', display: i.total_customers.toLocaleString(), icon: ['fas','users'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: 'text-on-surface', tag: `${i.new_customers_this_month ?? 0} new`, tagClass: 'bg-secondary-fixed text-secondary', sub: 'Registered to date' },
    { label: 'Visits Today', display: i.visits_today.toLocaleString(), icon: ['fas','calendar-day'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface', tag: `${i.active_visits ?? 0} active`, tagClass: 'bg-primary-fixed text-primary-container', sub: 'In progress now' },
    { label: 'Active Users', display: i.active_users.toLocaleString(), icon: ['fas','user-check'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-on-surface', tag: 'Online', tagClass: 'bg-secondary-fixed text-secondary', sub: 'Signed in' },
  ] as Tile[]
})
const moneyKpis = computed(() => {
  const i = d.value!.insights
  return [
    { label: 'Insurance Covered', display: mwk(i.insurance_covered_amount?.MWK), money: true, icon: ['fas','shield-heart'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-secondary', sub: 'Settled by schemes' },
    { label: 'Outstanding Balance', display: mwk(i.outstanding_balance?.MWK), money: true, icon: ['fas','file-invoice-dollar'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface', tag: 'Receivable', tagClass: 'bg-accent-fixed text-accent-container', sub: 'Awaiting settlement' },
    { label: 'Pending Lab Results', display: i.pending_lab_results.toLocaleString(), icon: ['fas','flask'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: 'text-error', tag: 'Awaiting', tagClass: 'bg-error-container text-error', sub: 'Across all departments' },
  ] as Tile[]
})

// ── Charts (inline ApexCharts option builders) ─────────────────────────────
const COLORS = ['#3d7fbf', '#3dae8c', '#e8a33d', '#b05fa8', '#c0395a', '#5b9bdb', '#a3dac6', '#e2b3da']
const baseFont = { fontFamily: 'Manrope, sans-serif' }
const noData = { text: 'No data yet', style: { fontSize: '13px', color: '#727687' } }
let _cid = 0
const cid = () => `admin-chart-${++_cid}`
const mwk = (v: string | number | null | undefined) => `MWK ${Number(v ?? 0).toLocaleString('en-MW', { maximumFractionDigits: 0 })}`
const fmtMonth = (k: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(k)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString('en-MW', { month: 'short', year: 'numeric' }) : k
}
function distToSeries(obj?: Record<string, number>) {
  const e = Object.entries(obj ?? {})
  return { labels: e.map(([k]) => k || 'Unspecified'), series: e.map(([, v]) => v) }
}
function distToBarSeries(obj: Record<string, number> | undefined, name: string) {
  const e = Object.entries(obj ?? {})
  return { categories: e.map(([k]) => k || 'Unspecified'), series: [{ name, data: e.map(([, v]) => v) }] }
}
function donutOpts(labels: string[]) {
  return { chart: { id: cid(), type: 'donut', toolbar: { show: false }, ...baseFont }, labels, colors: COLORS, legend: { position: 'bottom', fontSize: '12px' }, dataLabels: { enabled: labels.length > 0 }, plotOptions: { pie: { donut: { size: '60%' } } }, noData }
}
function barOpts(categories: string[], horizontal = false) {
  // `distributed: true` colours EACH bar from `colors` (ribbon palette); without
  // it a single-series bar paints every bar with the first colour (all blue).
  // Legend hidden because distributed mode would otherwise list every category.
  return { chart: { id: cid(), type: 'bar', toolbar: { show: false }, ...baseFont }, colors: COLORS, plotOptions: { bar: { borderRadius: 4, horizontal, columnWidth: '55%', distributed: true } }, dataLabels: { enabled: false }, legend: { show: false }, xaxis: { categories, labels: { style: { fontSize: '11px' } } }, yaxis: { labels: { style: { fontSize: '11px' } } }, grid: { borderColor: '#e0e3e5', strokeDashArray: 4 }, noData }
}
function areaOpts(categories: string[]) {
  // Ribbon gradient fill: blue (stroke) → teal (fill base), so the trend reads
  // on-brand rather than flat blue.
  return { chart: { id: cid(), type: 'area', toolbar: { show: false }, ...baseFont }, colors: ['#3d7fbf'], fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, gradientToColors: ['#3dae8c'], stops: [0, 100] } }, stroke: { curve: 'smooth', width: 2 }, dataLabels: { enabled: false }, xaxis: { categories, labels: { style: { fontSize: '11px' } } }, yaxis: { labels: { style: { fontSize: '11px' } } }, grid: { borderColor: '#e0e3e5', strokeDashArray: 4 }, noData }
}

const cancerType = computed(() => distToSeries(d.value?.cancer_type_distribution ?? {}))
const cancerStage = computed(() => distToSeries(d.value?.cancer_stage_distribution ?? {}))
const activeUsers = computed(() => distToBarSeries(d.value?.active_users_by_role ?? {}, 'Users'))
const monthlyReg = computed(() => {
  const b = distToBarSeries(d.value?.monthly_registrations ?? {}, 'Registrations')
  return { ...b, categories: b.categories.map(fmtMonth) }
})

// ── Quick actions ──────────────────────────────────────────────────────────
const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Register customer', to: '/customers?action=register', icon: ['fas','user-plus'], perm: 'customer_registration', primary: true },
  { label: 'Search patient', to: '/patients', icon: ['fas','magnifying-glass'], perm: 'patient_search' },
  { label: 'Inventory', to: '/inventory', icon: ['fas','boxes-stacked'], perm: 'inventory_view' },
  { label: 'Assets', to: '/assets', icon: ['fas','microscope'], perm: 'asset_view' },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>