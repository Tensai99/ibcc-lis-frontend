<!-- app/pages/admin/settings/users.vue -->
<!--
  User Settings — staff accounts, their roles and departments, plus a read-only
  view of the permission matrix each role grants.

  ⚠️ DATA SHAPE:
     • User (test_users.rb): email_address, username, first_name, last_name,
       role_slug, department code, professional_license?, specialty?,
       designation?, active.
     • Role (roles_permissions.rb): 19 roles by slug.
     • Permission: process_key + actions {read,write,delete,approve}. The
       matrix below mirrors the grants in roles_permissions.rb.
  ⚠️ DUMMY DATA — replace USERS / ROLE_PERMS with
     useSettingsApi('admin/users').list() and a roles+permissions endpoint.
-->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-[98%] mx-auto">
    <SettingsHeader
      title="User Settings"
      subtitle="Staff accounts, role assignment and permission review"
      icon="user-gear"
      :crumbs="[{ label:'Settings', to:'/admin/settings' }, { label:'Users' }]"
    >
      <template #actions>
        <div class="relative">
          <font-awesome-icon :icon="['fas','magnifying-glass']"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs" />
          <input v-model="search" placeholder="Search users…"
            class="pl-8 pr-3 py-2 rounded-full text-sm bg-surface-bright border border-outline-variant/50
                   focus:border-primary/50 focus:outline-none w-44 sm:w-56 transition-colors" />
        </div>
        <button v-if="canWrite" class="btn-primary" @click="openCreate">
          <font-awesome-icon :icon="['fas','plus']" class="text-xs" />
          <span class="hidden sm:inline">Add user</span>
        </button>
      </template>
    </SettingsHeader>

    <div class="panel divide-y divide-outline-variant/20">
      <div v-for="u in visibleUsers" :key="u.username"
           class="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
        <!-- Avatar -->
        <div class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
             style="background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%);">
          {{ initials(u) }}
        </div>

        <!-- Identity -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-bold text-on-surface text-sm truncate">{{ u.first_name }} {{ u.last_name }}</h3>
            <span v-if="u.designation" class="text-[0.7rem] text-on-surface-variant">· {{ u.designation }}</span>
            <span v-if="!u.active" class="badge-muted">Inactive</span>
          </div>
          <div class="flex items-center gap-3 mt-0.5 text-[0.7rem] text-on-surface-variant">
            <span><font-awesome-icon :icon="['fas','at']" class="mr-0.5" />{{ u.email_address }}</span>
            <span class="hidden sm:inline"><font-awesome-icon :icon="['fas','id-badge']" class="mr-0.5" />{{ u.username }}</span>
          </div>
        </div>

        <!-- Role + dept -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="badge-role" @click="openPermissions(u.role_slug)" :title="`View ${roleName(u.role_slug)} permissions`">
            <font-awesome-icon :icon="['fas','shield-halved']" class="text-[0.6rem]" />
            {{ roleName(u.role_slug) }}
          </button>
          <span class="badge-dept">{{ u.department }}</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <AppToggle v-model="u.active" :disabled="!canWrite" size="sm" />
          <button v-if="canWrite" class="btn-icon" title="Configure" @click="openConfigure(u)">
            <font-awesome-icon :icon="['fas','pen']" class="text-xs" />
          </button>
        </div>
      </div>

      <div v-if="!visibleUsers.length" class="p-10 text-center">
        <font-awesome-icon :icon="['fas','users-slash']" class="text-3xl text-outline mb-3" />
        <p class="text-sm text-on-surface-variant">No users match your search.</p>
      </div>
    </div>

    <!-- ── Add / configure user ──────────────────────────────────────── -->
    <Modal v-model="userModal" :title="editing ? 'Configure User' : 'Add User'"
           :subtitle="editing ? draft.username : 'Create a new staff account'"
           :show-logo="false" class="w-[600px] max-w-2xl">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lbl">First name</label>
            <input v-model="draft.first_name" class="field" placeholder="James" />
          </div>
          <div>
            <label class="lbl">Last name</label>
            <input v-model="draft.last_name" class="field" placeholder="Banda" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lbl">Email address</label>
            <input v-model="draft.email_address" type="email" class="field" placeholder="name@ehis.mw" />
          </div>
          <div>
            <label class="lbl">Username</label>
            <input v-model="draft.username" class="field" placeholder="dr.banda" />
          </div>
        </div>
        <div v-if="!editing">
          <label class="lbl">Temporary password</label>
          <input v-model="draft.password" type="text" class="field font-mono" placeholder="Set an initial password" />
          <p class="text-[0.7rem] text-on-surface-variant mt-1.5">User will be prompted to change this on first sign-in.</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lbl">Role</label>
            <select v-model="draft.role_slug" class="field">
              <option v-for="r in ROLES" :key="r.slug" :value="r.slug">{{ r.name }}</option>
            </select>
          </div>
          <div>
            <label class="lbl">Department</label>
            <select v-model="draft.department" class="field">
              <option v-for="d in DEPARTMENTS" :key="d.code" :value="d.code">{{ d.name }} ({{ d.code }})</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="lbl">Professional licence <span class="text-outline font-normal">(optional)</span></label>
            <input v-model="draft.professional_license" class="field font-mono" placeholder="MED-MW-001234" />
          </div>
          <div>
            <label class="lbl">Designation <span class="text-outline font-normal">(optional)</span></label>
            <input v-model="draft.designation" class="field" placeholder="Consultant Oncologist" />
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm text-on-surface-variant">
          <AppToggle v-model="draft.active" size="sm" /> Active
        </label>

        <button class="text-xs font-semibold text-primary hover:underline" @click="openPermissions(draft.role_slug)">
          <font-awesome-icon :icon="['fas','shield-halved']" class="mr-1" />
          Preview {{ roleName(draft.role_slug) }} permissions
        </button>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="userModal = false">Cancel</button>
        <button class="btn-primary" @click="saveUser">{{ editing ? 'Save changes' : 'Add user' }}</button>
      </template>
    </Modal>

    <!-- ── Permission matrix (read-only review) ──────────────────────── -->
    <Modal v-model="permModal" title="Role Permissions" :subtitle="roleName(permRole)"
           :show-logo="false" class="w-[680px] max-w-2xl">
      <div class="space-y-1">
        <div class="grid grid-cols-[1fr_repeat(4,3rem)] gap-2 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wide text-on-surface-variant">
          <span>Process</span>
          <span class="text-center">Read</span>
          <span class="text-center">Write</span>
          <span class="text-center">Del</span>
          <span class="text-center">Appr</span>
        </div>
        <div v-for="p in permRows" :key="p.key"
             class="grid grid-cols-[1fr_repeat(4,3rem)] gap-2 items-center px-3 py-2 rounded-xl odd:bg-surface-container-low/60">
          <span class="text-xs font-medium text-on-surface truncate">{{ prettyKey(p.key) }}</span>
          <span class="flex justify-center"><Tick :on="p.read" /></span>
          <span class="flex justify-center"><Tick :on="p.write" /></span>
          <span class="flex justify-center"><Tick :on="p.delete" /></span>
          <span class="flex justify-center"><Tick :on="p.approve" /></span>
        </div>
        <p v-if="!permRows.length" class="text-sm text-on-surface-variant text-center py-6">
          This role has no explicit process permissions.
        </p>
      </div>
      <template #footer>
        <p class="text-xs text-on-surface-variant mr-auto">
          <font-awesome-icon :icon="['fas','circle-info']" class="mr-1" />
          Permissions are defined per role. Editing the matrix is a separate roles screen.
        </p>
        <button class="btn-primary" @click="permModal = false">Close</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
