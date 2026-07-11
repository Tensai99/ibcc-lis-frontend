<!-- app/components/BaseModal.vue -->
<!-- Generic modal shell: backdrop + centered (desktop) / bottom-sheet (mobile) panel. -->
<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
  subtitle?: string
  // 'lg' widens the panel for multi-column forms
  size?: 'md' | 'lg'
}>()

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
      >
        <!-- backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

        <!-- panel -->
        <div
          class="relative w-full max-h-[92vh] overflow-y-auto bg-white
                 rounded-t-xl sm:rounded-xl shadow-glass animate-island-in"
          :class="size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'"
        >
          <header
            class="sticky top-0 z-10 bg-island-header px-4 sm:px-6 py-4
                   flex items-start justify-between gap-3 border-b border-outline-variant"
          >
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl font-semibold sm:font-bold text-on-surface break-words">
                {{ title }}
              </h3>
              <p v-if="subtitle" class="text-xs sm:text-sm text-on-surface-variant mt-0.5 break-words">
                {{ subtitle }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 text-on-surface-variant hover:text-on-surface p-1 rounded-md
                     focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Close"
              @click="emit('close')"
            >
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
          </header>

          <div class="p-4 sm:p-6">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>