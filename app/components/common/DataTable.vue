<!-- app/components/common/DataTable.vue -->
<template>
  <div class="island overflow-hidden p-0">
    <!-- Header -->
    <div v-if="title || $slots.actions" class="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 border-b border-outline-variant/50 bg-island-header">
      <h2 v-if="title" class="section-heading mb-0">{{ title }}</h2>
      <div class="flex items-center gap-2 flex-wrap">
        <slot name="actions" />
      </div>
    </div>

    <!-- Search / filters -->
    <div v-if="searchable || $slots.filters" class="flex flex-wrap gap-2 p-3 sm:p-4 border-b border-outline-variant/50">
      <div v-if="searchable" class="relative flex-1 min-w-[200px]">
        <font-awesome-icon :icon="['fas','magnifying-glass']" class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder || 'Search…'"
          class="input-field pl-9"
        />
      </div>
      <slot name="filters" />
    </div>

    <!-- Table wrapper — horizontal scroll on small screens -->
    <div class="overflow-x-auto">
      <table class="his-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :class="col.thClass">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <SkeletonTableRows v-if="showSkeleton" :columns="columns.length" :rows="4" />
          <tr v-else-if="loading" />
          <tr v-else-if="!filteredRows.length">
            <td :colspan="columns.length" class="text-center py-10 text-on-surface-variant">
              <font-awesome-icon :icon="['fas','inbox']" class="text-2xl mb-2 block mx-auto opacity-40" />
              {{ emptyText || 'No records found' }}
            </td>
          </tr>
          <template v-else>
            <tr v-for="(row, idx) in paginatedRows" :key="idx" @click="$emit('row-click', row)">
              <td v-for="col in columns" :key="col.key" :class="col.tdClass">
                <slot :name="`cell-${col.key}`" :row="row" :value="getVal(row, col.key)">
                  <span :class="col.truncate !== false ? 'truncate-cell block' : ''">
                    {{ getVal(row, col.key) }}
                  </span>
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="paginate && filteredRows.length > perPage" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-outline-variant/50">
      <p class="text-xs sm:text-sm text-on-surface-variant">
        Showing {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filteredRows.length) }} of {{ filteredRows.length }}
      </p>
      <div class="flex items-center gap-1">
        <button class="btn-secondary !px-2 !py-1 text-xs" :disabled="currentPage === 1" @click="currentPage--">
          <font-awesome-icon :icon="['fas','chevron-left']" />
        </button>
        <span class="text-xs sm:text-sm px-2">{{ currentPage }} / {{ totalPages }}</span>
        <button class="btn-secondary !px-2 !py-1 text-xs" :disabled="currentPage === totalPages" @click="currentPage++">
          <font-awesome-icon :icon="['fas','chevron-right']" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface TableColumn {
  key:      string
  label:    string
  thClass?: string
  tdClass?: string
  truncate?: boolean
}

const props = withDefaults(defineProps<{
  columns:           TableColumn[]
  rows:              Record<string, unknown>[]
  title?:            string
  loading?:          boolean
  searchable?:       boolean
  searchPlaceholder?:string
  searchKeys?:       string[]
  emptyText?:        string
  paginate?:         boolean
  perPage?:          number
}>(), {
  paginate: true,
  perPage:  15,
})

const emit = defineEmits(['row-click'])

const searchQuery = ref('')
const currentPage = ref(1)

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return props.rows
  const q = searchQuery.value.toLowerCase()
  const keys = props.searchKeys || props.columns.map(c => c.key)
  return props.rows.filter(row =>
    keys.some(k => String(getVal(row, k)).toLowerCase().includes(q))
  )
})

// Reset page on search
watch(searchQuery, () => { currentPage.value = 1 })

const totalPages = computed(() => Math.ceil(filteredRows.value.length / props.perPage))

const paginatedRows = computed(() => {
  if (!props.paginate) return filteredRows.value
  const start = (currentPage.value - 1) * props.perPage
  return filteredRows.value.slice(start, start + props.perPage)
})

function getVal(row: Record<string, unknown>, key: string): unknown {
  // Support nested keys like 'patient.name'
  return key.split('.').reduce((acc: unknown, k) => (acc as Record<string, unknown>)?.[k], row)
}

const { showSkeleton } = useDelayedLoading(computed(() => props.loading ?? false))
</script>
