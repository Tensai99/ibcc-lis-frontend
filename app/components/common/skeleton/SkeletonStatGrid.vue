<!-- app/components/common/skeleton/SkeletonStatGrid.vue -->
<!--
  Mirrors the KPI-tile grid used across dashboards: icon block top-right,
  label line, value line. Pass the caller's exact grid-cols classes via
  `gridClass` so the skeleton occupies the identical layout as the real tiles.
-->
<template>
  <div class="grid gap-3 sm:gap-4" :class="gridClass">
    <div
      v-for="i in count"
      :key="i"
      class="rounded-xl p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-col justify-between overflow-hidden"
    >
      <div class="flex items-start justify-between gap-2">
        <SkeletonBase width="65%" height="0.85rem" />
        <SkeletonBase width="2.25rem" height="2.25rem" circle />
      </div>
      <div class="mt-3">
        <SkeletonBase width="45%" height="1.75rem" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?:     number
  gridClass?: string
}>(), {
  count:     4,
  gridClass: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
})
</script>
