<!-- app/pages/dashboard/oncology-nurse.vue -->
<!--
  Oncology Nurse dashboard — fully self-contained (no shared components).
  Live GET /dashboard (role=oncology_nurse); the payload currently carries
  empty insights, so the body is an action-oriented landing. Also serves
  clinical_nurse / palliative_nurse (see DASHBOARD_ROUTES).
-->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Loading skeleton -->
    <SkeletonPanel v-if="showSkeleton" :bars="2" />

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

    <!-- Live data (insights empty for this role) -->
    <div v-else-if="s" class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
      <div class="mb-4">
        <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface break-words">Today at a glance</h2>
        <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Your nursing shortcuts</p>
      </div>
      <div class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
        <font-awesome-icon :icon="['fas','heart-pulse']" class="text-3xl sm:text-4xl text-secondary/40 mb-3" />
        <p class="text-sm sm:text-base font-semibold text-on-surface">No metrics for your role yet</p>
        <p class="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">Patient and vitals shortcuts are below. Shift metrics will appear here as they come online.</p>
      </div>
    </div>

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
interface NurseDashboard {
  role: string; role_label: string; user: string; generated_at: string
  insights: Record<string, unknown>
}

const { data, loading, error, reload } = useDashboardData<NurseDashboard>()
const s = computed(() => data.value)
const { showSkeleton } = useDelayedLoading(loading)

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

const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Search patient', to: '/patients', icon: ['fas','magnifying-glass'], perm: 'patient_search', primary: true },
  { label: 'Lab referral', to: '/patients', icon: ['fas','flask'], perm: 'lab_referral' },
  { label: 'Inventory', to: '/inventory', icon: ['fas','boxes-stacked'], perm: 'inventory_view' },
  { label: 'Assets', to: '/assets', icon: ['fas','microscope'], perm: 'asset_view' },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>