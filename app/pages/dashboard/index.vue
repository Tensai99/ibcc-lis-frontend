<!-- app/pages/dashboard/index.vue -->
<!--
  /dashboard dispatcher. Bare "/dashboard" has no view of its own — it forwards to
  the laboratory (LIS) dashboard for the current role:
    • system_administrator + lab_technician → /dashboard/laboratory-admin
    • every other role                       → /dashboard/laboratory
  This catches deep links, bookmarks, and any auth guard that stashed
  redirect=/dashboard, so the "No match for /dashboard" warning can't recur.

  Note: this mirrors the resolver in login.vue + Sidebar.vue. Once
  dashboardPathForRole() in useDashboard.ts is confirmed to return these
  laboratory paths, swap the inline block below for:
      await navigateTo(dashboardPathForRole(auth.currentRole), { replace: true })
-->
<script setup lang="ts">
const auth = useAuthStore()

const LAB_ADMIN_ROLES = ['system_administrator', 'lab_technician']
const target = LAB_ADMIN_ROLES.includes(auth.currentRole)
  ? '/dashboard/laboratory-admin'
  : '/dashboard/laboratory'

// redirect before paint (runs on both server and client navigation);
// replace: true so the browser back button doesn't bounce back to /dashboard.
await navigateTo(target, { replace: true })
</script>

<template>
  <div />
</template>