<!-- app/pages/assets/department.vue -->
<!-- Non-privileged asset overview: department dashboard ONLY.
     Calls a single endpoint (getDepartmentDashboard) — no register/types/list calls. -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- Header -->
      <header class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'building']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words">{{ dept.name || auth.currentUser?.department || 'Department' }} asset overview</h1>
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
          <table class="w-full text-left border-collapse text-sm sm:text-base">
            <thead><tr><th class="py-4 px-5">Tag</th><th class="py-4 px-5">Name</th><th class="py-4 px-5">Type</th><th class="py-4 px-5">Condition</th><th class="py-4 px-5">Status</th></tr></thead>
            <tbody><SkeletonTableRows :columns="5" :rows="5" /></tbody>
          </table>
        </div>
      </template>

      <template v-else>
        <!-- KPI cards (ribbon accents) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
            <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Total assets</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.total_assets ?? '—' }}</p>
          </div>
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-teal">
            <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-2">In service</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.in_service ?? '—' }}</p>
          </div>
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-red">
            <p class="text-[10px] text-ribbon-red font-bold uppercase tracking-wider mb-2">Out of service</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.out_of_service ?? '—' }}</p>
          </div>
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-teal bg-ribbon-teal/5">
            <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-2">On-hand value</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-extrabold text-secondary-on-container break-words">{{ fmtAssetMoney(summary.on_hand_value) }}</p>
          </div>
        </div>

        <!-- Status + anomalies -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- operational status -->
          <div class="g-card p-6">
            <h3 class="text-base sm:text-lg font-semibold sm:font-bold mb-4">Operational status</h3>
            <div class="space-y-3">
              <div v-for="s in byStatus" :key="s.status">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs sm:text-sm font-medium break-words">{{ titleCase(s.status) }}</span>
                  <span class="text-xs sm:text-sm font-bold">{{ s.count }}</span>
                </div>
                <div class="h-2 rounded-full bg-surface-low overflow-hidden">
                  <div class="h-full rounded-full bg-ribbon-blue" :style="{ width: pct(s.count, summary.total_assets) + '%' }" />
                </div>
              </div>
              <p v-if="!byStatus.length" class="text-sm text-on-surface-variant py-4 text-center">No data.</p>
            </div>
          </div>

          <!-- anomalies -->
          <div class="g-card p-6 lg:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-ribbon-red/15 flex items-center justify-center text-ribbon-red">
                <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
              </div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Anomalies</h3>
              <span class="ml-auto text-[11px] font-bold text-ribbon-red bg-ribbon-red/10 px-2.5 py-1 rounded-full">{{ anomalies.length }}</span>
            </div>
            <div class="space-y-2 max-h-[260px] overflow-y-auto scroll-area pr-1">
              <div v-for="(an, i) in anomalies" :key="i" class="p-3 rounded-xl bg-ribbon-red/5 border border-ribbon-red/15">
                <div class="flex justify-between items-center gap-2">
                  <span class="text-xs font-mono text-ribbon-blue">{{ an.asset_tag }}</span>
                  <span class="text-[10px] font-bold uppercase" :class="sevClass(an.severity)">{{ an.severity }}</span>
                </div>
                <p class="text-xs font-bold text-on-surface break-words mt-0.5">{{ an.name }}</p>
                <p class="text-[11px] text-on-surface-variant break-words">{{ an.detail }}</p>
              </div>
              <p v-if="!anomalies.length" class="text-sm text-on-surface-variant py-6 text-center">No anomalies flagged.</p>
            </div>
          </div>
        </div>

        <!-- Assets table (alive, ribbon) -->
        <div class="g-card p-6 sm:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Department assets</h3>
            <div class="relative w-full md:w-96">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
              <input v-model="q" type="text" autocomplete="off" placeholder="Search by tag, name or serial…" class="cust-input has-icon" />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-blue">
              <thead>
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                  <th class="py-4 px-5">Tag</th>
                  <th class="py-4 px-5">Name</th>
                  <th class="py-4 px-5">Type</th>
                  <th class="py-4 px-5 text-center">Condition</th>
                  <th class="py-4 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="a in pagedAssets" :key="a.asset_uuid" class="cursor-pointer transition-colors" @click="navigateTo(`/assets/${a.asset_uuid}`)">
                  <td class="py-4 px-5 font-mono text-[11px] text-ribbon-blue whitespace-nowrap">{{ a.asset_tag }}</td>
                  <td class="py-4 px-5"><p class="font-bold break-words">{{ a.name }}</p><p v-if="a.serial_number" class="text-[10px] text-outline break-words">SN {{ a.serial_number }}</p></td>
                  <td class="py-4 px-5 text-xs text-on-surface-variant break-words">{{ a.type }}</td>
                  <td class="py-4 px-5 text-center"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" :class="conditionClass(a.condition)">{{ titleCase(a.condition) }}</span></td>
                  <td class="py-4 px-5 text-center"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" :class="statusClass(a.operational_status)">{{ titleCase(a.operational_status) }}</span></td>
                </tr>
                <tr v-if="!filteredAssets.length"><td colspan="5" class="py-8 text-center text-on-surface-variant">No assets in this department.</td></tr>
              </tbody>
            </table>
          </div>

          <div v-if="pages > 1" class="flex items-center justify-between gap-3 mt-4">
            <p class="text-xs sm:text-sm text-on-surface-variant">Showing {{ (page - 1) * PAGE_SIZE + 1 }}–{{ Math.min(page * PAGE_SIZE, filteredAssets.length) }} of {{ filteredAssets.length }}</p>
            <div class="flex items-center gap-2">
              <button class="pager-btn" :disabled="page === 1" @click="page--"><font-awesome-icon :icon="['fas', 'chevron-left']" /></button>
              <span class="text-sm font-semibold text-on-surface">{{ page }} / {{ pages }}</span>
              <button class="pager-btn" :disabled="page === pages" @click="page++"><font-awesome-icon :icon="['fas', 'chevron-right']" /></button>
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
import { useAssets, fmtAssetMoney, titleCase } from '~/composables/useAssets'