const { can } = usePermission()
const canWrite = computed(() => can('admin_users'))

// Tiny inline tick/dash for the permission grid.
const Tick = defineComponent({
  props: { on: Boolean },
  setup: (p) => () => h('span', {
    class: p.on ? 'text-emerald-500' : 'text-outline/40',
  }, [h(resolveComponent('font-awesome-icon') as any, { icon: ['fas', p.on ? 'check' : 'minus'], class: 'text-xs' })]),
})

interface User {
  email_address: string; username: string; first_name: string; last_name: string
  role_slug: string; department: string
  professional_license?: string; specialty?: string; designation?: string
  active: boolean; password?: string
}

// ── Roles (roles_permissions.rb) ────────────────────────────────────────────
const ROLES = [
  { slug:'system_administrator', name:'System Administrator' },
  { slug:'administrator',        name:'Administrator' },
  { slug:'medical_director',     name:'Medical Director' },
  { slug:'oncologist',           name:'Oncologist' },
  { slug:'resident_doctor',      name:'Resident Doctor' },
  { slug:'clinical_nurse',       name:'Clinical Nurse' },
  { slug:'oncology_nurse',       name:'Oncology Nurse' },
  { slug:'receptionist',         name:'Medical Secretary' },
  { slug:'medical_records',      name:'Medical Records Officer' },
  { slug:'lab_technician',       name:'Laboratory Technician' },
  { slug:'radiographer',         name:'Radiographer' },
  { slug:'pharmacist',           name:'Pharmacist' },
  { slug:'finance_officer',      name:'Finance Officer' },
  { slug:'social_worker',        name:'Social Worker' },
  { slug:'palliative_nurse',     name:'Palliative Care Nurse' },
  { slug:'inventory_officer',    name:'Inventory Officer' },
  { slug:'biomedical_engineer',  name:'Biomedical Engineer' },
  { slug:'bme_lead',             name:'Biomedical Engineering Lead' },
  { slug:'asset_officer',        name:'Asset/Stores Officer' },
]
const roleName = (slug: string) => ROLES.find(r => r.slug === slug)?.name ?? slug

