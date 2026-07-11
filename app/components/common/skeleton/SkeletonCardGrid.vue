<!-- app/components/common/skeleton/SkeletonCardGrid.vue -->
<!--
  Mirrors the patient/customer/asset result-card shape: avatar circle,
  name + subtext lines, a couple of detail rows. `gridClass` should match
  the caller's real grid so the layout doesn't shift once data arrives.
-->
<template>
  <div class="grid gap-5 pb-2" :class="gridClass">
    <div
      v-for="i in count"
      :key="i"
      class="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-island"
    >
      <div class="flex items-center gap-3 mb-4">
        <SkeletonBase width="3rem" height="3rem" circle />
        <div class="flex-1 min-w-0 space-y-2">
          <SkeletonBase width="70%" height="0.95rem" />
          <SkeletonBase width="45%" height="0.75rem" />
        </div>
      </div>
      <div class="space-y-2.5">
        <SkeletonBase width="100%" height="0.75rem" />
        <SkeletonBase width="85%" height="0.75rem" />
        <SkeletonBase width="60%" height="0.75rem" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?:     number
  gridClass?: string
}>(), {
  count:     6,
  gridClass: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
})
</script>
