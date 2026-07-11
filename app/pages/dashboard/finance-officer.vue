<!-- app/pages/dashboard/finance-officer.vue -->
<!--
  Finance Officer dashboard — fully self-contained (no shared components).
  Live GET /dashboard (role=finance_officer). Donut option builder is inline.
-->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Loading skeleton -->
    <template v-if="showSkeleton">
      <SkeletonStatGrid :count="4" grid-class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonPanel :bars="4" />
        <SkeletonPanel :bars="4" />
      </div>
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
        <table class="his-table">
          <thead><tr><th>Invoice #</th><th>Patient</th><th>Amount</th><th>Patient Pays</th><th>Status</th></tr></thead>
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
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="k in kpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3">
            <span :class="['font-bold break-words', k.money ? 'text-lg sm:text-xl md:text-2xl break-all' : 'text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.display }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Payment Method Breakdown</h2>
          <ClientOnly>
            <apexchart v-if="payment.series.length" type="donut" height="240" :series="payment.series" :options="donutOpts(payment.labels)" />
            <p v-else class="py-10 text-center text-sm text-on-surface-variant">No payments recorded yet.</p>
            <template #fallback><div class="h-[240px] grid place-items-center text-sm text-on-surface-variant">Loading…</div></template>
          </ClientOnly>
        </div>
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Insurance Breakdown</h2>
          <ClientOnly>
            <apexchart v-if="insurance.series.length" type="donut" height="240" :series="insurance.series" :options="donutOpts(insurance.labels)" />
            <p v-else class="py-10 text-center text-sm text-on-surface-variant">No insurance claims yet.</p>
            <template #fallback><div class="h-[240px] grid place-items-center text-sm text-on-surface-variant">Loading…</div></template>
          </ClientOnly>
        </div>
      </div>

      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Recent Invoices</h2>
        <div v-if="!d.recent_invoices.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','file-invoice-dollar']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">No invoices yet</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Newly raised invoices will appear here.</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="his-table">
            <thead><tr><th>Invoice #</th><th>Patient</th><th>Amount</th><th>Patient Pays</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="(inv, idx) in d.recent_invoices" :key="idx">
                <td class="font-mono text-xs sm:text-sm font-bold text-primary">{{ inv.invoice_number }}</td>
                <td class="truncate-cell">{{ inv.patient_name }}</td>
                <td class="font-semibold whitespace-nowrap">{{ mwk(inv.subtotal_amount) }}</td>
                <td class="font-semibold text-primary whitespace-nowrap">{{ mwk(inv.patient_amount) }}</td>
                <td><span class="badge-success">{{ inv.status }}</span></td>
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
interface FinanceInsights {
  invoices_today: number; revenue_today_mwk: string; revenue_this_month_mwk: string
  outstanding_total_mwk: string; insurance_claims_pending: number
  insurance_claims_approved: number; insurance_claims_rejected: number
}
interface FinanceDashboard {
  role: string; role_label: string; user: string; generated_at: string
  insights: FinanceInsights
  payment_method_breakdown: Record<string, number>
  insurance_breakdown: Record<string, number>
  recent_invoices: Array<{ invoice_number?: string; patient_name?: string; subtotal_amount?: string; patient_amount?: string; status?: string }>
}

const { data, loading, error, reload } = useDashboardData<FinanceDashboard>()
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

const mwk = (v: string | number | null | undefined) => `MWK ${Number(v ?? 0).toLocaleString('en-MW', { maximumFractionDigits: 0 })}`

type Tile = { label: string; display: string; icon: [string,string]; iconBg: string; iconColor: string; accent: string; money?: boolean }
const kpis = computed(() => {
  const i = d.value!.insights
  return [
    { label: 'Invoices Today', display: i.invoices_today.toLocaleString(), icon: ['fas','receipt'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Revenue Today', display: mwk(i.revenue_today_mwk), money: true, icon: ['fas','coins'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-secondary' },
    { label: 'Revenue This Month', display: mwk(i.revenue_this_month_mwk), money: true, icon: ['fas','chart-line'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: 'text-tertiary' },
    { label: 'Outstanding Balance', display: mwk(i.outstanding_total_mwk), money: true, icon: ['fas','file-invoice'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: 'text-error' },
    { label: 'Claims Pending', display: i.insurance_claims_pending.toLocaleString(), icon: ['fas','hourglass-half'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface' },
    { label: 'Claims Approved', display: i.insurance_claims_approved.toLocaleString(), icon: ['fas','circle-check'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-secondary' },
    { label: 'Claims Rejected', display: i.insurance_claims_rejected.toLocaleString(), icon: ['fas','circle-xmark'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: 'text-error' },
  ] as Tile[]
})

// Donut (inline ApexCharts builder)
const COLORS = ['#3d7fbf', '#3dae8c', '#e8a33d', '#b05fa8', '#c0395a', '#5b9bdb', '#a3dac6', '#e2b3da']
const baseFont = { fontFamily: 'Manrope, sans-serif' }
let _cid = 0
const cid = () => `fin-chart-${++_cid}`
function distToSeries(obj?: Record<string, number>) {
  const e = Object.entries(obj ?? {})
  return { labels: e.map(([k]) => k || 'Unspecified'), series: e.map(([, v]) => v) }
}
function donutOpts(labels: string[]) {
  return { chart: { id: cid(), type: 'donut', toolbar: { show: false }, ...baseFont }, labels, colors: COLORS, legend: { position: 'bottom', fontSize: '12px' }, dataLabels: { enabled: labels.length > 0 }, plotOptions: { pie: { donut: { size: '60%' } } }, noData: { text: 'No data yet', style: { fontSize: '13px', color: '#727687' } } }
}
const payment = computed(() => distToSeries(d.value?.payment_method_breakdown ?? {}))
const insurance = computed(() => distToSeries(d.value?.insurance_breakdown ?? {}))

const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'New invoice', to: '/billing?action=new', icon: ['fas','file-invoice-dollar'], perm: 'billing_create', primary: true },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>