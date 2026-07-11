<!-- app/pages/dashboard/inventory-officer.vue -->
<!--
  Inventory Officer dashboard — fully self-contained (no shared components).
  Live GET /dashboard (role=inventory_officer). Header, KPI tiles, bars,
  tables, quick actions and loading/error UI are all inline in this file.
-->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Loading skeleton -->
    <template v-if="showSkeleton">
      <SkeletonStatGrid :count="5" grid-class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
      <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonPanel :bars="4" />
        <SkeletonPanel :bars="4" />
      </div>
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
        <table class="his-table">
          <thead><tr><th>Item</th><th>Code</th><th>On Hand</th><th>Reorder</th><th>Status</th></tr></thead>
          <tbody><SkeletonTableRows :columns="5" :rows="4" /></tbody>
        </table>
      </div>
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
        <table class="his-table">
          <thead><tr><th>Item</th><th>Batch</th><th>Qty</th><th>Received</th><th>Supplier</th></tr></thead>
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
    <template v-else-if="s">
      <!-- Store summary -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div v-for="k in summaryKpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3">
            <span :class="['font-bold break-words', k.money ? 'text-lg sm:text-xl md:text-2xl break-all' : 'text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.display }}</span>
            <p v-if="k.sub" class="text-xs sm:text-sm text-outline mt-1 break-words">{{ k.sub }}</p>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="k in alertKpis" :key="k.label"
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

      <!-- Breakdowns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Items by Type</h2>
          <div v-if="byType.length" class="flex flex-col gap-2.5">
            <div v-for="(row, idx) in byType" :key="row.label" class="min-w-0">
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
          <p v-else class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No item types catalogued.</p>
        </div>

        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Departments Stocked</h2>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Unique items held per department</p>
          </div>
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
          <p v-else class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No departmental holdings.</p>
        </div>
      </div>

      <!-- Consumption -->
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Consumption (last {{ s.usage_insights.window_days }} days)</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div class="min-w-0">
            <p class="text-2xl sm:text-3xl font-bold text-on-surface break-words">{{ s.usage_insights.events.toLocaleString() }}</p>
            <p class="text-xs sm:text-sm text-on-surface-variant">Usage events</p>
          </div>
          <div class="min-w-0">
            <p class="text-2xl sm:text-3xl font-bold text-on-surface break-words">{{ qty(s.usage_insights.quantity_used) }}</p>
            <p class="text-xs sm:text-sm text-on-surface-variant">Quantity used</p>
          </div>
          <div class="min-w-0 col-span-2">
            <p class="text-lg sm:text-xl md:text-2xl font-bold text-secondary break-all">{{ mwk(s.usage_insights.billable_value.amount) }}</p>
            <p class="text-xs sm:text-sm text-on-surface-variant">Billable value consumed</p>
          </div>
        </div>
        <div v-if="s.usage_insights.top_consumed_items.length" class="mt-4 pt-4 border-t border-surface-container">
          <p class="text-xs sm:text-sm font-bold text-on-surface-variant mb-2">Top consumed items</p>
          <ul class="flex flex-col gap-2">
            <li v-for="(t, idx) in s.usage_insights.top_consumed_items" :key="idx" class="flex items-center justify-between gap-2 min-w-0">
              <span class="text-xs sm:text-sm font-semibold text-on-surface truncate">{{ t.name }}</span>
              <span class="text-xs sm:text-sm font-bold text-on-surface-variant flex-shrink-0">{{ qty(t.quantity_used) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Low stock -->
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="mb-4">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Low Stock Items</h2>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">At or below reorder level</p>
        </div>
        <div v-if="!s.low_stock.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','circle-check']" class="text-3xl sm:text-4xl text-secondary/40 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">Stock levels healthy</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">No items are below their reorder level.</p>
        </div>
        <div v-else class="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table class="his-table">
            <thead><tr><th>Item</th><th>Code</th><th>On Hand</th><th>Reorder</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="i in s.low_stock" :key="i.id">
                <td class="truncate-cell font-semibold">{{ i.name }}</td>
                <td class="font-mono text-xs sm:text-sm">{{ i.code }}</td>
                <td class="font-semibold whitespace-nowrap">{{ qty(i.on_hand) }}</td>
                <td class="whitespace-nowrap text-on-surface-variant">{{ qty(i.reorder_level) }}</td>
                <td class="whitespace-nowrap">
                  <span v-if="Number(i.on_hand) <= 0" class="badge-error">Out of stock</span>
                  <span v-else class="badge-warning">At reorder</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent receipts -->
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Recent Goods Receipts</h2>
        <div v-if="!s.recent_receipts.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','truck-ramp-box']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">No recent receipts</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Incoming stock receipts will be listed here.</p>
        </div>
        <div v-else class="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table class="his-table">
            <thead><tr><th>Item</th><th>Batch</th><th>Qty</th><th>Received</th><th>Supplier</th></tr></thead>
            <tbody>
              <tr v-for="(r, idx) in s.recent_receipts" :key="idx">
                <td class="truncate-cell font-semibold">{{ r.item }}</td>
                <td class="font-mono text-xs sm:text-sm">{{ r.batch_no }}</td>
                <td class="font-semibold whitespace-nowrap">{{ qty(r.quantity) }}</td>
                <td class="whitespace-nowrap text-xs sm:text-sm">{{ r.received_date }}</td>
                <td class="truncate-cell">{{ r.supplier }}</td>
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
interface InventoryDashboard {
  summary: { total_items: number; billable_items: number; controlled_items: number; central_batches: number; departments_stocked: Array<{ type: string; unique_items: number }> }
  items_by_type: Array<{ type: string; count: number }>
  stock_valuation: { currency: string; central_store_value: string }
  low_stock: Array<{ id: number; name: string; code: string; on_hand: string; reorder_level: string }>
  expiring_soon: Array<Record<string, unknown>>
  expired: { batches: number; quantity: string }
  pending_approvals: { prices: number; damages: number; disposals: number }
  recent_receipts: Array<{ item: string; batch_no: string; quantity: string; received_date: string; supplier: string }>
  usage_insights: {
    window_days: number; events: number; quantity_used: string
    billable_value: { currency: string; amount: string }
    top_consumed_items: Array<{ name: string; quantity_used: string }>
  }
}

// ── Data ───────────────────────────────────────────────────────────────────
const { data, loading, error, reload } = useDashboardData<InventoryDashboard>()
const { showSkeleton } = useDelayedLoading(loading)
const s = computed(() => data.value)

// ── Header ─────────────────────────────────────────────────────────────────
const auth = useAuthStore()
const { can } = usePermission()
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' })
const displayName = computed(() => auth.user?.full_name ?? 'there')
const roleLabel = computed(() => auth.user?.role_label ?? '')
const department = computed(() => auth.user?.department ?? '')

// ── Formatters ─────────────────────────────────────────────────────────────
const qty = (v: string | number | null | undefined) => Number(v ?? 0).toLocaleString('en-MW', { maximumFractionDigits: 2 })
const mwk = (v: string | number | null | undefined) => `MWK ${Number(v ?? 0).toLocaleString('en-MW', { maximumFractionDigits: 0 })}`

// ── KPI tiles ──────────────────────────────────────────────────────────────
const summaryKpis = computed(() => {
  const su = s.value!.summary, sv = s.value!.stock_valuation
  return [
    { label: 'Total Items', display: su.total_items.toLocaleString(), icon: ['fas','boxes-stacked'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Billable Items', display: su.billable_items.toLocaleString(), icon: ['fas','tags'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-on-surface' },
    { label: 'Controlled Items', display: su.controlled_items.toLocaleString(), icon: ['fas','lock'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: 'text-error' },
    { label: 'Central Batches', display: su.central_batches.toLocaleString(), icon: ['fas','layer-group'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: 'text-on-surface' },
    { label: 'Store Value', display: mwk(sv.central_store_value), money: true, sub: `${sv.currency} · central store`, icon: ['fas','vault'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-accent-container' },
  ] as Tile[]
})
const alertKpis = computed(() => {
  const d = s.value!
  const pa = d.pending_approvals
  const oos = d.low_stock.filter(i => Number(i.on_hand) <= 0).length
  return [
    { label: 'Low Stock', display: d.low_stock.length.toLocaleString(), sub: `${oos} out of stock`, icon: ['fas','arrow-trend-down'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: d.low_stock.length ? 'text-accent-container' : 'text-on-surface' },
    { label: 'Expiring Soon', display: d.expiring_soon.length.toLocaleString(), icon: ['fas','hourglass-half'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: d.expiring_soon.length ? 'text-tertiary' : 'text-on-surface' },
    { label: 'Expired Batches', display: d.expired.batches.toLocaleString(), sub: `Qty ${qty(d.expired.quantity)}`, icon: ['fas','ban'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: d.expired.batches ? 'text-error' : 'text-on-surface' },
    { label: 'Pending Approvals', display: (pa.prices + pa.damages + pa.disposals).toLocaleString(), sub: `${pa.prices} price · ${pa.damages} damage · ${pa.disposals} disposal`, icon: ['fas','clipboard-check'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
  ] as Tile[]
})
type Tile = { label: string; display: string; icon: [string,string]; iconBg: string; iconColor: string; accent: string; money?: boolean; sub?: string }

// ── Distribution bars ──────────────────────────────────────────────────────
const RIBBON_BAR = ['bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red']
function toBars(items: Array<{ label: string; value: number }>) {
  const max = Math.max(1, ...items.map(i => i.value))
  return items.slice().sort((a, b) => b.value - a.value).map(i => ({ ...i, pct: Math.round((i.value / max) * 100) }))
}
const byType = computed(() => toBars((s.value?.items_by_type ?? []).map(r => ({ label: r.type, value: r.count }))))
const byDept = computed(() => toBars((s.value?.summary.departments_stocked ?? []).map(r => ({ label: r.type, value: r.unique_items }))))

// ── Quick actions ──────────────────────────────────────────────────────────
const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Inventory', to: '/inventory', icon: ['fas','boxes-stacked'], perm: 'inventory_view', primary: true },
  { label: 'Assets', to: '/assets', icon: ['fas','microscope'], perm: 'asset_view' },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>