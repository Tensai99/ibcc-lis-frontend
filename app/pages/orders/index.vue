<!-- app/pages/orders/index.vue -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- Header -->
      <header class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas','vials']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words">Laboratory orders</h1>
            <p class="text-[11px] text-outline font-mono mt-0.5">
              {{ meta ? `${meta.total} order${meta.total === 1 ? '' : 's'}` : 'Clinical laboratory requests' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="filter-toggle" @click="filtersOpen = !filtersOpen">
            <font-awesome-icon :icon="['fas','sliders']" />
            <span>{{ filtersOpen ? 'Hide filters' : 'Filters' }}</span>
          </button>
          <button type="button" class="pager-btn" :disabled="loading" @click="load()">
            <font-awesome-icon :icon="['fas','rotate-right']" :class="loading ? 'animate-spin' : ''" />
          </button>
        </div>
      </header>

      <!-- Filters -->
      <LabOrdersFilterBar v-model="filters" :open="filtersOpen" @apply="load()" />

      <!-- Error -->
      <div v-if="error" class="alert-error">
        <font-awesome-icon :icon="['fas','circle-exclamation']" class="mt-0.5" />
        <span class="break-words">{{ error }}</span>
      </div>

      <!-- KPI cards (ribbon accents) -->
      <div v-if="!loading || rows.length" class="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
          <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Total orders</p>
          <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ meta?.total ?? rows.length }}</p>
        </div>
        <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-amber">
          <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider mb-2">In progress</p>
          <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ kpi.inProgress }}</p>
        </div>
        <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-teal">
          <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-2">Reported</p>
          <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ kpi.completed }}</p>
        </div>
        <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-red bg-ribbon-red/5">
          <p class="text-[10px] text-ribbon-red font-bold uppercase tracking-wider mb-2">STAT / urgent</p>
          <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ kpi.urgent }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="g-card flex flex-col items-center justify-center gap-3 py-16">
        <font-awesome-icon :icon="['fas','circle-notch']" class="text-3xl text-primary animate-spin" />
        <p class="text-sm text-on-surface-variant">Loading orders…</p>
      </div>

      <!-- Data -->
      <template v-else-if="rows.length">
        <div class="g-card p-6 sm:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Orders</h3>
            <div class="text-xs sm:text-sm text-on-surface-variant">
              Click a row to open the order
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-blue">
              <thead>
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                  <th class="py-4 px-5">Accession</th>
                  <th class="py-4 px-5">Patient</th>
                  <th class="py-4 px-5">Scheduled</th>
                  <th class="py-4 px-5">Department</th>
                  <th class="py-4 px-5">Specimen</th>
                  <th class="py-4 px-5 text-center">Urgency</th>
                  <th class="py-4 px-5 text-center">Status</th>
                  <th class="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="o in rows" :key="o.uuid" class="cursor-pointer transition-colors" @click="openOrder(o.uuid)">
                  <td class="py-4 px-5 font-mono text-[11px] text-ribbon-blue whitespace-nowrap border-l-4" :class="rowAccent(o.status)">
                    {{ o.accession_number }}
                  </td>
                  <td class="py-4 px-5">
                    <p class="font-bold break-words">{{ o.patient_name }}</p>
                    <p class="text-[10px] text-outline break-words">
                      {{ [o.age != null ? `${o.age}y` : null, o.gender].filter(Boolean).join(' · ') || '—' }}
                    </p>
                  </td>
                  <td class="py-4 px-5 text-xs text-on-surface-variant whitespace-nowrap">{{ fmtDate(o.scheduled_for) }}</td>
                  <td class="py-4 px-5">
                    <p class="text-sm break-words">{{ o.department?.section || o.department?.name || '—' }}</p>
                    <p class="text-[10px] text-outline font-mono">{{ o.department?.section_code || o.department?.code || '' }}</p>
                  </td>
                  <td class="py-4 px-5 text-xs text-on-surface-variant break-words">{{ o.specimen || '—' }}</td>
                  <td class="py-4 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap uppercase" :class="urgencyClass(o.urgency)">
                      {{ o.urgency || '—' }}
                    </span>
                  </td>
                  <td class="py-4 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" :class="statusPillClass(o.status)">
                      {{ titleCase(o.status) }}
                    </span>
                  </td>
                  <td class="py-4 px-5 text-right" @click.stop>
                    <button type="button" class="ellipsis-btn" @click="toggleMenu(o.uuid, $event)">
                      <font-awesome-icon :icon="['fas','ellipsis-vertical']" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="meta && meta.total_pages > 1" class="flex items-center justify-between gap-3 mt-4">
            <p class="text-xs sm:text-sm text-on-surface-variant">
              Page {{ meta.page }} of {{ meta.total_pages }} · {{ meta.total }} total
            </p>
            <div class="flex items-center gap-2">
              <button type="button" class="pager-btn" :disabled="meta.page <= 1" @click="goPage(meta.page - 1)">
                <font-awesome-icon :icon="['fas','chevron-left']" />
              </button>
              <span class="text-sm font-semibold text-on-surface">{{ meta.page }} / {{ meta.total_pages }}</span>
              <button type="button" class="pager-btn" :disabled="meta.page >= meta.total_pages" @click="goPage(meta.page + 1)">
                <font-awesome-icon :icon="['fas','chevron-right']" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else class="g-card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div class="w-14 h-14 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
          <font-awesome-icon :icon="['fas','vials']" class="text-2xl" />
        </div>
        <p class="text-sm text-on-surface-variant">No laboratory orders match your filters.</p>
      </div>

      <!-- Teleported ellipsis menu -->
      <Teleport to="body">
        <div v-if="menuFor" class="fixed inset-0 z-40" @click="menuFor = null" />
        <div v-if="menuFor"
          class="fixed z-50 w-44 rounded-xl bg-surface-lowest shadow-island border border-outline-variant/40 py-1"
          :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
          <button type="button" class="menu-item" @click="openOrder(menuFor!)">
            <font-awesome-icon :icon="['fas','eye']" class="text-primary" /><span>View order</span>
          </button>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const { listOrders } = useLaboratory()

