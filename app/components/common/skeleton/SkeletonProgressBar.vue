<!-- app/components/common/skeleton/SkeletonProgressBar.vue -->
<!--
  Fallback for loads exceeding ~10s (see useDelayedLoading's showProgressBar).
  A skeleton no longer reads as "almost there" past that point — an
  indeterminate bar sets better expectations for a genuinely slow request.
-->
<template>
  <div class="w-full h-1 rounded-full bg-outline-variant/25 overflow-hidden" role="status" aria-busy="true">
    <div class="h-full w-1/3 rounded-full bg-primary animate-progress-indeterminate motion-reduce:animate-none motion-reduce:w-full motion-reduce:opacity-40" />
  </div>
</template>
