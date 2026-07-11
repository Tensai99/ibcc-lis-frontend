<!-- app/components/common/Modal.vue -->
<!--
  Global modal — sized entirely by the consumer:
    • No built-in width/height — pass a class (e.g. "w-[640px] max-w-[95vw]")
      or max-h-* directly on <Modal> to control dimensions.
    • rounded-[2rem] card
    • backdrop-filter: blur(8px) + dark rgba overlay
    • bg-white/50 header + footer with border-outline-variant/20 dividers
    • IBCC logo + title in header (optional via `showLogo` prop)
    • Spring scale-in animation (cubic-bezier 0.34,1.56,0.64,1)
    • body: p-6 sm:p-8 scrollable
-->
<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); background: rgba(25,28,30,0.42);"
        @mousedown.self="onBackdropClick"
      >
        <Transition name="modal-scale">
          <div
            v-if="modelValue"
            class="relative bg-surface-bright w-full overflow-hidden flex flex-col"
            :class="panelClass"
            style="
              border-radius: 2rem;
              max-height: 92vh;
              box-shadow: 0 24px 60px rgba(0,51,153,0.18), 0 8px 24px rgba(0,0,0,0.10);
              border: 1px solid rgba(255,255,255,0.40);
            "
          >

            <!-- ── Header ──────────────────────────────────────────────── -->
            <div
              class="flex items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-outline-variant/20 flex-shrink-0"
              style="background: rgba(255,255,255,0.50);"
            >
              <div class="flex items-center gap-4 min-w-0">
                <!-- Optional IBCC logo -->
                <img
                  v-if="showLogo"
                  src="/images/ibcc_logo.png"
                  alt="IBCC"
                  class="h-20 w-auto object-contain flex-shrink-0"
                  @error="($event.target as HTMLImageElement).style.display='none'"
                />
                <div class="min-w-0">
                  <h2 class="text-base sm:text-lg font-bold text-primary leading-tight break-words">
                    {{ title }}
                  </h2>
                  <p v-if="subtitle" class="text-xs text-on-surface-variant mt-0.5">{{ subtitle }}</p>
                </div>
              </div>
              <button
                class="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors flex-shrink-0"
                @click="$emit('update:modelValue', false)"
              >
                <font-awesome-icon :icon="['fas','xmark']" class="text-outline text-sm" />
              </button>
            </div>

            <!-- ── Body ───────────────────────────────────────────────── -->
            <div class="flex-1 overflow-y-auto p-6 sm:p-8">
              <slot />
            </div>

            <!-- ── Footer ─────────────────────────────────────────────── -->
            <div
              v-if="$slots.footer"
              class="flex-shrink-0 px-6 sm:px-8 py-5 border-t border-outline-variant/20 flex flex-wrap items-center justify-end gap-3"
              style="background: rgba(255,255,255,0.50);"
            >
              <slot name="footer" />
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// Root is <Teleport>, so a consumer-passed `class` can't auto-inherit onto the
// panel. Disable auto-inheritance and forward it explicitly via panelClass.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue:       boolean
  title:            string
  subtitle?:        string    // optional subheading under title
  showLogo?:        boolean   // show IBCC logo in header (default true)
  closeOnBackdrop?: boolean
}>(), {
  showLogo:         true,
  closeOnBackdrop:  true,
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()

// Forward any class the consumer passes directly onto the panel.
const panelClass = computed(() => (attrs.class as string | undefined) ?? '')

const onBackdropClick = () => {
  if (props.closeOnBackdrop) emit('update:modelValue', false)
}
</script>

<style scoped>
/* Overlay fade */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to     { opacity: 0; }

/* Card spring scale-in */
.modal-scale-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}
.modal-scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-scale-enter-from { transform: scale(0.92); opacity: 0; }
.modal-scale-leave-to   { transform: scale(0.95); opacity: 0; }
</style>