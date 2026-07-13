<!-- app/components/LabOrdersFilterBar.vue -->
<!-- Filter bar for the Laboratory Orders list. Mirrors InventoryHistoryFilterBar
     (surface-low grid panel + .filter-label / .filter-date / SearchSelect,
     submit-based: nothing reloads until "Apply filters").
     Fields: Search (q) · From · To · Status · Urgency · Department · Sub-department.
     Picking a department loads its sub-departments (/department/show?uuid=) and
     both department_id and sub_department_id (integers) are sent as filters. -->
<template>
  <div v-show="open"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-low/60 border border-ribbon-blue/10">

    <!-- Search (q) — full width -->
    <div class="sm:col-span-2 lg:col-span-3 xl:col-span-4">
      <label class="filter-label">Search</label>
      <div class="filter-search">
        <font-awesome-icon :icon="['fas','magnifying-glass']" class="filter-search-icon" />
        <input v-model="model.q" type="text" class="filter-search-input"
          placeholder="Search accession number, patient, specimen…" @keyup.enter="apply" />
      </div>
    </div>

    <!-- From -->
    <div>
      <label class="filter-label">From</label>
      <input v-model="model.from" type="date" class="filter-date" />
    </div>

    <!-- To -->
    <div>
      <label class="filter-label">To</label>
      <input v-model="model.to" type="date" class="filter-date" />
    </div>

    <!-- Status -->
    <div>
      <label class="filter-label">Status</label>
      <SearchSelect v-model="model.status" :options="STATUS_OPTS" option-value="value" option-label="label"
        icon="circle-dot" placeholder="Any status" search-placeholder="Search status…" clearable />
    </div>

    <!-- Urgency -->
    <div>
      <label class="filter-label">Urgency</label>
      <SearchSelect v-model="model.urgency" :options="URGENCY_OPTS" option-value="value" option-label="label"
        icon="bolt" placeholder="Any urgency" search-placeholder="Search urgency…" clearable />
    </div>

    <!-- Department — sends department_id; drives the sub-department list -->
    <div>
      <label class="filter-label">Department</label>
      <SearchSelect v-model="model.department_id" :options="departments" option-value="id" option-label="name"
        icon="building" placeholder="All departments" search-placeholder="Search departments…" clearable />
    </div>

    <!-- Sub-department — sends sub_department_id; enabled once a department is set -->
    <div>
      <label class="filter-label">Sub-department</label>
      <SearchSelect v-model="model.sub_department_id" :options="subDepartments" option-value="id" option-label="name"
        icon="sitemap"
        :placeholder="model.department_id ? 'All sub-departments' : 'Select a department first'"
        search-placeholder="Search sub-departments…" clearable />
    </div>

    <!-- Actions -->
    <div class="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end gap-2 pt-1">
      <button type="button" class="clear-btn" @click="clearAll">Clear</button>
      <button type="button" class="apply-btn" @click="apply">
        <font-awesome-icon :icon="['fas','magnifying-glass']" />
        <span>Apply filters</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ apply: [] }>()

// model shape: { from, to, q, status, urgency, department_id, sub_department_id, page, per_page }
const model = defineModel<Record<string, any>>({ required: true })

const { request } = useApi()

// NOTE: adjust to match the backend enums if they differ.
const STATUS_OPTS = [
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'collected',   label: 'Collected' },
  { value: 'received',    label: 'Received' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
  { value: 'no_show',     label: 'No show' },
]
const URGENCY_OPTS = [
  { value: 'Low',    label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High',   label: 'High' },
  { value: 'STAT',   label: 'STAT' },
]

// ── Department → Sub-department cascade ───────────────────────────────────────
const departments    = ref<any[]>([])
const subDepartments = ref<any[]>([])

const loadDepartments = async () => {
  departments.value = (await request<any[]>('/departments')) ?? []
}
const loadSubDepartments = async (uuid: string) => {
  subDepartments.value = (await request<any>(`/department/show?uuid=${uuid}`))?.sub_departments ?? []
}

// department_id (integer) → find its uuid → load sub-departments; reset sub choice
watch(() => model.value.department_id, (id) => {
  model.value.sub_department_id = undefined
  subDepartments.value = []
  const dept = departments.value.find((d: any) => d.id === id)
  if (dept?.uuid) loadSubDepartments(dept.uuid)
})

const apply = () => { model.value.page = 1; emit('apply') }

const clearAll = () => {
  model.value.from = ''
  model.value.to = ''
  model.value.q = ''
  model.value.status = undefined
  model.value.urgency = undefined
  model.value.department_id = undefined
  model.value.sub_department_id = undefined
  model.value.page = 1
  emit('apply')
}

onMounted(loadDepartments)
</script>

<style scoped>
/* mirrored from InventoryHistoryFilterBar (scoped styles don't cross components) */
.filter-label {
  font-size: 0.7rem; font-weight: 700; color: var(--color-outline, #727687);
  margin-left: 0.25rem; display: block; margin-bottom: 0.25rem;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.filter-date {
  width: 100%; background: var(--color-surface-low, #f2f4f6); border: none;
  border-radius: 0.75rem; padding: 0.65rem 1rem; font-size: 0.85rem;
  font-weight: 600; color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease; box-shadow: inset 0 0 0 1.5px transparent;
}
.filter-date:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }
.filter-date:hover:not(:focus) { background: #e6e8ea; }

.filter-search { position: relative; }
.filter-search-icon {
  position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%);
  color: var(--color-outline, #727687); font-size: 0.8rem; pointer-events: none;
}
.filter-search-input {
  width: 100%; background: var(--color-surface-low, #f2f4f6); border: none;
  border-radius: 0.75rem; padding: 0.65rem 1rem 0.65rem 2.4rem;
  font-size: 0.85rem; font-weight: 600; color: var(--color-on-surface, #191c1e);
  box-shadow: inset 0 0 0 1.5px transparent; transition: all 0.2s ease;
}
.filter-search-input:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }

.apply-btn {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem;
  border-radius: 0.9rem; font-size: 0.8rem; font-weight: 700; color: #fff;
  background: #3d7fbf; box-shadow: 0 6px 16px rgba(61,127,191,0.25); transition: all 0.18s ease;
}
.apply-btn:hover { background: #356fa8; }
.clear-btn {
  display: inline-flex; align-items: center; padding: 0.6rem 1rem;
  border-radius: 0.9rem; font-size: 0.8rem; font-weight: 700;
  color: var(--color-outline, #727687); background: transparent; transition: all 0.18s ease;
}
.clear-btn:hover { background: #e6e8ea; color: var(--color-on-surface, #191c1e); }
</style>