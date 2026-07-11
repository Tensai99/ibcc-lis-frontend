<!-- app/components/common/AccessDenied.vue -->
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
    <div class="text-center p-8 max-w-sm">
      <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
        <font-awesome-icon :icon="['fas','lock']" class="text-2xl text-error" />
      </div>
      <h2 class="text-xl font-bold text-on-surface mb-2">Access Denied</h2>
      <p class="text-sm text-on-surface-variant mb-6">
        You don't have permission to view this page.<br />
        Redirecting to dashboard…
      </p>
      <NuxtLink to="/dashboard" class="btn-primary">
        <font-awesome-icon :icon="['fas','gauge']" /> Go to Dashboard
      </NuxtLink>
    </div>
  </div>
</template>
