<!-- app/components/common/skeleton/SkeletonDetailHeader.vue -->
<!--
  Mirrors a detail-page profile/header card: avatar + name/subtext lines,
  optional trailing meta lines (used for patient/customer/asset headers).
-->
<template>
  <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex items-center gap-4 overflow-hidden">
    <SkeletonBase width="3.5rem" height="3.5rem" circle />
    <div class="flex-1 min-w-0 space-y-2">
      <SkeletonBase width="45%" height="1.25rem" />
      <SkeletonBase width="30%" height="0.8rem" />
    </div>
    <div v-if="meta" class="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
      <SkeletonBase width="6rem" height="0.8rem" />
      <SkeletonBase width="4rem" height="0.8rem" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  meta?: boolean
}>(), {
  meta: true,
})
</script>
