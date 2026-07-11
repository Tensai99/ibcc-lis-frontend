<!-- app/layouts/auth.vue -->
<!-- Intentionally minimal — login.vue manages its own background and layout -->
<template>
  <div class="min-h-screen">
    <slot />
    <NotificationCenter />
  </div>
</template>