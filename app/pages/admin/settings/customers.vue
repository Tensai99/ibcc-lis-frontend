<!-- app/pages/admin/settings/customers.vue -->
<!--
  Customer Settings — customer categories and their price adjustments.

  ⚠️ DATA SHAPE (from customer_categories.rb + enc_lab_rad_pricing.rb):
     • CustomerCategory: name, description, accept_insurance (+ active on model)
     • CustomerCategoryPriceAdjustment.adjustment_rate is a MULTIPLIER, not an
       offset:  1.20 → base × 1.20 (+20% markup),  0.90 → base × 0.90 (−10%).
       Also carries use_exchange_rate, effective_from, is_approved.
     The UI lets you enter a friendly ±% and converts to/from the multiplier.
  ⚠️ DUMMY DATA below — swap for useSettingsApi('customer_categories').list().
-->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-[98%] mx-auto">
    <SettingsHeader
      title="Customer Settings"
      subtitle="Categories, insurance eligibility and price adjustment tariffs"
      icon="user-tag"
      :crumbs="[{ label:'Settings', to:'/admin/settings' }, { label:'Customers' }]"
    >
      <template #actions>
        <button v-if="canWrite" class="btn-primary" @click="openCreateCategory">
          <font-awesome-icon :icon="['fas','plus']" class="text-xs" />
          <span class="hidden sm:inline">Add category</span>
        </button>
      </template>
    </SettingsHeader>

    <div class="grid gap-4 sm:grid-cols-2">
      <div v-for="cat in categories" :key="cat.id" class="panel p-5 flex flex-col">
        <!-- Header row -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-bold text-on-surface text-base truncate">{{ cat.name }}</h3>
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              <span v-if="cat.accept_insurance" class="badge-blue">
                <font-awesome-icon :icon="['fas','shield-heart']" class="text-[0.6rem]" /> Insurance
              </span>
              <span v-else class="badge-muted">Self-pay</span>
              <span v-if="cat.current?.use_exchange_rate" class="badge-amber">
                <font-awesome-icon :icon="['fas','arrow-right-arrow-left']" class="text-[0.6rem]" /> FX
              </span>
              <span v-if="!cat.active" class="badge-muted">Inactive</span>
            </div>
          </div>
          <AppToggle v-model="cat.active" :disabled="!canWrite" size="sm" />
        </div>

        <p class="text-xs text-on-surface-variant mt-2 leading-relaxed flex-1">{{ cat.description }}</p>

        <!-- Current adjustment -->
        <div class="mt-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4">
          <div class="flex items-center justify-between">
            <span class="text-[0.7rem] font-semibold text-on-surface-variant uppercase tracking-wide">Current tariff</span>
            <span v-if="cat.current && !cat.current.is_approved" class="badge-amber">Pending approval</span>
            <span v-else-if="cat.current" class="badge-emerald">Approved</span>
          </div>

          <div v-if="cat.current" class="flex items-baseline gap-2 mt-1.5">
            <span class="text-2xl font-bold tabular-nums" :class="deltaColor(cat.current.adjustment_rate)">
              {{ deltaLabel(cat.current.adjustment_rate) }}
            </span>
            <span class="text-xs text-on-surface-variant">
              ×{{ cat.current.adjustment_rate.toFixed(4) }} · since {{ fmtDate(cat.current.effective_from) }}
            </span>
          </div>
          <p v-else class="text-sm text-on-surface-variant mt-1.5">No adjustment configured.</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 mt-4">
          <button v-if="canWrite" class="btn-soft flex-1" @click="openAdjust(cat)">
            <font-awesome-icon :icon="['fas','sliders']" class="text-xs" /> New tariff
          </button>
          <button class="btn-soft" @click="openHistory(cat)" title="History">
            <font-awesome-icon :icon="['fas','clock-rotate-left']" class="text-xs" />
          </button>
          <button v-if="canWrite" class="btn-icon" @click="openConfigureCategory(cat)" title="Configure">
            <font-awesome-icon :icon="['fas','pen']" class="text-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Category add / configure ──────────────────────────────────── -->
    <Modal v-model="catModal" :title="catEditing ? 'Configure Category' : 'Add Customer Category'"
           :subtitle="catEditing ? catDraft.name : 'Define a new customer classification'"
           :show-logo="false" class="w-[560px] max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="lbl">Name</label>
          <input v-model="catDraft.name" class="field" placeholder="e.g. Corporate Client" />
        </div>
        <div>
          <label class="lbl">Description</label>
          <textarea v-model="catDraft.description" rows="3" class="field resize-none"
            placeholder="Describe who falls into this category and how they are billed." />
        </div>
        <div class="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-on-surface">Accepts insurance</p>
            <p class="text-xs text-on-surface-variant">Allow insurance schemes to be attached to these customers.</p>
          </div>
          <AppToggle v-model="catDraft.accept_insurance" />
        </div>
        <label class="flex items-center gap-2 text-sm text-on-surface-variant">
          <AppToggle v-model="catDraft.active" size="sm" /> Active
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="catModal = false">Cancel</button>
        <button class="btn-primary" @click="saveCategory">{{ catEditing ? 'Save changes' : 'Add category' }}</button>
      </template>
    </Modal>

    <!-- ── New price adjustment ──────────────────────────────────────── -->
    <Modal v-model="adjModal" title="New Price Adjustment"
           :subtitle="adjTarget?.name" :show-logo="false" class="w-[520px] max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="lbl">Adjustment</label>
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input v-model.number="adjPct" type="number" step="0.5" class="field text-right tabular-nums pr-8" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">%</span>
            </div>
            <span class="text-on-surface-variant text-sm">→ ×{{ pctToRate(adjPct).toFixed(4) }}</span>
          </div>
          <p class="text-[0.7rem] text-on-surface-variant mt-1.5">
            Positive = markup over base price, negative = discount. 0% bills at base price.
          </p>
        </div>
        <div>
          <label class="lbl">Effective from</label>
          <input v-model="adjFrom" type="date" class="field" />
        </div>
        <label class="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-on-surface">Use exchange rate</p>
            <p class="text-xs text-on-surface-variant">Convert via the active FX rate (international tariffs).</p>
          </div>
          <AppToggle v-model="adjFx" />
        </label>
        <div class="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2.5">
          <font-awesome-icon :icon="['fas','circle-info']" class="text-amber-500 mt-0.5 text-sm" />
          <p class="text-xs text-amber-700">New tariffs are created pending and require finance approval before they take effect.</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="adjModal = false">Cancel</button>
        <button class="btn-primary" @click="saveAdjustment">Submit for approval</button>
      </template>
    </Modal>

    <!-- ── History ───────────────────────────────────────────────────── -->
    <Modal v-model="histModal" title="Adjustment History" :subtitle="histTarget?.name"
           :show-logo="false" class="w-[560px] max-w-2xl">
      <div class="space-y-2">
        <div v-for="(a, i) in (histTarget?.history ?? [])" :key="i"
             class="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
          <div>
            <span class="font-bold tabular-nums" :class="deltaColor(a.adjustment_rate)">{{ deltaLabel(a.adjustment_rate) }}</span>
            <span class="text-xs text-on-surface-variant ml-2">×{{ a.adjustment_rate.toFixed(4) }}</span>
            <p class="text-[0.7rem] text-on-surface-variant mt-0.5">From {{ fmtDate(a.effective_from) }}</p>
          </div>
          <span :class="a.is_approved ? 'badge-emerald' : 'badge-amber'">
            {{ a.is_approved ? 'Approved' : 'Pending' }}
          </span>
        </div>
        <p v-if="!(histTarget?.history?.length)" class="text-sm text-on-surface-variant text-center py-6">
          No history yet.
        </p>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