// ── Departments (departments.rb) ────────────────────────────────────────────
const DEPARTMENTS = [
  { code:'ONCO', name:'Oncology' }, { code:'HISTOPATH', name:'Histopathology' },
  { code:'CLIN-LAB', name:'Clinical Laboratory' }, { code:'RAD', name:'Radiology' },
  { code:'PHARM', name:'Pharmacy' }, { code:'ADMIN', name:'Administration' },
  { code:'NURS', name:'Nursing' }, { code:'BME', name:'Biomedical Engineering' },
]

// ── DUMMY DATA (test_users.rb) ──────────────────────────────────────────────
const users = ref<User[]>([
  { email_address:'admin@ehis.mw', username:'sysadmin', first_name:'System', last_name:'Administrator', role_slug:'system_administrator', department:'ADMIN', active:true },
  { email_address:'dr.banda@ehis.mw', username:'dr.banda', first_name:'James', last_name:'Banda', role_slug:'oncologist', department:'ONCO', professional_license:'MED-MW-001234', specialty:'Medical Oncology', designation:'Consultant Oncologist', active:true },
  { email_address:'dr.phiri@ehis.mw', username:'dr.phiri', first_name:'Chisomo', last_name:'Phiri', role_slug:'resident_doctor', department:'ONCO', professional_license:'MED-MW-005678', specialty:'Internal Medicine', active:true },
  { email_address:'nurse.mwale@ehis.mw', username:'nurse.mwale', first_name:'Fatima', last_name:'Mwale', role_slug:'oncology_nurse', department:'NURS', professional_license:'NURS-MW-00789', active:true },
  { email_address:'reception@ehis.mw', username:'reception.desk', first_name:'Mary', last_name:'Chirwa', role_slug:'receptionist', department:'ADMIN', active:true },
  { email_address:'histopath@ehis.mw', username:'histopath.tech', first_name:'Patrick', last_name:'Mvula', role_slug:'lab_technician', department:'HISTOPATH', active:true },
  { email_address:'clin_lab@ehis.mw', username:'clin_lab.tech', first_name:'Mary', last_name:'Chombo', role_slug:'lab_technician', department:'CLIN-LAB', active:true },
  { email_address:'finance@ehis.mw', username:'finance.officer', first_name:'Grace', last_name:'Tembo', role_slug:'finance_officer', department:'ADMIN', active:true },
])

const search = ref('')
const visibleUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    `${u.first_name} ${u.last_name} ${u.username} ${u.email_address} ${roleName(u.role_slug)} ${u.department}`
      .toLowerCase().includes(q))
})

