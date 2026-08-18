<!-- app/components/notifications/ServerNotificationToaster.vue -->
<!--
  Bottom-right toast stack for freshly-arrived server notifications.
  Distinct from the apiService error-toast store (~/stores/notifications) —
  this one only surfaces polled notifications from /notifications.

  UX choices (modern in-app toast conventions):
    • Bottom-right anchor, stack grows upward, gap between cards
    • Colored left accent per urgency (ribbon palette)
    • Icon tile + title + body + relative time
    • Auto-dismiss after 8s (in composable) but pauses when hovered
    • Click card → route to object; explicit × to dismiss
    • Progress bar drains 8s so users know when it'll disappear
    • On mobile: full-width minus 1rem, stacks the same way
-->
<template>
  <div
    aria-live="polite"
    class="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto sm:w-96
           flex flex-col-reverse gap-2 pointer-events-none"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto relative overflow-hidden
               bg-white rounded-xl shadow-lg border border-outline-variant/50
               cursor-pointer group"
        :class="accentBorderClass(t.notification.urgency)"
        @click="onCardClick(t.id, t.notification)"
      >
        <!-- Body -->
        <div class="flex items-start gap-3 p-3 pr-9">
          <!-- Icon tile -->
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            :class="iconTileClass(t.notification.urgency)"
          >
            <font-awesome-icon
              :icon="['fas', iconForType(t.notification.object_type)]"
              class="text-white text-sm"
            />
          </div>

          <!-- Text -->
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-on-surface leading-snug break-words">
              {{ t.notification.title }}
            </p>
            <p
              v-if="t.notification.body"
              class="text-xs text-on-surface-variant mt-1 break-words line-clamp-2"
            >
              {{ t.notification.body }}
            </p>
            <p class="text-[11px] text-outline mt-1.5">
              {{ relativeTime(t.notification.created_at) }}
            </p>
          </div>
        </div>

        <!-- Dismiss -->
        <button
          class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
                 text-outline hover:text-on-surface hover:bg-surface-low transition-colors"
          aria-label="Dismiss"
          @click.stop="dismissToast(t.id)"
        >
          <font-awesome-icon :icon="['fas','xmark']" class="text-xs" />
        </button>

        <!-- Drain bar -->
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-container">
          <div
            class="h-full origin-left animate-toast-drain"
            :class="drainBarClass(t.notification.urgency)"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { NotificationUrgency, ServerNotification } from '~/composables/useServerNotifications'

const { toasts, dismissToast, handleClick } = useServerNotifications()

function onCardClick(id: string, n: ServerNotification) {
  dismissToast(id)
  handleClick(n)
}

// literal class strings only — no dynamic concatenation
function accentBorderClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'border-l-4 border-l-ribbon-red'
  if (u === 'medium') return 'border-l-4 border-l-ribbon-amber'
  return 'border-l-4 border-l-ribbon-blue'
}
function iconTileClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber'
  return 'bg-ribbon-blue'
}
function drainBarClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber'
  return 'bg-ribbon-blue'
}
function iconForType(t: string) {
  if (t === 'customer_proforma_invoice') return 'file-invoice-dollar'
  if (t === 'customer_quotation')        return 'file-invoice'
  if (t === 'asset')                     return 'boxes-stacked'
  if (t === 'inventory')                 return 'warehouse'
  if (t === 'patient_visit')             return 'user-doctor'
  if (t === 'laboratory_order_test_result') return 'flask-vial'
  return 'bell'
}
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Math.floor((Date.now() - then) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

.toast-enter-active,
.toast-leave-active { transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.toast-enter-from  { opacity: 0; transform: translateX(120%); }
.toast-leave-to    { opacity: 0; transform: translateX(120%); }
.toast-move        { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }

@keyframes toast-drain {
  0%   { transform: scaleX(1); }
  100% { transform: scaleX(0); }
}
.animate-toast-drain {
  animation: toast-drain 8s linear forwards;
}

/* pause the drain (and, by extension, prolong perceived life) while hovered */
.group:hover .animate-toast-drain {
  animation-play-state: paused;
}
</style>