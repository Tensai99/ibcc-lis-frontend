<!-- app/components/layout/Sidebar.vue -->
<!--
  Sidebar glass matches login right panel: rgba(255,255,255,0.75) + blur(20px).
  Active LEAF item: pure white pill that bleeds into the white main content area —
  the two concave corners use the main-area fill (#eceef0) to carve the cutout.

  ── Group behaviour (Settings) ───────────────────────────────────────────────
  • When a group is ACTIVE (you're on one of its routes), the PARENT row and the
    ACTIVE CHILD render as ONE continuous white bleed pill — a single cutout with
    the top concave corner above "Settings" and the bottom concave corner below
    the active child. (See the design sketch: Settings + Billing in one blob.)
  • The remaining sibling pages reveal on HOVER, as muted indented rows beneath
    the pill — so you can still jump to Customers / Departments / Users.
  • When the group is INACTIVE, the parent is a normal row and hovering reveals
    all children as muted rows.
  • Adding a sub-page = append ONE line to the `children` array below.

  ── Dashboard link ───────────────────────────────────────────────────────────
  • The Dashboard link now points at the CURRENT ROLE's dashboard
    (dashboardPathForRole → useDashboard.ts), so admins land on the admin view,
    inventory officers on the inventory view, etc.
-->
<template>
  <nav class="flex flex-col h-full" style="
      overflow: visible;
      background-color: #ffffffbf;
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
    ">

    <!-- ── Logo ──────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-center px-4 pt-5 pb-5 flex-shrink-0">
      <img src="/images/ibcc_logo.png" alt="IBCC" class="object-contain"
        style="height: 100px; width: auto; max-width: 100%;"
        @error="($event.target as HTMLImageElement).style.display = 'none'" />
    </div>

    <!-- Divider -->
    <div class="mx-4 mb-1 flex-shrink-0 h-[1px] bg-surface-container" />

    <!-- ── Navigation ─────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col" style="
        padding-top: 22px;
        padding-bottom: 8px;
        overflow-y: auto;
        overflow-x: clip;
        min-height: 0;
      ">
      <template v-for="item in navItems" :key="item.label">

        <!-- ════════════════════════════════════════════════════════════════
             GROUP (has children) — e.g. Settings
        ═════════════════════════════════════════════════════════════════ -->
        <div v-if="item.children" @mouseenter="hovered = item.label" @mouseleave="hovered = null">
          <!-- ╔══════════════════════════════════════════════════════════════╗
               ║ ACTIVE GROUP — one continuous bleed pill (parent + active     ║
               ║ child). Concave corners wrap the WHOLE block, top and bottom. ║
               ╚══════════════════════════════════════════════════════════════╝ -->
          <template v-if="groupActive(item)">
            <div class="relative my-1">
              <!-- concave corner: top (above the parent row) -->
              <div class="absolute -top-[20px] right-0 w-5 h-5 pointer-events-none z-10">
                <div class="w-full h-full rounded-br-[1.25rem]"
                  style="background: transparent; box-shadow: 6px 6px 0 6px #eceef0;" />
              </div>

              <!-- the single white surface holding parent + active child -->
              <div class="bg-surface-container rounded-l-[1.6rem] ml-4 py-1.5">
                <!-- Parent (Settings) -->
                <NuxtLink :to="groupRoot(item)" class="flex items-center gap-2.5 px-3 py-1.5" @click="$emit('close')">
                  <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%);
                           box-shadow: 0 2px 8px rgba(0,80,203,0.35), inset 0 1px 0 rgba(255,255,255,0.20);">
                    <font-awesome-icon :icon="item.icon" class="text-white text-sm" />
                  </div>
                  <span class="text-on-surface text-xs sm:text-sm font-bold flex-1 truncate">{{ item.label }}</span>
                  <!-- chevron hints there are more pages to reveal on hover -->
                  <font-awesome-icon :icon="['fas', 'chevron-down']"
                    class="text-[0.65rem] mr-2 text-on-surface-variant transition-transform duration-300"
                    :class="hovered === item.label ? 'rotate-180' : ''" />
                </NuxtLink>

                <!-- Active child (always visible inside the pill) -->
                <NuxtLink v-for="child in activeChildren(item)" :key="child.to" :to="child.to"
                  class="flex items-center gap-2.5 pl-7 pr-3 py-1.5" @click="$emit('close')">
                  <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #FF5CFF 0%, #D100D1 100%);
                           box-shadow: 0 2px 8px #0050cb59, inset 0 1px 0 #ffffff33;">
                    <font-awesome-icon :icon="child.icon" class="text-white text-[0.7rem]" />
                  </div>
                  <span class="text-on-surface text-xs sm:text-sm font-bold flex-1 truncate">{{ child.label }}</span>
                </NuxtLink>
              </div>

              <!-- concave corner: bottom (below the active child) -->
              <div class="absolute -bottom-[20px] right-0 w-5 h-5 pointer-events-none z-10">
                <div class="w-full h-full rounded-tr-[1.25rem]"
                  style="background: transparent; box-shadow: 6px -6px 0 6px #eceef0;" />
              </div>
            </div>

            <!-- Sibling pages — revealed on hover, beneath the pill -->
            <div class="grid transition-[grid-template-rows] bg-surface duration-300 ease-out"
              :style="{ gridTemplateRows: hovered === item.label ? '1fr' : '0fr' }">
              <div class="overflow-hidden">
                <div class="pt-1.5 pb-1">
                  <NuxtLink v-for="child in inactiveChildren(item)" :key="child.to" :to="child.to"
                    class="flex items-center gap-2.5 py-2 ml-6 pl-3 mr-2
                           text-purple-400 hover:text-primary hover:border-b hover:border-primary transition-all duration-200 group/child" @click="$emit('close')">
                    <span class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                      <font-awesome-icon :icon="child.icon"
                        class="text-[0.8rem] group-hover/child:scale-110 transition-transform duration-200" />
                    </span>
                    <span class="text-xs sm:text-sm font-semibold truncate">{{ child.label }}</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </template>

          <!-- ╔══════════════════════════════════════════════════════════════╗
               ║ INACTIVE GROUP — normal parent row + hover-reveal children.   ║
               ╚══════════════════════════════════════════════════════════════╝ -->
          <template v-else>
            <button type="button" class="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 mx-2 rounded-xl
                     text-on-surface-variant hover:text-primary transition-all duration-200 group"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = '#0050cb0f'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = ''" @click="onGroupClick(item)">
              <font-awesome-icon :icon="item.icon"
                class="text-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
              <span class="text-xs sm:text-sm font-semibold truncate flex-1 text-left">{{ item.label }}</span>
              <font-awesome-icon :icon="['fas', 'chevron-down']"
                class="text-[0.65rem] flex-shrink-0 transition-transform duration-300"
                :class="hovered === item.label ? 'rotate-180' : ''" />
            </button>

            <div class="grid transition-[grid-template-rows] bg-surface duration-300 ease-out"
              :style="{ gridTemplateRows: hovered === item.label ? '1fr' : '0fr' }">
              <div class="overflow-hidden">
                <div class="pt-1 pb-1">
                  <NuxtLink v-for="child in item.children" :key="child.to" :to="child.to"
                    class="flex items-center gap-2.5 py-2 ml-6 pl-3 mr-2
                           text-purple-400 hover:text-primary hover:border-b hover:border-primary transition-all duration-200 group/child" @click="$emit('close')">
                    <span class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                      <font-awesome-icon :icon="child.icon"
                        class="text-[0.8rem] group-hover/child:scale-110 transition-transform duration-200" />
                    </span>
                    <span class="text-xs sm:text-sm font-semibold truncate">{{ child.label }}</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ════════════════════════════════════════════════════════════════
             LEAF (no children) — original behaviour, untouched
        ═════════════════════════════════════════════════════════════════ -->
        <template v-else>
          <!-- ACTIVE — seamless white pill -->
          <div v-if="isActive(item.to!)" class="relative my-1">
            <div class="absolute -top-[20px] right-0 w-5 h-5 pointer-events-none z-10">
              <div class="w-full h-full rounded-br-[1.25rem]"
                style="background: transparent; box-shadow: 6px 6px 0 6px #eceef0;" />
            </div>

            <NuxtLink :to="item.to!"
              class="bg-surface-container rounded-l-full flex items-center gap-2.5 px-3 py-2.5 ml-4"
              style="box-shadow: none;" @click="$emit('close')">
              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%);
                       box-shadow: 0 2px 8px rgba(0,80,203,0.35), inset 0 1px 0 rgba(255,255,255,0.20);">
                <font-awesome-icon :icon="item.icon" class="text-white text-sm" />
              </div>
              <span class="text-on-surface text-xs sm:text-sm font-bold flex-1 truncate">
                {{ item.label }}
              </span>
            </NuxtLink>

            <div class="absolute -bottom-[20px] right-0 w-5 h-5 pointer-events-none z-10">
              <div class="w-full h-full rounded-tr-[1.25rem]"
                style="background: transparent; box-shadow: 6px -6px 0 6px #eceef0;" />
            </div>
          </div>

          <!-- INACTIVE -->
          <NuxtLink v-else :to="item.to!" class="flex items-center gap-3 px-4 sm:px-5 py-2.5 mx-2 rounded-xl
                   text-on-surface-variant hover:text-primary
                   transition-all duration-200 group"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(0,80,203,0.06)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = ''" @click="$emit('close')">
            <font-awesome-icon :icon="item.icon"
              class="text-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
            <span class="text-xs sm:text-sm font-semibold truncate">{{ item.label }}</span>
          </NuxtLink>
        </template>

      </template>
    </div>

    <!-- Mobile close -->
    <div class="lg:hidden flex-shrink-0 px-3 pb-4 pt-2" style="border-top: 1px solid #00339912;">
      <button class="w-full flex items-center justify-center gap-2 py-2 rounded-lg
               text-on-surface-variant hover:text-on-surface transition-all"
        @mouseenter="($event.currentTarget as HTMLElement).style.background = '#0033990d'"
        @mouseleave="($event.currentTarget as HTMLElement).style.background = ''" @click="$emit('close')">
        <font-awesome-icon :icon="['fas', 'xmark']" class="text-sm" />
        <span class="text-xs font-semibold">Close menu</span>
      </button>
    </div>

  </nav>
