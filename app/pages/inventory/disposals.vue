<!-- app/pages/inventory/disposals.vue -->
<script setup lang="ts">
const { denied } = usePageGuard(['pharmacy_dispensing', 'admin_system'])
const { can } = usePermission()
const { request, loading } = useApi()

const disposals  = ref<Record<string, unknown>[]>([])
const showModal  = ref(false)
const activeTab  = ref('pending')

// Demo disposal records
onMounted(() => {
  disposals.value = [
    {
      id:1, item_name:'Methotrexate 50mg Inj', batch:'BATCH-2025-006',
      quantity:60, reason:'Expired', disposal_date:'2026-05-14',
      disposed_by:'Patrick Mvula', authorised_by:null, status:'pending_approval'
    },
    {
      id:2, item_name:'Cyclophosphamide 200mg', batch:'BATCH-2024-011',
      quantity:12, reason:'Damaged packaging', disposal_date:'2026-05-10',
      disposed_by:'Mary Chirwa', authorised_by:'Dr James Banda', status:'approved'
    },
    {
      id:3, item_name:'Ondansetron 8mg Tab', batch:'BATCH-2025-003',
      quantity:200, reason:'Near expiry — pre-emptive disposal', disposal_date:'2026-05-08',
      disposed_by:'Patrick Mvula', authorised_by:'Dr James Banda', status:'approved'
    },
  ]
})

// ── Disposal form ──────────────────────────────────────────────────────────
const disposalForm = reactive({
  item_id:      '',
  batch:        '',
  quantity:     0,
  reason:       '',
  custom_reason:'',
  disposal_date: new Date().toISOString().split('T')[0],
  notes:        '',
})
const saving   = ref(false)
const formError= ref('')

const reasonOptions = [
  'Expired',
  'Damaged packaging',
  'Near expiry — pre-emptive disposal',
  'Contamination',
  'Cold chain failure',
  'Patient safety recall',
  'Other',
]