const { can } = usePermission()
const canWrite = computed(() => can('admin_system') || can('admin_users'))

interface Adjustment { adjustment_rate: number; use_exchange_rate: boolean; effective_from: string; is_approved: boolean }
interface Category {
  id: number; name: string; description: string; accept_insurance: boolean; active: boolean
  current: Adjustment | null; history: Adjustment[]
}

const adj = (rate: number, fx: boolean, from: string, ok = true): Adjustment =>
  ({ adjustment_rate: rate, use_exchange_rate: fx, effective_from: from, is_approved: ok })

// ── DUMMY DATA (customer_categories.rb + enc_lab_rad_pricing.rb) ────────────
const categories = ref<Category[]>([
  { id:1, name:'Cash Client', accept_insurance:false, active:true,
    description:'Pays the full cost of services out of pocket at the time of service. No insurance billing.',
    current: adj(1.2000,false,'2024-01-01'), history:[adj(1.2000,false,'2024-01-01'), adj(1.1500,false,'2023-01-01')] },
  { id:2, name:'Local Private Client', accept_insurance:true, active:true,
    description:'Individual with private medical insurance or medical aid. Claim submitted on their behalf.',
    current: adj(1.1000,false,'2024-01-01'), history:[adj(1.1000,false,'2024-01-01')] },
  { id:3, name:'Corporate Client', accept_insurance:true, active:true,
    description:'Covered under a corporate employee health scheme. Invoice raised against the employer/insurer.',
    current: adj(1.2500,false,'2024-01-01'), history:[adj(1.2500,false,'2024-01-01')] },
  { id:4, name:'Government Client', accept_insurance:true, active:true,
    description:'Government employee or dependent under a government scheme or NHIS. Billed to the government entity.',
    current: adj(1.2000,false,'2024-01-01'), history:[adj(1.2000,false,'2024-01-01')] },
  { id:5, name:'Research Client', accept_insurance:false, active:true,
    description:'Enrolled in a clinical trial or research study. Costs covered by the grant or sponsor institution.',
    current: adj(1.2500,false,'2024-01-01'), history:[adj(1.2500,false,'2024-01-01')] },
  { id:6, name:'Private Laboratory', accept_insurance:false, active:true,
    description:'Specimen or referral received from a private laboratory. Invoice raised against the referring lab.',
    current: adj(0.9000,false,'2024-01-01'), history:[adj(0.9000,false,'2024-01-01')] },
  { id:7, name:'Private Hospital', accept_insurance:false, active:true,
    description:'Referral or service received from a private hospital or clinic. Invoice raised against the facility.',
    current: adj(1.1500,false,'2024-01-01'), history:[adj(1.1500,false,'2024-01-01')] },
  { id:8, name:'International Client', accept_insurance:false, active:true,
    description:'Customer from outside Malawi. May hold international insurance. Billed in agreed currency at international tariff.',
    current: adj(1.3500,true,'2024-01-01'),
    history:[adj(1.4000,true,'2025-01-01',false), adj(1.3500,true,'2024-01-01')] },
])

