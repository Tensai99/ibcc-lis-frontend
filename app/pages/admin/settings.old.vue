<!-- app/pages/admin/settings.vue -->
<script setup lang="ts">
interface Role { id:number; name:string; slug:string; description:string; permissions?: Permission[] }
interface Permission { id:number; process_key:string; sub_encounter_keys:string[]; actions:{read:boolean;write:boolean;delete:boolean;approve:boolean} }
interface FhirCoding { system:string; code:string; display:string }
interface EncounterType { id:number; name:string; code:string; fhir_class_code:string; fhir_class_coding?:FhirCoding; sequence_order:number; is_billable:boolean; requires_appointment:boolean; sub_encounter_types?:SubEncounterType[] }
interface SubEncounterType { id:number; name:string; code:string; description:string|null; loinc_code:string|null; snomed_code:string|null }
interface Department { id:number; name:string; code:string; description:string|null; sub_departments?:SubDepartment[] }
interface SubDepartment { id:number; name:string; code:string; description:string|null }

const { can, canAny } = usePermission()
const { request, loading } = useApi()
const router = useRouter()

onMounted(() => {
  if (!canAny(['admin_users', 'admin_system'])) router.push('/dashboard')
  if (can('admin_users')) loadRoles()
})

// ── Active section ─────────────────────────────────────────────────────────
type Section = 'users'|'roles'|'encounters'|'departments'|'integrations'|'alerts'|'notifications'
const active = ref<Section>(can('admin_users') ? 'users' : 'integrations')

const nav = computed(() => [
  { id:'users',         label:'Users',           icon:['fas','users'] as [string,string],            group:'People',   show: can('admin_users') },
  { id:'roles',         label:'Roles',           icon:['fas','user-shield'] as [string,string],       group:'People',   show: can('admin_users') },
  { id:'encounters',    label:'Encounter Types', icon:['fas','notes-medical'] as [string,string],     group:'Clinical', show: can('admin_users') },
  { id:'departments',   label:'Departments',     icon:['fas','building'] as [string,string],          group:'Clinical', show: can('admin_users') },
  { id:'integrations',  label:'Integrations',    icon:['fas','link'] as [string,string],              group:'System',   show: can('admin_system') },
  { id:'alerts',        label:'Inventory Alerts',icon:['fas','triangle-exclamation'] as [string,string], group:'System', show: can('admin_system') },
  { id:'notifications', label:'Notifications',   icon:['fas','bell'] as [string,string],              group:'System',   show: can('admin_system') },
].filter(s => s.show) as { id:Section; label:string; icon:[string,string]; group:string; show:boolean }[])

const groups = computed(() => [...new Set(nav.value.map(s => s.group))])
const currentSection = computed(() => nav.value.find(s => s.id === active.value))

// ── Data ───────────────────────────────────────────────────────────────────
const roles          = ref<Role[]>([])
const encounterTypes = ref<EncounterType[]>([])
const departments    = ref<Department[]>([])
const selectedRole   = ref<Role|null>(null)
const selectedEnc    = ref<EncounterType|null>(null)
const selectedDept   = ref<Department|null>(null)
const showRoleModal  = ref(false)
const showEncModal   = ref(false)
const showDeptModal  = ref(false)

const loadRoles       = async () => { const d = await request<Role[]>('/roles');           if (d) roles.value = d }
const loadEncounters  = async () => { const d = await request<EncounterType[]>('/encounter_types'); if (d) encounterTypes.value = d }
const loadDepartments = async () => { const d = await request<Department[]>('/departments');        if (d) departments.value = d }

watch(active, s => {
  if (s === 'roles'       && !roles.value.length)          loadRoles()
  if (s === 'encounters'  && !encounterTypes.value.length) loadEncounters()
  if (s === 'departments' && !departments.value.length)    loadDepartments()
})

