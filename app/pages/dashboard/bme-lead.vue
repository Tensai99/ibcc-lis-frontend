<!-- app/pages/dashboard/bme-lead.vue -->
<!--
  Biomedical Engineering Lead dashboard — fully self-contained (no shared
  components). Live GET /dashboard (role=bme_lead). Everything (header, KPI
  tiles, bars, number panels, tables, quick actions, loading/error) is inline.
-->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Loading skeleton -->
    <template v-if="showSkeleton">
      <SkeletonStatGrid :count="5" grid-class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
      <SkeletonStatGrid :count="3" grid-class="grid-cols-1 sm:grid-cols-3" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonPanel :bars="4" />
        <SkeletonPanel :bars="4" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonPanel :bars="3" />
        <SkeletonPanel :bars="3" />
      </div>
      <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
        <table class="his-table">
          <thead><tr><th>Asset</th><th>Type</th><th>Due</th></tr></thead>
          <tbody><SkeletonTableRows :columns="3" :rows="4" /></tbody>
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
    <template v-else-if="s">
      <!-- Register summary -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div v-for="k in summaryKpis" :key="k.label"
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

      <!-- Register value -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div v-for="k in valueKpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3">
            <span :class="['font-bold break-all text-lg sm:text-xl md:text-2xl', k.accent]">{{ k.display }}</span>
            <p v-if="k.sub" class="text-xs sm:text-sm text-outline mt-1 break-words">{{ k.sub }}</p>
          </div>
        </div>
      </div>

      <!-- Breakdowns: class + status -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Assets by Class</h2>
          <div v-if="byClass.length" class="flex flex-col gap-2.5">
            <div v-for="(row, idx) in byClass" :key="row.label" class="min-w-0">
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
          <p v-else class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No assets classified.</p>
        </div>

        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Operational Status</h2>
          <div v-if="byStatus.length" class="flex flex-col gap-2.5">
            <div v-for="(row, idx) in byStatus" :key="row.label" class="min-w-0">
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
          <p v-else class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No status data.</p>
        </div>
      </div>

      <!-- Condition + Tools -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Condition</h2>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Register-wide asset condition</p>
          </div>
          <div v-if="byCondition.length" class="flex flex-col gap-2.5">
            <div v-for="(row, idx) in byCondition" :key="row.label" class="min-w-0">
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
          <p v-else class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No condition data.</p>
          <p v-if="faultyCount" class="mt-3 text-xs sm:text-sm text-error font-semibold">
            <font-awesome-icon :icon="['fas','triangle-exclamation']" /> {{ faultyCount }} asset(s) flagged faulty
          </p>
        </div>

        <div v-if="s.tools" class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Tools Register</h2>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">{{ s.tools.total }} tools tracked</p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-secondary">{{ s.tools.available }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Available</p></div>
            <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-primary-container">{{ s.tools.on_loan }}</p><p class="text-xs sm:text-sm text-on-surface-variant">On loan</p></div>
            <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-accent-container">{{ s.tools.in_maintenance }}</p><p class="text-xs sm:text-sm text-on-surface-variant">In maintenance</p></div>
            <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-error">{{ s.tools.lost }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Lost</p></div>
            <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-on-surface">{{ s.tools.outstanding_loans }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Outstanding loans</p></div>
            <div class="min-w-0"><p :class="['text-2xl sm:text-3xl font-bold', s.tools.overdue_loans ? 'text-error' : 'text-on-surface']">{{ s.tools.overdue_loans }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Overdue loans</p></div>
          </div>
        </div>
      </div>

      <!-- Maintenance -->
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="mb-4">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Maintenance</h2>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Planned preventive &amp; corrective work</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-tertiary">{{ s.maintenance.planned }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Planned</p></div>
          <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-primary-container">{{ s.maintenance.in_progress }}</p><p class="text-xs sm:text-sm text-on-surface-variant">In progress</p></div>
          <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-error">{{ s.maintenance.overdue }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Overdue</p></div>
          <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-accent-container">{{ s.maintenance.due_30d }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Due in 30d</p></div>
          <div class="min-w-0"><p class="text-2xl sm:text-3xl font-bold text-secondary">{{ s.maintenance.completed_30d }}</p><p class="text-xs sm:text-sm text-on-surface-variant">Done in 30d</p></div>
        </div>
      </div>

      <!-- Issues + approvals -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="k in issueKpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3">
            <span :class="['font-bold break-words text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.display }}</span>
            <p v-if="k.sub" class="text-xs sm:text-sm text-outline mt-1 break-words">{{ k.sub }}</p>
          </div>
        </div>
      </div>

      <!-- Inspections due -->
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="mb-4">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Inspections Due</h2>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Scheduled PPM &amp; routine checks</p>
        </div>
        <div v-if="!s.inspections_due.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','clipboard-check']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">No inspections due</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Upcoming scheduled inspections will appear here.</p>
        </div>
        <div v-else class="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table class="his-table">
            <thead><tr><th>Asset</th><th>Type</th><th>Due</th></tr></thead>
            <tbody>
              <tr v-for="(i, idx) in s.inspections_due" :key="idx">
                <td class="truncate-cell font-semibold">{{ i.asset }}</td>
                <td class="whitespace-nowrap"><span :class="i.type === 'PPM_PROTOCOL' ? 'badge-purple' : 'badge-info'">{{ titleize(i.type) }}</span></td>
                <td class="whitespace-nowrap text-xs sm:text-sm">
                  <span :class="isOverdue(i.next_due_on) ? 'text-error font-semibold' : ''">{{ i.next_due_on }}</span>
                  <span v-if="isOverdue(i.next_due_on)" class="ml-1 badge-error">Overdue</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Commissioning backlog -->
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="mb-4">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Commissioning Backlog</h2>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">{{ s.commissioning_backlog.length }} assets awaiting commissioning</p>
        </div>
        <div v-if="!s.commissioning_backlog.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','clipboard-check']" class="text-3xl sm:text-4xl text-secondary/40 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">No backlog</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">All received assets are commissioned.</p>
        </div>
        <div v-else class="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table class="his-table">
            <thead><tr><th>Tag</th><th>Name</th><th>Type</th></tr></thead>
            <tbody>
              <tr v-for="a in s.commissioning_backlog" :key="a.asset_tag">
                <td class="font-mono text-xs sm:text-sm font-bold text-primary">{{ a.asset_tag }}</td>
                <td class="truncate-cell font-semibold">{{ a.name }}</td>
                <td class="truncate-cell">{{ a.type }}</td>
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
// ── Payload shape (owned by this file) ─────────────────────────────────────
interface BmeDashboard {
  summary: { total_assets: number; tangible: number; intangible: number; in_service: number; departments_holding: number }
  by_class: Array<{ asset_class: string; count: number }>
  by_operational_status: Array<{ status: string; count: number }>
  by_condition: Array<{ condition: string; count: number }>
  register_value: { currency: string; gross_book_value: string | number; net_book_value: string | number; accumulated_depreciation: string | number }
  unallocated_units: { total_unallocated: number; assets_with_unallocated: number; items: Array<Record<string, unknown>> }
  maintenance: { planned: number; in_progress: number; overdue: number; due_30d: number; completed_30d: number }
  inspections_due: Array<{ asset: string; type: string; next_due_on: string }>
  open_issues: { total: number; critical: number; by_status: Record<string, number> }
  pending_approvals: { damages: number; disposals: number }
  commissioning_backlog: Array<{ asset_tag: string; name: string; type: string }>
  tools?: { total: number; available: number; on_loan: number; in_maintenance: number; lost: number; outstanding_loans: number; overdue_loans: number; recent_loans: Array<Record<string, unknown>> }
}

// ── Data ───────────────────────────────────────────────────────────────────
const { data, loading, error, reload } = useDashboardData<BmeDashboard>()
const s = computed(() => data.value)
const { showSkeleton } = useDelayedLoading(loading)

// ── Header ─────────────────────────────────────────────────────────────────
const auth = useAuthStore()
const { can } = usePermission()
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' })
const displayName = computed(() => auth.user?.full_name ?? 'there')
const roleLabel = computed(() => auth.user?.role_label ?? '')
const department = computed(() => auth.user?.department ?? '')

// ── Formatters + label helpers ─────────────────────────────────────────────
const mwk = (v: string | number | null | undefined) => `MWK ${Number(v ?? 0).toLocaleString('en-MW', { maximumFractionDigits: 0 })}`
const titleize = (v: string) => v.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ── KPI tiles ──────────────────────────────────────────────────────────────
type Tile = { label: string; display: string; icon: [string,string]; iconBg: string; iconColor: string; accent: string; sub?: string }
const summaryKpis = computed(() => {
  const su = s.value!.summary
  return [
    { label: 'Total Assets', display: su.total_assets.toLocaleString(), icon: ['fas','microscope'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Tangible', display: su.tangible.toLocaleString(), icon: ['fas','cube'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: 'text-on-surface' },
    { label: 'Intangible', display: su.intangible.toLocaleString(), icon: ['fas','floppy-disk'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface' },
    { label: 'In Service', display: su.in_service.toLocaleString(), icon: ['fas','circle-check'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-secondary' },
    { label: 'Departments', display: su.departments_holding.toLocaleString(), icon: ['fas','hospital'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
  ] as Tile[]
})
const valueKpis = computed(() => {
  const rv = s.value!.register_value
  return [
    { label: 'Gross Book Value', display: mwk(rv.gross_book_value), sub: rv.currency, icon: ['fas','sack-dollar'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Net Book Value', display: mwk(rv.net_book_value), icon: ['fas','scale-balanced'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-secondary' },
    { label: 'Accumulated Depreciation', display: mwk(rv.accumulated_depreciation), icon: ['fas','arrow-trend-down'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface' },
  ] as Tile[]
})
const issueKpis = computed(() => {
  const d = s.value!
  return [
    { label: 'Open Issues', display: d.open_issues.total.toLocaleString(), sub: `${d.open_issues.critical} critical`, icon: ['fas','triangle-exclamation'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: d.open_issues.total ? 'text-error' : 'text-on-surface' },
    { label: 'Unallocated Units', display: d.unallocated_units.total_unallocated.toLocaleString(), icon: ['fas','box-open'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface' },
    { label: 'Damage Approvals', display: d.pending_approvals.damages.toLocaleString(), icon: ['fas','clipboard-check'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Disposal Approvals', display: d.pending_approvals.disposals.toLocaleString(), icon: ['fas','trash-can'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: d.pending_approvals.disposals ? 'text-tertiary' : 'text-on-surface' },
  ] as Tile[]
})

// ── Distribution bars ──────────────────────────────────────────────────────
const RIBBON_BAR = ['bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red']
function toBars(items: Array<{ label: string; value: number }>) {
  const max = Math.max(1, ...items.map(i => i.value))
  return items.slice().sort((a, b) => b.value - a.value).map(i => ({ ...i, pct: Math.round((i.value / max) * 100) }))
}
const byClass = computed(() => toBars((s.value?.by_class ?? []).map(r => ({ label: titleize(r.asset_class), value: r.count }))))
const byStatus = computed(() => toBars((s.value?.by_operational_status ?? []).map(r => ({ label: titleize(r.status), value: r.count }))))
const byCondition = computed(() => toBars((s.value?.by_condition ?? []).map(r => ({ label: titleize(r.condition), value: r.count }))))
const faultyCount = computed(() => (s.value?.by_condition ?? []).find(r => r.condition === 'FAULTY')?.count ?? 0)

// ── Inspection date helper (timezone-safe local compare) ───────────────────
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const isOverdue = (due: string) => !!due && due < todayStr()

// ── Quick actions ──────────────────────────────────────────────────────────
const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Assets', to: '/assets', icon: ['fas','microscope'], perm: 'asset_view', primary: true },
  { label: 'Inventory', to: '/inventory', icon: ['fas','boxes-stacked'], perm: 'inventory_view' },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>