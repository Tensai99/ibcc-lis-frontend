<!-- app/pages/patients/encounters.vue -->
<script setup lang="ts">
interface EncounterType {
  id: number; name: string; code: string; is_billable: boolean
  fhir_class_code: string; sequence_order: number
}
interface Encounter {
  id: number; patient_mrn: string; patient_name: string
  encounter_type: string; encounter_type_code: string
  sub_type: string; status: string; clinician: string; date: string; time: string
}

const { denied } = usePageGuard(['vitals_capture', 'consultation', 'next_encounter_assignment', 'encounter_management'])
const { can }                 = usePermission()
const { request, loading }    = useApi()
const route                   = useRoute()

const encounterTypes = ref<EncounterType[]>([])
const encounters     = ref<Encounter[]>([])
const activeTab      = ref((route.query.tab as string) || 'all')
const filterType     = ref('')

onMounted(async () => {
  await Promise.all([loadEncounterTypes(), loadEncounters()])
})

const loadEncounterTypes = async () => {
  const data = await request<EncounterType[]>('/encounter_types')
  if (data) encounterTypes.value = data
}

const loadEncounters = async () => {
  // Demo data — real endpoint would be /patient_visits or similar
  encounters.value = [
    { id:1, patient_mrn:'EHIS-2026-000001', patient_name:'Fatima Mwale',  encounter_type:'OPD Consultation',    encounter_type_code:'OPD',     sub_type:'Specialist Consultation', status:'completed',   clinician:'Dr James Banda',   date:'2026-05-15', time:'09:15' },
    { id:2, patient_mrn:'EHIS-2026-000002', patient_name:'Charles Phiri', encounter_type:'Laboratory',          encounter_type_code:'LAB',     sub_type:'Histopathology',          status:'pending',     clinician:'Patrick Mvula',    date:'2026-05-15', time:'09:45' },
    { id:3, patient_mrn:'EHIS-2026-000003', patient_name:'Grace Tembo',   encounter_type:'Chemotherapy',        encounter_type_code:'CHEMO',   sub_type:'AC-T Protocol',           status:'in_progress', clinician:'Dr Chisomo Phiri', date:'2026-05-15', time:'10:00' },
    { id:4, patient_mrn:'EHIS-2026-000004', patient_name:'John Mvula',    encounter_type:'Vitals Assessment',   encounter_type_code:'VITALS',  sub_type:'Vitals Assessment',       status:'completed',   clinician:'Fatima Mwale',     date:'2026-05-15', time:'08:30' },
    { id:5, patient_mrn:'EHIS-2026-000005', patient_name:'Ruth Banda',    encounter_type:'Radiotherapy',        encounter_type_code:'RADIO',   sub_type:'Radiation Oncology',      status:'pending',     clinician:'Dr James Banda',   date:'2026-05-15', time:'11:00' },
    { id:6, patient_mrn:'EHIS-2026-000006', patient_name:'Peter Chirwa',  encounter_type:'Diagnostic Imaging',  encounter_type_code:'IMAGING', sub_type:'CT Scan',                 status:'completed',   clinician:'Patrick Mvula',    date:'2026-05-15', time:'08:00' },
  ]
}

// ── Tab config generated from real encounter types + some fixed tabs ───────
const tabConfig = computed(() => {
  const fixed = [{ key:'all', label:'All', code:'' }]
  // Add tabs for clinical encounter type codes the user cares about
  const codesToShow = ['LAB','CHEMO','VITALS','OPD','IMAGING','RADIO']
  const dynamic = encounterTypes.value
    .filter(et => codesToShow.includes(et.code))
    .sort((a,b) => a.sequence_order - b.sequence_order)
    .map(et => ({ key: et.code.toLowerCase(), label: et.name, code: et.code }))
  return [...fixed, ...dynamic]
})

const filteredEncounters = computed(() => {
  let list = encounters.value
  // Tab filter
  const tab = tabConfig.value.find(t => t.key === activeTab.value)
  if (tab?.code) list = list.filter(e => e.encounter_type_code === tab.code)
  // Additional type filter
  if (filterType.value) list = list.filter(e => e.encounter_type_code === filterType.value)
  return list
})

const statusBadge = (s: string) => ({
  completed:   'badge-success',
  in_progress: 'badge-info',
  pending:     'badge-warning',
  cancelled:   'badge-error',
}[s] || 'badge-neutral')

const fhirClassBadge = (code: string) => ({
  AMB: 'badge-info', IMP: 'badge-warning', EMER: 'badge-error',
}[code] || 'badge-neutral')