const openRole = async (r:Role) => { const d = await request<Role>(`/roles/${r.id}`); if (d) { selectedRole.value = d; showRoleModal.value = true } }
const openEnc  = async (e:EncounterType) => { const d = await request<EncounterType>(`/encounter_types/${e.id}`); if (d) { selectedEnc.value = d; showEncModal.value = true } }
const openDept = async (d:Department) => { const x = await request<Department>(`/departments/${d.id}`); if (x) { selectedDept.value = x; showDeptModal.value = true } }

// ── Demo users ─────────────────────────────────────────────────────────────
const users = ref([
  { id:1, full_name:'System Administrator', username:'sysadmin',        email:'admin@ehis.mw',      role_label:'System Administrator',  department:'Administration', active:true },
  { id:2, full_name:'Dr James Banda',       username:'dr.banda',        email:'dr.banda@ehis.mw',   role_label:'Oncologist',            department:'Oncology',       active:true },
  { id:3, full_name:'Dr Chisomo Phiri',     username:'dr.phiri',        email:'dr.phiri@ehis.mw',   role_label:'Resident Doctor',       department:'Oncology',       active:true },
  { id:4, full_name:'Fatima Mwale',         username:'nurse.mwale',     email:'nurse.mwale@ehis.mw',role_label:'Oncology Nurse',        department:'Nursing',        active:true },
  { id:5, full_name:'Mary Chirwa',          username:'reception.desk',  email:'reception@ehis.mw',  role_label:'Receptionist',          department:'Administration', active:true },
  { id:6, full_name:'Patrick Mvula',        username:'lab.tech',        email:'lab@ehis.mw',        role_label:'Lab Technician',        department:'Laboratory',     active:true },
  { id:7, full_name:'Grace Tembo',          username:'finance.officer', email:'finance@ehis.mw',    role_label:'Finance Officer',       department:'Administration', active:true },
])
const userSearch   = ref('')
const filteredUsers = computed(() => {
  const q = userSearch.value.toLowerCase()
  return q ? users.value.filter(u => [u.full_name,u.username,u.email,u.role_label,u.department].some(v=>v.toLowerCase().includes(q))) : users.value
})