const filters = reactive<Record<string, any>>({
  from: '', to: '', q: '',
  status: undefined, urgency: undefined,
  department_id: undefined, sub_department_id: undefined,
  page: 1, per_page: 100,
})
const filtersOpen = ref(false)

const rows    = ref<any[]>([])
const meta    = ref<any>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await listOrders(filters)
    rows.value = res?.data ?? []
    meta.value = res?.meta ?? null
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load laboratory orders. Please try again.'
  } finally {
    loading.value = false
  }
}
const goPage = (p: number) => { filters.page = p; load() }
onMounted(load)

// KPI tallies over the current page
const kpi = computed(() => {
  const acc = { inProgress: 0, completed: 0, urgent: 0 }
  for (const o of rows.value) {
    const s = (o.status || '').toLowerCase()
    const u = (o.urgency || '').toLowerCase()
    if (s.includes('progress') || s.includes('collected') || s.includes('received')) acc.inProgress++
    if (s.includes('reported') || s.includes('complete') || s.includes('verified')) acc.completed++
    if (u === 'stat' || u === 'high') acc.urgent++
  }
  return acc
})

// navigation
const openOrder = (uuid: string) => {
  menuFor.value = null
  navigateTo(`/orders/${uuid}`)
}

// teleported ellipsis menu
const menuFor = ref<string | null>(null)
const menuPos = reactive({ top: 0, left: 0 })
const toggleMenu = (uuid: string, ev: MouseEvent) => {
  if (menuFor.value === uuid) { menuFor.value = null; return }
  const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  menuPos.top = r.bottom + 6
  menuPos.left = Math.max(8, r.right - 176)
  menuFor.value = uuid
}

// formatting
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const titleCase = (s: string) =>
  (s || '—').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// pill classes (ribbon palette)
const statusPillClass = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show')) return 'bg-error/10 text-error'
  if (k.includes('reported') || k.includes('complete') || k.includes('verified')) return 'bg-ribbon-teal/15 text-ribbon-teal'
  if (k.includes('progress') || k.includes('collected') || k.includes('received')) return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-blue/15 text-ribbon-blue'
}
const urgencyClass = (u: string) => {
  const k = (u || '').toLowerCase()
  if (k === 'stat' || k === 'high') return 'bg-error/10 text-error'
  if (k === 'medium') return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-teal/15 text-ribbon-teal'
}
// ribbon left-accent for the accession cell, keyed by status
const rowAccent = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show')) return 'border-ribbon-red'
  if (k.includes('reported') || k.includes('complete') || k.includes('verified')) return 'border-ribbon-teal'
  if (k.includes('progress') || k.includes('collected') || k.includes('received')) return 'border-ribbon-amber'
  return 'border-ribbon-blue'
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

.g-card {
  position: relative; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem; box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05); border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.5s ease-out backwards;
}

.filter-toggle { @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors; }
.ellipsis-btn { @apply w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-ribbon-blue/10 hover:text-ribbon-blue transition-colors; }
.menu-item { @apply w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors; }

/* alive table — ribbon blue header + hover, matches department.vue */
.alive-tbl tbody tr { transition: background 0.15s ease; }
.alive-tbl tbody tr:nth-child(even) { background: rgba(25, 28, 30, 0.018); }
.tbl-blue thead tr { background: linear-gradient(90deg, rgba(61,127,191,0.14), rgba(61,127,191,0.04)); }
.tbl-blue thead th { border-bottom: 2px solid rgba(61,127,191,0.40); }
.tbl-blue tbody tr:hover { background: rgba(61,127,191,0.09); }

.pager-btn { width: 2.25rem; height: 2.25rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 0.75rem; background: rgba(255, 255, 255, 0.7); border: 1px solid var(--color-outline-variant, #c2c6d8); color: #3d7fbf; transition: background 0.15s ease; }
.pager-btn:hover:not(:disabled) { background: #fff; }
.pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@keyframes island-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>