</template>

<script setup lang="ts">
const emit = defineEmits(['close'])
const { can, canAny } = usePermission()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// Tracks which group the pointer is currently over (by label).
const hovered = ref<string | null>(null)

interface NavChild { to: string; icon: [string, string]; label: string }
interface NavItem {
  to?: string
  icon: [string, string]
  label: string
  show: boolean
  children?: NavChild[]
}

// Dashboard target follows the logged-in role (admin → admin view, etc.).
const LAB_ADMIN_ROLES = ['system_administrator', 'lab_technician']
const dashboardPath = computed(() =>
  LAB_ADMIN_ROLES.includes(auth.currentRole)
    ? '/dashboard/laboratory-admin'
    : '/dashboard/laboratory',
)

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { to: dashboardPath.value, icon: ['fas', 'gauge'], label: 'Dashboard', show: true },
    //{ to: '/customers', icon: ['fas', 'users'], label: 'Customers', show: can('customer_view') },
    //{ to: '/patients', icon: ['fas', 'hospital-user'], label: 'Patients', show: can('patient_view') || can('patient_search') },
    // ── Laboratory ──────────────────────────────────────────────────────────
    { to: '/orders', icon: ['fas', 'vials'], label: 'Laboratory Orders', show: canAny(['lab_referral', 'lab_results']) },
    // ── Inventory & Assets ──────────────────────────────────────────────────
    { to: '/inventory', icon: ['fas', 'boxes-stacked'], label: 'Inventory', show: can('inventory_view') },
    { to: '/assets', icon: ['fas', 'server'], label: 'Assets', show: can('asset_view') },
    /*{ to:'/billing',         icon:['fas','file-invoice-dollar'], label:'Billing',  show: canAny(['billing_view','billing_create']) },
    { to:'/billing/reports', icon:['fas','chart-bar'],           label:'Reports',  show: canAny(['report_view','report_export']) },*/
    // ── Settings GROUP — add a sub-page by appending ONE line to children ──
    {
      to: '/admin/settings/laboratory',
      icon: ['fas', 'sliders'],
      label: 'Settings',
      show: LAB_ADMIN_ROLES.includes(auth.currentRole),
    },
  ]
  return items.filter(i => i.show)
})

