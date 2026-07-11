<!-- app/pages/admin/settings/departments/[departmentId]/[subDepartmentId].vue -->
<!--
  Sub-department catalogue — the priced services offered by one sub-department.

  Two independent sections, each rendered ONLY if it has rows:
    • Laboratory Tests   (SubDepartmentLaboratoryTest + …Price)
    • Diagnostic Imaging (SubDepartmentRadiologyImage + …Price)
  A CLIN-LAB-* sub-dept shows lab tests; a RAD-* sub-dept shows imaging; a
  sub-dept that has both would show both stacked.

  Prices are MWK, effective-dated and approval-gated (mirrors the seed: amount,
  currency = Malawi, effective_from, is_approved). Setting a new price opens a
  new effective window rather than mutating the old one.

  ⚠️ DUMMY DATA from enc_lab_rad_pricing.rb — replace CATALOGUE with
     useSettingsApi('sub_departments/'+code+'/laboratory_tests' | 'radiology_images').
-->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
    <SettingsHeader
      :title="meta.name"
      :subtitle="meta.description"
      :icon="hasImaging ? 'x-ray' : 'vial'"
      :crumbs="[
        { label:'Settings', to:'/admin/settings' },
        { label:'Departments', to:'/admin/settings/departments' },
        { label:deptCode, to:`/admin/settings/departments/${deptCode}` },
        { label:meta.name },
      ]"
    />

    <!-- ── Laboratory Tests ──────────────────────────────────────────── -->
    <section v-if="hasLab" class="mb-8">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h2 class="flex items-center gap-2 text-sm font-bold text-on-surface uppercase tracking-wide">
          <font-awesome-icon :icon="['fas','vial']" class="text-primary" /> Laboratory Tests
          <span class="badge-muted">{{ labTests.length }}</span>
        </h2>
        <button v-if="canWrite" class="btn-soft" @click="openAddTest('lab')">
          <font-awesome-icon :icon="['fas','plus']" class="text-xs" /> Add test
        </button>
      </div>

      <div class="panel divide-y divide-outline-variant/20">
        <div v-for="t in labTests" :key="t.code"
             class="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-on-surface text-sm truncate">{{ t.name }}</h3>
              <span v-if="!t.active" class="badge-muted">Inactive</span>
            </div>
            <div class="flex items-center gap-3 mt-0.5 text-[0.7rem] text-on-surface-variant">
              <code class="font-mono text-primary/80">{{ t.code }}</code>
              <span v-if="t.classifier">{{ t.classifier }}</span>
              <span v-if="t.turnaround"><font-awesome-icon :icon="['fas','clock']" class="mr-0.5" />{{ t.turnaround }}</span>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-on-surface tabular-nums">{{ fmtMwk(t.amount) }}</p>
            <p class="text-[0.65rem] text-on-surface-variant">{{ t.currency }} · since {{ fmtDate(t.effective_from) }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <AppToggle v-model="t.active" :disabled="!canWrite" size="sm" />
            <button v-if="canWrite" class="btn-icon" title="Set price" @click="openSetPrice(t, 'lab')">
              <font-awesome-icon :icon="['fas','tag']" class="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Diagnostic Imaging ────────────────────────────────────────── -->
    <section v-if="hasImaging" class="mb-8">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h2 class="flex items-center gap-2 text-sm font-bold text-on-surface uppercase tracking-wide">
          <font-awesome-icon :icon="['fas','x-ray']" class="text-primary" /> Diagnostic Imaging
          <span class="badge-muted">{{ radImages.length }}</span>
        </h2>
        <button v-if="canWrite" class="btn-soft" @click="openAddTest('rad')">
          <font-awesome-icon :icon="['fas','plus']" class="text-xs" /> Add image
        </button>
      </div>

      <div class="panel divide-y divide-outline-variant/20">
        <div v-for="t in radImages" :key="t.code"
             class="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-on-surface text-sm truncate">{{ t.name }}</h3>
              <span v-if="!t.active" class="badge-muted">Inactive</span>
            </div>
            <div class="flex items-center gap-3 mt-0.5 text-[0.7rem] text-on-surface-variant">
              <code class="font-mono text-primary/80">{{ t.code }}</code>
              <span v-if="t.classifier">{{ t.classifier }}</span>
              <span v-if="t.turnaround"><font-awesome-icon :icon="['fas','clock']" class="mr-0.5" />{{ t.turnaround }}</span>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-on-surface tabular-nums">{{ fmtMwk(t.amount) }}</p>
            <p class="text-[0.65rem] text-on-surface-variant">{{ t.currency }} · since {{ fmtDate(t.effective_from) }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <AppToggle v-model="t.active" :disabled="!canWrite" size="sm" />
            <button v-if="canWrite" class="btn-icon" title="Set price" @click="openSetPrice(t, 'rad')">
              <font-awesome-icon :icon="['fas','tag']" class="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Empty state ───────────────────────────────────────────────── -->
    <div v-if="!hasLab && !hasImaging" class="panel p-10 text-center">
      <font-awesome-icon :icon="['fas','folder-open']" class="text-3xl text-outline mb-3" />
      <p class="text-sm text-on-surface-variant">
        No priced services are configured for this sub-department yet.
      </p>
      <button v-if="canWrite" class="btn-primary mt-4 mx-auto" @click="openAddTest(defaultKind)">
        <font-awesome-icon :icon="['fas','plus']" class="text-xs" /> Add {{ defaultKind === 'rad' ? 'image' : 'test' }}
      </button>
    </div>

    <!-- ── Set price modal (new effective window) ────────────────────── -->
    <Modal v-model="priceModal" title="Set Price"
           :subtitle="priceTarget?.name" :show-logo="false" class="w-[480px] max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="lbl">Amount (MWK)</label>
          <input v-model.number="priceAmount" type="number" min="0" step="1"
            class="field text-right tabular-nums" />
          <p class="text-[0.7rem] text-on-surface-variant mt-1.5">
            Current: {{ priceTarget ? fmtMwk(priceTarget.amount) : '—' }}
          </p>
        </div>
        <div>
          <label class="lbl">Effective from</label>
          <input v-model="priceFrom" type="date" class="field" />
        </div>
        <div class="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2.5">
          <font-awesome-icon :icon="['fas','circle-info']" class="text-amber-500 mt-0.5 text-sm" />
          <p class="text-xs text-amber-700">This opens a new price window and supersedes the current one from the effective date. New prices require finance approval.</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="priceModal = false">Cancel</button>
        <button class="btn-primary" @click="savePrice">Set price</button>
      </template>
    </Modal>

    <!-- ── Add test / image modal ────────────────────────────────────── -->
    <Modal v-model="addModal" :title="addKind === 'rad' ? 'Add Imaging Service' : 'Add Laboratory Test'"
           :subtitle="meta.name" :show-logo="false" class="w-[520px] max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="lbl">{{ addKind === 'rad' ? 'Image' : 'Test' }} from catalogue</label>
          <select v-model="addDraft.code" class="field">
            <option value="" disabled>Select from catalogue…</option>
            <!-- TODO: populate from /laboratory_tests or /radiology_images catalogue endpoint -->
          </select>
          <p class="text-[0.7rem] text-on-surface-variant mt-1.5">
            Catalogue is loaded from the master test/image list (endpoint to be wired). You can also enter a code and name manually below.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lbl">Code</label>
            <input v-model="addDraft.code" class="field font-mono" :placeholder="addKind === 'rad' ? '21101' : '23001'" />
          </div>
          <div>
            <label class="lbl">Turnaround</label>
            <input v-model="addDraft.turnaround" class="field" placeholder="e.g. 24 hrs" />
          </div>
        </div>
        <div>
          <label class="lbl">Name</label>
          <input v-model="addDraft.name" class="field" :placeholder="addKind === 'rad' ? 'Chest X-Ray (PA)' : 'Albumin'" />
        </div>
        <div>
          <label class="lbl">Initial price (MWK)</label>
          <input v-model.number="addDraft.amount" type="number" min="0" step="1" class="field text-right tabular-nums" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="addModal = false">Cancel</button>
        <button class="btn-primary" @click="saveAdd">Add</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const deptCode = computed(() => String(route.params.departmentId))
const subCode  = computed(() => String(route.params.subDepartmentId))
const { can } = usePermission()
const canWrite = computed(() => can('admin_system'))

type Kind = 'lab' | 'rad'
interface Priced {
  code: string; name: string; classifier?: string; turnaround?: string
  active: boolean; amount: number; currency: string; effective_from: string
}

// ── Sub-department display names (subset, from departments.rb) ──────────────
const SUB_META: Record<string, { name: string; description: string }> = {
  'CLIN-LAB-CHEM':  { name:'Clinical Chemistry', description:'General chemistry, liver and renal function, electrolytes, lipids and drug monitoring.' },
  'CLIN-LAB-HAEM':  { name:'Haematology', description:'Full blood counts, blood film, reticulocyte count, ESR and red cell studies.' },
  'CLIN-LAB-IMMUNO':{ name:'Immunoassay', description:'Hormones, tumour markers, thyroid function, vitamins and autoimmune panels.' },
  'CLIN-LAB-MICRO': { name:'Microbiology', description:'Bacteriology, mycology and parasitology cultures.' },
  'CLIN-LAB-URINE': { name:'Urinalysis', description:'Routine urine analysis, culture and sensitivity, and urine TB LAM.' },
  'RAD-XR':         { name:'X-Ray', description:'Plain film radiography — chest, skeletal, abdominal and screening.' },
  'RAD-US':         { name:'Ultrasound', description:'Real-time sonography for abdominal, pelvic, thyroid and soft tissue.' },
  'RAD-CT':         { name:'CT Scan', description:'Computed tomography for staging, planning and follow-up of solid tumours.' },
}

const pl = (amount: number, code: string, name: string, classifier?: string, turnaround?: string): Priced =>
  ({ code, name, classifier, turnaround, active: true, amount, currency: 'MWK', effective_from: '2024-01-01' })

// ── DUMMY catalogue keyed by sub-department code (enc_lab_rad_pricing.rb) ────
const CATALOGUE: Record<string, { lab?: Priced[]; rad?: Priced[] }> = {
  'CLIN-LAB-CHEM': { lab: [
    pl(16_060,'23001','Albumin','Chemistry','Same day'),
    pl(16_137,'23002','Alkaline Phosphatase','Chemistry','Same day'),
    pl( 7_656,'23013','Glucose','Chemistry','Same day'),
    pl( 9_713,'23009','Creatinine','Chemistry','Same day'),
    pl(25_179,'23019','Urea & Electrolytes','Panel','Same day'),
    pl(80_058,'23029','Liver Function Tests','Panel','24 hrs'),
    pl(57_684,'23030','Lipid Profile','Panel','24 hrs'),
    pl(38_962,'23014','HbA1c','Chemistry','24 hrs'),
  ]},
  'CLIN-LAB-HAEM': { lab: [
    pl( 8_734,'23101','Full Blood Count','Haematology','Same day'),
    pl(12_584,'23102','Reticulocyte Count','Haematology','Same day'),
    pl(10_230,'23104','ESR','Haematology','Same day'),
    pl(12_342,'23103','Sickling Test','Haematology','Same day'),
    pl(31_812,'23105','Coombs Test','Haematology','24 hrs'),
  ]},
  'CLIN-LAB-IMMUNO': { lab: [
    pl(108_999,'23039','AFP','Tumour marker','24 hrs'),
    pl( 86_273,'23045','CEA','Tumour marker','24 hrs'),
    pl( 72_358,'23056','PSA Total','Tumour marker','24 hrs'),
    pl( 78_628,'23060','CA-125','Tumour marker','24 hrs'),
    pl(101_200,'23053','TSH','Hormone','24 hrs'),
  ]},
  'CLIN-LAB-MICRO': { lab: [
    pl(68_573,'23201','Culture and Sensitivity','Microbiology','48–72 hrs'),
    pl(43_700,'23202','Blood Culture','Microbiology','5 days'),
    pl(11_891,'23208','Gram Stain','Microbiology','Same day'),
  ]},
  'CLIN-LAB-URINE': { lab: [
    pl( 5_060,'23084','Routine Urine Analysis','Urinalysis','Same day'),
    pl(32_956,'23085','Urine Culture and Sensitivity','Urinalysis','48–72 hrs'),
    pl(25_047,'23086','Urine LAM TB','Urinalysis','Same day'),
  ]},
  'RAD-XR': { rad: [ pl(35_000,'21101','Chest X-Ray (PA)','Plain film','Same day') ]},
  'RAD-US': { rad: [ pl(85_000,'22101','Abdominal Ultrasound','Sonography','Same day') ]},
  'RAD-CT': { rad: [ pl(250_000,'23101','CT Brain (Head)','CT + contrast','24 hrs') ]},
}

const meta = computed(() => SUB_META[subCode.value] ?? { name: subCode.value, description: '' })
const labTests  = ref<Priced[]>([...(CATALOGUE[subCode.value]?.lab ?? [])])
const radImages = ref<Priced[]>([...(CATALOGUE[subCode.value]?.rad ?? [])])

const hasLab     = computed(() => labTests.value.length > 0)
const hasImaging = computed(() => radImages.value.length > 0)
// When empty, guess the right kind from the code so "Add" pre-selects correctly.
const defaultKind = computed<Kind>(() => subCode.value.startsWith('RAD') ? 'rad' : 'lab')

// ── Formatters ──────────────────────────────────────────────────────────────
const fmtMwk = (n: number) => 'MWK ' + n.toLocaleString('en-MW')
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })

