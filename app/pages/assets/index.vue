<!-- app/pages/assets/index.vue -->
<!-- Dispatcher only: route the user to the correct overview page by role.
     Privileged roles → /assets/overview (full admin register dashboard).
     Everyone else    → /assets/department (their own department dashboard).
     No data endpoints are called here. -->
<template>
  <div class="max-w-[98%] mx-auto py-10 space-y-4">
    <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
    <SkeletonPanel :bars="4" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const PRIVILEGED_ROLES = ['system_administrator', 'bme_lead']

// role comes from client-side auth state → redirect after mount
onMounted(() => {
  const target = PRIVILEGED_ROLES.includes(auth.currentRole) ? '/assets/overview' : '/assets/department'
  navigateTo(target, { replace: true })
})
</script>