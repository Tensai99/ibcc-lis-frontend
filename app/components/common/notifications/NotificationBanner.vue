<!-- app/components/notifications/NotificationBanner.vue -->
<!--
  Contextual banner that appears just under the TopBar on the page the user
  was redirected to after clicking a notification.

  Behaviour:
    • Renders only when useServerNotifications().lastOpenedBanner is set AND
      the current route path matches the target path recorded at click time.
    • Auto-dismisses after NUXT_PUBLIC_NOTIF_BANNER_TTL_MS (default 12s).
    • User can dismiss with the × or by navigating elsewhere.
    • Ribbon-colored left accent + icon tile mirror the notification's urgency,
      so the banner reads at a glance without adding another color language.
-->
<template>
  <Transition name="banner-slide">
    <div
      v-if="visible && banner"
      class="banner"
      :class="ribbonBorderClass(banner.notification.urgency)"
      role="status"
      aria-live="polite"
    >
      <!-- Icon tile -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="iconTileClass(banner.notification.urgency)"
      >
        <font-awesome-icon
          :icon="['fas', iconForType(banner.notification.object_type)]"
          class="text-white text-sm"
        />
      </div>

      <!-- Text -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            :class="urgencyChipClass(banner.notification.urgency)"
          >
            {{ banner.notification.urgency }}
          </span>
          <p class="text-sm font-semibold text-on-surface break-words">
            {{ banner.notification.title }}
          </p>
        </div>
        <p
          v-if="banner.notification.body"
          class="text-xs text-on-surface-variant mt-1 break-words"
        >
          {{ banner.notification.body }}
        </p>
      </div>

      <!-- Dismiss -->
      <button
        type="button"
        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
               text-outline hover:text-on-surface hover:bg-surface-low transition-colors"
        aria-label="Dismiss banner"
        @click="dismissBanner"
      >
        <font-awesome-icon :icon="['fas','xmark']" class="text-sm" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { NotificationUrgency } from '~/composables/useServerNotifications'

const { lastOpenedBanner, dismissBanner } = useServerNotifications()
const route = useRoute()

const banner = computed(() => lastOpenedBanner.value)

// Only show the banner on the exact target page (path match) — if the user
// navigates elsewhere, the banner drops out automatically.
const visible = computed(() =>
  !!banner.value && route.path === banner.value.targetPath
)

// Auto-clear when the user navigates away from the target — keeps state tidy
watch(visible, (v, prev) => {
  if (prev && !v) dismissBanner()
})

// ── literal-class helpers ─────────────────────────────────────────────────
function ribbonBorderClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'border-l-4 border-l-ribbon-red'
  if (u === 'medium') return 'border-l-4 border-l-ribbon-amber'
  return 'border-l-4 border-l-ribbon-blue'
}
function iconTileClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber'
  return 'bg-ribbon-blue'
}
function urgencyChipClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red/15 text-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-blue/15 text-ribbon-blue'
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
</script>

<style scoped>

.banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  margin: 0.75rem 1rem 0 1rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(61, 127, 191, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.banner-slide-enter-active { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease; }
.banner-slide-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.banner-slide-enter-from   { transform: translateY(-12px); opacity: 0; }
.banner-slide-leave-to     { transform: translateY(-8px);  opacity: 0; }
</style>