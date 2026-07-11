<!-- app/pages/admin/settings/billing.vue -->
<!--
  Billing Settings — tabbed configuration of the BillingSetting table.

  ⚠️ BACKEND NOTE: the BillingSetting model has NO `category` column (confirmed
     in billing_settings.rb — settings are only grouped by code comment-blocks).
     The tabs below therefore key off a frontend CATEGORY map. Two ways to make
     this real later:
       (a) add a `category` string column to BillingSetting and seed it, or
       (b) keep CATEGORY_OF as the single source of truth on the frontend.
  ⚠️ DUMMY DATA: `SEED` mirrors billing_settings.rb so the UI is reviewable now.
     Replace `rows` hydration with `useSettingsApi('billing_settings').list()`.
-->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-[98%] mx-auto">
    <SettingsHeader
      title="Billing Settings"
      subtitle="Tax, invoicing, deposits, currency and compliance configuration"
      icon="file-invoice-dollar"
      :crumbs="[{ label:'Settings', to:'/admin/settings' }, { label:'Billing' }]"
    >
      <template #actions>
        <div class="relative">
          <font-awesome-icon :icon="['fas','magnifying-glass']"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs" />
          <input
            v-model="search"
            placeholder="Search settings…"
            class="pl-8 pr-3 py-2 rounded-full text-sm bg-surface-bright border border-outline-variant/50
                   focus:border-primary/50 focus:outline-none w-44 sm:w-56 transition-colors"
          />
        </div>
        <button v-if="canWrite" class="btn-primary" @click="openCreate">
          <font-awesome-icon :icon="['fas','plus']" class="text-xs" />
          <span class="hidden sm:inline">Add setting</span>
        </button>
      </template>
    </SettingsHeader>

    <!-- ── Tabs ──────────────────────────────────────────────────────── -->
    <div class="flex gap-1.5 overflow-x-auto pb-2 mb-5 -mx-1 px-1 no-scrollbar">
      <button
        v-for="t in TABS" :key="t.key"
        class="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all"
        :class="activeTab === t.key
          ? 'text-white shadow-md'
          : 'text-on-surface-variant hover:text-primary bg-surface-bright border border-outline-variant/40'"
        :style="activeTab === t.key ? 'background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%);' : ''"
        @click="activeTab = t.key"
      >
        <font-awesome-icon :icon="['fas', t.icon]" class="text-[0.7rem]" />
        {{ t.label }}
        <span class="text-[0.65rem] opacity-70">{{ countFor(t.key) }}</span>
      </button>
    </div>

    <!-- ── Settings list ─────────────────────────────────────────────── -->
    <div class="space-y-3">
      <div
        v-for="row in visibleRows" :key="row.code"
        class="panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <!-- Label / meta -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-bold text-on-surface text-sm sm:text-base truncate">{{ row.name }}</h3>
            <DataTypeBadge :type="row.data_type" />
            <span v-if="!row.active" class="badge-muted">Inactive</span>
          </div>
          <code class="text-[0.7rem] text-primary/80 font-mono">{{ row.code }}</code>
          <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">{{ row.description }}</p>
        </div>

        <!-- Value control -->
        <div class="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <div class="flex-1 sm:w-52">
            <!-- boolean -->
            <div v-if="row.data_type === 'boolean'" class="flex items-center gap-2">
              <AppToggle v-model="row._boolVal" :disabled="!canWrite" @update:modelValue="markDirty(row)" />
              <span class="text-xs font-semibold text-on-surface-variant">
                {{ row._boolVal ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <!-- date -->
            <input
              v-else-if="row.data_type === 'date'"
              v-model="row.value" type="date" :disabled="!canWrite"
              class="value-input" @input="markDirty(row)"
            />
            <!-- number -->
            <input
              v-else-if="row.data_type === 'decimal' || row.data_type === 'integer'"
              v-model="row.value" type="number"
              :step="row.data_type === 'decimal' ? '0.0001' : '1'" :disabled="!canWrite"
              class="value-input text-right tabular-nums" @input="markDirty(row)"
            />
            <!-- string -->
            <input
              v-else
              v-model="row.value" type="text" :disabled="!canWrite"
              class="value-input" @input="markDirty(row)"
            />
            <!-- decimal hint: show as % when it looks like a rate -->
            <p v-if="row.data_type === 'decimal' && isRate(row)"
               class="text-[0.65rem] text-on-surface-variant mt-1 text-right">
              ≈ {{ (Number(row.value) * 100).toFixed(2) }}%
            </p>
          </div>

          <button
            v-if="canWrite && row._dirty"
            class="btn-save" title="Save value" @click="saveValue(row)"
          >
            <font-awesome-icon :icon="['fas','check']" class="text-xs" />
          </button>
          <button
            v-if="canWrite"
            class="btn-icon" title="Configure" @click="openConfigure(row)"
          >
            <font-awesome-icon :icon="['fas','pen']" class="text-xs" />
          </button>
        </div>
      </div>

      <div v-if="!visibleRows.length" class="panel p-10 text-center">
        <font-awesome-icon :icon="['fas','inbox']" class="text-3xl text-outline mb-3" />
        <p class="text-sm text-on-surface-variant">No settings in this category match your search.</p>
      </div>
    </div>

    <!-- ── Add / Configure modal ─────────────────────────────────────── -->
    <Modal v-model="modalOpen" :title="editing ? 'Configure Setting' : 'Add Setting'"
           :subtitle="editing ? draft.code : 'Define a new billing parameter'"
           :show-logo="false" class="w-[560px] max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="lbl">Name</label>
          <input v-model="draft.name" class="field" placeholder="e.g. Value Added Tax Rate" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lbl">Code</label>
            <input v-model="draft.code" :disabled="editing"
              class="field font-mono uppercase disabled:opacity-60"
              placeholder="VAT_RATE" @input="draft.code = (draft.code || '').toUpperCase()" />
          </div>
          <div>
            <label class="lbl">Data type</label>
            <select v-model="draft.data_type" class="field">
              <option value="string">Text</option>
              <option value="decimal">Decimal</option>
              <option value="integer">Integer</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
        <div>
          <label class="lbl">Category</label>
          <select v-model="draft.category" class="field">
            <option v-for="t in TABS" :key="t.key" :value="t.key">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <label class="lbl">Default value</label>
          <input v-model="draft.value" class="field" placeholder="e.g. 0.175" />
        </div>
        <div>
          <label class="lbl">Description</label>
          <textarea v-model="draft.description" rows="3" class="field resize-none"
            placeholder="Explain what this setting controls and where it is used." />
        </div>
        <label class="flex items-center gap-2 text-sm text-on-surface-variant">
          <AppToggle v-model="draft.active" size="sm" /> Active
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="modalOpen = false">Cancel</button>
        <button class="btn-primary" @click="saveDraft">
          {{ editing ? 'Save changes' : 'Add setting' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
const { can } = usePermission()
const canWrite = computed(() => can('admin_system'))

// ── Tabs ───────────────────────────────────────────────────────────────────
const TABS = [
  { key:'taxes',              label:'Billing Taxes',          icon:'receipt' },
  { key:'discounts',          label:'Discounts',              icon:'tags' },
  { key:'invoice_numbering',  label:'Invoice & Numbering',    icon:'hashtag' },
  { key:'payment_terms',      label:'Payment Terms',          icon:'calendar-day' },
  { key:'deposit_prepayment', label:'Deposit & Prepayment',   icon:'piggy-bank' },
  { key:'copayment_insurance',label:'Co-payment & Insurance', icon:'shield-heart' },
  { key:'currency_rounding',  label:'Currency & Rounding',    icon:'coins' },
  { key:'late_fees_interest', label:'Late Fees & Interest',   icon:'clock' },
  { key:'revenue_compliance', label:'Revenue & Compliance',   icon:'scale-balanced' },
  { key:'facility_identity',  label:'Facility Identity',      icon:'building' },
] as const
type TabKey = typeof TABS[number]['key']
const activeTab = ref<TabKey>('taxes')
const search = ref('')

// ── Which category each known code belongs to (frontend source of truth) ────
const CATEGORY_OF: Record<string, TabKey> = {
  TIN:'taxes', VAT_RATE:'taxes', WHT_RATE:'taxes', VAT_EXEMPT:'taxes', VAT_REG_NUMBER:'taxes', TAX_INVOICE_PREFIX:'taxes',
  MAX_DISCOUNT_RATE:'discounts', MAX_SUPERVISOR_DISCOUNT_RATE:'discounts', MAX_DIRECTOR_DISCOUNT_RATE:'discounts', INDIGENT_DISCOUNT_RATE:'discounts', STAFF_DISCOUNT_RATE:'discounts',
  PRE_COSTING_PREFIX:'invoice_numbering', INVOICE_PREFIX:'invoice_numbering', RECEIPT_PREFIX:'invoice_numbering', CREDIT_NOTE_PREFIX:'invoice_numbering', PROFORMA_PREFIX:'invoice_numbering',
  PRE_COSTING_VALIDITY_TERMS_DAYS:'payment_terms', QUOTE_VALIDITY_TERMS_DAYS:'payment_terms', INVOICE_PAYMENT_TERMS_DAYS:'payment_terms', INSURANCE_CLAIM_DAYS:'payment_terms', INSURANCE_REIMBURSEMENT_DAYS:'payment_terms', OVERDUE_REMINDER_DAYS:'payment_terms', BAD_DEBT_WRITEOFF_DAYS:'payment_terms',
  INPATIENT_DEPOSIT_RATE:'deposit_prepayment', SURGICAL_DEPOSIT_RATE:'deposit_prepayment', CHEMO_DEPOSIT_RATE:'deposit_prepayment',
  DEFAULT_COPAY_RATE:'copayment_insurance', PREAUTH_THRESHOLD_MWK:'copayment_insurance', INSURANCE_DIRECT_BILLING:'copayment_insurance',
  BASE_CURRENCY:'currency_rounding', CURRENCY_SYMBOL:'currency_rounding', ROUNDING_PRECISION:'currency_rounding', ROUNDING_METHOD:'currency_rounding',
  LATE_PAYMENT_INTEREST_RATE:'late_fees_interest', LATE_PAYMENT_GRACE_DAYS:'late_fees_interest',
  FINANCIAL_YEAR_START_MONTH:'revenue_compliance', BILLING_RETENTION_YEARS:'revenue_compliance', SHOW_ZERO_VALUE_LINE_ITEMS:'revenue_compliance', MIN_BILLABLE_AMOUNT_MWK:'revenue_compliance',
  FACILITY_NAME:'facility_identity', FACILITY_ADDRESS_LINE1:'facility_identity', FACILITY_ADDRESS_LINE2:'facility_identity', FACILITY_PHONE:'facility_identity', FACILITY_EMAIL:'facility_identity',
}

// ── DUMMY DATA (mirrors billing_settings.rb) — remove once API is wired ──────
const SEED: [string, string, string, string, string][] = [
  ['Tax Identification Number','TIN','','string','Government issued tax identification number. Printed on all tax invoices.'],
  ['Value Added Tax Rate','VAT_RATE','0.175','decimal','VAT applied to taxable goods and services. Malawi standard rate is 17.5%.'],
  ['Withholding Tax Rate','WHT_RATE','0.2','decimal','Withholding tax deducted at source on payments to suppliers. Standard WHT is 20%.'],
  ['VAT Exempt','VAT_EXEMPT','false','boolean','When true, VAT is not applied to any line item regardless of VAT_RATE.'],
  ['VAT Registration Number','VAT_REG_NUMBER','','string','Government issued VAT registration number. Printed on all tax invoices.'],
  ['Tax Invoice Number Prefix','TAX_INVOICE_PREFIX','TINV','string','Prefix for tax invoice numbers e.g. TINV-2025-000001.'],
  ['Maximum Discount Rate','MAX_DISCOUNT_RATE','0.001','decimal','Max discount a user can apply without supervisor approval. 0.001 = 0.1%.'],
  ['Maximum Supervisor Discount Rate','MAX_SUPERVISOR_DISCOUNT_RATE','0.005','decimal','Max a supervisor can approve without finance director escalation. 0.005 = 0.5%.'],
  ['Maximum Director Discount Rate','MAX_DIRECTOR_DISCOUNT_RATE','0.01','decimal','Max the finance/medical director can approve. Above requires the board. 0.01 = 1%.'],
  ['Indigent / Charity Discount Rate','INDIGENT_DISCOUNT_RATE','1.0','decimal','Discount for indigent/charity patients. 1.0 = 100% waiver, needs director approval.'],
  ['Staff Discount Rate','STAFF_DISCOUNT_RATE','0.01','decimal','Discount for staff and their registered dependants. 0.01 = 1%.'],
  ['Pre-costing Number Prefix','PRE_COSTING_PREFIX','PRC','string','Prefix for pre-costing documents e.g. PRC-2025-000001.'],
  ['Invoice Number Prefix','INVOICE_PREFIX','INV','string','Prefix for standard patient invoices e.g. INV-2025-000001.'],
  ['Receipt Number Prefix','RECEIPT_PREFIX','RCP','string','Prefix for payment receipts e.g. RCP-2025-000001.'],
  ['Credit Note Number Prefix','CREDIT_NOTE_PREFIX','CN','string','Prefix for credit notes on invoice adjustments or reversals.'],
  ['Proforma Invoice Prefix','PROFORMA_PREFIX','PRO','string','Prefix for proforma invoices issued before treatment.'],
  ['Pre-costing Validity Terms (Days)','PRE_COSTING_VALIDITY_TERMS_DAYS','30','integer','Days a pre-costing remains valid.'],
  ['Quote Validity Terms (Days)','QUOTE_VALIDITY_TERMS_DAYS','30','integer','Days a quote remains valid.'],
  ['Invoice Payment Terms (Days)','INVOICE_PAYMENT_TERMS_DAYS','30','integer','Days within which corporate/government/insurance debtors must pay.'],
  ['Insurance Claim Submission Deadline (Days)','INSURANCE_CLAIM_DAYS','60','integer','Max days after service within which an insurance claim must be submitted.'],
  ['Insurance Reimbursement Expected (Days)','INSURANCE_REIMBURSEMENT_DAYS','90','integer','Expected days for an insurer to reimburse an approved claim.'],
  ['Overdue Invoice Reminder (Days)','OVERDUE_REMINDER_DAYS','7','integer','Days past due before an overdue reminder is triggered.'],
  ['Bad Debt Write-Off Threshold (Days)','BAD_DEBT_WRITEOFF_DAYS','365','integer','Days outstanding before an invoice can go for bad-debt write-off review.'],
  ['Inpatient Admission Deposit Rate','INPATIENT_DEPOSIT_RATE','0.30','decimal','Min deposit (of estimated bill) for self-pay inpatients before admission. 0.30 = 30%.'],
  ['Surgical Procedure Deposit Rate','SURGICAL_DEPOSIT_RATE','0.50','decimal','Min deposit from self-pay patients before elective surgery. 0.50 = 50%.'],
  ['Chemotherapy Prepayment Rate','CHEMO_DEPOSIT_RATE','1.0','decimal','Full prepayment before chemo drug prep. 1.0 = 100%. Waived for approved pre-auth.'],
  ['Default Patient Co-Payment Rate','DEFAULT_COPAY_RATE','0.20','decimal','Default co-payment when a scheme has no explicit rate. 0.20 = 20% of insurable amount.'],
  ['Insurance Pre-Authorisation Threshold (MWK)','PREAUTH_THRESHOLD_MWK','100000','integer','Amount above which pre-authorisation is required before service. In MWK.'],
  ['Insurance Direct Billing Enabled','INSURANCE_DIRECT_BILLING','true','boolean','When true, claims are billed directly to insurers and patient-payable is reduced.'],
  ['Base Currency Code','BASE_CURRENCY','MWK','string','ISO 4217 functional currency. All prices and invoices use this currency.'],
  ['Currency Symbol','CURRENCY_SYMBOL','MWK','string','Symbol displayed on invoices, receipts and reports.'],
  ['Rounding Precision (Decimal Places)','ROUNDING_PRECISION','2','integer','Decimal places to round monetary amounts to.'],
  ['Rounding Method','ROUNDING_METHOD','half_up','string','Strategy: half_up | half_even | ceiling | floor.'],
  ['Late Payment Interest Rate (Annual)','LATE_PAYMENT_INTEREST_RATE','0.18','decimal','Annual interest on overdue corporate/government accounts. 0.18 = 18% p.a.'],
  ['Late Payment Grace Period (Days)','LATE_PAYMENT_GRACE_DAYS','7','integer','Days beyond due date before late interest begins accruing.'],
  ['Financial Year Start Month','FINANCIAL_YEAR_START_MONTH','7','integer','Month (1–12) the financial year begins. 7 = July.'],
  ['Billing Record Retention Period (Years)','BILLING_RETENTION_YEARS','7','integer','Years billing records must be retained for MRA audit compliance.'],
  ['Show Zero-Value Line Items on Invoice','SHOW_ZERO_VALUE_LINE_ITEMS','false','boolean','When true, zero-amount lines (registration, triage) appear on the invoice.'],
  ['Minimum Billable Amount (MWK)','MIN_BILLABLE_AMOUNT_MWK','1000','integer','Min invoice total below which a waiver is applied instead of a small invoice.'],
  ['Facility Name','FACILITY_NAME','International Blantyre Cancer Centre','string','Legal facility name printed on all invoices, receipts and statements.'],
  ['Facility Address Line 1','FACILITY_ADDRESS_LINE1','Chileka Road, Blantyre','string','First address line printed on invoices.'],
  ['Facility Address Line 2','FACILITY_ADDRESS_LINE2','Malawi','string','Second address line printed on invoices.'],
  ['Facility Billing Phone','FACILITY_PHONE','+265 891 00 38 80','string','Contact phone for billing enquiries. Printed on invoices.'],
  ['Facility Billing Email','FACILITY_EMAIL','finance@ibcc.mw','string','Billing enquiries email address. Printed on invoices.'],
]

interface Row {
  name: string; code: string; value: string; data_type: string
  description: string; category: TabKey; active: boolean
  _boolVal: boolean; _dirty: boolean
}

const rows = ref<Row[]>(
  SEED.map(([name, code, value, data_type, description]) => ({
    name, code, value, data_type, description,
    category: CATEGORY_OF[code] ?? 'facility_identity',
    active: true,
    _boolVal: value === 'true',
    _dirty: false,
  }))
)

// ── Derived ─────────────────────────────────────────────────────────────────
const countFor = (key: TabKey) => rows.value.filter(r => r.category === key).length
const isRate = (r: Row) =>
  /RATE$/.test(r.code) || r.code.includes('COPAY') || r.code.includes('DEPOSIT') || r.code.includes('DISCOUNT')

const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter(r =>
    r.category === activeTab.value &&
    (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
  )
})

// ── Inline value save ───────────────────────────────────────────────────────
const markDirty = (r: Row) => { r._dirty = true }
const saveValue = (r: Row) => {
  if (r.data_type === 'boolean') r.value = r._boolVal ? 'true' : 'false'
  r._dirty = false
  // TODO: useSettingsApi('billing_settings').update(r.code, { value: r.value })
}

// ── Add / configure modal ───────────────────────────────────────────────────
const modalOpen = ref(false)
const editing   = ref(false)
const draft = reactive<Row>({
  name:'', code:'', value:'', data_type:'string',
  description:'', category:'taxes', active:true, _boolVal:false, _dirty:false,
})

const openCreate = () => {
  editing.value = false
  Object.assign(draft, {
    name:'', code:'', value:'', data_type:'string',
    category: activeTab.value, description:'', active:true, _boolVal:false, _dirty:false,
  })
  modalOpen.value = true
}
const openConfigure = (r: Row) => {
  editing.value = true
  Object.assign(draft, { ...r })
  modalOpen.value = true
}
const saveDraft = () => {
  if (editing.value) {
    const i = rows.value.findIndex(r => r.code === draft.code)
    if (i > -1) rows.value[i] = {
      ...rows.value[i], ...draft,
      _boolVal: draft.value === 'true', _dirty: false,
    }
  } else {
    rows.value.push({ ...draft, _boolVal: draft.value === 'true', _dirty: false })
    activeTab.value = draft.category
  }
  modalOpen.value = false
  // TODO: persist via useSettingsApi('billing_settings').create/update(...)
}
</script>

<style scoped>
.panel { @apply bg-surface-bright rounded-[1.5rem] border border-outline-variant/30; box-shadow: 0 6px 22px rgba(0,51,153,0.05); }
.value-input { @apply w-full px-3 py-2 rounded-xl text-sm bg-surface-low border border-outline-variant/50 focus:border-primary/50 focus:outline-none disabled:opacity-60 transition-colors; }
.field { @apply w-full px-3 py-2.5 rounded-xl text-sm bg-surface-low border border-outline-variant/50 focus:border-primary/50 focus:outline-none transition-colors; }
.lbl   { @apply block text-xs font-semibold text-on-surface-variant mb-1.5; }
.btn-primary { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-transform active:scale-95; background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); box-shadow: 0 4px 12px rgba(0,80,203,0.30); }
.btn-ghost   { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant border border-outline-variant hover:text-primary hover:border-primary/40 transition-colors; }
.btn-save  { @apply w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0; background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); }
.btn-icon  { @apply w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary bg-surface-low hover:bg-surface-container flex-shrink-0 transition-colors; }
.badge-muted { @apply px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-surface-high text-on-surface-variant; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>