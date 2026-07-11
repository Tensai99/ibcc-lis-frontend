<!-- app/pages/dashboard/oncologist.vue -->
<!--
  Oncologist dashboard — fully self-contained. Live GET /dashboard
  (role=oncologist). No shared dashboard components: header, KPI tiles, bars,
  tables, quick actions and loading/error UI are all inline in this one file, so
  design changes here never affect any other dashboard.
-->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- ── Loading skeleton ────────────────────────────────────────────── -->
    <template v-if="showSkeleton">
      <SkeletonStatGrid :count="5" grid-class="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonPanel :bars="4" />
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <SkeletonBase width="50%" height="1.1rem" class="mb-4" />
          <table class="his-table">
            <thead><tr><th>Patient</th><th>Encounter</th><th>When</th></tr></thead>
            <tbody><SkeletonTableRows :columns="3" :rows="4" /></tbody>
          </table>
        </div>
      </div>
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
        <table class="his-table">
          <thead><tr><th>Patient</th><th>Priority</th><th>Presenting complaint</th><th>Arrived</th></tr></thead>
          <tbody><SkeletonTableRows :columns="4" :rows="4" /></tbody>
        </table>
      </div>
    </template>

    <!-- ── Error ───────────────────────────────────────────────────────── -->
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

    <!-- ── Live data ───────────────────────────────────────────────────── -->
    <template v-else-if="s">
      <!-- Personal caseload KPIs -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div v-for="k in kpis" :key="k.label"
          class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <span class="text-xs sm:text-sm font-bold text-on-surface-variant break-words">{{ k.label }}</span>
            <span :class="['w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0', k.iconBg]">
              <font-awesome-icon :icon="k.icon" :class="['text-sm', k.iconColor]" />
            </span>
          </div>
          <div class="mt-3">
            <span :class="['font-bold break-words text-2xl sm:text-3xl md:text-4xl', k.accent]">{{ k.value.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Caseload mix + upcoming appointments -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <!-- Cancer caseload distribution bars -->
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface break-words">Cancer Caseload</h2>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Distribution across my patients</p>
          </div>
          <div v-if="cancerBars.length" class="flex flex-col gap-2.5">
            <div v-for="(row, idx) in cancerBars" :key="row.label" class="min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="flex items-center gap-2 min-w-0">
                  <span :class="['inline-block w-2.5 h-2.5 rounded-full shrink-0', RIBBON_BAR[idx % RIBBON_BAR.length]]" />
                  <span class="text-xs sm:text-sm font-semibold text-on-surface truncate">{{ row.label }}</span>
                </span>
                <span class="text-xs sm:text-sm font-bold text-on-surface-variant flex-shrink-0">{{ row.value.toLocaleString() }}</span>
              </div>
              <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div :class="['h-full rounded-full', RIBBON_BAR[idx % RIBBON_BAR.length]]" :style="{ width: row.pct + '%' }" />
              </div>
            </div>
          </div>
          <div v-else class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
            <font-awesome-icon :icon="['fas','chart-simple']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
            <p class="text-xs sm:text-sm text-on-surface-variant">No caseload recorded yet.</p>
          </div>
        </div>

        <!-- Upcoming appointments -->
        <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
          <div class="mb-4">
            <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface break-words">Upcoming Appointments</h2>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Next 7 days</p>
          </div>
          <div v-if="!s.upcoming_appointments.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
            <font-awesome-icon :icon="['fas','calendar-check']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
            <p class="text-sm sm:text-base font-semibold text-on-surface">No upcoming appointments</p>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">Scheduled follow-ups assigned to you will appear here.</p>
          </div>
          <div v-else class="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table class="his-table">
              <thead><tr><th>Patient</th><th>Encounter</th><th>When</th></tr></thead>
              <tbody>
                <tr v-for="(a, idx) in s.upcoming_appointments" :key="idx">
                  <td class="truncate-cell font-semibold">{{ field(a, 'patient_name', 'patient') }}</td>
                  <td class="truncate-cell">{{ field(a, 'encounter_type') }}</td>
                  <td class="whitespace-nowrap text-xs sm:text-sm">{{ fmtWhen(a.scheduled_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Triage queue -->
      <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="mb-4">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface break-words">Triage Queue</h2>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Patients awaiting review</p>
        </div>
        <div v-if="!s.triage_queue.length" class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
          <font-awesome-icon :icon="['fas','list-check']" class="text-3xl sm:text-4xl text-primary/30 mb-3" />
          <p class="text-sm sm:text-base font-semibold text-on-surface">Triage queue is clear</p>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">Newly triaged patients routed to you will be listed here.</p>
        </div>
        <div v-else class="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table class="his-table">
            <thead><tr><th>Patient</th><th>Priority</th><th>Presenting complaint</th><th>Arrived</th></tr></thead>
            <tbody>
              <tr v-for="(t, idx) in s.triage_queue" :key="idx">
                <td class="truncate-cell font-semibold">{{ field(t, 'patient_name', 'patient') }}</td>
                <td class="whitespace-nowrap">
                  <span v-if="t.triage_level" :class="[triageClass(String(t.triage_level))]">{{ t.triage_level }}</span>
                  <span v-else>—</span>
                </td>
                <td class="truncate-cell">{{ field(t, 'presenting_complaint') }}</td>
                <td class="whitespace-nowrap text-xs sm:text-sm">{{ fmtWhen(t.arrived_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ── Quick actions (always available) ────────────────────────────── -->
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
// ── Payload shape (owned by this file) ─────────────────────────────────────
interface ClinicalInsights {
  my_patients_today: number
  pending_sub_encounters: number
  completed_by_me_today: number
  lab_results_pending_review: number
  upcoming_appointments_7_days: number
}
interface LooseRow { [k: string]: unknown; patient?: string; patient_name?: string; triage_level?: string; presenting_complaint?: string; arrived_at?: string; encounter_type?: string; scheduled_at?: string }
interface ClinicalDashboard {
  role: string; role_label: string; user: string; generated_at: string
  insights: ClinicalInsights
  upcoming_appointments: LooseRow[]
  cancer_type_breakdown: Record<string, number>
  triage_queue: LooseRow[]
}

// ── Data ───────────────────────────────────────────────────────────────────
const { data, loading, error, reload } = useDashboardData<ClinicalDashboard>()
const s = computed(() => data.value)
const { showSkeleton } = useDelayedLoading(loading)

// ── Header (greeting from auth store) ──────────────────────────────────────
const auth = useAuthStore()
const { can } = usePermission()
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' })
const displayName = computed(() => auth.user?.full_name ?? 'there')
const roleLabel = computed(() => auth.user?.role_label ?? '')
const department = computed(() => auth.user?.department ?? '')
const generatedLabel = computed(() => {
  const v = s.value?.generated_at; if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-MW', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
})

// ── KPI tiles ──────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const i = s.value!.insights
  return [
    { label: 'My Patients Today', value: i.my_patients_today, icon: ['fas','user-injured'], iconBg: 'bg-primary-fixed', iconColor: 'text-primary-container', accent: 'text-on-surface' },
    { label: 'Pending Encounters', value: i.pending_sub_encounters, icon: ['fas','notes-medical'], iconBg: 'bg-accent-fixed', iconColor: 'text-accent-container', accent: i.pending_sub_encounters ? 'text-accent-container' : 'text-on-surface' },
    { label: 'Completed Today', value: i.completed_by_me_today, icon: ['fas','circle-check'], iconBg: 'bg-secondary-fixed', iconColor: 'text-secondary', accent: 'text-secondary' },
    { label: 'Labs to Review', value: i.lab_results_pending_review, icon: ['fas','flask'], iconBg: 'bg-error-container', iconColor: 'text-error', accent: i.lab_results_pending_review ? 'text-error' : 'text-on-surface' },
    { label: 'Upcoming (7 days)', value: i.upcoming_appointments_7_days, icon: ['fas','calendar-days'], iconBg: 'bg-tertiary-fixed', iconColor: 'text-tertiary', accent: 'text-on-surface' },
  ] as Array<{ label: string; value: number; icon: [string,string]; iconBg: string; iconColor: string; accent: string }>
})

// ── Distribution bars (ribbon colours cycle) ───────────────────────────────
const RIBBON_BAR = ['bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red']
const cancerBars = computed(() => {
  const items = Object.entries(s.value?.cancer_type_breakdown ?? {}).map(([label, value]) => ({ label: label || 'Unspecified', value }))
  const max = Math.max(1, ...items.map(i => i.value))
  return items.sort((a, b) => b.value - a.value).map(i => ({ ...i, pct: Math.round((i.value / max) * 100) }))
})

// ── Table helpers ──────────────────────────────────────────────────────────
const field = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) { const v = row[k]; if (v != null && v !== '') return String(v) }
  return '—'
}
const triageClass = (lvl: string) => lvl === 'P1' ? 'badge-error' : lvl === 'P2' ? 'badge-warning' : 'badge-info'
const fmtWhen = (v: unknown) => {
  if (!v) return '—'
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-MW', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Quick actions (permission-gated) ───────────────────────────────────────
const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Search patient', to: '/patients', icon: ['fas','magnifying-glass'], perm: 'patient_search', primary: true },
  { label: 'Record vitals', to: '/patients', icon: ['fas','heart-pulse'], perm: 'vitals_capture' },
  { label: 'Lab referral', to: '/patients', icon: ['fas','flask'], perm: 'lab_referral' },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>