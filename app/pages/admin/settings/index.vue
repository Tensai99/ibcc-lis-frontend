<!-- app/pages/admin/settings/index.vue -->
<!--
  Settings overview — landing page for /admin/settings. Cards link to each
  settings area. Also the breadcrumb root and the Sidebar group's parent target.
  Cards are permission-aware: a user only sees areas their role can reach.
-->
<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-[98%] mx-auto">
    <SettingsHeader
      title="Settings"
      subtitle="Configure billing, customers, departments and user access"
      icon="sliders"
      :crumbs="[{ label:'Settings' }]"
    />

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="c in visibleCards" :key="c.to" :to="c.to"
        class="panel p-5 sm:p-6 group hover:border-primary/40 transition-colors flex items-start gap-4"
      >
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
             style="background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%); box-shadow: 0 4px 12px rgba(0,80,203,0.25);">
          <font-awesome-icon :icon="['fas', c.icon]" class="text-white text-lg" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-bold text-on-surface text-base group-hover:text-primary transition-colors">{{ c.title }}</h3>
            <font-awesome-icon :icon="['fas','arrow-right']"
              class="text-outline group-hover:text-primary group-hover:translate-x-1 transition-all text-sm flex-shrink-0" />
          </div>
          <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">{{ c.description }}</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span v-for="tag in c.tags" :key="tag" class="badge-muted">{{ tag }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { can, canAny } = usePermission()

const cards = [
  { to:'/admin/settings/billing', icon:'file-invoice-dollar', title:'Billing',
    description:'Tax, invoicing, deposits, currency and compliance parameters.',
    tags:['Tax','Discounts','Numbering','Currency'], show: can('admin_system') },
  { to:'/admin/settings/customers', icon:'user-tag', title:'Customers',
    description:'Customer categories, insurance eligibility and price adjustment tariffs.',
    tags:['Categories','Tariffs','Insurance'], show: canAny(['admin_system','admin_users']) },
  { to:'/admin/settings/departments', icon:'hospital', title:'Departments',
    description:'Departments, sub-departments and their test/imaging catalogues.',
    tags:['Sub-departments','Lab tests','Imaging'], show: can('admin_system') },
  { to:'/admin/settings/users', icon:'user-gear', title:'Users',
    description:'Staff accounts, role assignment and permission review.',
    tags:['Accounts','Roles','Permissions'], show: can('admin_users') },
]

const visibleCards = computed(() => cards.filter(c => c.show))
</script>

<style scoped>
.panel { @apply bg-surface-bright rounded-[1.5rem] border border-outline-variant/30; box-shadow: 0 6px 22px rgba(0,51,153,0.05); }
.badge-muted { @apply inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-surface-high text-on-surface-variant; }
</style>