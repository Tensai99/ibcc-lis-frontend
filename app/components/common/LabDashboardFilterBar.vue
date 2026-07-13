<!-- app/components/LabDashboardFilterBar.vue -->
<template>
  <div v-show="open"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-low/60 border border-ribbon-blue/10">

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

    <!-- Sub-department — a SINGLE two-step section. Pick a department first; its
         sub-departments then appear right below, in the same block. Only
         sub_department_id (integer) is ever sent to the endpoint — the department
         is just the pivot used to load the sub-department list. -->
    <div v-if="showSubDepartment" class="sm:col-span-2">
      <label class="filter-label">Sub-department</label>
      <p class="filter-hint">
        <font-awesome-icon :icon="['fas', 'circle-info']" class="mr-1 opacity-70" />
        {{ hint }}
      </p>

      <div class="space-y-2">
        <!-- Step 1 — department (drives the list below; NOT sent to the endpoint) -->
        <SearchSelect v-model="deptUuid" :options="departments" option-value="uuid" option-label="name"
          icon="building" placeholder="Choose a department…" search-placeholder="Search departments…" clearable />

        <!-- Step 2 — sub-department (revealed once a department is chosen) -->
        <SearchSelect v-if="deptUuid" v-model="model.sub_department_id" :options="subDepartments"
          option-value="id" option-label="name" icon="sitemap"
          placeholder="Choose a sub-department…" search-placeholder="Search sub-departments…" clearable />
      </div>
    </div>

    <!-- Apply — the only thing that refreshes the dashboard -->
    <div class="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end pt-1">
      <button type="button" class="apply-btn" @click="apply">
        <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
        <span>Apply filters</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{ open: boolean; showSubDepartment?: boolean }>()
const emit  = defineEmits<{ apply: [] }>()

// model shape: { from, to, sub_department_id? }
const model = defineModel<Record<string, any>>({ required: true })

const { request } = useApi()

// ── Department → Sub-department cascade (privileged roles only) ───────────────
const departments    = ref<any[]>([])
const subDepartments = ref<any[]>([])
const deptUuid       = ref<string>('')

// name of the chosen department, for the guidance hint
const deptName = computed(() =>
  departments.value.find((d: any) => d.uuid === deptUuid.value)?.name ?? '',
)

// hint tells the user which of the two steps they're on
const hint = computed(() =>
  !deptUuid.value
    ? 'Pick a department first — its sub-departments will appear below.'
    : `Now choose a sub-department in ${deptName.value}, or leave it blank to include the whole department.`,
)

const loadDepartments = async () => {
  const res = await request<any[]>('/departments')
  departments.value = res ?? []
}

const loadSubDepartments = async (uuid: string) => {
  const res = await request<any>(`/department/show?uuid=${uuid}`)
  subDepartments.value = res?.sub_departments ?? []
}

// changing (or clearing) the department resets the sub-department choice + list
watch(deptUuid, (uuid) => {
  model.value.sub_department_id = undefined
  subDepartments.value = []
  if (uuid) loadSubDepartments(uuid)
})

const apply = () => emit('apply')

onMounted(() => { if (props.showSubDepartment) loadDepartments() })
</script>

<style scoped>
/* mirrored from InventoryHistoryFilterBar (scoped styles don't cross components) */
.filter-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-outline, #727687);
  margin-left: 0.25rem;
  display: block;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
/* guidance line under the Sub-department heading */
.filter-hint {
  font-size: 0.7rem;
  color: var(--color-outline, #727687);
  line-height: 1.35;
  margin: 0 0 0.45rem 0.25rem;
}
.filter-date {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}
.filter-date:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }
.filter-date:hover:not(:focus) { background: #e6e8ea; }
.apply-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: #3d7fbf;
  box-shadow: 0 6px 16px rgba(61, 127, 191, 0.25);
  transition: all 0.18s ease;
}
.apply-btn:hover { background: #356fa8; }
</style>