const initials = (u: User) => (u.first_name[0] ?? '') + (u.last_name[0] ?? '')

// ── Permission matrix (mirrors roles_permissions.rb grants) ─────────────────
type A = { read?: boolean; write?: boolean; delete?: boolean; approve?: boolean }
const full: A = { read:true, write:true, delete:true, approve:true }
const ro:   A = { read:true }
const rw:   A = { read:true, write:true }
const rwa:  A = { read:true, write:true, approve:true }

const ALL_PROCESSES = [
  'customer_registration','customer_search','customer_view',
  'pre_costing_create','pre_costing_search','pre_costing_view','pre_costing_approve',
  'proforma_invoice_create','proforma_invoice_search','proforma_invoice_view','proforma_invoice_settle','proforma_invoice_schedule',
  'receipt_search','receipt_view','receipt_revoke',
  'patient_registration','patient_search','patient_view','vitals_capture',
  'consultation','lab_referral','lab_results','radiology_referral','radiology_results',
  'inventory_view','inventory_management','inventory_pricing','inventory_stock','inventory_adjustment',
  'asset_view','asset_management','asset_custody','asset_maintenance','asset_writeoff',
  'pharmacy_dispensing','billing_view','billing_create','billing_approve',
  'encounter_management','next_encounter_assignment','report_view',
  'report_export','admin_users','admin_system',
]

const ROLE_PERMS: Record<string, Record<string, A>> = {
  system_administrator: Object.fromEntries(ALL_PROCESSES.map(p => [p, full])),
  medical_director: {
    customer_search:ro, customer_view:ro, pre_costing_create:rw, pre_costing_search:ro, pre_costing_view:ro,
    patient_search:ro, patient_view:ro, vitals_capture:ro, consultation:rwa, lab_referral:rw, lab_results:ro,
    radiology_referral:rw, next_encounter_assignment:rw, billing_view:ro, billing_approve:rwa, report_view:ro, report_export:rw, admin_users:rwa,
  },
  oncologist: {
    patient_search:ro, patient_view:ro, vitals_capture:rw, consultation:rwa, lab_referral:rw, lab_results:ro,
    radiology_referral:rw, radiology_results:ro, next_encounter_assignment:rw, report_view:ro,
  },
  resident_doctor: {
    patient_search:ro, patient_view:ro, vitals_capture:rw, consultation:rw, lab_referral:rw, lab_results:ro,
    radiology_referral:rw, next_encounter_assignment:rw,
  },
  clinical_nurse: { patient_search:ro, patient_view:ro, vitals_capture:rw, next_encounter_assignment:rw, inventory_view:ro, inventory_stock:rw, inventory_adjustment:rw, asset_view:ro, asset_custody:rw },
  oncology_nurse: { patient_search:ro, patient_view:ro, vitals_capture:rw, next_encounter_assignment:rw, inventory_view:ro, inventory_stock:rw, inventory_adjustment:rw, asset_view:ro, asset_custody:rw },
  palliative_nurse: { patient_search:ro, patient_view:ro, vitals_capture:rw, next_encounter_assignment:rw, inventory_view:ro, inventory_stock:rw, inventory_adjustment:rw, asset_view:ro, asset_custody:rw },
  receptionist: {
    customer_registration:rw, customer_search:ro, customer_view:ro, pre_costing_search:ro, pre_costing_view:ro,
    proforma_invoice_search:ro, proforma_invoice_view:ro, proforma_invoice_schedule:rw,
    patient_registration:rw, patient_search:ro, patient_view:ro, next_encounter_assignment:rw, billing_view:ro,
  },
  medical_records: {
    customer_registration:rw, customer_search:ro, customer_view:ro, pre_costing_create:rw, pre_costing_search:ro, pre_costing_view:ro,
    proforma_invoice_create:rw, proforma_invoice_search:ro, proforma_invoice_view:ro,
    patient_registration:rw, patient_search:ro, patient_view:ro, report_view:ro, report_export:rw,
  },
  lab_technician: { patient_search:ro, patient_view:ro, lab_referral:ro, lab_results:rwa, inventory_view:ro, inventory_stock:rw, inventory_adjustment:rw, asset_view:ro, asset_custody:rw },
  radiographer: { patient_search:ro, patient_view:ro, consultation:rwa, radiology_results:ro, report_view:ro, inventory_stock:rw, inventory_adjustment:rw, asset_view:ro, asset_custody:rw },
  finance_officer: {
    customer_search:ro, customer_view:ro, pre_costing_create:rw, pre_costing_search:ro, pre_costing_view:ro, pre_costing_approve:rw,
    proforma_invoice_search:ro, proforma_invoice_view:ro, proforma_invoice_settle:rw,
    receipt_search:ro, receipt_view:ro, receipt_revoke:rw, patient_view:ro, billing_view:ro, billing_create:rw, billing_approve:rwa,
    report_view:ro, report_export:rw, inventory_view:ro, inventory_pricing:rwa, asset_view:ro, asset_writeoff:rwa,
  },
  inventory_officer: { inventory_view:ro, inventory_management:rw, inventory_pricing:rw, inventory_stock:full, inventory_adjustment:rwa },
  pharmacist: { inventory_view:ro, inventory_management:rw, inventory_stock:rw, inventory_adjustment:rwa },
  bme_lead: { asset_view:ro, asset_management:rw, asset_custody:rw, asset_maintenance:rwa, asset_writeoff:rwa },
  biomedical_engineer: { asset_view:ro, asset_custody:rw, asset_maintenance:rw },
  asset_officer: { asset_view:ro, asset_management:rw, asset_custody:rw },
  social_worker: { patient_search:ro, patient_view:ro },
  administrator: Object.fromEntries(ALL_PROCESSES.map(p => [p, ro])),
}

