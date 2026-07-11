<!-- app/pages/admin/settings/departments/index.vue -->
<!--
  Departments — top level. Lists departments; clicking one drills into its
  sub-departments. Data mirrors departments.rb (code is the stable key:
  uppercase, hyphenated, e.g. CLIN-LAB).
  ⚠️ DUMMY DATA — replace `departments` with useSettingsApi('departments').list().
-->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-[98%] mx-auto">
    <SettingsHeader
      title="Departments"
      subtitle="Clinical and operational units, their sub-departments and catalogues"
      icon="hospital"
      :crumbs="[{ label:'Settings', to:'/admin/settings' }, { label:'Departments' }]"
    >
      <template #actions>
        <button v-if="canWrite" class="btn-primary" @click="openCreate">
          <font-awesome-icon :icon="['fas','plus']" class="text-xs" />
          <span class="hidden sm:inline">Add department</span>
        </button>
      </template>
    </SettingsHeader>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="d in departments" :key="d.code"
        :to="`/admin/settings/departments/${d.code}`"
        class="panel p-5 group hover:border-primary/40 transition-colors flex flex-col"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
               style="background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); box-shadow: 0 4px 12px rgba(0,80,203,0.25);">
            <font-awesome-icon :icon="['fas', d.icon]" class="text-white" />
          </div>
          <span v-if="!d.active" class="badge-muted">Inactive</span>
        </div>

        <h3 class="font-bold text-on-surface text-base mt-3 group-hover:text-primary transition-colors">{{ d.name }}</h3>
        <code class="text-[0.7rem] text-primary/80 font-mono">{{ d.code }}</code>
        <p class="text-xs text-on-surface-variant mt-1.5 leading-relaxed flex-1">{{ d.description }}</p>

        <div class="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/30">
          <span class="text-xs font-semibold text-on-surface-variant">
            <font-awesome-icon :icon="['fas','sitemap']" class="text-[0.7rem] mr-1" />
            {{ d.sub_departments_count }} sub-departments
          </span>
          <font-awesome-icon :icon="['fas','arrow-right']"
            class="text-outline group-hover:text-primary group-hover:translate-x-1 transition-all text-sm" />
        </div>
      </NuxtLink>
    </div>

    <!-- ── Add / configure department ────────────────────────────────── -->
    <Modal v-model="modalOpen" :title="editing ? 'Configure Department' : 'Add Department'"
           :subtitle="editing ? draft.code : 'Create a new clinical or operational unit'"
           :show-logo="false" class="w-[520px] max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="lbl">Name</label>
          <input v-model="draft.name" class="field" placeholder="e.g. Clinical Laboratory" />
        </div>
        <div>
          <label class="lbl">Code</label>
          <input v-model="draft.code" :disabled="editing"
            class="field font-mono uppercase disabled:opacity-60" placeholder="CLIN-LAB"
            @input="draft.code = (draft.code || '').toUpperCase().replace(/[^A-Z0-9-]/g,'')" />
          <p class="text-[0.7rem] text-on-surface-variant mt-1.5">
            Uppercase, hyphen-separated. This code is the stable reference used across the system.
          </p>
        </div>
        <div>
          <label class="lbl">Description</label>
          <textarea v-model="draft.description" rows="3" class="field resize-none"
            placeholder="What this department is responsible for." />
        </div>
        <label class="flex items-center gap-2 text-sm text-on-surface-variant">
          <AppToggle v-model="draft.active" size="sm" /> Active
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="modalOpen = false">Cancel</button>
        <button class="btn-primary" @click="save">{{ editing ? 'Save changes' : 'Add department' }}</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
const { can } = usePermission()
const canWrite = computed(() => can('admin_system'))

interface Dept {
  name: string; code: string; description: string
  icon: string; active: boolean; sub_departments_count: number
}

// ── DUMMY DATA (departments.rb) ─────────────────────────────────────────────
const departments = ref<Dept[]>([
  { name:'Oncology', code:'ONCO', icon:'ribbon', active:true, sub_departments_count:4,
    description:'Cancer diagnosis and treatment.' },
  { name:'Histopathology', code:'HISTOPATH', icon:'microscope', active:true, sub_departments_count:2,
    description:'Anatomic pathology — tissue-based cancer diagnosis, staging and margin assessment.' },
  { name:'Clinical Laboratory', code:'CLIN-LAB', icon:'flask-vial', active:true, sub_departments_count:9,
    description:'Clinical pathology — blood, urine and body fluid analysis for diagnosis and monitoring.' },
  { name:'Radiology', code:'RAD', icon:'x-ray', active:true, sub_departments_count:9,
    description:'Diagnostic and interventional imaging supporting staging and treatment planning.' },
  { name:'Pharmacy', code:'PHARM', icon:'prescription-bottle-medical', active:true, sub_departments_count:2,
    description:'Medication dispensing and chemotherapy preparation.' },
  { name:'Administration', code:'ADMIN', icon:'folder-open', active:true, sub_departments_count:3,
    description:'Patient administration, records and finance.' },
  { name:'Nursing', code:'NURS', icon:'user-nurse', active:true, sub_departments_count:3,
    description:'Nursing services across day ward, inpatient and oncology care.' },
  { name:'Biomedical Engineering', code:'BME', icon:'screwdriver-wrench', active:true, sub_departments_count:3,
    description:'Clinical engineering — asset register, PPM/CM maintenance, inspection and commissioning.' },
])

// ── Add / configure modal ───────────────────────────────────────────────────
const modalOpen = ref(false)
const editing   = ref(false)
const draft = reactive<Dept>({ name:'', code:'', description:'', icon:'hospital', active:true, sub_departments_count:0 })

const openCreate = () => {
  editing.value = false
  Object.assign(draft, { name:'', code:'', description:'', icon:'hospital', active:true, sub_departments_count:0 })
  modalOpen.value = true
}
const save = () => {
  if (editing.value) {
    const i = departments.value.findIndex(d => d.code === draft.code)
    if (i > -1) departments.value[i] = { ...departments.value[i], ...draft }
  } else {
    departments.value.push({ ...draft })
  }
  modalOpen.value = false
}
</script>

<style scoped>
.panel { @apply bg-surface-bright rounded-[1.5rem] border border-outline-variant/30; box-shadow: 0 6px 22px rgba(0,51,153,0.05); }
.field { @apply w-full px-3 py-2.5 rounded-xl text-sm bg-surface-low border border-outline-variant/50 focus:border-primary/50 focus:outline-none transition-colors; }
.lbl   { @apply block text-xs font-semibold text-on-surface-variant mb-1.5; }
.btn-primary { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-transform active:scale-95; background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); box-shadow: 0 4px 12px rgba(0,80,203,0.30); }
.btn-ghost   { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant border border-outline-variant hover:text-primary hover:border-primary/40 transition-colors; }
.badge-muted { @apply inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-surface-high text-on-surface-variant; }
</style>