// A leaf is active for an exact match, or a deeper path that no *other* leaf
// owns more specifically (keeps parents from lighting up on child routes).
const isActive = (path: string) => {
  if (route.path === path) return true
  if (!route.path.startsWith(path + '/')) return false
  return !navItems.value.some(
    other => other.to && other.to !== path &&
      (route.path === other.to || route.path.startsWith(other.to + '/')) &&
      other.to.startsWith(path + '/')
  )
}

// A group is active when the route sits under its root OR matches any child.
const groupActive = (item: NavItem) => {
  if (item.to && (route.path === item.to || route.path.startsWith(item.to + '/'))) return true
  return !!item.children?.some(c => isActive(c.to))
}

// Split children into the active one(s) (shown inside the pill) and the rest
// (revealed on hover below the pill).
const activeChildren = (item: NavItem) => item.children?.filter(c => isActive(c.to)) ?? []
const inactiveChildren = (item: NavItem) => item.children?.filter(c => !isActive(c.to)) ?? []

// Parent link target: the group root if it has one, else its first child.
const groupRoot = (item: NavItem) => item.to ?? item.children?.[0]?.to ?? '#'

// Inactive parent click → jump to the group root / first child.
const onGroupClick = (item: NavItem) => {
  const dest = groupRoot(item)
  if (dest && dest !== '#') router.push(dest)
}
</script>