const permModal = ref(false)
const permRole  = ref('system_administrator')
const openPermissions = (slug: string) => { permRole.value = slug; permModal.value = true }

const permRows = computed(() => {
  const map = ROLE_PERMS[permRole.value] ?? {}
  return Object.entries(map).map(([key, a]) => ({
    key, read: !!a.read, write: !!a.write, delete: !!a.delete, approve: !!a.approve,
  }))
})
const prettyKey = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ── User add / configure ────────────────────────────────────────────────────
const userModal = ref(false)
const editing   = ref(false)
const draft = reactive<User>({
  email_address:'', username:'', first_name:'', last_name:'',
  role_slug:'receptionist', department:'ADMIN', active:true, password:'',
})

const openCreate = () => {
  editing.value = false
  Object.assign(draft, {
    email_address:'', username:'', first_name:'', last_name:'',
    role_slug:'receptionist', department:'ADMIN', active:true, password:'',
    professional_license:'', designation:'', specialty:'',
  })
  userModal.value = true
}
const openConfigure = (u: User) => {
  editing.value = true
  Object.assign(draft, { ...u, password:'' })
  userModal.value = true
}
const saveUser = () => {
  if (editing.value) {
    const i = users.value.findIndex(x => x.username === draft.username)
    if (i > -1) users.value[i] = { ...users.value[i], ...draft }
  } else {
    users.value.push({ ...draft })
  }
  userModal.value = false
  // TODO: persist via useSettingsApi('admin/users').create/update(...)
}
</script>

<style scoped>
.panel { @apply bg-surface-bright rounded-[1.5rem] border border-outline-variant/30 overflow-hidden; box-shadow: 0 6px 22px rgba(0,51,153,0.05); }
.field { @apply w-full px-3 py-2.5 rounded-xl text-sm bg-surface-low border border-outline-variant/50 focus:border-primary/50 focus:outline-none transition-colors; }
.lbl   { @apply block text-xs font-semibold text-on-surface-variant mb-1.5; }
.btn-primary { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-transform active:scale-95; background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); box-shadow: 0 4px 12px rgba(0,80,203,0.30); }
.btn-ghost   { @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant border border-outline-variant hover:text-primary hover:border-primary/40 transition-colors; }
.btn-icon  { @apply w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary bg-surface-low hover:bg-surface-container flex-shrink-0 transition-colors; }
.badge-role { @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors; }
.badge-dept { @apply inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-surface-high text-on-surface-variant; }
.badge-muted { @apply inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-surface-high text-on-surface-variant; }
</style>