// ── System config ──────────────────────────────────────────────────────────
const cfg = reactive({ sage_api_url:'', sage_api_key:'', expiry_alert_days:90, smtp_host:'', smtp_port:587, sms_gateway_url:'' })
const saving = ref(false)
const saved  = ref<string|null>(null)
const saveSection = async (key:string) => {
  saving.value = true
  await new Promise(r => setTimeout(r,700))
  saving.value = false; saved.value = key
  setTimeout(()=>saved.value=null,3000)
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fhirBadge = (c:string) => ({'AMB':'badge-info','IMP':'badge-warning','EMER':'badge-error'}[c]||'badge-neutral')
const actionDot = (v:boolean) => v ? 'w-2.5 h-2.5 rounded-full bg-green-500' : 'w-2.5 h-2.5 rounded-full bg-surface-dim'
const initials  = (n:string)  => n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()
const bgPalette = ['bg-blue-100 text-blue-700','bg-violet-100 text-violet-700','bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700','bg-rose-100 text-rose-700','bg-cyan-100 text-cyan-700','bg-orange-100 text-orange-700']
const userBg    = (i:number) => bgPalette[i % bgPalette.length]
</script>

<template>
  <!-- Two-column settings layout: narrow fixed nav + scrollable content -->
  <div class="flex gap-6 min-h-full animate-fade-in">

    <!-- ── Left nav ──────────────────────────────────────────────────── -->
    <aside class="hidden lg:block w-44 flex-shrink-0">
      <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-3">Settings</p>
      <nav class="space-y-0.5">
        <template v-for="group in groups" :key="group">
          <p class="text-[10px] font-bold text-outline uppercase tracking-widest px-2 pt-3 pb-1">{{ group }}</p>
          <button
            v-for="s in nav.filter(x=>x.group===group)" :key="s.id"
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-all text-left"
            :class="active===s.id ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-low'"
            @click="active=s.id as Section"
          >
            <font-awesome-icon :icon="s.icon" class="text-xs w-3.5 flex-shrink-0" />
            <span class="truncate">{{ s.label }}</span>
          </button>
        </template>
      </nav>
    </aside>

    <!-- Mobile nav -->
    <div class="lg:hidden mb-4 w-full absolute top-0 left-0">
      <select v-model="active" class="input-field text-sm">
        <option v-for="s in nav" :key="s.id" :value="s.id">{{ s.label }}</option>
      </select>
    </div>

    <!-- ── Content ────────────────────────────────────────────────────── -->
    <div class="flex-1 min-w-0">

      <!-- Section header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <font-awesome-icon :icon="currentSection?.icon ?? ['fas','gear']" class="text-primary text-sm" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-on-surface leading-tight">{{ currentSection?.label }}</h2>
            <p class="text-xs text-on-surface-variant leading-tight">
              <span v-if="active==='users'">{{ filteredUsers.length }} accounts</span>
              <span v-else-if="active==='roles'">{{ roles.length }} roles</span>
              <span v-else-if="active==='encounters'">{{ encounterTypes.length }} types</span>
              <span v-else-if="active==='departments'">{{ departments.length }} departments</span>
              <span v-else>System configuration</span>
            </p>
          </div>
        </div>
        <!-- Section-level actions -->
        <div v-if="active==='users'" class="flex items-center gap-2">
          <div class="relative">
            <font-awesome-icon :icon="['fas','magnifying-glass']" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
            <input v-model="userSearch" type="text" placeholder="Search…" class="input-field !py-1.5 pl-8 pr-3 !text-sm w-40 sm:w-52" />
          </div>
          <button v-if="can('admin_system')" class="btn-primary !py-1.5 !px-3 !text-sm">
            <font-awesome-icon :icon="['fas','plus']" />Add User
          </button>
        </div>
      </div>

      <!-- ════════════ USERS ════════════════════════════════════════════ -->
      <template v-if="active==='users'">
        <!-- Table-style list — easier to scan than cards at this density -->
        <div class="island !p-0 overflow-hidden">
          <table class="his-table">
            <thead>
              <tr>
                <th class="pl-4">User</th>
                <th class="hidden md:table-cell">Role</th>
                <th class="hidden lg:table-cell">Department</th>
                <th class="w-20">Status</th>
                <th class="w-10 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u,i) in filteredUsers" :key="u.id" class="group">
                <td class="pl-4">
                  <div class="flex items-center gap-3">
                    <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', userBg(i)]">
                      {{ initials(u.full_name) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-on-surface">{{ u.full_name }}</p>
                      <p class="text-xs text-outline truncate">{{ u.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="hidden md:table-cell">
                  <span class="text-xs font-semibold bg-primary/8 text-primary px-2 py-0.5 rounded-full">{{ u.role_label }}</span>
                </td>
                <td class="hidden lg:table-cell text-sm text-on-surface-variant">{{ u.department }}</td>
                <td>
                  <span class="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />Active
                  </span>
                </td>
                <td class="pr-4">
                  <button class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/8 transition-all">
                    <font-awesome-icon :icon="['fas','ellipsis-vertical']" class="text-sm" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filteredUsers.length" class="py-12 text-center text-sm text-on-surface-variant">No users match your search.</div>
        </div>
      </template>

      <!-- ════════════ ROLES ════════════════════════════════════════════ -->
      <template v-else-if="active==='roles'">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-16 bg-white rounded-xl animate-pulse" />
        </div>
        <div v-else class="island !p-0 overflow-hidden divide-y divide-outline-variant/20">
          <button
            v-for="role in roles" :key="role.id"
            class="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-surface-low text-left transition-colors group"
            @click="openRole(role)"
          >
            <div class="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
              <font-awesome-icon :icon="['fas','user-shield']" class="text-primary text-xs" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{{ role.name }}</p>
              <p class="text-xs text-on-surface-variant truncate">{{ role.description }}</p>
            </div>
            <span class="font-mono text-xs text-outline bg-surface-low px-1.5 py-0.5 rounded hidden sm:block">{{ role.slug }}</span>
            <font-awesome-icon :icon="['fas','chevron-right']" class="text-outline text-xs flex-shrink-0 group-hover:text-primary transition-colors" />
          </button>
          <div v-if="!roles.length && !loading" class="py-12 text-center text-sm text-on-surface-variant">No roles loaded yet.</div>
        </div>
      </template>

      <!-- ════════════ ENCOUNTER TYPES ══════════════════════════════════ -->
      <template v-else-if="active==='encounters'">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-14 bg-white rounded-xl animate-pulse" />
        </div>
        <div v-else class="island !p-0 overflow-hidden divide-y divide-outline-variant/20">
          <button
            v-for="et in encounterTypes" :key="et.id"
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-low text-left transition-colors group"
            @click="openEnc(et)"
          >
            <span class="w-6 h-6 rounded-full bg-surface-low border border-outline-variant/30 text-on-surface-variant text-xs font-mono flex items-center justify-center flex-shrink-0">
              {{ et.sequence_order }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{{ et.name }}</p>
              <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span class="font-mono text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded">{{ et.code }}</span>
                <span class="badge !py-0 !text-xs" :class="fhirBadge(et.fhir_class_code)">{{ et.fhir_class_code }}</span>
                <span v-if="et.is_billable" class="text-xs text-green-600 font-semibold">● Billable</span>
              </div>
            </div>
            <font-awesome-icon :icon="['fas','chevron-right']" class="text-outline text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <div v-if="!encounterTypes.length && !loading" class="py-12 text-center text-sm text-on-surface-variant">No encounter types loaded.</div>
        </div>
      </template>

      <!-- ════════════ DEPARTMENTS ══════════════════════════════════════ -->
      <template v-else-if="active==='departments'">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-14 bg-white rounded-xl animate-pulse" />
        </div>
        <div v-else class="island !p-0 overflow-hidden divide-y divide-outline-variant/20">
          <button
            v-for="dept in departments" :key="dept.id"
            class="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-surface-low text-left transition-colors group"
            @click="openDept(dept)"
          >
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <font-awesome-icon :icon="['fas','building']" class="text-amber-600 text-xs" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{{ dept.name }}</p>
              <p v-if="dept.description" class="text-xs text-on-surface-variant truncate">{{ dept.description }}</p>
            </div>
            <span class="font-mono text-xs font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded hidden sm:block">{{ dept.code }}</span>
            <font-awesome-icon :icon="['fas','chevron-right']" class="text-outline text-xs flex-shrink-0 group-hover:text-primary transition-colors" />
          </button>
          <div v-if="!departments.length && !loading" class="py-12 text-center text-sm text-on-surface-variant">No departments loaded.</div>
        </div>
      </template>

      <!-- ════════════ INTEGRATIONS ═════════════════════════════════════ -->
      <template v-else-if="active==='integrations'">
        <AppAlert v-if="saved==='integrations'" type="success" title="Integration settings saved." />
        <div class="island space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
            <div class="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
              <font-awesome-icon :icon="['fas','link']" class="text-primary" />
            </div>
            <div>
              <p class="text-sm font-bold text-on-surface">SAGE Accounting</p>
              <p class="text-xs text-on-surface-variant">Sync approved invoices as journal entries</p>
            </div>
            <span class="ml-auto badge badge-neutral text-xs">Not connected</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="input-label">SAGE API URL</label>
              <input v-model="cfg.sage_api_url" type="url" class="input-field" placeholder="https://sage-api.example.com" />
            </div>
            <div>
              <label class="input-label">SAGE API Key</label>
              <input v-model="cfg.sage_api_key" type="password" class="input-field" placeholder="••••••••••••" />
            </div>
          </div>
          <div class="flex justify-end pt-2">
            <button class="btn-primary !text-sm" :disabled="saving" @click="saveSection('integrations')">
              <font-awesome-icon v-if="saving" :icon="['fas','spinner']" spin /><font-awesome-icon v-else :icon="['fas','floppy-disk']" />
              Save
            </button>
          </div>
        </div>
      </template>

      <!-- ════════════ INVENTORY ALERTS ════════════════════════════════ -->
      <template v-else-if="active==='alerts'">
        <AppAlert v-if="saved==='alerts'" type="success" title="Alert settings saved." />
        <div class="island space-y-5">
          <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
            <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <font-awesome-icon :icon="['fas','triangle-exclamation']" class="text-amber-600" />
            </div>
            <div>
              <p class="text-sm font-bold text-on-surface">Pre-expiry Alert Lead Time</p>
              <p class="text-xs text-on-surface-variant">Items expiring within <strong>{{ cfg.expiry_alert_days }} days</strong> will trigger amber alerts</p>
            </div>
            <span class="ml-auto text-2xl font-bold text-primary w-16 text-right flex-shrink-0">{{ cfg.expiry_alert_days }}<span class="text-xs font-normal text-on-surface-variant ml-0.5">d</span></span>
          </div>
          <!-- Slider -->
          <div>
            <input v-model.number="cfg.expiry_alert_days" type="range" min="7" max="180" step="7" class="w-full accent-primary" />
            <div class="flex justify-between text-xs text-outline mt-1"><span>7d</span><span>60d</span><span>120d</span><span>180d</span></div>
          </div>
          <!-- Quick presets -->
          <div class="flex gap-2 flex-wrap">
            <span class="text-xs text-on-surface-variant self-center">Presets:</span>
            <button v-for="d in [30,60,90,120]" :key="d"
              class="px-3 py-1 text-xs font-semibold rounded-full border transition-all"
              :class="cfg.expiry_alert_days===d ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'"
              @click="cfg.expiry_alert_days=d"
            >{{ d }}d</button>
          </div>
          <div class="flex justify-end pt-1">
            <button class="btn-primary !text-sm" :disabled="saving" @click="saveSection('alerts')">
              <font-awesome-icon v-if="saving" :icon="['fas','spinner']" spin /><font-awesome-icon v-else :icon="['fas','floppy-disk']" />
              Save
            </button>
          </div>
        </div>
      </template>

      <!-- ════════════ NOTIFICATIONS ════════════════════════════════════ -->
      <template v-else-if="active==='notifications'">
        <AppAlert v-if="saved==='notifications'" type="success" title="Notification settings saved." />
        <div class="island space-y-5">
          <!-- SMTP -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <font-awesome-icon :icon="['fas','envelope']" class="text-primary text-sm" />
              <p class="text-sm font-bold text-on-surface">Email (SMTP)</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div class="sm:col-span-3">
                <label class="input-label">SMTP Host</label>
                <input v-model="cfg.smtp_host" class="input-field" placeholder="smtp.ehis.mw" />
              </div>
              <div>
                <label class="input-label">Port</label>
                <input v-model.number="cfg.smtp_port" type="number" class="input-field" placeholder="587" />
              </div>
            </div>
          </div>
          <div class="border-t border-outline-variant/30" />
          <!-- SMS -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <font-awesome-icon :icon="['fas','mobile-screen']" class="text-primary text-sm" />
              <p class="text-sm font-bold text-on-surface">SMS Gateway</p>
            </div>
            <div>
              <label class="input-label">Gateway URL</label>
              <input v-model="cfg.sms_gateway_url" type="url" class="input-field" placeholder="https://sms-gateway.ehis.mw/send" />
            </div>
          </div>
          <div class="flex justify-end border-t border-outline-variant/30 pt-4">
            <button class="btn-primary !text-sm" :disabled="saving" @click="saveSection('notifications')">
              <font-awesome-icon v-if="saving" :icon="['fas','spinner']" spin /><font-awesome-icon v-else :icon="['fas','floppy-disk']" />
              Save
            </button>
          </div>
        </div>
      </template>

    </div><!-- /content -->
  </div>

  <!-- ── Role modal ────────────────────────────────────────────────────── -->
  <Modal v-model="showRoleModal" :title="selectedRole?.name ?? ''" size="lg">
    <div v-if="selectedRole" class="space-y-4">
      <p class="text-sm text-on-surface-variant">{{ selectedRole.description }}</p>
      <div v-if="!selectedRole.permissions?.length" class="py-8 text-center text-sm text-on-surface-variant">No permissions defined.</div>
      <div v-else class="overflow-x-auto rounded-xl border border-outline-variant/30">
        <table class="his-table">
          <thead><tr><th class="pl-4">Process Key</th><th class="w-16 text-center">Read</th><th class="w-16 text-center">Write</th><th class="w-16 text-center">Delete</th><th class="w-16 text-center pr-4">Approve</th></tr></thead>
          <tbody>
            <tr v-for="p in selectedRole.permissions" :key="p.id">
              <td class="pl-4"><span class="font-mono text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded">{{ p.process_key }}</span></td>
              <td class="text-center"><span :class="actionDot(p.actions.read)" class="inline-block" /></td>
              <td class="text-center"><span :class="actionDot(p.actions.write)" class="inline-block" /></td>
              <td class="text-center"><span :class="actionDot(p.actions.delete)" class="inline-block" /></td>
              <td class="text-center pr-4"><span :class="actionDot(p.actions.approve)" class="inline-block" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center gap-4 text-xs text-on-surface-variant">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Allowed</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-surface-dim inline-block" /> Denied</span>
      </div>
    </div>
  </Modal>

  <!-- ── Encounter modal ───────────────────────────────────────────────── -->
  <Modal v-model="showEncModal" :title="selectedEnc?.name ?? ''" size="md">
    <div v-if="selectedEnc" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><p class="input-label">Code</p><span class="font-mono font-bold bg-primary/8 text-primary px-2 py-0.5 rounded text-xs">{{ selectedEnc.code }}</span></div>
        <div><p class="input-label">FHIR Class</p><span class="badge !text-xs" :class="fhirBadge(selectedEnc.fhir_class_code)">{{ selectedEnc.fhir_class_code }}</span></div>
        <div><p class="input-label">Billable</p><span :class="selectedEnc.is_billable?'badge-success':'badge-neutral'" class="badge !text-xs">{{ selectedEnc.is_billable?'Yes':'No' }}</span></div>
        <div><p class="input-label">Appointment</p><span :class="selectedEnc.requires_appointment?'badge-warning':'badge-neutral'" class="badge !text-xs">{{ selectedEnc.requires_appointment?'Required':'Optional' }}</span></div>
      </div>
      <div v-if="selectedEnc.sub_encounter_types?.length">
        <p class="input-label mb-2">Sub-Types</p>
        <div class="space-y-1.5">
          <div v-for="sub in selectedEnc.sub_encounter_types" :key="sub.id" class="flex items-start gap-2 p-2.5 rounded-lg bg-surface-low">
            <span class="font-mono text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded flex-shrink-0">{{ sub.code }}</span>
            <div class="min-w-0"><p class="text-sm font-semibold">{{ sub.name }}</p><p v-if="sub.description" class="text-xs text-on-surface-variant">{{ sub.description }}</p></div>
          </div>
        </div>
      </div>
    </div>
  </Modal>

  <!-- ── Department modal ──────────────────────────────────────────────── -->
  <Modal v-model="showDeptModal" :title="selectedDept?.name ?? ''" size="sm">
    <div v-if="selectedDept" class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs">{{ selectedDept.code }}</span>
        <p v-if="selectedDept.description" class="text-sm text-on-surface-variant">{{ selectedDept.description }}</p>
      </div>
      <div v-if="selectedDept.sub_departments?.length">
        <p class="input-label mb-2">Sub-Departments</p>
        <div class="space-y-1.5">
          <div v-for="sub in selectedDept.sub_departments" :key="sub.id" class="flex items-start gap-2 p-2.5 rounded-lg bg-surface-low">
            <span class="font-mono text-xs font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded flex-shrink-0">{{ sub.code }}</span>
            <div class="min-w-0"><p class="text-sm font-semibold">{{ sub.name }}</p><p v-if="sub.description" class="text-xs text-on-surface-variant">{{ sub.description }}</p></div>
          </div>
        </div>
      </div>
      <div v-else class="py-4 text-center text-sm text-on-surface-variant bg-surface-low rounded-lg">No sub-departments defined.</div>
    </div>
  </Modal>
</template>