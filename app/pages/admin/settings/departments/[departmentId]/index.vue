<!-- app/pages/admin/settings/departments/[departmentId]/index.vue -->
<!--
  Department detail — lists the sub-departments of one department. The route
  param `departmentId` carries the department CODE (the stable key, e.g.
  CLIN-LAB), matching the backend convention of resolving by `code`.
  Clicking a sub-department opens its catalogue (lab tests / imaging).
  ⚠️ DUMMY DATA from departments.rb — replace with
     useSettingsApi('departments').show(code) + nested sub_departments.
-->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-[98%] mx-auto">
    <SettingsHeader
      :title="dept?.name ?? deptCode"
      :subtitle="dept?.description"
      icon="sitemap"
      :crumbs="[
        { label:'Settings', to:'/admin/settings' },
        { label:'Departments', to:'/admin/settings/departments' },
        { label:dept?.name ?? deptCode },
      ]"
    >
      <template #actions>
        <button v-if="canWrite" class="btn-primary" @click="openCreate">
          <font-awesome-icon :icon="['fas','plus']" class="text-xs" />
          <span class="hidden sm:inline">Add sub-department</span>
        </button>
      </template>
    </SettingsHeader>

    <div class="space-y-3">
      <NuxtLink
        v-for="s in subs" :key="s.code"
        :to="`/admin/settings/departments/${deptCode}/${s.code}`"
        class="panel p-4 sm:p-5 flex items-center gap-4 group hover:border-primary/40 transition-colors"
      >
        <div class="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0
                    group-hover:bg-primary/10 transition-colors">
          <font-awesome-icon :icon="['fas', catalogueIcon(s.code)]" class="text-primary text-sm" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-on-surface text-sm sm:text-base truncate group-hover:text-primary transition-colors">{{ s.name }}</h3>
            <span v-if="!s.active" class="badge-muted">Inactive</span>
          </div>
          <code class="text-[0.7rem] text-primary/80 font-mono">{{ s.code }}</code>
          <p class="text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2">{{ s.description }}</p>
        </div>
        <font-awesome-icon :icon="['fas','arrow-right']"
          class="text-outline group-hover:text-primary group-hover:translate-x-1 transition-all text-sm flex-shrink-0" />
      </NuxtLink>

      <div v-if="!subs.length" class="panel p-10 text-center">
        <font-awesome-icon :icon="['fas','sitemap']" class="text-3xl text-outline mb-3" />
        <p class="text-sm text-on-surface-variant">No sub-departments configured for this department.</p>
      </div>
    </div>

    <!-- ── Add / configure sub-department ────────────────────────────── -->
    <Modal v-model="modalOpen" :title="editing ? 'Configure Sub-department' : 'Add Sub-department'"
           :subtitle="editing ? draft.code : `Under ${dept?.name ?? deptCode}`"
           :show-logo="false" class="w-[520px] max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="lbl">Name</label>
          <input v-model="draft.name" class="field" placeholder="e.g. Clinical Chemistry" />
        </div>
        <div>
          <label class="lbl">Code</label>
          <input v-model="draft.code" :disabled="editing"
            class="field font-mono uppercase disabled:opacity-60" :placeholder="`${deptCode}-CHEM`"
            @input="draft.code = (draft.code || '').toUpperCase().replace(/[^A-Z0-9-]/g,'')" />
          <p class="text-[0.7rem] text-on-surface-variant mt-1.5">Conventionally prefixed with the parent code, e.g. {{ deptCode }}-XXX.</p>
        </div>
        <div>
          <label class="lbl">Description</label>
          <textarea v-model="draft.description" rows="3" class="field resize-none"
            placeholder="What this sub-department handles." />
        </div>
        <label class="flex items-center gap-2 text-sm text-on-surface-variant">
          <AppToggle v-model="draft.active" size="sm" /> Active
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="modalOpen = false">Cancel</button>
        <button class="btn-primary" @click="save">{{ editing ? 'Save changes' : 'Add sub-department' }}</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const deptCode = computed(() => String(route.params.departmentId))