const submitDisposal = async () => {
  formError.value = ''
  if (!disposalForm.item_id || disposalForm.quantity <= 0 || !disposalForm.reason) {
    formError.value = 'Fill in item, quantity, and reason.'
    return
  }
  saving.value = true
  try {
    const payload = {
      ...disposalForm,
      reason: disposalForm.reason === 'Other' ? disposalForm.custom_reason : disposalForm.reason,
    }
    await request('/inventory/disposals', { method:'POST', body: payload })
    showModal.value = false
    // Add optimistic row
    disposals.value.unshift({
      id: Date.now(), item_name: `Item #${disposalForm.item_id}`,
      batch: disposalForm.batch, quantity: disposalForm.quantity,
      reason: payload.reason, disposal_date: disposalForm.disposal_date,
      disposed_by: 'You', authorised_by: null, status: 'pending_approval',
    })
  } catch (e: unknown) {
    formError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

const approveDisposal = async (disposal: Record<string, unknown>) => {
  await request(`/inventory/disposals/${disposal.id}`, { method:'PATCH', body:{ action:'approve' } })
  const idx = disposals.value.findIndex(d => d.id === disposal.id)
  if (idx !== -1) disposals.value[idx] = { ...disposal, status:'approved', authorised_by:'You' }
}

const filteredDisposals = computed(() =>
  disposals.value.filter(d =>
    activeTab.value === 'all'              ? true :
    activeTab.value === 'pending'          ? d.status === 'pending_approval' :
    activeTab.value === 'approved'         ? d.status === 'approved' : true
  )
)

const statusBadge = (s: unknown) => ({
  pending_approval: 'badge-warning',
  approved:         'badge-success',
  rejected:         'badge-error',
}[s as string] || 'badge-neutral')

const columns = [
  { key:'item_name',     label:'Item',            thClass:'min-w-[160px]' },
  { key:'batch',         label:'Batch',           thClass:'w-32' },
  { key:'quantity',      label:'Qty',             thClass:'w-16' },
  { key:'reason',        label:'Reason',          thClass:'min-w-[160px]' },
  { key:'disposal_date', label:'Date',            thClass:'w-28' },
  { key:'disposed_by',   label:'Recorded By',     thClass:'w-32' },
  { key:'authorised_by', label:'Authorised By',   thClass:'w-32' },
  { key:'status',        label:'Status',          thClass:'w-28', truncate:false },
  { key:'actions',       label:'Actions',         thClass:'w-20', truncate:false },
]
</script>

<template>
  <AccessDenied v-if="denied" />
  <div class="space-y-6 animate-fade-in">

    <div class="page-header">
      <div>
        <h1 class="page-title">Disposal Workflow</h1>
        <p class="page-subtitle">Wastage recording · Expiry disposal · Sign-off authorisation</p>
      </div>
      <button class="btn-primary" @click="showModal=true">
        <font-awesome-icon :icon="['fas','trash-can-arrow-up']" />
        Record Disposal
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <StatCard label="Pending Approval" :value="disposals.filter(d=>d.status==='pending_approval').length" icon="['fas','hourglass-half']" icon-bg="bg-amber-50" icon-color="text-amber-600" />
      <StatCard label="Approved This Month" :value="disposals.filter(d=>d.status==='approved').length" icon="['fas','circle-check']" icon-bg="bg-green-50" icon-color="text-green-600" />
      <StatCard label="Total Items Disposed" :value="disposals.reduce((s,d)=>s+(d.quantity as number),0)" icon="['fas','trash-can']" icon-bg="bg-error-container" icon-color="text-error" />
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button class="tab-item" :class="{ active: activeTab==='pending' }"  @click="activeTab='pending'">Pending Approval</button>
      <button class="tab-item" :class="{ active: activeTab==='approved' }" @click="activeTab='approved'">Approved</button>
      <button class="tab-item" :class="{ active: activeTab==='all' }"      @click="activeTab='all'">All Records</button>
    </div>

    <DataTable
      :columns="columns"
      :rows="filteredDisposals"
      :loading="loading"
      searchable
      search-placeholder="Search by item, batch, reason…"
      :search-keys="['item_name','batch','reason']"
      empty-text="No disposal records found."
    >
      <template #cell-reason="{ value }">
        <span class="break-words max-w-[200px] block text-xs sm:text-sm">{{ value }}</span>
      </template>

      <template #cell-authorised_by="{ value }">
        <span v-if="value" class="text-sm">{{ value }}</span>
        <span v-else class="text-outline text-xs">Pending</span>
      </template>

      <template #cell-status="{ value }">
        <span class="badge" :class="statusBadge(value)">
          {{ String(value).replace('_',' ') }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <button
          v-if="can('admin_system') && row.status === 'pending_approval'"
          class="p-1.5 rounded bg-primary-fixed text-primary hover:bg-primary/10 transition-colors text-sm"
          title="Approve disposal"
          @click="approveDisposal(row)"
        >
          <font-awesome-icon :icon="['fas','circle-check']" />
        </button>
      </template>
    </DataTable>

    <!-- Disposal Modal -->
    <Modal v-model="showModal" title="Record Disposal" size="md">
      <form @submit.prevent="submitDisposal" class="space-y-4">
        <AppAlert v-if="formError" type="error" :title="formError" />

        <div class="alert-warning text-xs sm:text-sm">
          <font-awesome-icon :icon="['fas','triangle-exclamation']" class="flex-shrink-0" />
          All disposal records are permanent and subject to authorisation review.
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="input-label">Stock Item <span class="text-error">*</span></label>
            <input v-model="disposalForm.item_id" class="input-field" placeholder="Item name or ID…" />
          </div>
          <div>
            <label class="input-label">Batch Number</label>
            <input v-model="disposalForm.batch" class="input-field" placeholder="BATCH-YYYY-XXX" />
          </div>
          <div>
            <label class="input-label">Quantity <span class="text-error">*</span></label>
            <input v-model.number="disposalForm.quantity" type="number" min="1" class="input-field" />
          </div>
          <div>
            <label class="input-label">Disposal Date</label>
            <input v-model="disposalForm.disposal_date" type="date" class="input-field" />
          </div>
        </div>

        <div>
          <label class="input-label">Disposal Reason <span class="text-error">*</span></label>
          <select v-model="disposalForm.reason" class="input-field">
            <option value="">Select reason…</option>
            <option v-for="r in reasonOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div v-if="disposalForm.reason === 'Other'">
          <label class="input-label">Specify Reason</label>
          <input v-model="disposalForm.custom_reason" class="input-field" placeholder="Describe reason…" />
        </div>

        <div>
          <label class="input-label">Notes / Additional Details</label>
          <textarea v-model="disposalForm.notes" rows="2" class="input-field resize-none" />
        </div>
      </form>

      <template #footer>
        <button class="btn-secondary" @click="showModal=false">Cancel</button>
        <button class="btn-danger" :disabled="saving" @click="submitDisposal">
          <font-awesome-icon v-if="saving" :icon="['fas','spinner']" spin />
          <font-awesome-icon v-else :icon="['fas','trash-can']" />
          {{ saving ? 'Recording…' : 'Record Disposal' }}
        </button>
      </template>
    </Modal>

  </div>
</template>
