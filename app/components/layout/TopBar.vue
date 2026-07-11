<!-- app/components/layout/TopBar.vue -->
<!--
  Right-side user menu replaces the old sidebar profile + sign-out footer.

  Interaction model:
    • Clicking the trigger (avatar + name + chevron) toggles the dropdown.
    • Clicking outside (useClickOutside via onMounted listener) closes it.
    • Keyboard: Escape closes; Tab naturally leaves the open menu.

  Dropdown items:
    1. Settings  → /admin/settings  (always shown — user can always reach their own prefs)
    2. Sign Out  → calls logout(), same logic previously in Sidebar footer

  Design notes:
    • Avatar circle uses a gradient derived from the user's initials as a subtle
      personalisation without needing an uploaded photo.
    • role_label badge sits inside the dropdown header so it's visible but not
      cluttering the top bar on narrow screens.
    • Chevron rotates 180° when open for a polished affordance cue.
    • Dropdown animates in with the existing `.dropdown-*` transition classes.
-->
<template>
  <header class="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-md shadow-sm gap-3 flex-shrink-0 min-w-0">

    <!-- ── Left: hamburger + title + search ──────────────────────────── -->
    <div class="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">

      <!-- Hamburger (mobile) -->
      <button
        class="lg:hidden text-on-surface-variant hover:text-primary p-1 -ml-1 flex-shrink-0 transition-colors"
        @click="$emit('toggle-sidebar')"
        aria-label="Open menu"
      >
        <font-awesome-icon :icon="['fas','bars']" class="text-lg" />
      </button>

      <!-- Page title -->
      <h1 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface truncate hidden sm:block flex-shrink-0">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- ── Right: bell + quick action + user menu ────────────────────── -->
    <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">

      <!-- Notification bell -->
      <button class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/50 flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors">
        <font-awesome-icon :icon="['fas','bell']" class="text-sm sm:text-base" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
      </button>

      <!-- ── User menu ───────────────────────────────────────────────── -->
      <!-- Wrapping div provides the click-outside boundary via ref -->
      <div class="relative" ref="userMenuContainer">

        <!--
          Trigger button: avatar initials circle + full name + animated chevron.
          The name is hidden on very small screens (xs) to avoid overflow;
          the avatar alone still indicates a clickable account area.
        -->
        <button
          class="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full
                 hover:bg-surface-container transition-colors duration-200
                 focus:outline-none focus:ring-2 focus:ring-primary/30"
          :aria-expanded="userMenuOpen"
          aria-haspopup="true"
          @click="userMenuOpen = !userMenuOpen"
        >
          <!-- Avatar: gradient circle with user initials -->
          <div
            class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                   text-white text-xs sm:text-sm font-bold flex-shrink-0 select-none"
            style="background: linear-gradient(135deg, #FFA500 0%, #DB9D00 100%); box-shadow: 0 2px 8px rgba(0,80,203,0.30);"
          >
            {{ initials }}
          </div>

          <!-- Name — hidden on xs, visible sm+ -->
          <span class="hidden sm:block text-sm font-semibold text-on-surface max-w-[140px] truncate">
            {{ auth.user?.full_name }}
          </span>

          <!-- Chevron rotates when menu is open -->
          <font-awesome-icon
            :icon="['fas','chevron-down']"
            class="text-xs text-on-surface-variant transition-transform duration-200"
            :class="{ 'rotate-180': userMenuOpen }"
          />
        </button>

        <!-- Dropdown panel -->
        <Transition name="dropdown">
          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl
                   border border-outline-variant/60 z-50 overflow-hidden"
            style="box-shadow: 0 8px 32px rgba(0,51,153,0.12), 0 2px 8px rgba(0,0,0,0.06);"
          >
            <!-- Header: name + role badge — gives context at a glance -->
            <div
              class="px-4 py-3 flex items-center gap-3"
              style="background: linear-gradient(90deg, #f0f5ff 0%, #FFE4B3 100%); border-bottom: 1px solid rgba(194,198,216,0.50);"
            >
              <!-- Larger avatar for the dropdown header -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center
                       text-white text-sm font-bold flex-shrink-0 select-none"
                style="background: linear-gradient(135deg, #FFA500 0%, #DB9D00 100%); box-shadow: 0 2px 8px rgba(0,80,203,0.30);"
              >
                {{ initials }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-on-surface truncate">{{ auth.user?.full_name }}</p>
                <p class="text-xs text-on-surface-variant truncate mt-0.5">{{ auth.user?.email ?? auth.user?.username }}</p>
                <!-- Role badge -->
                <span
                  v-if="auth.user?.role_label"
                  class="inline-block mt-1 text-xs font-semibold text-[#614500] bg-[#DB9D00]/50 px-2 py-0.5 rounded-full truncate max-w-full"
                >
                  {{ auth.user?.role_label }}
                </span>
              </div>
            </div>

            <!-- Menu items -->
            <div class="py-1.5">

              <!-- Settings -->
              <NuxtLink
                to="/admin/settings"
                class="flex items-center gap-3 px-4 py-2.5
                       text-sm font-medium text-on-surface
                       hover:bg-surface-low transition-colors duration-150"
                @click="userMenuOpen = false"
              >
                <div class="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                  <font-awesome-icon :icon="['fas','gear']" class="text-on-surface-variant text-xs" />
                </div>
                <span>Settings</span>
              </NuxtLink>

              <!-- Divider -->
              <div class="my-1 mx-3 border-t border-outline-variant/40" />

              <!-- Sign Out — uses error colour to signal a destructive/exit action -->
              <button
                class="w-full flex items-center gap-3 px-4 py-2.5
                       text-sm font-medium text-error
                       hover:bg-error-container/40 transition-colors duration-150"
                @click="logout"
              >
                <div class="w-7 h-7 rounded-lg bg-error-container/60 flex items-center justify-center flex-shrink-0">
                  <font-awesome-icon :icon="['fas','right-from-bracket']" class="text-error text-xs" />
                </div>
                <span>Sign Out</span>
              </button>

            </div>
          </div>
        </Transition>

      </div>
      <!-- ── /user menu ──────────────────────────────────────────────── -->

    </div>

  </header>
</template>

<script setup lang="ts">
import { parseFhirBundle, type FhirPatient } from '~/composables/useFhir'

const emit = defineEmits(['toggle-sidebar'])
const auth   = useAuthStore()
const { can } = usePermission()
const route   = useRoute()
const router  = useRouter()

const canSearch = computed(() => can('patient_search'))

// ── User menu ──────────────────────────────────────────────────────────────
const userMenuOpen     = ref(false)
const userMenuContainer = ref<HTMLElement | null>(null)

/** Two-letter initials derived from full_name, falling back to username. */
const initials = computed(() => {
  const name = auth.user?.full_name ?? auth.user?.username ?? ''
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('')
})

const logout = async () => {
  userMenuOpen.value = false
  try {
    const { request } = useApi()
    await request('/session', { method: 'DELETE' })
  } catch { /* ignore network errors on logout */ }
  auth.clear()
  router.push('/login')
}

// ── Page title ─────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':           'Dashboard Overview',
  '/customers':           'Customers Management',
  '/patients':            'Patient Management',
  '/patients/encounters': 'Encounters',
  '/billing':             'Billing',
  '/billing/reports':     'Revenue Reports',
  '/inventory':           'Inventory Management',
  '/inventory/disposals': 'Disposals',
  '/assets':           'Assets Management',
  '/admin/users':         'Administration',
  '/admin/system':        'System Settings',
  '/admin/settings':      'Settings',
}
const pageTitle = computed(() => {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (route.path === path || (path !== '/dashboard' && route.path.startsWith(path))) return title
  }
  return 'Dashboard Overview'
})

