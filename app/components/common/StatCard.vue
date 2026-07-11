<!-- app/components/common/StatCard.vue -->
<template>
  <div class="island flex items-start gap-4 overflow-hidden">
    <!-- Icon -->
    <div
      class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      :class="iconBg"
    >
      <font-awesome-icon :icon="icon" :class="iconColor" class="text-base sm:text-lg" />
    </div>
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="stat-card-label truncate">{{ label }}</p>
      <p class="stat-card-value">
        <SkeletonBase v-if="showSkeleton" width="4rem" height="1.5rem" />
        <template v-else>{{ formattedValue }}</template>
      </p>
      <p v-if="sub" class="text-xs sm:text-sm text-on-surface-variant mt-0.5 truncate">{{ sub }}</p>
    </div>
    <!-- Trend badge -->
    <div v-if="trend !== undefined" class="flex-shrink-0">
      <span
        class="badge text-xs"
        :class="trend >= 0 ? 'badge-success' : 'badge-error'"
      >
        <font-awesome-icon :icon="trend >= 0 ? ['fas','arrow-up'] : ['fas','arrow-down']" class="text-xs" />
        {{ Math.abs(trend) }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label:    string
  value:    number | string
  sub?:     string
  icon:     string | string[]
  iconBg?:  string
  iconColor?:string
  trend?:   number
  loading?: boolean
  format?:  'number' | 'currency' | 'percent' | 'text'
}>()

const formattedValue = computed(() => {
  if (props.format === 'currency') {
    return `MWK ${Number(props.value).toLocaleString('en-MW')}`
  }
  if (props.format === 'percent') return `${props.value}%`
  if (typeof props.value === 'number') return props.value.toLocaleString()
  return props.value
})

const iconBg    = computed(() => props.iconBg    || 'bg-primary-fixed')
const iconColor = computed(() => props.iconColor || 'text-primary')

const { showSkeleton } = useDelayedLoading(computed(() => props.loading ?? false))
</script>
