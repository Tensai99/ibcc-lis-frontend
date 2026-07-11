<!-- app/components/SettingsHeader.vue -->
<!--
  Page header for every settings screen: breadcrumb trail + title/subtitle on
  the left, an #actions slot on the right (Add buttons, search, etc.).
  Uses the same glass/token language as Modal.vue and Sidebar.vue.
-->
<template>
  <header class="mb-6">
    <!-- Breadcrumb -->
    <nav v-if="crumbs?.length" class="flex items-center flex-wrap gap-1.5 mb-2 text-xs text-on-surface-variant">
      <template v-for="(c, i) in crumbs" :key="i">
        <NuxtLink
          v-if="c.to && i < crumbs.length - 1"
          :to="c.to"
          class="hover:text-primary transition-colors font-medium"
        >{{ c.label }}</NuxtLink>
        <span v-else class="font-semibold text-on-surface">{{ c.label }}</span>
        <font-awesome-icon
          v-if="i < crumbs.length - 1"
          :icon="['fas','chevron-right']"
          class="text-[0.55rem] text-outline"
        />
      </template>
    </nav>

    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div
            v-if="icon"
            class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style="background: linear-gradient(135deg, #0066ff 0%, #0050cb 100%);
                   box-shadow: 0 4px 12px rgba(0,80,203,0.30);"
          >
            <font-awesome-icon :icon="['fas', icon]" class="text-white text-base" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface leading-tight truncate">{{ title }}</h1>
            <p v-if="subtitle" class="text-sm text-on-surface-variant mt-0.5">{{ subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title:     string
  subtitle?: string
  icon?:     string
  crumbs?:   { label: string; to?: string }[]
}>()
</script>