const { can } = usePermission()
const canWrite = computed(() => can('admin_system'))

interface Sub { name: string; code: string; description: string; active: boolean }

// ── DUMMY DATA (departments.rb) keyed by department code ────────────────────
const DEPT_META: Record<string, { name: string; description: string }> = {
  ONCO:      { name:'Oncology', description:'Cancer diagnosis and treatment.' },
  HISTOPATH: { name:'Histopathology', description:'Anatomic pathology — tissue-based cancer diagnosis, staging and margin assessment.' },
  'CLIN-LAB':{ name:'Clinical Laboratory', description:'Clinical pathology — blood, urine and body fluid analysis for cancer diagnosis and monitoring.' },
  RAD:       { name:'Radiology', description:'Diagnostic and interventional imaging supporting staging and treatment planning.' },
  PHARM:     { name:'Pharmacy', description:'Medication dispensing and chemotherapy preparation.' },
  ADMIN:     { name:'Administration', description:'Patient administration, records and finance.' },
  NURS:      { name:'Nursing', description:'Nursing services.' },
  BME:       { name:'Biomedical Engineering', description:'Clinical engineering — asset register, maintenance, inspection and commissioning.' },
}

const SUBS: Record<string, Sub[]> = {
  ONCO: [
    { name:'Medical Oncology', code:'ONCO-MED', active:true, description:'Chemotherapy and systemic therapies.' },
    { name:'Surgical Oncology', code:'ONCO-SURG', active:true, description:'Surgical cancer treatment.' },
    { name:'Radiation Oncology', code:'ONCO-RAD', active:true, description:'Radiotherapy services.' },
    { name:'Palliative Care', code:'ONCO-PAL', active:true, description:'Symptom management and end-of-life care.' },
  ],
  HISTOPATH: [
    { name:'Histology', code:'HISTOPATH-HIST', active:true, description:'Gross and microscopic examination of tissue biopsies and resections — diagnosis, grading and margin assessment.' },
    { name:'Cytology', code:'HISTOPATH-CYTO', active:true, description:'Microscopic examination of cells from Pap smears, FNA, effusions and washings.' },
  ],
  'CLIN-LAB': [
    { name:'Clinical Chemistry', code:'CLIN-LAB-CHEM', active:true, description:'General chemistry, liver and renal function, electrolytes, lipids and drug monitoring.' },
    { name:'Coagulation', code:'CLIN-LAB-COAG', active:true, description:'PT, aPTT, D-Dimer, clotting time — pre-op and chemotherapy safety monitoring.' },
    { name:'Haematology', code:'CLIN-LAB-HAEM', active:true, description:'Full blood counts, blood film, reticulocyte count, ESR and red cell studies.' },
    { name:'Immunoassay', code:'CLIN-LAB-IMMUNO', active:true, description:'Hormones, tumour markers, thyroid function, vitamins and autoimmune panels.' },
    { name:'Microbiology', code:'CLIN-LAB-MICRO', active:true, description:'Bacteriology, mycology and parasitology cultures — infection surveillance.' },
    { name:'Serology', code:'CLIN-LAB-SERO', active:true, description:'Antibody/antigen detection for hepatitis, HIV, syphilis and rheumatological disease.' },
    { name:'Urinalysis', code:'CLIN-LAB-URINE', active:true, description:'Routine urine analysis, culture and sensitivity, and urine TB LAM.' },
    { name:'Molecular', code:'CLIN-LAB-MOL', active:true, description:'PCR pathogen quantification, HPV genotyping and viral load testing.' },
    { name:'Flow Cytometry', code:'CLIN-LAB-FLOW', active:true, description:'Immunophenotyping of haematological malignancies, CD4/CD8 subsets and MRD monitoring.' },
  ],
  RAD: [
    { name:'X-Ray', code:'RAD-XR', active:true, description:'Plain film radiography — chest, skeletal, abdominal and screening.' },
    { name:'Fluoroscopy', code:'RAD-FLUORO', active:true, description:'Dynamic contrast studies — barium swallow, meal and enema.' },
    { name:'Ultrasound', code:'RAD-US', active:true, description:'Real-time sonography for abdominal, pelvic, thyroid and soft tissue.' },
    { name:'CT Scan', code:'RAD-CT', active:true, description:'Computed tomography for staging, planning and follow-up of solid tumours.' },
    { name:'MRI', code:'RAD-MRI', active:true, description:'Soft tissue characterisation — brain, spine and pelvic malignancies.' },
    { name:'Mammography', code:'RAD-MAMMO', active:true, description:'Dedicated breast imaging for screening, diagnosis and pre-op planning.' },
    { name:'Nuclear Medicine', code:'RAD-NM', active:true, description:'Radioisotope studies — bone scans, thyroid scans and radioiodine therapy.' },
    { name:'PET Scan', code:'RAD-PET', active:true, description:'Metabolic staging, response assessment and recurrence detection.' },
    { name:'Interventional Radiology', code:'RAD-IR', active:true, description:'Image-guided biopsies, drains and vascular port placements.' },
  ],
  PHARM: [
    { name:'Oncology Pharmacy', code:'PHARM-ONCO', active:true, description:'Chemotherapy preparation.' },
    { name:'Outpatient Pharmacy', code:'PHARM-OPD', active:true, description:'General dispensing.' },
  ],
  ADMIN: [
    { name:'Registration', code:'ADMIN-REG', active:true, description:'Patient registration.' },
    { name:'Medical Records', code:'ADMIN-MR', active:true, description:'Health records management.' },
    { name:'Finance', code:'ADMIN-FIN', active:true, description:'Billing and financial services.' },
  ],
  NURS: [
    { name:'Oncology Nursing', code:'NURS-ONCO', active:true, description:'Cancer care nursing.' },
    { name:'Day Ward', code:'NURS-DAY', active:true, description:'Day chemotherapy ward.' },
    { name:'Inpatient Ward', code:'NURS-IP', active:true, description:'Inpatient nursing.' },
  ],
  BME: [
    { name:'Equipment Maintenance', code:'BME-MAINT', active:true, description:'Planned preventive (PPM) and corrective maintenance of assets.' },
    { name:'Equipment Inspection', code:'BME-INSP', active:true, description:'Routine, weekly and PPM-protocol inspection and safety checks.' },
    { name:'Commissioning & Calibration', code:'BME-COMM', active:true, description:'Acceptance testing, commissioning, calibration and decommissioning.' },
  ],
}

const dept = computed(() => DEPT_META[deptCode.value])
const subs = ref<Sub[]>([...(SUBS[deptCode.value] ?? [])])

// Lab-type sub-departments get a vial; radiology gets a scan icon.
const catalogueIcon = (code: string) =>
  code.startsWith('RAD') ? 'x-ray' : code.startsWith('HISTOPATH') ? 'microscope' : 'vial'

// ── Add / configure modal ───────────────────────────────────────────────────
const modalOpen = ref(false)
const editing   = ref(false)
const draft = reactive<Sub>({ name:'', code:'', description:'', active:true })

const openCreate = () => {
  editing.value = false
  Object.assign(draft, { name:'', code:`${deptCode.value}-`, description:'', active:true })
  modalOpen.value = true
}
const save = () => {
  if (editing.value) {
    const i = subs.value.findIndex(s => s.code === draft.code)
    if (i > -1) subs.value[i] = { ...subs.value[i], ...draft }
  } else {
    subs.value.push({ ...draft })
    // TODO: useSettingsApi('departments/'+deptCode+'/sub_departments').create({ ...draft })
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
.line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
</style>