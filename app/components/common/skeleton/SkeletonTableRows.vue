<!-- app/components/common/skeleton/SkeletonTableRows.vue -->
<!--
  Drop-in replacement for a single "loading" <tr> inside an existing
  .his-table / alive-tbl <tbody>. Renders a handful of placeholder rows
  (not the eventual exact count — the real row count is unknown while
  loading) so the table shape reads correctly before data arrives.
-->
<template>
  <tr v-for="i in rows" :key="i" class="border-b border-outline-variant/50">
    <td v-for="c in columns" :key="c" class="px-3 py-3">
      <SkeletonBase :width="widthFor(c)" height="0.9rem" />
    </td>
  </tr>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  columns?: number
  rows?:    number
}>(), {
  columns: 4,
  rows:    4,
})

const CYCLE = ['85%', '60%', '75%', '45%']
const widthFor = (col: number) => CYCLE[(col - 1) % CYCLE.length]
</script>
