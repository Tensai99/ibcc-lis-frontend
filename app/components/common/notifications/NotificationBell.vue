<!-- app/components/notifications/NotificationBell.vue -->
<!--
  Bell trigger + dropdown, drop-in replacement for the inline bell block
  that used to live in TopBar.vue.

  UX choices:
    • Unread pill counter (99+ cap), not just a static red dot
    • Header row with title + "Refresh" ghost icon
    • Empty state with icon + explanatory copy — no dead area
    • Up to 7 items in the dropdown, each with icon tile + title + body + time
    • Item click: marks seen, dismisses, routes via composable
    • Footer "See all notifications" → /notifications
    • Same click-outside + Escape behaviour as the user menu
-->
<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger -->
    <button
      class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/50
             flex items-center justify-center text-on-surface
             hover:bg-surface-container-highest transition-colors
             focus:outline-none focus:ring-2 focus:ring-primary/30"
      :aria-expanded="open"
      aria-haspopup="true"
      aria-label="Notifications"
      @click="open = !open"
    >
      <font-awesome-icon :icon="['fas','bell']" class="text-sm sm:text-base" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
               rounded-full bg-error text-white text-[10px] font-bold
               flex items-center justify-center border-2 border-white leading-none"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)]
               bg-white rounded-xl border border-outline-variant/60 z-50
               overflow-hidden shadow-xl"
        style="box-shadow: 0 8px 32px rgba(0,51,153,0.12), 0 2px 8px rgba(0,0,0,0.06);"
      >
        <!-- Header -->
        <div
          class="px-4 py-3 flex items-center justify-between gap-2
                 border-b border-outline-variant/40"
          style="background: linear-gradient(90deg, #eef5fc 0%, #e3eefb 100%);"
        >
          <div class="flex items-center gap-2 min-w-0">
            <font-awesome-icon :icon="['fas','bell']" class="text-primary text-sm" />
            <p class="text-sm font-bold text-on-surface">Notifications</p>
            <span
              v-if="unreadCount > 0"
              class="text-xs font-semibold text-primary bg-primary-fixed
                     px-1.5 py-0.5 rounded-full"
            >
              {{ unreadCount }}
            </span>
          </div>
          <button
            class="w-7 h-7 rounded-lg flex items-center justify-center
                   text-on-surface-variant hover:text-primary
                   hover:bg-white/60 transition-colors disabled:opacity-50"
            :disabled="loading"
            @click="onRefresh"
            aria-label="Refresh notifications"
          >
            <font-awesome-icon
              :icon="['fas','arrows-rotate']"
              class="text-xs"
              :class="{ 'animate-spin': loading }"
            />
          </button>
        </div>

        <!-- List -->
        <div class="max-h-[26rem] overflow-y-auto">
          <template v-if="topItems.length > 0">
            <button
              v-for="n in topItems"
              :key="n.uuid"
              class="w-full text-left flex items-start gap-3 px-4 py-3
                     hover:bg-surface-low transition-colors border-b
                     border-outline-variant/30 last:border-b-0"
              @click="onItemClick(n)"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                :class="iconTileClass(n.urgency)"
              >
                <font-awesome-icon
                  :icon="['fas', iconForType(n.object_type)]"
                  class="text-white text-sm"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-on-surface leading-snug break-words">
                  {{ n.title }}
                </p>
                <p
                  v-if="n.body"
                  class="text-xs text-on-surface-variant mt-1 break-words line-clamp-2"
                >
                  {{ n.body }}
                </p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span
                    class="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    :class="urgencyChipClass(n.urgency)"
                  >
                    {{ n.urgency }}
                  </span>
                  <span class="text-[11px] text-outline">
                    {{ relativeTime(n.created_at) }}
                  </span>
                </div>
              </div>
            </button>
          </template>

          <!-- Empty -->
          <div v-else class="px-6 py-12 flex flex-col items-center text-center gap-3">
            <div class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
              <font-awesome-icon :icon="['fas','bell-slash']" class="text-outline text-xl" />
            </div>
            <div>
              <p class="text-sm font-semibold text-on-surface">You're all caught up</p>
              <p class="text-xs text-on-surface-variant mt-0.5">
                We'll let you know when something needs your attention.
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <NuxtLink
          to="/notifications"
          class="block px-4 py-3 text-center text-sm font-semibold text-primary
                 bg-surface-low hover:bg-primary-fixed transition-colors
                 border-t border-outline-variant/40"
          @click="open = false"
        >
          See all notifications
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { NotificationUrgency, ServerNotification } from '~/composables/useServerNotifications'

const { notifications, loading, refresh, handleClick } = useServerNotifications()

const open        = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const topItems    = computed<ServerNotification[]>(() => notifications.value.slice(0, 7))
const unreadCount = computed(() => notifications.value.length)

function onItemClick(n: ServerNotification) {
  open.value = false
  handleClick(n)
}

async function onRefresh() {
  await refresh()
}

// literal-class helpers
function iconTileClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-ribbon-red'
  if (u === 'medium') return 'bg-ribbon-amber'
  return 'bg-ribbon-blue'
}
function urgencyChipClass(u: NotificationUrgency) {
  if (u === 'critical' || u === 'high') return 'bg-error-container text-error-on-container'
  if (u === 'medium') return 'bg-accent-fixed text-accent-on'
  return 'bg-primary-fixed text-primary-on-fixed'
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
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// click-outside + Escape
function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) open.value = false
}
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>