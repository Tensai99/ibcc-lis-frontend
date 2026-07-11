<!-- app/pages/dashboard/index.vue -->
<!--
  /dashboard is now a dispatcher. It reads the authenticated role and replaces
  the route with that role's dashboard (see useDashboard → dashboardPathForRole).
  The previous monolithic app/pages/dashboard.vue has been split into the
  per-role pages in this folder and should be deleted.
-->
<template>
  <div class="animate-fade-in space-y-4">
    <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
    <SkeletonPanel :bars="4" />
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()

// Redirect on the client (auth is hydrated from localStorage there).
onMounted(() => {
  navigateTo(dashboardPathForRole(auth.user?.role), { replace: true })
})
</script>