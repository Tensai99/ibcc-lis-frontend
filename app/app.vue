<!-- app/app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Hydrate auth store from localStorage as early as possible
const auth = useAuthStore()
if (import.meta.client) auth.hydrate()
</script>
