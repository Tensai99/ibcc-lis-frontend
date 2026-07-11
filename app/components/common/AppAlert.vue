<!-- app/components/AppAlert.vue -->
<template>
  <Transition name="app-alert-fade">
    <div v-if="visible" :class="alertClass" role="alert">
      <font-awesome-icon :icon="alertIcon" class="flex-shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm sm:text-base break-words">{{ title }}</p>
        <p v-if="message" class="text-xs sm:text-sm mt-0.5 break-words opacity-80">{{ message }}</p>
      </div>
      <button v-if="dismissible" @click="visible = false" class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <font-awesome-icon :icon="['fas','xmark']" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?:        'error' | 'warning' | 'success' | 'info'
  title:        string
  message?:     string
  dismissible?: boolean
}>(), {
  type:        'info',
  dismissible: true,
})

// Internal visibility — no v-model dependency, avoids useVModel issues
const visible = ref(true)

// Re-show whenever title/type changes (e.g. new error message set)
watch(() => props.title, () => { visible.value = true })

const alertClass = computed(() => {
  const map: Record<string, string> = {
    error:   'alert-error',
    warning: 'alert-warning',
    success: 'alert-success',
    info:    'alert-info',
  }
  return map[props.type ?? 'info'] ?? 'alert-info'
})

const alertIcon = computed(() => {
  const map: Record<string, [string, string]> = {
    error:   ['fas', 'circle-xmark'],
    warning: ['fas', 'triangle-exclamation'],
    success: ['fas', 'circle-check'],
    info:    ['fas', 'circle-info'],
  }
  return map[props.type ?? 'info'] ?? ['fas', 'circle-info']
})
</script>

<style scoped>
.app-alert-fade-enter-active,
.app-alert-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.app-alert-fade-enter-from,
.app-alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>