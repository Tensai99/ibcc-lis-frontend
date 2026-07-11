<!-- app/components/common/skeleton/SkeletonBase.vue -->
<!--
  Primitive skeleton block. All other Skeleton* components compose this.
  Shimmer sweeps left-to-right; motion-reduce disables it but keeps the
  neutral block so loading is still communicated.
-->
<template>
  <span
    class="relative inline-block overflow-hidden bg-outline-variant/25"
    :class="circle ? 'rounded-full' : rounded"
    :style="{ width, height }"
    role="status"
    aria-busy="true"
    aria-hidden="true"
  >
    <span
      class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer motion-reduce:animate-none motion-reduce:hidden"
    />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?:   string
  height?:  string
  circle?:  boolean
  rounded?: string
}>(), {
  width:   '100%',
  height:  '1rem',
  circle:  false,
  rounded: 'rounded-md',
})
</script>
