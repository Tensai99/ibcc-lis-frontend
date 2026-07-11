<!-- app/pages/dashboard/receptionist.vue -->
<!--
  Receptionist / Medical Secretary dashboard — fully self-contained (no shared
  components). Live GET /dashboard (role=receptionist).
-->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Loading skeleton -->
    <template v-if="showSkeleton">
      <SkeletonStatGrid :count="4" grid-class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
        <table class="his-table">
          <thead><tr><th>#</th><th>Patient</th><th>MRN</th><th>Arrived</th><th>Encounter</th></tr></thead>
          <tbody><SkeletonTableRows :columns="5" :rows="5" /></tbody>
        </table>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island">
      <div class="py-10 sm:py-12 flex flex-col items-center justify-center gap-3 text-center">
        <span class="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
          <font-awesome-icon :icon="['fas','triangle-exclamation']" class="text-xl text-error" />
        </span>
        <p class="text-sm sm:text-base font-semibold text-on-surface">Couldn't load your dashboard</p>
        <p class="text-xs sm:text-sm text-on-surface-variant max-w-md break-words">{{ error }}</p>
        <button type="button" class="btn-secondary mt-1" @click="reload">
          <font-awesome-icon :icon="['fas','rotate-right']" /><span>Retry</span>
        </button>
      </div>
    </div>

    <!-- Live data -->
    <template v-else-if="d">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="k in kpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3"><span :class="['font-bold break-words text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.display }}</span></div>
        </div>
      </div>

      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="mb-4">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Waiting Queue</h2>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Patients currently in the waiting room</p>
        </div>
        <div v-if="!d.waiting_queue.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','chair']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">Waiting room is empty</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Checked-in patients will appear here in arrival order.</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="his-table">
            <thead><tr><th>#</th><th>Patient</th><th>MRN</th><th>Arrived</th><th>Encounter</th></tr></thead>
            <tbody>
              <tr v-for="(p, idx) in d.waiting_queue" :key="idx">
                <td class="font-bold text-primary">{{ idx + 1 }}</td>
                <td class="truncate-cell">{{ p.patient_name }}</td>
                <td class="font-mono text-xs sm:text-sm">{{ p.mrn }}</td>
                <td class="whitespace-nowrap text-xs sm:text-sm">{{ p.arrival_time }}</td>
                <td class="truncate-cell">{{ p.encounter_type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Quick actions -->
    <div v-if="quickActions.length"
      class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
      <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-4">Quick actions</h2>
      <div class="flex flex-wrap gap-2 sm:gap-3">
        <NuxtLink v-for="(a, idx) in quickActions" :key="a.to" :to="a.to" :class="a.primary ? 'btn-primary' : 'btn-secondary'">
          <font-awesome-icon :icon="a.icon" :class="a.primary ? '' : RIBBON_ICON[idx % RIBBON_ICON.length]" />
          <span>{{ a.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ReceptionInsights {
  registrations_today: number; patients_checked_in_today: number; in_progress_visits: number
  completed_visits_today: number; no_shows_today: number; new_patients_this_month: number
  upcoming_appointments_today: number
}
interface ReceptionDashboard {
  role: string; role_label: string; user: string; generated_at: string
  insights: ReceptionInsights
  waiting_queue: Array<{ patient_name?: string; mrn?: string; arrival_time?: string; encounter_type?: string }>
}

const { data, loading, error, reload } = useDashboardData<ReceptionDashboard>()
const { showSkeleton } = useDelayedLoading(loading)
const d = computed(() => data.value)

const auth = useAuthStore()
const { can } = usePermission()
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' })
const displayName = computed(() => auth.user?.full_name ?? 'there')
const roleLabel = computed(() => auth.user?.role_label ?? '')
const department = computed(() => auth.user?.department ?? '')
const generatedLabel = computed(() => {
  const v = d.value?.generated_at; if (!v) return ''
  const dt = new Date(v)
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString('en-MW', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
})

type Tile = { label: string; display: string; icon: [string,string]; iconBg: string; iconColor: string; accent: string }
const kpis = computed(() => {
  const i = d.value!.insights
  return [
    { label: 'Registrations Today', display: i.registrations_today.toLocaleString(), icon: ['fas','user-plus'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Checked In Today', display: i.patients_checked_in_today.toLocaleString(), icon: ['fas','circle-check'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-on-surface' },
    { label: 'In-Progress Visits', display: i.in_progress_visits.toLocaleString(), icon: ['fas','spinner'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface' },
    { label: 'Completed Today', display: i.completed_visits_today.toLocaleString(), icon: ['fas','flag-checkered'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: 'text-on-surface' },
    { label: 'No-Shows Today', display: i.no_shows_today.toLocaleString(), icon: ['fas','user-slash'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: 'text-error' },
    { label: 'New This Month', display: i.new_patients_this_month.toLocaleString(), icon: ['fas','calendar-plus'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-on-surface' },
    { label: 'Appointments Today', display: i.upcoming_appointments_today.toLocaleString(), icon: ['fas','calendar-check'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: 'text-on-surface' },
  ] as Tile[]
})

const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Search patient', to: '/patients', icon: ['fas','magnifying-glass'], perm: 'patient_search' },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>