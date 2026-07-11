<!-- app/pages/billing/index.vue -->
<script setup lang="ts">
interface EncounterType { id: number; name: string; code: string; is_billable: boolean }
interface Insurance     { id: number; name?: string; code?: string }
interface Invoice {
  id: number; invoice_number: string; patient_name: string; created_at: string
  subtotal_amount: number; insurance_amount: number; patient_amount: number
  outstanding_amount: number; status: string
}

const { denied } = usePageGuard(['billing_view', 'billing_create', 'billing_approve'])
const { can }           = usePermission()
const { request, loading } = useApi()
const route             = useRoute()

const invoices       = ref<Invoice[]>([])
const encounterTypes = ref<EncounterType[]>([])
const showModal      = ref(false)
const payModal       = ref(false)
const activeInvoice  = ref<Invoice | null>(null)
const activeTab      = ref('invoices')

// Billable encounter types only — used in invoice line items
const billableTypes = computed(() => encounterTypes.value.filter(e => e.is_billable))

onMounted(async () => {
  if (route.query.action === 'new' && can('billing_create')) showModal.value = true
  await Promise.all([loadInvoices(), loadEncounterTypes()])
})

const loadInvoices = async () => {
  const data = await request<{ billings: Invoice[] } | Invoice[]>('/billings')
  if (Array.isArray(data))         invoices.value = data
  else if (data && 'billings' in data) invoices.value = data.billings
}

const loadEncounterTypes = async () => {
  const data = await request<EncounterType[]>('/encounter_types')
  if (data) encounterTypes.value = data
}

// ── Invoice form ──────────────────────────────────────────────────────────
interface LineItem { encounter_type_id: string; description: string; quantity: number; unit_cost: number }
const form = reactive({
  patient_id:        '',
  insurance_id:      '',
  notes:             '',
  line_items:        [{ encounter_type_id: '', description: '', quantity: 1, unit_cost: 0 }] as LineItem[],
})
const saving    = ref(false)
const formError = ref('')

const addLine    = () => form.line_items.push({ encounter_type_id:'', description:'', quantity:1, unit_cost:0 })
const removeLine = (i: number) => form.line_items.splice(i, 1)

const totalAmount = computed(() =>
  form.line_items.reduce((sum, l) => sum + (l.quantity * l.unit_cost), 0)
)

// Auto-fill description when encounter type selected
const onEncTypeChange = (line: LineItem) => {
  const et = encounterTypes.value.find(e => String(e.id) === String(line.encounter_type_id))
  if (et && !line.description) line.description = et.name
}

const saveInvoice = async () => {
  formError.value = ''
  if (!form.patient_id) { formError.value = 'Patient is required.'; return }
  saving.value = true
  try {
    await request('/billings', { method: 'POST', body: form })
    await loadInvoices()
    showModal.value = false
    Object.assign(form, { patient_id:'', insurance_id:'', notes:'',
      line_items:[{ encounter_type_id:'', description:'', quantity:1, unit_cost:0 }] })
  } catch (e: unknown) { formError.value = (e as Error).message }
  finally { saving.value = false }
}

// ── Payment ────────────────────────────────────────────────────────────────
const payForm  = reactive({ amount: 0, method: 'cash', reference: '' })
const paying   = ref(false)
const payError = ref('')

const openPay = (inv: Invoice) => {
  activeInvoice.value = inv
  payForm.amount      = inv.outstanding_amount ?? 0
  payForm.method      = 'cash'
  payForm.reference   = ''
  payModal.value      = true
}

const recordPayment = async () => {
  payError.value = ''
  if (payForm.amount <= 0) { payError.value = 'Enter a valid amount.'; return }
  paying.value = true
  try {
    await request(`/billings/${activeInvoice.value?.id}`, {
      method:'PATCH', body:{ action:'record_payment', ...payForm },
    })
    await loadInvoices()
    payModal.value = false
  } catch (e: unknown) { payError.value = (e as Error).message }
  finally { paying.value = false }
}

const approveInvoice = async (inv: Invoice) => {
  await request(`/billings/${inv.id}`, { method:'PATCH', body:{ action:'approve' } })
  await loadInvoices()
}

const statusBadge = (s: string) => ({
  draft:'badge-neutral', pending:'badge-warning', paid:'badge-success',
  partial:'badge-info',  cancelled:'badge-error',
}[s] || 'badge-neutral')

const filteredInvoices = computed(() => invoices.value.filter(inv =>
  activeTab.value === 'invoices' ? true :
  activeTab.value === 'pending'  ? ['pending','partial'].includes(inv.status) :
  activeTab.value === 'approve'  ? inv.status === 'draft' : true
))

