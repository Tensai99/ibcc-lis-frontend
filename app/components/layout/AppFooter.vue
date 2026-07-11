<!-- app/components/AppFooter.vue -->
<template>
  <footer
    class="flex-shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-1
           px-4 sm:px-6 py-2.5
           border-t border-outline-variant/40
           bg-white/45 backdrop-blur-sm"
  >
    <!-- Left: ownership / system identity (single line — truncates, never overflows) -->
    <p class="min-w-0 truncate text-xs sm:text-sm leading-none text-on-surface-variant/80">
      © {{ year }} {{ org }}
      <span class="mx-1.5 text-outline-variant">·</span>
      <span class="font-medium">{{ product }}</span>
      <template v-if="version">
        <span class="mx-1.5 text-outline-variant">·</span>
        <span class="font-mono text-on-surface-variant/70">{{ version }}</span>
      </template>
    </p>

    <!-- Right: engineering attribution (kept intact; wraps to its own row on small screens) -->
    <component
      :is="href ? 'a' : 'span'"
      :href="href || undefined"
      :target="href ? '_blank' : undefined"
      :rel="href ? 'noopener noreferrer' : undefined"
      class="group flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap
             text-xs sm:text-sm leading-none text-on-surface-variant/70
             transition-colors duration-200 hover:text-on-surface-variant"
    >
      <span class="tracking-wide">Engineered by</span>
      <img
        src="/images/welloverse_tag.png"
        alt="Welloverse"
        class="h-4 sm:h-5 w-auto select-none
               opacity-65 grayscale-[35%]
               transition motion-safe:duration-300 ease-out
               group-hover:opacity-100 group-hover:grayscale-0
               group-hover:-translate-y-px"
        draggable="false"
      />
    </component>
  </footer>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    org?: string
    product?: string
    version?: string
    /** Optional: link the Welloverse mark out to a site. Omit to render plain. */
    href?: string
  }>(),
  {
    org: 'International Blantyre Cancer Centre',
    product: 'Hospital Information System',
    version: '',
    href: '',
  },
)

const year = new Date().getFullYear()
</script>