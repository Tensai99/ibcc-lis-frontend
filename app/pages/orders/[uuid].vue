<!-- app/pages/orders/[uuid].vue -->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Breadcrumb (pill) -->
    <div class="mb-1">
      <nav class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs shadow-sm">
        <NuxtLink to="/orders"
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
          <font-awesome-icon :icon="['fas', 'vials']" class="text-[11px]" />Laboratory Orders
        </NuxtLink>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
        <span v-if="order" class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
          <font-awesome-icon :icon="['fas', 'flask-vial']" class="text-[11px] text-primary" />{{ order.accession_number }}
        </span>
      </nav>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="island flex flex-col items-center justify-center gap-3 py-20">
      <font-awesome-icon :icon="['fas','circle-notch']" class="text-3xl text-primary animate-spin" />
      <p class="text-sm text-on-surface-variant">Loading order…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="island flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div class="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
        <font-awesome-icon :icon="['fas','triangle-exclamation']" class="text-2xl text-error" />
      </div>
      <p class="text-sm text-on-surface-variant max-w-md">{{ error }}</p>
      <div class="flex gap-2">
        <NuxtLink to="/orders" class="btn-secondary">
          <font-awesome-icon :icon="['fas','arrow-left']" /><span>Back to orders</span>
        </NuxtLink>
        <button type="button" class="btn-secondary" @click="load"><font-awesome-icon :icon="['fas','rotate-right']" /><span>Retry</span></button>
      </div>
    </div>

    <!-- Order -->
    <template v-else-if="order">

      <!-- Header card -->
      <div class="rounded-xl p-4 sm:p-6 bg-primary-gradient text-white shadow-island">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs sm:text-sm text-white/70 font-semibold uppercase tracking-wide">Accession</p>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-bold break-words">{{ order.accession_number }}</h1>
            <p class="text-sm text-white/80 mt-1 break-words">
              {{ order.patient_name }}
              <span v-if="order.age != null || order.gender" class="text-white/60">
                · {{ [order.age != null ? `${order.age}y` : null, order.gender].filter(Boolean).join(' · ') }}
              </span>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span :class="statusClass(order.status)">{{ titleCase(order.status) }}</span>
            <span :class="urgencyClass(order.urgency)">{{ order.urgency }}</span>

            <!-- Advanced options dropdown (holds all workflow actions) -->
            <div class="relative">
              <button type="button" class="hdr-btn" @click="advOpen = !advOpen">
                <font-awesome-icon :icon="['fas','sliders']" />
                <span>Advanced options</span>
                <font-awesome-icon :icon="['fas','chevron-down']"
                  class="text-[0.65rem] transition-transform" :class="advOpen ? 'rotate-180' : ''" />
              </button>
              <div v-if="advOpen" class="fixed inset-0 z-20" @click="advOpen = false" />
              <div v-if="advOpen"
                class="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-lowest shadow-island border border-outline-variant/40 py-1 z-30">
                <button type="button" class="adv-item" @click="openUpdate(); advOpen = false">
                  <font-awesome-icon :icon="['fas','pen-to-square']" class="text-primary" /><span>Update order</span>
                </button>
                <button type="button" class="adv-item" @click="openCollect(); advOpen = false">
                  <font-awesome-icon :icon="['fas','droplet']" class="text-ribbon-teal" /><span>Collect specimen</span>
                </button>
                <button type="button" class="adv-item" @click="receiveOpen = true; advOpen = false">
                  <font-awesome-icon :icon="['fas','inbox']" class="text-ribbon-amber" /><span>Receive order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button type="button" class="tab-item" :class="{ active: tab === 'general' }" @click="tab = 'general'">
          General
        </button>
        <button type="button" class="tab-item" :class="{ active: tab === 'tests' }" @click="tab = 'tests'">
          Tests <span class="text-on-surface-variant font-normal">({{ order.tests?.length || 0 }})</span>
        </button>
      </div>

      <!-- ══ General tab ══ -->
      <div v-show="tab === 'general'" class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="island lg:col-span-2">
            <h3 class="section-heading">Order details</h3>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Detail label="Department" :value="order.department?.name" />
              <Detail label="Section" :value="order.department?.section" />
              <Detail label="Specimen" :value="order.specimen" />
              <Detail label="Site" :value="order.site" />
              <Detail label="Scheduled for" :value="fmtDate(order.scheduled_for)" />
              <Detail label="Disposition" :value="order.disposition" />
              <Detail label="Collection time" :value="fmtDate(order.collection_time)" />
              <Detail label="Reception time" :value="fmtDate(order.reception_time)" />
              <Detail label="Referring facility" :value="order.referring_facility" />
              <Detail label="Requested by" :value="order.requested_by" />
              <Detail label="Requested by occupation" :value="order.requested_by_occupation" />
              <Detail label="Received by" :value="order.received_by" />
            </dl>

            <template v-if="clinicalEntries.length">
              <h4 class="sub-label mt-4">Clinical details</h4>
              <div class="flex flex-wrap gap-2">
                <span v-for="[k, v] in clinicalEntries" :key="k" class="ribbon-chip-blue">
                  {{ titleCase(k) }}: {{ v }}
                </span>
              </div>
            </template>
          </div>

          <!-- Encounters / workflow -->
          <div class="island">
            <h3 class="section-heading">Workflow</h3>
            <div v-if="order.encounters?.length" class="space-y-3">
              <div v-for="e in order.encounters" :key="e.id"
                class="rounded-xl border-l-4 bg-surface-low/60 px-3 py-2.5" :class="tatAccent(e.tat_status)">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-semibold text-sm">{{ titleCase(e.type) }}</span>
                  <span :class="tatChip(e.tat_status)">{{ titleCase(e.tat_status || e.status) }}</span>
                </div>
                <p class="text-xs text-on-surface-variant mt-1">
                  <font-awesome-icon :icon="['fas','clock']" class="mr-1 opacity-70" />
                  Due {{ fmtDate(e.due_at) }}
                </p>
                <p v-if="e.performed_by" class="text-xs text-on-surface-variant">By {{ e.performed_by }}</p>
              </div>
            </div>
            <p v-else class="empty-line">No workflow stations yet.</p>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="order.notes?.length" class="island">
          <h3 class="section-heading">Notes</h3>
          <ul class="space-y-2">
            <li v-for="(n, i) in order.notes" :key="i" class="text-sm text-on-surface flex gap-2">
              <font-awesome-icon :icon="['fas','notes-medical']" class="text-ribbon-purple mt-0.5" />
              <span>{{ typeof n === 'string' ? n : (n.body || n.note || JSON.stringify(n)) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ══ Tests tab ══ -->
      <div v-show="tab === 'tests'">
        <div class="bg-surface-lowest rounded-xl shadow-island overflow-hidden">
          <div class="overflow-x-auto">
            <table class="his-table">
              <thead>
                <tr><th>Accession</th><th>Test</th><th>Code</th><th>Sample</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-for="t in order.tests" :key="t.uuid">
                  <!-- ribbon variant: status-coloured left accent on the row -->
                  <td class="font-semibold text-primary whitespace-nowrap border-l-4" :class="rowAccent(t.status)">
                    {{ t.accession_number }}
                  </td>
                  <td>{{ t.test_name }}</td>
                  <td class="text-on-surface-variant">{{ t.test_code }}</td>
                  <td>{{ t.sample_name || '—' }}</td>
                  <td><span :class="statusClass(t.status)">{{ titleCase(t.status) }}</span></td>
                </tr>
                <tr v-if="!order.tests?.length">
                  <td colspan="5" class="text-center text-on-surface-variant py-6">No tests on this order.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ Update modal ═══ -->
    <Modal v-model="updateOpen" title="Update order" :subtitle="order?.accession_number" class="w-[760px] max-w-[95vw]">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">Scheduled for</label>
          <input v-model="uForm.scheduled_for" type="datetime-local" class="input-field" />
        </div>
        <div>
          <label class="input-label">Specimen site ID</label>
          <input v-model="uForm.laboratory_specimen_site_id" type="number" class="input-field" placeholder="laboratory_specimen_site_id" />
        </div>
        <div>
          <label class="input-label">Requested by</label>
          <input v-model="uForm.requested_by_name" type="text" class="input-field" />
        </div>
        <div>
          <label class="input-label">Requested by occupation</label>
          <input v-model="uForm.requested_by_occupation" type="text" class="input-field" />
        </div>
        <div>
          <label class="input-label">Referring facility</label>
          <input v-model="uForm.referring_facility" type="text" class="input-field" />
        </div>
        <div>
          <label class="input-label">Referring facility type</label>
          <input v-model="uForm.referring_facility_type" type="text" class="input-field" placeholder="e.g. hospital, clinic" />
        </div>
        <div>
          <label class="input-label">Urgency</label>
          <select v-model="uForm.urgency" class="input-field">
            <option value="">—</option>
            <option v-for="u in URGENCY_OPTS" :key="u" :value="u">{{ u }}</option>
          </select>
        </div>
        <div>
          <label class="input-label">Disposition</label>
          <select v-model="uForm.disposition" class="input-field">
            <option value="">—</option>
            <option v-for="d in DISPOSITION_OPTS" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="input-label">Clinical details</label>
          <textarea v-model="uForm.clinical_details" rows="3" class="input-field" placeholder="Relevant clinical history / indication…" />
          <p class="text-xs text-on-surface-variant mt-1">Sent as <code>laboratory_order[clinical_details]</code> ({{ '{' }} notes: … {{ '}' }}). Adjust the shape if your API expects different keys.</p>
        </div>
      </div>
      <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
      <template #footer>
        <button type="button" class="btn-secondary" @click="updateOpen = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="submitUpdate">
          <font-awesome-icon v-if="saving" :icon="['fas','circle-notch']" class="animate-spin" />
          <span>Save changes</span>
        </button>
      </template>
    </Modal>

    <!-- ═══ Collect modal ═══ -->
    <Modal v-model="collectOpen" title="Collect specimen" :subtitle="order?.accession_number" class="w-[520px] max-w-[95vw]">
      <div class="space-y-4">
        <div>
          <label class="input-label">Collected at</label>
          <input v-model="cForm.collected_at" type="datetime-local" class="input-field" />
        </div>
        <div>
          <label class="input-label">Specimen site ID</label>
          <input v-model="cForm.laboratory_specimen_site_id" type="number" class="input-field" placeholder="laboratory_specimen_site_id" />
        </div>
      </div>
      <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
      <template #footer>
        <button type="button" class="btn-secondary" @click="collectOpen = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="submitCollect">
          <font-awesome-icon v-if="saving" :icon="['fas','circle-notch']" class="animate-spin" />
          <span>Mark collected</span>
        </button>
      </template>
    </Modal>

    <!-- ═══ Receive modal ═══ -->
    <Modal v-model="receiveOpen" title="Receive order" :subtitle="order?.accession_number" class="w-[460px] max-w-[95vw]">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
          <font-awesome-icon :icon="['fas','inbox']" class="text-primary" />
        </div>
        <p class="text-sm text-on-surface">
          Mark <span class="font-semibold">{{ order?.accession_number }}</span> as received at the laboratory? This stamps the reception step.
        </p>
      </div>
      <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
      <template #footer>
        <button type="button" class="btn-secondary" @click="receiveOpen = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="submitReceive">
          <font-awesome-icon v-if="saving" :icon="['fas','circle-notch']" class="animate-spin" />
          <span>Confirm receive</span>
        </button>
      </template>
    </Modal>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show"
          class="fixed bottom-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-island text-sm font-semibold flex items-center gap-2"
          :class="toast.ok ? 'bg-secondary-fixed text-secondary-on-fixed' : 'bg-error-container text-error-on-container'">
          <font-awesome-icon :icon="['fas', toast.ok ? 'check' : 'triangle-exclamation']" />
          <span>{{ toast.msg }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, onMounted } from 'vue'
import type { LabOrderDetail } from '~/composables/useLaboratory'

const route = useRoute()
const { showOrder, updateOrder, collectOrder, receiveOrder } = useLaboratory()

const uuid = computed(() => (route.params.uuid as string) || '')

const order   = ref<LabOrderDetail | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

// active body tab + header dropdown
const tab = ref<'general' | 'tests'>('general')
const advOpen = ref(false)

const load = async () => {
  if (!uuid.value) { error.value = 'No order selected.'; loading.value = false; return }
  loading.value = true
  error.value = null
  try {
    order.value = await showOrder(uuid.value)
    if (!order.value) error.value = 'Order not found.'
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load the order. Please try again.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── options ──────────────────────────────────────────────────────────────────
const URGENCY_OPTS = ['Low', 'Medium', 'High', 'STAT']
const DISPOSITION_OPTS = ['Dispose', 'Return', 'Retain'] // adjust to backend enum

// ── clinical details (object → chip entries) ─────────────────────────────────
const clinicalEntries = computed(() =>
  Object.entries(order.value?.clinical_details ?? {}).filter(([, v]) => v != null && v !== ''),
)

// ── datetime helpers ─────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toIso = (local: string) => (local ? new Date(local).toISOString() : undefined)

// ── modal state ──────────────────────────────────────────────────────────────
const updateOpen  = ref(false)
const collectOpen = ref(false)
const receiveOpen = ref(false)
const saving      = ref(false)
const formError   = ref<string | null>(null)

const uForm = reactive<Record<string, any>>({
  scheduled_for: '', laboratory_specimen_site_id: '',
  requested_by_name: '', requested_by_occupation: '',
  referring_facility: '', referring_facility_type: '',
  urgency: '', disposition: '', clinical_details: '',
})
const cForm = reactive<Record<string, any>>({ collected_at: '', laboratory_specimen_site_id: '' })

const openUpdate = () => {
  formError.value = null
  const o = order.value
  if (o) {
    uForm.scheduled_for = toLocalInput(o.scheduled_for)
    uForm.requested_by_name = o.requested_by ?? ''
    uForm.requested_by_occupation = o.requested_by_occupation ?? ''
    uForm.referring_facility = o.referring_facility ?? ''
    uForm.referring_facility_type = ''
    uForm.urgency = o.urgency ?? ''
    uForm.disposition = o.disposition ?? ''
    uForm.laboratory_specimen_site_id = ''
    uForm.clinical_details = o.clinical_details?.notes ?? ''
  }
  updateOpen.value = true
}
const openCollect = () => {
  formError.value = null
  cForm.collected_at = toLocalInput(new Date().toISOString())
  cForm.laboratory_specimen_site_id = ''
  collectOpen.value = true
}

// ── submit handlers ──────────────────────────────────────────────────────────
const run = async (fn: () => Promise<any>, ok: string, close: () => void) => {
  saving.value = true
  formError.value = null
  try {
    order.value = await fn()
    close()
    flash(true, ok)
  } catch (e: any) {
    formError.value = e?.message ?? 'Something went wrong. Please try again.'
  } finally {
    saving.value = false
  }
}

const submitUpdate = () => run(() => updateOrder(uuid.value, {
  scheduled_for: toIso(uForm.scheduled_for),
  laboratory_specimen_site_id: uForm.laboratory_specimen_site_id || undefined,
  requested_by_name: uForm.requested_by_name || undefined,
  requested_by_occupation: uForm.requested_by_occupation || undefined,
  referring_facility: uForm.referring_facility || undefined,
  referring_facility_type: uForm.referring_facility_type || undefined,
  urgency: uForm.urgency || undefined,
  disposition: uForm.disposition || undefined,
  // object → JSON-stringified by toForm; reshape if the API expects other keys
  clinical_details: uForm.clinical_details ? { notes: uForm.clinical_details } : undefined,
}), 'Order updated.', () => (updateOpen.value = false))

const submitCollect = () => run(() => collectOrder(uuid.value, {
  collected_at: toIso(cForm.collected_at),
  laboratory_specimen_site_id: cForm.laboratory_specimen_site_id || undefined,
}), 'Specimen collected.', () => (collectOpen.value = false))

const submitReceive = () => run(() => receiveOrder(uuid.value), 'Order received.', () => (receiveOpen.value = false))

// ── toast ────────────────────────────────────────────────────────────────────
const toast = reactive({ show: false, ok: true, msg: '' })
let toastTimer: any
const flash = (ok: boolean, msg: string) => {
  toast.ok = ok; toast.msg = msg; toast.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.show = false), 3500)
}

// ── formatting ───────────────────────────────────────────────────────────────
const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const titleCase = (s: string | null | undefined) =>
  (s || '—').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const statusClass = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show')) return 'ribbon-chip-red'
  if (k.includes('complete') || k.includes('received') || k.includes('verified')) return 'ribbon-chip-teal'
  if (k.includes('progress') || k.includes('collected')) return 'ribbon-chip-amber'
  return 'ribbon-chip-blue'
}
const urgencyClass = (u: string) => {
  const k = (u || '').toLowerCase()
  if (k === 'stat' || k === 'high') return 'ribbon-chip-red'
  if (k === 'medium') return 'ribbon-chip-amber'
  return 'ribbon-chip-teal'
}
// ribbon left-accent for table rows, keyed by status
const rowAccent = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show')) return 'border-ribbon-red'
  if (k.includes('complete') || k.includes('received') || k.includes('verified')) return 'border-ribbon-teal'
  if (k.includes('progress') || k.includes('collected')) return 'border-ribbon-amber'
  return 'border-ribbon-blue'
}
const tatChip = (t: string | null) => {
  const k = (t || '').toLowerCase()
  if (k === 'breached') return 'ribbon-chip-red'
  if (k === 'at_risk') return 'ribbon-chip-amber'
  return 'ribbon-chip-teal'
}
const tatAccent = (t: string | null) => {
  const k = (t || '').toLowerCase()
  if (k === 'breached') return 'border-ribbon-red'
  if (k === 'at_risk') return 'border-ribbon-amber'
  return 'border-ribbon-teal'
}

// ── tiny inline detail renderer (label + value) ──────────────────────────────
const Detail = (props: { label: string; value: string | number | null | undefined }) =>
  h('div', [
    h('dt', { class: 'text-xs font-semibold uppercase tracking-wide text-on-surface-variant' }, props.label),
    h('dd', { class: 'text-sm text-on-surface mt-0.5 break-words' },
      props.value === null || props.value === undefined || props.value === '' ? '—' : String(props.value)),
  ])
</script>

<style scoped>
.sub-label { @apply text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2; }
.empty-line { @apply text-sm text-on-surface-variant py-6 text-center; }

/* translucent header action button on the gradient card */
.hdr-btn {
  @apply inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold
         text-white bg-white/15 hover:bg-white/25 transition-colors;
}
/* advanced-options dropdown items (white menu) */
.adv-item {
  @apply w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors;
}

/* toast transition */
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
</style>