const columns = [
  { key:'invoice_number',   label:'Invoice #',     thClass:'w-36' },
  { key:'patient_name',     label:'Patient',       thClass:'min-w-[140px]' },
  { key:'created_at',       label:'Date',          thClass:'w-28' },
  { key:'subtotal_amount',  label:'Amount (MWK)',  thClass:'w-32' },
  { key:'insurance_amount', label:'Insurance',     thClass:'w-28' },
  { key:'patient_amount',   label:'Patient Pays',  thClass:'w-28' },
  { key:'status',           label:'Status',        thClass:'w-28', truncate:false },
  { key:'actions',          label:'',              thClass:'w-20', truncate:false },
]

const payMethods = ['cash','momo','bank_transfer','insurance','cheque']

// MASM insurance schemes (static — these come from /insurances in a full impl)
const insuranceSchemes = [
  { id:1, name:'MASM VIP',              code:'MASMVIP'  },
  { id:2, name:'MASM Executive',        code:'MASMEXEC' },
  { id:3, name:'MASM Econoplan',        code:'MASMECON' },
  { id:4, name:'MASM Platinum Diamond', code:'MASMPLAT' },
  { id:5, name:'Self Pay',              code:'SELFPAY'  },
]
</script>

<template>
  <AccessDenied v-if="denied" />
  <div class="space-y-6 animate-fade-in">

    <div class="page-header">
      <div>
        <h1 class="page-title">Billing</h1>
        <p class="page-subtitle">Invoice management · Payment recording · SAGE integration</p>
      </div>
      <button v-if="can('billing_create')" class="btn-primary" @click="showModal=true">
        <font-awesome-icon :icon="['fas','plus']" /> New Invoice
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <StatCard label="Today's Revenue"         value="2400000" format="currency" :icon="['fas','coins']"         icon-bg="bg-green-50"        icon-color="text-green-600" />
      <StatCard label="Outstanding"             value="850000"  format="currency" :icon="['fas','file-invoice']"  icon-bg="bg-error-container" icon-color="text-error"     />
      <StatCard label="Insurance Pending"       :value="12"                       :icon="['fas','shield-halved']" icon-bg="bg-amber-50"        icon-color="text-amber-600" />
      <StatCard label="Invoices This Month"     :value="184"                      :icon="['fas','receipt']"       icon-bg="bg-primary-fixed"   icon-color="text-primary"   />
    </div>

    <div class="tab-bar">
      <button class="tab-item" :class="{ active: activeTab==='invoices' }" @click="activeTab='invoices'">All Invoices</button>
      <button class="tab-item" :class="{ active: activeTab==='pending' }"  @click="activeTab='pending'">Pending Payment</button>
      <button v-if="can('billing_approve')" class="tab-item" :class="{ active: activeTab==='approve' }" @click="activeTab='approve'">Awaiting Approval</button>
    </div>

    <DataTable
      :columns="columns"
      :rows="filteredInvoices as unknown as Record<string,unknown>[]"
      :loading="loading"
      searchable
      search-placeholder="Search invoice, patient…"
      :search-keys="['invoice_number','patient_name']"
      empty-text="No invoices found."
    >
      <template #cell-invoice_number="{ value }">
        <span class="font-mono text-xs font-bold text-primary">{{ value }}</span>
      </template>
      <template #cell-subtotal_amount="{ value }">
        <span class="font-semibold">MWK {{ Number(value).toLocaleString() }}</span>
      </template>
      <template #cell-insurance_amount="{ value }">
        <span>MWK {{ Number(value).toLocaleString() }}</span>
      </template>
      <template #cell-patient_amount="{ value }">
        <span class="font-semibold text-primary">MWK {{ Number(value).toLocaleString() }}</span>
      </template>
      <template #cell-status="{ value }">
        <span class="badge" :class="statusBadge(value as string)">{{ value }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <button
            v-if="can('billing_create') && ['pending','partial'].includes((row as unknown as Invoice).status)"
            class="p-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            title="Record Payment" @click="openPay(row as unknown as Invoice)">
            <font-awesome-icon :icon="['fas','money-bill-wave']" class="text-sm" />
          </button>
          <button
            v-if="can('billing_approve') && (row as unknown as Invoice).status === 'draft'"
            class="p-1.5 rounded bg-primary-fixed text-primary hover:bg-primary/10 transition-colors"
            title="Approve Invoice" @click="approveInvoice(row as unknown as Invoice)">
            <font-awesome-icon :icon="['fas','circle-check']" class="text-sm" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- ── New Invoice Modal ─────────────────────────────────────────── -->
    <Modal v-model="showModal" title="Create Invoice" size="xl">
      <form @submit.prevent="saveInvoice" class="space-y-4">
        <AppAlert v-if="formError" type="error" :title="formError" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="input-label">Patient ID / MRN <span class="text-error">*</span></label>
            <input v-model="form.patient_id" class="input-field" placeholder="Enter patient ID or MRN…" />
          </div>
          <div>
            <label class="input-label">Insurance Scheme</label>
            <select v-model="form.insurance_id" class="input-field">
              <option value="">Self Pay (no insurance)</option>
              <option v-for="ins in insuranceSchemes" :key="ins.id" :value="ins.id">
                {{ ins.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Line items with encounter type -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="input-label mb-0">Line Items</label>
            <button type="button" class="btn-secondary !py-1 !px-3 text-xs" @click="addLine">
              <font-awesome-icon :icon="['fas','plus']" /> Add Line
            </button>
          </div>

          <div class="space-y-2">
            <div v-for="(line, i) in form.line_items" :key="i"
              class="grid gap-2 items-start"
              style="grid-template-columns: 1fr 1fr auto auto auto">
              <!-- Encounter type -->
              <div class="min-w-[140px]">
                <label v-if="i===0" class="input-label">Encounter Type</label>
                <select v-model="line.encounter_type_id" class="input-field"
                  @change="onEncTypeChange(line)">
                  <option value="">Select type…</option>
                  <option v-for="et in billableTypes" :key="et.id" :value="et.id">
                    {{ et.name }}
                  </option>
                </select>
              </div>
              <!-- Description -->
              <div class="min-w-[120px]">
                <label v-if="i===0" class="input-label">Description</label>
                <input v-model="line.description" class="input-field" placeholder="Service description" />
              </div>
              <!-- Qty -->
              <div class="w-16">
                <label v-if="i===0" class="input-label">Qty</label>
                <input v-model.number="line.quantity" type="number" min="1" class="input-field text-center" />
              </div>
              <!-- Unit cost -->
              <div class="w-28">
                <label v-if="i===0" class="input-label">Unit Cost (MWK)</label>
                <input v-model.number="line.unit_cost" type="number" min="0" class="input-field" placeholder="0" />
              </div>
              <!-- Remove -->
              <div :class="i===0 ? 'pt-6' : ''">
                <button type="button" :disabled="form.line_items.length === 1"
                  class="text-error hover:bg-error-container p-2 rounded disabled:opacity-30"
                  @click="removeLine(i)">
                  <font-awesome-icon :icon="['fas','trash']" class="text-sm" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-2 pt-2 border-t border-outline-variant/30">
            <p class="text-sm sm:text-base font-bold text-on-surface">
              Total: <span class="text-primary">MWK {{ totalAmount.toLocaleString() }}</span>
            </p>
          </div>
        </div>

        <div>
          <label class="input-label">Notes</label>
          <textarea v-model="form.notes" rows="2" class="input-field resize-none" placeholder="Optional notes…" />
        </div>
      </form>

      <template #footer>
        <button class="btn-secondary" @click="showModal=false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="saveInvoice">
          <font-awesome-icon v-if="saving" :icon="['fas','spinner']" spin />
          <font-awesome-icon v-else :icon="['fas','floppy-disk']" />
          {{ saving ? 'Saving…' : 'Create Invoice' }}
        </button>
      </template>
    </Modal>

    <!-- ── Record Payment Modal ──────────────────────────────────────── -->
    <Modal v-model="payModal" title="Record Payment" size="sm">
      <div v-if="activeInvoice" class="space-y-4">
        <AppAlert v-if="payError" type="error" :title="payError" />
        <div class="bg-surface-low rounded-md p-3 text-sm sm:text-base">
          <p class="font-semibold truncate">{{ activeInvoice.invoice_number }}</p>
          <p class="text-on-surface-variant">
            Outstanding: <strong class="text-on-surface">MWK {{ Number(activeInvoice.outstanding_amount).toLocaleString() }}</strong>
          </p>
        </div>
        <div>
          <label class="input-label">Amount (MWK) <span class="text-error">*</span></label>
          <input v-model.number="payForm.amount" type="number" min="1" class="input-field" />
        </div>
        <div>
          <label class="input-label">Payment Method</label>
          <select v-model="payForm.method" class="input-field">
            <option v-for="m in payMethods" :key="m" :value="m" class="capitalize">
              {{ m.replace('_',' ') }}
            </option>
          </select>
        </div>
        <div>
          <label class="input-label">Reference / Receipt #</label>
          <input v-model="payForm.reference" class="input-field" placeholder="Optional reference" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="payModal=false">Cancel</button>
        <button class="btn-primary" :disabled="paying" @click="recordPayment">
          <font-awesome-icon v-if="paying" :icon="['fas','spinner']" spin />
          <font-awesome-icon v-else :icon="['fas','money-bill-wave']" />
          {{ paying ? 'Saving…' : 'Record Payment' }}
        </button>
      </template>
    </Modal>

  </div>
</template>