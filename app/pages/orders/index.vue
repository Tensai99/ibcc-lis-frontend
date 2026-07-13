<!-- app/pages/orders/index.vue -->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Header (no breadcrumb on the list page) -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Laboratory Orders</h1>
        <p class="page-subtitle">
          {{ meta ? `${meta.total} order${meta.total === 1 ? '' : 's'}` : 'Clinical laboratory requests' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="filter-toggle" @click="filtersOpen = !filtersOpen">
          <font-awesome-icon :icon="['fas','sliders']" />
          <span>{{ filtersOpen ? 'Hide filters' : 'Filters' }}</span>
        </button>
        <button type="button" class="btn-secondary" @click="load()">
          <font-awesome-icon :icon="['fas','rotate-right']" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <LabOrdersFilterBar v-model="filters" :open="filtersOpen" @apply="load()" />

    <!-- Loading -->
    <div v-if="loading" class="island flex flex-col items-center justify-center gap-3 py-16">
      <font-awesome-icon :icon="['fas','circle-notch']" class="text-3xl text-primary animate-spin" />
      <p class="text-sm text-on-surface-variant">Loading orders…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="island flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div class="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
        <font-awesome-icon :icon="['fas','triangle-exclamation']" class="text-2xl text-error" />
      </div>
      <p class="text-sm text-on-surface-variant max-w-md">{{ error }}</p>
      <button type="button" class="btn-secondary" @click="load()">
        <font-awesome-icon :icon="['fas','rotate-right']" /><span>Retry</span>
      </button>
    </div>

    <!-- Data -->
    <template v-else-if="rows.length">
      <div class="bg-surface-lowest rounded-xl shadow-island overflow-hidden">
        <div class="overflow-x-auto">
          <table class="his-table">
            <thead>
              <tr>
                <th>Accession</th>
                <th>Patient</th>
                <th>Scheduled</th>
                <th>Department</th>
                <th>Specimen</th>
                <th>Urgency</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in rows" :key="o.uuid" class="cursor-pointer" @click="openOrder(o.uuid)">
                <!-- ribbon variant: status-coloured left accent on the row -->
                <td class="font-bold text-primary whitespace-nowrap border-l-4" :class="rowAccent(o.status)">
                  {{ o.accession_number }}
                </td>
                <td>
                  <div class="font-semibold">{{ o.patient_name }}</div>
                  <div class="text-xs text-on-surface-variant">
                    {{ [o.age != null ? `${o.age}y` : null, o.gender].filter(Boolean).join(' · ') || '—' }}
                  </div>
                </td>
                <td class="whitespace-nowrap">{{ fmtDate(o.scheduled_for) }}</td>
                <td>
                  <div class="text-sm">{{ o.department?.section || o.department?.name || '—' }}</div>
                  <div class="text-xs text-on-surface-variant">
                    {{ o.department?.section_code || o.department?.code || '' }}
                  </div>
                </td>
                <td>{{ o.specimen || '—' }}</td>
                <td><span :class="urgencyClass(o.urgency)">{{ o.urgency || '—' }}</span></td>
                <td><span :class="statusClass(o.status)">{{ titleCase(o.status) }}</span></td>
                <td class="text-right" @click.stop>
                  <button type="button" class="ellipsis-btn" @click="toggleMenu(o.uuid, $event)">
                    <font-awesome-icon :icon="['fas','ellipsis-vertical']" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.total_pages > 1" class="flex items-center justify-between gap-3">
        <p class="text-xs sm:text-sm text-on-surface-variant">
          Page {{ meta.page }} of {{ meta.total_pages }} · {{ meta.total }} total
        </p>
        <div class="flex gap-2">
          <button type="button" class="pager-btn" :disabled="meta.page <= 1" @click="goPage(meta.page - 1)">
            <font-awesome-icon :icon="['fas','chevron-left']" />
          </button>
          <button type="button" class="pager-btn" :disabled="meta.page >= meta.total_pages" @click="goPage(meta.page + 1)">
            <font-awesome-icon :icon="['fas','chevron-right']" />
          </button>
        </div>
      </div>
    </template>

    <!-- Empty -->
    <div v-else class="island flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div class="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center">
        <font-awesome-icon :icon="['fas','vials']" class="text-2xl text-primary" />
      </div>
      <p class="text-sm text-on-surface-variant">No laboratory orders match your filters.</p>
    </div>

    <!-- Teleported ellipsis menu (table sits in overflow-x-auto) -->
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

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

// ── navigation → nested detail route (orders/[uuid].vue) ─────────────────────
const openOrder = (uuid: string) => {
  menuFor.value = null
  navigateTo(`/orders/${uuid}`)
}

// ── teleported ellipsis menu ─────────────────────────────────────────────────
const menuFor = ref<string | null>(null)
const menuPos = reactive({ top: 0, left: 0 })
const toggleMenu = (uuid: string, ev: MouseEvent) => {
  if (menuFor.value === uuid) { menuFor.value = null; return }
  const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  menuPos.top = r.bottom + 6
  menuPos.left = Math.max(8, r.right - 176) // 176px = w-44
  menuFor.value = uuid
}

// ── formatting ───────────────────────────────────────────────────────────────
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const titleCase = (s: string) =>
  (s || '—').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const statusClass = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show')) return 'ribbon-chip-red'
  if (k.includes('complete') || k.includes('received') || k.includes('verified')) return 'ribbon-chip-teal'
  if (k.includes('progress') || k.includes('collected')) return 'ribbon-chip-amber'
  return 'ribbon-chip-blue'
}
const urgencyClass = (u: string) => {
  const k = (u || '').toLowerCase()
  if (k === 'stat' || k === 'high') return 'ribbon-chip-red'
  if (k === 'medium') return 'ribbon-chip-amber'
  return 'ribbon-chip-teal'
}
// ribbon left-accent for the row, keyed by status
const rowAccent = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show')) return 'border-ribbon-red'
  if (k.includes('complete') || k.includes('received') || k.includes('verified')) return 'border-ribbon-teal'
  if (k.includes('progress') || k.includes('collected')) return 'border-ribbon-amber'
  return 'border-ribbon-blue'
}
</script>

<style scoped>
.filter-toggle { @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors; }
.ellipsis-btn { @apply w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-primary transition-colors; }
.menu-item { @apply w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors; }
.pager-btn { @apply w-9 h-9 inline-flex items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors; }
</style>