// ── Set-price modal ─────────────────────────────────────────────────────────
const priceModal  = ref(false)
const priceTarget = ref<Priced | null>(null)
const priceKind   = ref<Kind>('lab')
const priceAmount = ref(0)
const priceFrom   = ref(new Date().toISOString().slice(0, 10))

const openSetPrice = (t: Priced, kind: Kind) => {
  priceTarget.value = t; priceKind.value = kind
  priceAmount.value = t.amount
  priceFrom.value = new Date().toISOString().slice(0, 10)
  priceModal.value = true
}
const savePrice = () => {
  if (priceTarget.value) {
    // New effective window → here we just reflect the new amount in the dummy row.
    priceTarget.value.amount = priceAmount.value
    priceTarget.value.effective_from = priceFrom.value
    // TODO: POST a new …Price row (amount, currency, effective_from, is_approved:false)
  }
  priceModal.value = false
}

// ── Add modal ───────────────────────────────────────────────────────────────
const addModal = ref(false)
const addKind  = ref<Kind>('lab')
const addDraft = reactive<Priced>({ code:'', name:'', turnaround:'', active:true, amount:0, currency:'MWK', effective_from:'2024-01-01' })

const openAddTest = (kind: Kind) => {
  addKind.value = kind
  Object.assign(addDraft, { code:'', name:'', turnaround:'', active:true, amount:0, currency:'MWK', effective_from: new Date().toISOString().slice(0,10) })
  addModal.value = true
}
const saveAdd = () => {
  const row: Priced = { ...addDraft }
  if (addKind.value === 'rad') radImages.value.push(row)
  else labTests.value.push(row)
  addModal.value = false
  // TODO: POST to the sub-department's laboratory_tests / radiology_images endpoint
}
</script>

<style scoped>
.panel { @apply bg-surface-bright rounded-[1.5rem] border border-outline-variant/30 overflow-hidden; box-shadow: 0 6px 22px rgba(0,51,153,0.05); }
.field { @apply w-full px-3 py-2.5 rounded-xl text-sm bg-surface-low border border-outline-variant/50 focus:border-primary/50 focus:outline-none transition-colors; }
.lbl   { @apply block text-xs font-semibold text-on-surface-variant mb-1.5; }
.btn-primary { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-transform active:scale-95; background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); box-shadow: 0 4px 12px rgba(0,80,203,0.30); }
.btn-ghost   { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant border border-outline-variant hover:text-primary hover:border-primary/40 transition-colors; }
.btn-soft  { @apply inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold text-on-surface-variant bg-surface-bright border border-outline-variant/40 hover:text-primary hover:border-primary/40 transition-colors; }
.btn-icon  { @apply w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary bg-surface-low hover:bg-surface-container flex-shrink-0 transition-colors; }
.badge-muted { @apply inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-surface-high text-on-surface-variant; }
</style>