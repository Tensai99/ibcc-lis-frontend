<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[min(92vw,384px)] pointer-events-none">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2.5">
        <div
          v-for="n in store.items"
          :key="n.id"
          class="toast-item group relative rounded-xl bg-white/95 backdrop-blur-sm
                 shadow-[0_8px_28px_-6px_rgba(25,28,30,0.18),0_2px_8px_-2px_rgba(25,28,30,0.08)]
                 ring-1 ring-black/[0.04] overflow-hidden pointer-events-auto"
          role="alert"
          @mouseenter="store.pause(n.id)"
          @mouseleave="store.resume(n.id)"
        >
          <div class="flex items-start gap-3 p-3.5 pr-8">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
              :class="BADGE_BG[n.type]"
            >
              <font-awesome-icon
                :icon="['fas', ICON[n.type]]"
                class="text-[15px]"
                :class="ICON_CLASS[n.type]"
              />
            </span>
            <div class="min-w-0 flex-1 pt-0.5">
              <p class="text-sm font-bold text-on-surface leading-tight">{{ n.title }}</p>
              <p class="text-sm text-on-surface-variant mt-0.5 break-words leading-snug">{{ n.message }}</p>
            </div>
          </div>

          <button
            type="button"
            class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
                   text-outline hover:text-on-surface hover:bg-black/[0.04] transition-colors"
            aria-label="Dismiss"
            @click="store.dismiss(n.id)"
          >
            <font-awesome-icon :icon="['fas', 'xmark']" class="text-xs" />
          </button>

          <div
            v-if="n.duration > 0"
            class="toast-bar absolute bottom-0 left-0 h-[3px] w-full rounded-b-xl"
            :class="BAR_CLASS[n.type]"
            :style="{ animationDuration: `${n.duration}ms` }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// app/components/NotificationCenter.vue
import { useNotificationsStore, type NotifyType } from '~/stores/notifications'

const store = useNotificationsStore()

// literal maps — no dynamic class string construction (Tailwind JIT safety)
const ICON: Record<NotifyType, string> = {
  success: 'circle-check',
  error: 'circle-exclamation',
  warning: 'triangle-exclamation',
  info: 'circle-info',
}
const BADGE_BG: Record<NotifyType, string> = {
  success: 'bg-ribbon-teal/12',
  error: 'bg-ribbon-red/12',
  warning: 'bg-ribbon-amber/12',
  info: 'bg-ribbon-blue/12',
}
const ICON_CLASS: Record<NotifyType, string> = {
  success: 'text-ribbon-teal',
  error: 'text-ribbon-red',
  warning: 'text-ribbon-amber',
  info: 'text-ribbon-blue',
}
const BAR_CLASS: Record<NotifyType, string> = {
  success: 'bg-ribbon-teal',
  error: 'bg-ribbon-red',
  warning: 'bg-ribbon-amber',
  info: 'bg-ribbon-blue',
}
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  width: 100%;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.94);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(32px) scale(0.92);
}
.toast-move {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-bar {
  transform-origin: left;
  animation-name: toast-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
.toast-item:hover .toast-bar {
  animation-play-state: paused;
}
@keyframes toast-shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move { transition: none; }
  .toast-bar { animation: none; }
}
</style>