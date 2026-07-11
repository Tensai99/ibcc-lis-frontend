<!-- app/components/common/skeleton/SkeletonPanel.vue -->
<!--
  Mirrors a chart/distribution panel: heading line + subheading, then a
  few label+bar rows (for donut/bar-chart/progress-list style panels).
-->
<template>
  <div class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
    <div v-if="showTitle" class="mb-4 space-y-2">
      <SkeletonBase width="40%" height="1.1rem" />
      <SkeletonBase width="60%" height="0.75rem" />
    </div>
    <div class="flex flex-col gap-3">
      <div v-for="i in bars" :key="i" class="min-w-0">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <SkeletonBase width="45%" height="0.8rem" />
          <SkeletonBase width="2rem" height="0.8rem" />
        </div>
        <SkeletonBase width="100%" height="0.5rem" rounded="rounded-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  bars?:      number
  showTitle?: boolean
}>(), {
  bars:      4,
  showTitle: true,
})
</script>