// ── Multiplier ↔ percentage helpers ────────────────────────────────────────
const pctToRate = (pct: number) => 1 + (Number(pct) || 0) / 100
const rateToPct = (rate: number) => (rate - 1) * 100
const deltaLabel = (rate: number) => {
  const p = rateToPct(rate)
  return `${p > 0 ? '+' : ''}${p.toFixed(1)}%`
}
const deltaColor = (rate: number) =>
  rate > 1 ? 'text-primary' : rate < 1 ? 'text-emerald-600' : 'text-on-surface-variant'
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })

// ── Category modal ──────────────────────────────────────────────────────────
const catModal = ref(false)
const catEditing = ref(false)
const catDraft = reactive<Category>({ id:0, name:'', description:'', accept_insurance:false, active:true, current:null, history:[] })

const openCreateCategory = () => {
  catEditing.value = false
  Object.assign(catDraft, { id:0, name:'', description:'', accept_insurance:false, active:true, current:null, history:[] })
  catModal.value = true
}
const openConfigureCategory = (c: Category) => {
  catEditing.value = true
  Object.assign(catDraft, { ...c })
  catModal.value = true
}
const saveCategory = () => {
  if (catEditing.value) {
    const i = categories.value.findIndex(c => c.id === catDraft.id)
    if (i > -1) categories.value[i] = { ...categories.value[i], ...catDraft }
  } else {
    categories.value.push({ ...catDraft, id: Date.now() })
  }
  catModal.value = false
}

// ── Adjustment modal ────────────────────────────────────────────────────────
const adjModal  = ref(false)
const adjTarget = ref<Category | null>(null)
const adjPct    = ref(0)
const adjFx     = ref(false)
const adjFrom   = ref(new Date().toISOString().slice(0, 10))

const openAdjust = (c: Category) => {
  adjTarget.value = c
  adjPct.value = c.current ? Number(rateToPct(c.current.adjustment_rate).toFixed(2)) : 0
  adjFx.value = c.current?.use_exchange_rate ?? false
  adjFrom.value = new Date().toISOString().slice(0, 10)
  adjModal.value = true
}
const saveAdjustment = () => {
  if (!adjTarget.value) return
  const a = adj(pctToRate(adjPct.value), adjFx.value, adjFrom.value, false) // pending
  adjTarget.value.history.unshift(a)
  // Stays pending → does not replace `current` until approved (mirrors is_approved gate)
  adjModal.value = false
}

// ── History modal ───────────────────────────────────────────────────────────
const histModal  = ref(false)
const histTarget = ref<Category | null>(null)
const openHistory = (c: Category) => { histTarget.value = c; histModal.value = true }
</script>

<style scoped>
.panel { @apply bg-surface-bright rounded-[1.5rem] border border-outline-variant/30; box-shadow: 0 6px 22px rgba(0,51,153,0.05); }
.field { @apply w-full px-3 py-2.5 rounded-xl text-sm bg-surface-low border border-outline-variant/50 focus:border-primary/50 focus:outline-none transition-colors; }
.lbl   { @apply block text-xs font-semibold text-on-surface-variant mb-1.5; }
.btn-primary { @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-transform active:scale-95; background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); box-shadow: 0 4px 12px rgba(0,80,203,0.30); }
.btn-ghost   { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant border border-outline-variant hover:text-primary hover:border-primary/40 transition-colors; }
.btn-soft  { @apply inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold text-on-surface-variant bg-surface-low hover:bg-surface-container hover:text-primary transition-colors; }
.btn-icon  { @apply w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary bg-surface-low hover:bg-surface-container flex-shrink-0 transition-colors; }
.badge-blue    { @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-blue-100 text-blue-600; }
.badge-amber   { @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-amber-100 text-amber-600; }
.badge-emerald { @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-100 text-emerald-600; }
.badge-muted   { @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-surface-high text-on-surface-variant; }
</style>