// ── Patient search ─────────────────────────────────────────────────────────
const searchQuery     = ref('')
const results         = ref<FhirPatient[]>([])
const totalResults    = ref(0)
const searching       = ref(false)
const showDropdown    = ref(false)
const searchContainer = ref<HTMLElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const onSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (searchQuery.value.length < 2) {
    results.value = []; totalResults.value = 0
    showDropdown.value = searchQuery.value.length > 0
    return
  }
  showDropdown.value = true
  debounceTimer = setTimeout(doSearch, 350)
}

const doSearch = async () => {
  if (searchQuery.value.length < 2) return
  searching.value = true
  try {
    const { request } = useApi()
    const data = await request<Record<string,unknown>>(
      `/patients/search?q=${encodeURIComponent(searchQuery.value)}`
    )
    if (data?.resourceType === 'Bundle') {
      const pts = parseFhirBundle(data)
      results.value = pts.slice(0, 8)
      totalResults.value = (data.total as number) ?? pts.length
    } else if (Array.isArray(data)) {
      results.value = data as unknown as FhirPatient[]
      totalResults.value = results.value.length
    }
  } catch { results.value = [] }
  finally { searching.value = false }
}

const selectPatient   = (p: FhirPatient) => { closeSearch(); router.push(`/patients/${p.id}`) }
const goToFirstResult = () => {
  if (results.value.length) { const p = results.value[0]; if (p) selectPatient(p) }
  else if (searchQuery.value.length >= 2) { closeSearch(); router.push(`/patients?q=${encodeURIComponent(searchQuery.value)}`) }
}
const closeSearch = () => { showDropdown.value = false; searchQuery.value = ''; results.value = [] }

// ── Click-outside handler (closes both dropdowns) ─────────────────────────
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  if (searchContainer.value && !searchContainer.value.contains(target)) {
    showDropdown.value = false
  }
  if (userMenuContainer.value && !userMenuContainer.value.contains(target)) {
    userMenuOpen.value = false
  }
}
onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>

<style scoped>
.dropdown-enter-active,.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from,.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>