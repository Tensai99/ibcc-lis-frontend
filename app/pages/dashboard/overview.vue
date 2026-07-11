<!-- app/pages/dashboard/overview.vue -->
<template>
  <div class="space-y-4 sm:space-y-5 animate-fade-in">

    <!-- Welcome -->
    <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
      <div class="mb-4">
        <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface">Welcome</h2>
        <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">Use the actions below to get started</p>
      </div>
      <div class="py-8 sm:py-10 flex flex-col items-center justify-center text-center">
        <font-awesome-icon :icon="['fas','gauge']" class="text-3xl sm:text-4xl text-tertiary/40 mb-3" />
        <p class="text-sm sm:text-base font-semibold text-on-surface">No role dashboard configured</p>
        <p class="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">Your most-used actions are listed below. A tailored dashboard can be added for your role on request.</p>
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
const auth = useAuthStore()
const { can } = usePermission()
const greeting = computed(() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' })
const displayName = computed(() => auth.user?.full_name ?? 'there')
const roleLabel = computed(() => auth.user?.role_label ?? '')
const department = computed(() => auth.user?.department ?? '')

const RIBBON_ICON = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const ACTIONS: Array<{ label: string; to: string; icon: [string,string]; perm: string; primary?: boolean }> = [
  { label: 'Register customer', to: '/customers?action=register', icon: ['fas','user-plus'], perm: 'customer_registration', primary: true },
  { label: 'Search patient', to: '/patients', icon: ['fas','magnifying-glass'], perm: 'patient_search' },
  { label: 'Lab referral', to: '/patients', icon: ['fas','flask'], perm: 'lab_referral' },
  { label: 'New invoice', to: '/billing?action=new', icon: ['fas','file-invoice-dollar'], perm: 'billing_create' },
  { label: 'Inventory', to: '/inventory', icon: ['fas','boxes-stacked'], perm: 'inventory_view' },
  { label: 'Assets', to: '/assets', icon: ['fas','microscope'], perm: 'asset_view' },
]
const quickActions = computed(() => ACTIONS.filter(a => can(a.perm)))
</script>