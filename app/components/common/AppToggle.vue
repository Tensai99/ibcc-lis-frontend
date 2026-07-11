<!-- app/components/AppToggle.vue -->
<!--
  Accessible on/off switch. v-model is a boolean.
  ON  → primary blue gradient (matches sidebar icon circles).
  OFF → surface-container-high track.
  Props: disabled, size ('sm' | 'md').
-->
<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="relative inline-flex flex-shrink-0 items-center rounded-full transition-colors duration-200
           focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
    :class="size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'"
    :style="modelValue
      ? 'background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%);'
      : ''"
    :data-off="!modelValue"
    @click="!disabled && emit('update:modelValue', !modelValue)"
  >
    <span
      class="inline-block transform rounded-full bg-white shadow transition-transform duration-200"
      :class="[
        size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
        modelValue
          ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5')
          : 'translate-x-0.5',
      ]"
    />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  disabled?:  boolean
  size?:      'sm' | 'md'
}>(), { disabled: false, size: 'md' })

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
/* OFF-state track uses the theme token via a data attribute so the inline
   gradient (ON) and the token class (OFF) don't fight over specificity. */
button[data-off='true'] { background-color: var(--color-surface-container-high, #d9dde1); }
</style>