const assetsApi = useAssets()
const auth = useAuthStore()

const feedback = reactive<{ msg: string; kind: 'error' | 'success' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'error' | 'success' = 'error') => { feedback.msg = msg; feedback.kind = kind }

const dash = ref<any>(null)
const loading = ref(false)
const { showSkeleton } = useDelayedLoading(loading)

// derived view-model
const dept = computed(() => dash.value?.department ?? {})
const summary = computed(() => dash.value?.summary ?? {})
const byStatus = computed(() => dash.value?.by_operational_status ?? [])
const anomalies = computed(() => dash.value?.anomalies ?? [])

const pct = (n: any, total: any) => { const t = Number(total); return t > 0 ? Math.round((Number(n) / t) * 100) : 0 }

// status / condition / severity pills (ribbon palette)
const statusClass = (s: string) => s === 'IN_USE' ? 'bg-ribbon-teal/15 text-ribbon-teal'
  : (s === 'OUT_OF_SERVICE' || s === 'DISPOSED') ? 'bg-error/10 text-error'
  : s === 'UNDER_MAINTENANCE' ? 'bg-ribbon-amber/15 text-ribbon-amber'
  : 'bg-surface-container text-on-surface-variant'
const conditionClass = (c: string) => (c === 'VERY_GOOD' || c === 'GOOD') ? 'bg-ribbon-teal/15 text-ribbon-teal'
  : (c === 'FAULTY' || c === 'POOR') ? 'bg-error/10 text-error'
  : 'bg-ribbon-amber/15 text-ribbon-amber'
const sevClass = (s: string) => /high|critical/i.test(s) ? 'text-error' : /medium/i.test(s) ? 'text-ribbon-amber' : 'text-outline'

// search + pagination (client-side over the dashboard's assets array)
const q = ref('')
const PAGE_SIZE = 8
const page = ref(1)
const filteredAssets = computed(() => {
  const term = q.value.trim().toLowerCase()
  const list = dash.value?.assets ?? []
  if (!term) return list
  return list.filter((a: any) => `${a.name} ${a.asset_tag} ${a.serial_number ?? ''}`.toLowerCase().includes(term))
})
const pages = computed(() => Math.max(1, Math.ceil(filteredAssets.value.length / PAGE_SIZE)))
const pagedAssets = computed(() => filteredAssets.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
watch(filteredAssets, () => { page.value = 1 })

onMounted(async () => {
  loading.value = true
  try { dash.value = await assetsApi.getDashboard() }
  catch (e: any) { flash(e.message || 'Failed to load dashboard') }
  finally { loading.value = false }
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

.g-card {
  position: relative; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem; box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05); border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.5s ease-out backwards;
}
.cust-input { width: 100%; background: var(--color-surface-low, #f2f4f6); border: none; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--color-on-surface, #191c1e); transition: all 0.2s ease; box-shadow: inset 0 0 0 1.5px transparent; }
.cust-input::placeholder { color: rgba(114, 118, 135, 0.6); }
.cust-input:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }
.cust-input.has-icon { padding-left: 2.5rem; }

/* alive table — ribbon blue header + hover */
.alive-tbl tbody tr { transition: background 0.15s ease; }
.alive-tbl tbody tr:nth-child(even) { background: rgba(25, 28, 30, 0.018); }
.tbl-blue thead tr { background: linear-gradient(90deg, rgba(61,127,191,0.14), rgba(61,127,191,0.04)); }
.tbl-blue thead th { border-bottom: 2px solid rgba(61,127,191,0.40); }
.tbl-blue tbody tr:hover { background: rgba(61,127,191,0.09); }

.scroll-area::-webkit-scrollbar { width: 6px; height: 6px; }
.scroll-area::-webkit-scrollbar-thumb { background: rgba(61,127,191,0.2); border-radius: 10px; }
.scroll-area { scrollbar-width: thin; scrollbar-color: rgba(61,127,191,0.2) transparent; }

.pager-btn { width: 2.25rem; height: 2.25rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 0.75rem; background: rgba(255, 255, 255, 0.7); border: 1px solid var(--color-outline-variant, #c2c6d8); color: #3d7fbf; transition: background 0.15s ease; }
.pager-btn:hover:not(:disabled) { background: #fff; }
.pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@keyframes island-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>