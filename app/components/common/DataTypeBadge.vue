<!-- app/components/DataTypeBadge.vue -->
<!--
  Small pill that colour-codes a BillingSetting data_type.
  Mirrors the seeder vocabulary: string | decimal | integer | boolean | date.
-->
<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold tracking-wide uppercase"
    :class="palette.cls"
  >
    <font-awesome-icon :icon="['fas', palette.icon]" class="text-[0.6rem]" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ type: string }>()

interface Palette { cls: string; icon: string; label: string }

const FALLBACK: Palette = { cls: 'bg-slate-100 text-slate-600', icon: 'font', label: 'Text' }

const MAP: Record<string, Palette> = {
  string:  FALLBACK,
  decimal: { cls: 'bg-indigo-100 text-indigo-600',   icon: 'percent',   label: 'Decimal' },
  integer: { cls: 'bg-blue-100 text-blue-600',       icon: 'hashtag',   label: 'Integer' },
  boolean: { cls: 'bg-emerald-100 text-emerald-600', icon: 'toggle-on', label: 'Boolean' },
  date:    { cls: 'bg-amber-100 text-amber-600',     icon: 'calendar',  label: 'Date'    },
}

// `?? FALLBACK` makes palette non-undefined regardless of noUncheckedIndexedAccess
const palette = computed<Palette>(() => MAP[props.type] ?? FALLBACK)
const label   = computed(() => palette.value.label)
</script>