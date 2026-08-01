<!-- app/pages/inventory/department.vue -->
<!--
  Department Inventory Dashboard — non-privileged roles.

  Design language matches app/pages/assets/department.vue:
    • glass cards (.g-card)  — white/70 + backdrop-blur
    • alive table (.alive-tbl.tbl-rainbow) — each column header carries its own
      ribbon color (blue / purple / teal / amber / red / red / blue)
    • ribbon-tinted KPI cards
    • operational panel with progress bars
    • client-side search + pagination

  Data source: inv.getDashboard()  (server infers department from auth).
-->
<template>
    <div>
        <div class="max-w-[98%] mx-auto flex flex-col gap-5">

            <!-- ── Header ─────────────────────────────────────────────────────── -->
            <header
                class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
                <div class="flex items-center gap-4 min-w-0">
                    <div
                        class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                        <font-awesome-icon :icon="['fas', 'boxes-stacked']" class="text-xl" />
                    </div>
                    <div class="min-w-0">
                        <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words">
                            {{ dept.name || auth.currentUser?.department || 'Department' }} inventory overview
                        </h1>
                        <p v-if="dept.code" class="text-[11px] text-outline font-mono mt-0.5">{{ dept.code }}</p>
                    </div>
                </div>
            </header>

            <!-- feedback -->
            <div v-if="feedback.msg" class="alert-error">
                <font-awesome-icon :icon="['fas', 'circle-exclamation']" class="mt-0.5" />
                <span class="break-words">{{ feedback.msg }}</span>
            </div>

            <template v-if="showSkeleton && !dash">
                <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <SkeletonPanel :bars="4" />
                    <div class="g-card p-6 lg:col-span-2">
                        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
                        <SkeletonTableRows :columns="1" :rows="3" />
                    </div>
                </div>
                <div class="g-card p-6 sm:p-8">
                    <SkeletonBase width="25%" height="1.25rem" class="mb-5" />
                    <SkeletonTableRows :columns="7" :rows="5" />
                </div>
            </template>

            <template v-else>
                <!-- ── KPI cards (ribbon accents) ────────────────────────────── -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
                        <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Distinct items
                        </p>
                        <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.distinct_items ?? '—'
                            }}</p>
                        <p class="text-[11px] text-on-surface-variant mt-1">{{ summary.active_batches ?? 0 }} active
                            batches</p>
                    </div>
                    <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-purple">
                        <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-2">On hand</p>
                        <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ fmtQty(summary.total_on_hand)
                            }}</p>
                        <p class="text-[11px] text-on-surface-variant mt-1">of {{ fmtQty(summary.total_allocated) }}
                            allocated</p>
                    </div>
                    <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-teal">
                        <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-2">Used</p>
                        <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ fmtQty(summary.total_used) }}
                        </p>
                        <p class="text-[11px] text-on-surface-variant mt-1">{{ utilisationPct }}% utilisation</p>
                    </div>
                    <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-amber bg-ribbon-amber/5">
                        <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider mb-2">On-hand value
                        </p>
                        <p class="text-lg sm:text-xl lg:text-2xl font-extrabold text-on-surface break-words">
                            {{ fmtCurrency(summary.on_hand_value) }} <span class="text-xs text-outline">MWK</span>
                        </p>
                    </div>
                </div>

                <!-- ── Alert strip: expired + pending approvals ────────────── -->
                <div v-if="hasAlerts" class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div v-if="expired.batches" class="g-card p-5 border-l-4 border-ribbon-red bg-ribbon-red/5">
                        <div class="flex items-center gap-2 mb-1">
                            <font-awesome-icon :icon="['fas', 'hourglass-end']" class="text-ribbon-red" />
                            <p class="text-[10px] text-ribbon-red font-bold uppercase tracking-wider">Expired stock</p>
                        </div>
                        <p class="text-lg font-extrabold text-on-surface">{{ expired.batches }} batches</p>
                        <p class="text-xs text-on-surface-variant">{{ fmtQty(expired.quantity) }} units</p>
                    </div>
                    <div v-if="pendingApprovals.damages"
                        class="g-card p-5 border-l-4 border-ribbon-amber bg-ribbon-amber/5">
                        <div class="flex items-center gap-2 mb-1">
                            <font-awesome-icon :icon="['fas', 'house-crack']" class="text-ribbon-amber" />
                            <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider">Damages pending
                            </p>
                        </div>
                        <p class="text-lg font-extrabold text-on-surface">{{ pendingApprovals.damages }}</p>
                        <p class="text-xs text-on-surface-variant">awaiting approval</p>
                    </div>
                    <div v-if="pendingApprovals.disposals"
                        class="g-card p-5 border-l-4 border-ribbon-amber bg-ribbon-amber/5">
                        <div class="flex items-center gap-2 mb-1">
                            <font-awesome-icon :icon="['fas', 'trash-can']" class="text-ribbon-amber" />
                            <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider">Disposals
                                pending</p>
                        </div>
                        <p class="text-lg font-extrabold text-on-surface">{{ pendingApprovals.disposals }}</p>
                        <p class="text-xs text-on-surface-variant">awaiting approval</p>
                    </div>
                </div>

                <!-- ── Wastage + Anomalies row ─────────────────────────────── -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <!-- Wastage panel -->
                    <div class="g-card p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div
                                class="w-10 h-10 rounded-full bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber">
                                <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
                            </div>
                            <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Wastage</h3>
                        </div>
                        <div class="space-y-3">
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-xs sm:text-sm font-medium">Damaged</span>
                                    <span class="text-xs sm:text-sm font-bold font-mono">{{ fmtQty(wastage.damaged)
                                        }}</span>
                                </div>
                                <div class="h-2 rounded-full bg-surface-low overflow-hidden">
                                    <div class="h-full rounded-full bg-ribbon-amber"
                                        :style="{ width: wastagePct('damaged') + '%' }" />
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-xs sm:text-sm font-medium">Disposed</span>
                                    <span class="text-xs sm:text-sm font-bold font-mono">{{ fmtQty(wastage.disposed)
                                        }}</span>
                                </div>
                                <div class="h-2 rounded-full bg-surface-low overflow-hidden">
                                    <div class="h-full rounded-full bg-ribbon-red"
                                        :style="{ width: wastagePct('disposed') + '%' }" />
                                </div>
                            </div>
                            <div class="pt-3 border-t border-outline-variant/30">
                                <p class="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Wastage
                                    rate</p>
                                <p class="text-2xl font-extrabold" :class="wastageRateClass">
                                    {{ Number(wastage.wastage_rate_pct || 0).toFixed(2) }}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Anomalies -->
                    <div class="g-card p-6 lg:col-span-2">
                        <div class="flex items-center gap-3 mb-4">
                            <div
                                class="w-10 h-10 rounded-full bg-ribbon-red/15 flex items-center justify-center text-ribbon-red">
                                <font-awesome-icon :icon="['fas', 'satellite-dish']" />
                            </div>
                            <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Anomalies</h3>
                            <span
                                class="ml-auto text-[11px] font-bold text-ribbon-red bg-ribbon-red/10 px-2.5 py-1 rounded-full">
                                {{ anomalies.length }}
                            </span>
                        </div>
                        <div class="space-y-2 max-h-[260px] overflow-y-auto scroll-area pr-1">
                            <div v-for="(an, i) in anomalies" :key="i"
                                class="p-3 rounded-xl bg-ribbon-red/5 border border-ribbon-red/15">
                                <div class="flex justify-between items-center gap-2">
                                    <span class="text-xs font-bold text-on-surface break-words">
                                        {{ an.title || an.type || 'Anomaly' }}
                                    </span>
                                    <span class="text-[10px] font-bold uppercase" :class="sevClass(an.severity)">
                                        {{ an.severity || 'flag' }}
                                    </span>
                                </div>
                                <p class="text-[11px] text-on-surface-variant break-words mt-0.5">
                                    {{ an.description || an.detail || '' }}
                                </p>
                            </div>
                            <p v-if="!anomalies.length" class="text-sm text-on-surface-variant py-6 text-center">
                                No anomalies flagged.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ── Expiring soon + Usage-by-consumer row ───────────────── -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div class="g-card p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div
                                class="w-10 h-10 rounded-full bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber">
                                <font-awesome-icon :icon="['fas', 'hourglass-half']" />
                            </div>
                            <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Expiring soon</h3>
                        </div>
                        <div v-if="expiringSoon.length"
                            class="space-y-2 max-h-[260px] overflow-y-auto scroll-area pr-1">
                            <div v-for="(e, i) in expiringSoon" :key="i"
                                class="p-3 rounded-xl bg-ribbon-amber/5 border border-ribbon-amber/15 flex justify-between items-center gap-2">
                                <div class="min-w-0">
                                    <p class="text-xs font-bold break-words">{{ e.name || e.item || 'Item' }}</p>
                                    <p class="text-[10px] text-outline">Batch {{ e.batch_no || '—' }}</p>
                                </div>
                                <span class="text-[10px] font-bold text-ribbon-amber whitespace-nowrap">
                                    {{ e.expires_on || e.expiry_date || '—' }}
                                </span>
                            </div>
                        </div>
                        <div v-else class="text-center py-8">
                            <font-awesome-icon :icon="['fas', 'circle-check']" class="text-2xl text-ribbon-teal mb-2" />
                            <p class="text-sm text-on-surface-variant">Nothing expiring soon.</p>
                        </div>
                    </div>

                    <div class="g-card p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div
                                class="w-10 h-10 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple">
                                <font-awesome-icon :icon="['fas', 'chart-pie']" />
                            </div>
                            <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Usage by consumer type</h3>
                        </div>
                        <div v-if="usageByConsumerType.length" class="space-y-3">
                            <div v-for="(c, i) in usageByConsumerType" :key="i">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-xs sm:text-sm font-medium">{{ c.consumer_type || c.type ||
                                        'Unknown' }}</span>
                                    <span class="text-xs sm:text-sm font-bold font-mono">{{ fmtQty(c.quantity ||
                                        c.total) }}</span>
                                </div>
                                <div class="h-2 rounded-full bg-surface-low overflow-hidden">
                                    <div class="h-full rounded-full" :class="rotatingBar(i)"
                                        :style="{ width: consumerPct(c) + '%' }" />
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8">
                            <font-awesome-icon :icon="['fas', 'chart-pie']" class="text-2xl text-outline/40 mb-2" />
                            <p class="text-sm text-on-surface-variant">No consumer-type breakdown yet.</p>
                        </div>
                    </div>
                </div>

                <!-- ── Items table (colorful ribbon header) ─────────────────── -->
                <div class="g-card p-6 sm:p-8">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Department items</h3>
                        <div class="relative w-full md:w-96">
                            <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                            <input v-model="q" type="text" autocomplete="off" placeholder="Search by name or item id…"
                                class="cust-input has-icon" />
                        </div>
                    </div>

                    <div class="rounded-t-2xl overflow-hidden border border-outline-variant/20">
                        <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-rainbow">
                            <thead>
                                <tr class="text-[11px] text-white uppercase tracking-widest font-bold">
                                    <th class="py-4 px-5">Item</th>
                                    <th class="py-4 px-5 text-right">Allocated</th>
                                    <th class="py-4 px-5 text-right">On hand</th>
                                    <th class="py-4 px-5 text-right">Used</th>
                                    <th class="py-4 px-5 text-right">Damaged</th>
                                    <th class="py-4 px-5 text-right">Disposed</th>
                                    <th class="py-4 px-5">Utilisation</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-outline-variant/10">
                                <tr v-for="it in pagedItems" :key="it.inventory_id" class="transition-colors">
                                    <td class="py-4 px-5">
                                        <p class="font-bold break-words">{{ it.name }}</p>
                                        <p class="text-[10px] font-mono text-ribbon-blue">#{{ it.inventory_id }}</p>
                                    </td>
                                    <td class="py-4 px-5 text-right font-mono text-ribbon-purple">{{
                                        fmtQty(it.allocated) }}</td>
                                    <td class="py-4 px-5 text-right font-mono font-bold"
                                        :class="Number(it.on_hand) === 0 ? 'text-ribbon-red' : 'text-ribbon-teal'">
                                        {{ fmtQty(it.on_hand) }}
                                    </td>
                                    <td class="py-4 px-5 text-right font-mono">{{ fmtQty(it.used) }}</td>
                                    <td class="py-4 px-5 text-right font-mono"
                                        :class="Number(it.damaged) > 0 ? 'text-ribbon-amber font-bold' : 'text-on-surface-variant'">
                                        {{ fmtQty(it.damaged) }}
                                    </td>
                                    <td class="py-4 px-5 text-right font-mono"
                                        :class="Number(it.disposed) > 0 ? 'text-ribbon-red font-bold' : 'text-on-surface-variant'">
                                        {{ fmtQty(it.disposed) }}
                                    </td>
                                    <td class="py-4 px-5 min-w-[180px]">
                                        <div class="flex items-center gap-2">
                                            <div class="flex-1 h-2 bg-surface-low rounded-full overflow-hidden">
                                                <div class="h-full rounded-full transition-all"
                                                    :class="utilBarClass(it.utilisation_pct)"
                                                    :style="{ width: Math.min(Number(it.utilisation_pct) || 0, 100) + '%' }" />
                                            </div>
                                            <span class="text-[11px] font-mono text-on-surface-variant w-10 text-right">
                                                {{ Number(it.utilisation_pct || 0).toFixed(1) }}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="!filteredItems.length">
                                    <td colspan="7" class="py-10 text-center text-on-surface-variant">
                                        <font-awesome-icon :icon="['fas', 'inbox']"
                                            class="text-2xl opacity-40 mb-2 block mx-auto" />
                                        {{ q ? 'No items match your search.' : 'No items allocated to this department yet.' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="pages > 1" class="flex items-center justify-between gap-3 mt-4">
                        <p class="text-xs sm:text-sm text-on-surface-variant">
                            Showing {{ (page - 1) * PAGE_SIZE + 1 }}–{{ Math.min(page * PAGE_SIZE, filteredItems.length)
                            }}
                            of {{ filteredItems.length }}
                        </p>
                        <div class="flex items-center gap-2">
                            <button class="pager-btn" :disabled="page === 1" @click="page--">
                                <font-awesome-icon :icon="['fas', 'chevron-left']" />
                            </button>
                            <span class="text-sm font-semibold text-on-surface">{{ page }} / {{ pages }}</span>
                            <button class="pager-btn" :disabled="page === pages" @click="page++">
                                <font-awesome-icon :icon="['fas', 'chevron-right']" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ── Recent usage ─────────────────────────────────────────── -->
                <div v-if="recentUsage.length" class="g-card p-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
                            <font-awesome-icon :icon="['fas', 'clock-rotate-left']" />
                        </div>
                        <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Recent usage</h3>
                    </div>
                    <div class="space-y-2 max-h-[320px] overflow-y-auto scroll-area pr-1">
                        <div v-for="(u, i) in recentUsage" :key="i"
                            class="p-3 rounded-xl border border-outline-variant/20"
                            :class="i % 2 === 0 ? 'bg-white/40' : 'bg-surface-low/60'">
                            <div class="flex justify-between items-center gap-2 mb-1">
                                <span class="text-xs font-bold break-words">{{ u.item || u.name || 'Item' }}</span>
                                <span class="text-[10px] text-outline whitespace-nowrap">{{ relTime(u.used_at || u.date)
                                    }}</span>
                            </div>
                            <p class="text-[11px] text-on-surface-variant">
                                <span class="text-ribbon-teal font-bold">{{ fmtQty(u.quantity) }}</span> units ·
                                <span class="text-ribbon-purple">{{ u.consumer_type || u.consumer || '—' }}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

// auth.global.ts already gates every route; no definePageMeta needed.

// Bounce privileged users to the admin overview.
const auth = useAuthStore()
const PRIVILEGED_ROLES = ['system_administrator', 'inventory_officer']
if (PRIVILEGED_ROLES.includes(auth.currentRole)) {
    await navigateTo('/inventory', { replace: true })
}

const inv = useInventory()

// ── feedback / loading ─────────────────────────────────────────────────────
const feedback = reactive<{ msg: string; kind: 'error' | 'success' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'error' | 'success' = 'error') => { feedback.msg = msg; feedback.kind = kind }

const dash = ref<any>(null)
const loading = ref(false)
// Same delayed-skeleton helper the assets page uses. If it doesn't exist yet,
// swap to: const showSkeleton = computed(() => loading.value && !dash.value)
const { showSkeleton } = useDelayedLoading(loading)

// ── derived view-model ─────────────────────────────────────────────────────
const dept = computed(() => dash.value?.department ?? {})
const summary = computed(() => dash.value?.summary ?? {})
const items = computed<any[]>(() => dash.value?.items ?? [])
const anomalies = computed<any[]>(() => dash.value?.anomalies ?? [])
const wastage = computed(() => dash.value?.wastage ?? {})
const expiringSoon = computed<any[]>(() => dash.value?.expiring_soon ?? [])
const expired = computed(() => dash.value?.expired ?? { batches: 0, quantity: 0 })
const usageByConsumerType = computed<any[]>(() => dash.value?.usage_by_consumer_type ?? [])
const recentUsage = computed<any[]>(() => dash.value?.recent_usage ?? [])
const pendingApprovals = computed(() => dash.value?.pending_approvals ?? { damages: 0, disposals: 0 })

const hasAlerts = computed(() =>
    (expired.value.batches || 0) > 0 ||
    (pendingApprovals.value.damages || 0) > 0 ||
    (pendingApprovals.value.disposals || 0) > 0
)

const utilisationPct = computed(() => {
    const alloc = Number(summary.value.total_allocated) || 0
    const used = Number(summary.value.total_used) || 0
    if (!alloc) return '0.0'
    return ((used / alloc) * 100).toFixed(1)
})

const wastageRateClass = computed(() => {
    const r = Number(wastage.value.wastage_rate_pct) || 0
    if (r >= 5) return 'text-ribbon-red'
    if (r >= 1) return 'text-ribbon-amber'
    return 'text-ribbon-teal'
})

// ── formatters ─────────────────────────────────────────────────────────────
const fmtQty = (v: any) => {
    const n = Number(v)
    return isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
}
const fmtCurrency = (v: any) => {
    const n = Number(v)
    return isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
}
const relTime = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso); if (isNaN(d.getTime())) return '—'
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

// ── bar & pill classes ─────────────────────────────────────────────────────
const utilBarClass = (pct: any) => {
    const n = Number(pct) || 0
    if (n >= 90) return 'bg-ribbon-red'
    if (n >= 70) return 'bg-ribbon-amber'
    if (n > 0) return 'bg-ribbon-teal'
    return 'bg-outline-variant/60'
}
const rotatingBar = (i: number) => {
    const palette = ['bg-ribbon-blue', 'bg-ribbon-purple', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-red']
    return palette[i % palette.length]
}
const sevClass = (s: string) => /high|critical/i.test(s || '') ? 'text-ribbon-red'
    : /medium/i.test(s || '') ? 'text-ribbon-amber' : 'text-outline'

// ── wastage / consumer percentages ─────────────────────────────────────────
const wastagePct = (k: 'damaged' | 'disposed') => {
    const total = Number(wastage.value.total) || 0
    const val = Number((wastage.value as any)?.[k]) || 0
    if (!total) return 0
    return Math.min((val / total) * 100, 100).toFixed(1)
}
const totalConsumerQty = computed(() =>
    usageByConsumerType.value.reduce((s, c) => s + (Number(c.quantity ?? c.total) || 0), 0)
)
const consumerPct = (c: any) => {
    const total = totalConsumerQty.value || 1
    return Math.min((Number(c.quantity ?? c.total) || 0) / total * 100, 100).toFixed(1)
}

// ── search + pagination ────────────────────────────────────────────────────
const q = ref('')
const PAGE_SIZE = 8
const page = ref(1)
const filteredItems = computed(() => {
    const term = q.value.trim().toLowerCase()
    if (!term) return items.value
    return items.value.filter(i =>
        `${i.name} ${i.inventory_id}`.toLowerCase().includes(term)
    )
})
const pages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)))
const pagedItems = computed(() => filteredItems.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
watch(filteredItems, () => { page.value = 1 })

// ── loader ─────────────────────────────────────────────────────────────────
const dashboard = async () => {
    loading.value = true
    try { dash.value = await inv.getDashboard() }
    catch (e: any) { flash(e?.message || 'Failed to load dashboard') }
    finally { loading.value = false }
}
onMounted(dashboard)
</script>

<style scoped>
/* ── Glass card — identical to assets/department.vue ──────────────────── */
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

/* ── Search input ─────────────────────────────────────────────────────── */
.cust-input {
    width: 100%;
    background: var(--color-surface-low, #f2f4f6);
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: var(--color-on-surface, #191c1e);
    transition: all 0.2s ease;
    box-shadow: inset 0 0 0 1.5px transparent;
}

.cust-input::placeholder {
    color: rgba(114, 118, 135, 0.6);
}

.cust-input:focus {
    outline: none;
    box-shadow: inset 0 0 0 1.5px #3d7fbf;
    background: #f7f9fb;
}

.cust-input.has-icon {
    padding-left: 2.5rem;
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

.refresh-btn:hover:not(:disabled) {
    background: #fff;
    transform: translateY(-1px);
}

.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ── Alive table ──────────────────────────────────────────────────────── */
.alive-tbl tbody tr { transition: background 0.15s ease; }
.alive-tbl tbody tr:nth-child(even) { background: rgba(25, 28, 30, 0.018); }
.alive-tbl tbody tr:hover { background: rgba(61, 127, 191, 0.06); }

/* Single-color header — solid ribbon blue */
.tbl-rainbow thead tr {
  background: linear-gradient(90deg, #50bf3d 0%, #5bdb7d 100%); 
}
.tbl-rainbow thead th {
  border-bottom: 2px solid rgba(31, 87, 140, 0.5);
  color: #ffffff;
}

/* Rainbow tint on ROW cells — subtle column background stripes */
.tbl-rainbow tbody td:nth-child(1) { background: rgba(61,127,191,0.04); } /* Item        — blue   */
.tbl-rainbow tbody td:nth-child(2) { background: rgba(176,95,168,0.04); } /* Allocated   — purple */
.tbl-rainbow tbody td:nth-child(3) { background: rgba(61,174,140,0.04); } /* On hand     — teal   */
.tbl-rainbow tbody td:nth-child(4) { background: rgba(46,138,110,0.04); } /* Used        — dk teal*/
.tbl-rainbow tbody td:nth-child(5) { background: rgba(232,163,61,0.05); } /* Damaged     — amber  */
.tbl-rainbow tbody td:nth-child(6) { background: rgba(192,57,90,0.04);  } /* Disposed    — red    */
.tbl-rainbow tbody td:nth-child(7) { background: rgba(61,127,191,0.04); } /* Utilisation — blue   */

/* Utilisation — blue   */

/* ── Custom scrollbars for panels ─────────────────────────────────────── */
.scroll-area::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

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

.pager-btn:hover:not(:disabled) {
    background: #fff;
}

.pager-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

@keyframes island-in {
    from {
        opacity: 0;
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>