const columns = [
  { key:'patient_mrn',          label:'MRN',          thClass:'w-36' },
  { key:'patient_name',         label:'Patient',       thClass:'min-w-[140px]' },
  { key:'encounter_type',       label:'Encounter',     thClass:'min-w-[140px]' },
  { key:'sub_type',             label:'Sub-type',      thClass:'min-w-[120px]' },
  { key:'clinician',            label:'Clinician',     thClass:'min-w-[120px]' },
  { key:'date',                 label:'Date',          thClass:'w-24' },
  { key:'time',                 label:'Time',          thClass:'w-16' },
  { key:'status',               label:'Status',        thClass:'w-28', truncate:false },
]

// Stats derived from live filtered encounters
const stats = computed(() => ({
  total:       encounters.value.length,
  completed:   encounters.value.filter(e => e.status === 'completed').length,
  inProgress:  encounters.value.filter(e => e.status === 'in_progress').length,
  pending:     encounters.value.filter(e => e.status === 'pending').length,
}))
</script>

<template>
  <AccessDenied v-if="denied" />
  <div class="space-y-6 animate-fade-in">

    <div class="page-header">
      <div>
        <h1 class="page-title">Encounters</h1>
        <p class="page-subtitle">Clinical encounter management · Today's activity</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <StatCard label="Total Today"  :value="stats.total"      :icon="['fas','calendar-day']"  icon-bg="bg-primary-fixed"   icon-color="text-primary"    :loading="loading" />
      <StatCard label="Completed"    :value="stats.completed"  :icon="['fas','circle-check']"  icon-bg="bg-green-50"        icon-color="text-green-600"  :loading="loading" />
      <StatCard label="In Progress"  :value="stats.inProgress" :icon="['fas','spinner']"       icon-bg="bg-secondary-fixed" icon-color="text-secondary"  :loading="loading" />
      <StatCard label="Pending"      :value="stats.pending"    :icon="['fas','clock']"         icon-bg="bg-amber-50"        icon-color="text-amber-600"  :loading="loading" />
    </div>

    <!-- Dynamic tabs from real encounter types -->
    <div class="tab-bar">
      <button
        v-for="tab in tabConfig"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Encounter types quick reference (collapsible) -->
    <details class="island cursor-pointer select-none" v-if="encounterTypes.length">
      <summary class="section-heading mb-0 flex items-center gap-2 list-none">
        <font-awesome-icon :icon="['fas','table-list']" class="text-primary" />
        Encounter Types Reference
        <font-awesome-icon :icon="['fas','chevron-down']" class="ml-auto text-sm text-outline" />
      </summary>
      <div class="mt-4 overflow-x-auto">
        <table class="his-table">
          <thead>
            <tr>
              <th class="w-8">#</th>
              <th class="min-w-[140px]">Name</th>
              <th class="w-24">Code</th>
              <th class="w-20">FHIR</th>
              <th class="w-20">Billable</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="et in encounterTypes" :key="et.id">
              <td class="text-outline text-xs">{{ et.sequence_order }}</td>
              <td class="font-medium">{{ et.name }}</td>
              <td>
                <span class="font-mono text-xs font-bold bg-primary-fixed text-primary px-1.5 py-0.5 rounded">
                  {{ et.code }}
                </span>
              </td>
              <td>
                <span class="badge" :class="fhirClassBadge(et.fhir_class_code)">{{ et.fhir_class_code }}</span>
              </td>
              <td>
                <span class="badge" :class="et.is_billable ? 'badge-success' : 'badge-neutral'">
                  {{ et.is_billable ? 'Yes' : 'No' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <!-- Encounter table -->
    <DataTable
      :columns="columns"
      :rows="filteredEncounters as unknown as Record<string,unknown>[]"
      :loading="loading"
      searchable
      search-placeholder="Search by patient, encounter type, clinician…"
      :search-keys="['patient_mrn','patient_name','encounter_type','sub_type','clinician']"
      empty-text="No encounters found."
    >
      <template #cell-patient_mrn="{ value }">
        <span class="font-mono text-xs font-bold text-primary">{{ value }}</span>
      </template>
      <template #cell-encounter_type="{ row }">
        <div class="flex items-center gap-1.5">
          <span class="font-mono text-xs bg-primary-fixed text-primary px-1 py-0.5 rounded flex-shrink-0">
            {{ (row as unknown as Encounter).encounter_type_code }}
          </span>
          <span class="truncate text-sm sm:text-base">{{ (row as unknown as Encounter).encounter_type }}</span>
        </div>
      </template>
      <template #cell-status="{ value }">
        <span class="badge" :class="statusBadge(value as string)">
          {{ String(value).replace('_',' ') }}
        </span>
      </template>
    </DataTable>

  </div>
</template>