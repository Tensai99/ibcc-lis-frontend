// app/composables/useDelayedLoading.ts
import { ref, watch, onScopeDispose, type Ref } from 'vue'

const SKELETON_DELAY_MS = 500
const PROGRESS_BAR_DELAY_MS = 10_000

/**
 * Derives skeleton/progress-bar visibility from a loading flag without
 * touching the flag itself. Guards against flashing a skeleton on fast
 * loads (< 500ms) and swaps to an indeterminate progress bar past 10s.
 */
export const useDelayedLoading = (loading: Ref<boolean>) => {
  const showSkeleton = ref(false)
  const showProgressBar = ref(false)

  let skeletonTimer: ReturnType<typeof setTimeout> | undefined
  let progressTimer: ReturnType<typeof setTimeout> | undefined

  const clearTimers = () => {
    clearTimeout(skeletonTimer)
    clearTimeout(progressTimer)
    skeletonTimer = undefined
    progressTimer = undefined
  }

  watch(loading, (isLoading) => {
    clearTimers()
    if (isLoading) {
      skeletonTimer = setTimeout(() => { showSkeleton.value = true }, SKELETON_DELAY_MS)
      progressTimer = setTimeout(() => { showProgressBar.value = true }, PROGRESS_BAR_DELAY_MS)
    } else {
      showSkeleton.value = false
      showProgressBar.value = false
    }
  }, { immediate: true })

  onScopeDispose(clearTimers)

  return { showSkeleton, showProgressBar }
}
