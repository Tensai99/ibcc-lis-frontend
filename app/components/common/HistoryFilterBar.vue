<!-- app/components/HistoryFilterBar.vue -->
<!-- Submit-based history filter panel. Styled to match the Assets-tab advanced
     filters (surface-low grid panel + .filter-label / .filter-select / SearchSelect).
     Nothing hits the endpoint until the user clicks "Apply filters" (@apply). -->
<template>
  <div v-show="open"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-low/60 border border-ribbon-blue/10">

    <!-- From (max 90-day range enforced against To) -->
    <div>
      <label class="filter-label">From</label>
      <input v-model="model.from" type="date" :max="fromMax" class="filter-date" @change="onFromChange" />
    </div>

    <!-- To -->
    <div>
      <label class="filter-label">To <span class="normal-case text-outline font-normal">(≤ 90 days)</span></label>
      <input v-model="model.to" type="date" :min="toMin" :max="toMax" class="filter-date" @change="onToChange" />
    </div>

    <!-- Asset — searchable select (SearchSelect is auto-imported globally) -->
    <div>
      <label class="filter-label">Asset</label>
      <SearchSelect v-model="model.asset_id" :options="assetOptions" option-value="id" option-label="label"
        icon="server" placeholder="All assets" search-placeholder="Search assets…" clearable />
    </div>

    <!-- Department — searchable select -->
    <div>
      <label class="filter-label">Department</label>
      <SearchSelect v-model="model.department_id" :options="departments" option-value="id" option-label="name"
        icon="building" placeholder="All departments" search-placeholder="Search departments…" clearable />
    </div>

    <!-- Status -->
    <div>
      <label class="filter-label">Status</label>
      <div class="filter-wrap">
        <select v-model="model.status" class="filter-select">
          <option value="">Any status</option>
          <option v-for="s in STATUSES" :key="s" :value="s">{{ titleCase(s) }}</option>
        </select>
        <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
      </div>
    </div>

    <!-- Severity -->
    <div>
      <label class="filter-label">Severity</label>
      <div class="filter-wrap">
        <select v-model="model.severity" class="filter-select">
          <option value="">Any severity</option>
          <option v-for="s in SEVERITIES" :key="s" :value="s">{{ titleCase(s) }}</option>
        </select>
        <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
      </div>
    </div>

    <!-- Open state -->
    <div>
      <label class="filter-label">Open</label>
      <div class="filter-wrap">
        <select v-model="model.open" class="filter-select">
          <option value="">Any</option>
          <option value="true">Open only</option>
          <option value="false">Closed only</option>
        </select>
        <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
      </div>
    </div>

    <!-- Apply — the only thing that sends filters to the endpoint -->
    <div class="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end pt-1">
      <button type="button" class="apply-btn" @click="apply">
        <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
        <span>Apply filters</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const titleCase = (v: any) =>
  String(v ?? '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—'

const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const MAX_RANGE_DAYS = 90
const DAY_MS = 86400000

const props = defineProps<{ assets: any[]; departments: any[]; open: boolean }>()
const emit = defineEmits<{ apply: [] }>()

const model = defineModel<Record<string, any>>({ required: true })

// asset options: fold the tag into the label so it reads like the old typeahead
const assetOptions = computed(() =>
  (props.assets ?? []).map((a: any) => ({
    id: a.id,
    label: a.asset_tag ? `${a.name} — ${a.asset_tag}` : a.name,
  })),
)

// ── submit ─────────────────────────────────────────────────────────────────
// reset to page 1 for a fresh filter set, then let the parent call load()
const apply = () => { model.value.page = 1; emit('apply') }

// ── 90-day range enforcement (clamps only — no auto-load) ────────────────────
const toMin = computed(() => model.value.from || undefined)
const toMax = computed(() => {
  if (!model.value.from) return undefined
  const d = new Date(model.value.from); d.setDate(d.getDate() + MAX_RANGE_DAYS)
  return d.toISOString().slice(0, 10)
})
const fromMax = computed(() => model.value.to || undefined)
const onFromChange = () => {
  if (model.value.from && model.value.to) {
    const span = (new Date(model.value.to).getTime() - new Date(model.value.from).getTime()) / DAY_MS
    if (span > MAX_RANGE_DAYS || span < 0) model.value.to = ''
  }
}
const onToChange = () => {
  if (model.value.from && model.value.to) {
    const span = (new Date(model.value.to).getTime() - new Date(model.value.from).getTime()) / DAY_MS
    if (span > MAX_RANGE_DAYS || span < 0) model.value.from = ''
  }
}
</script>

<style scoped>
/* mirrored from overview.vue's assets-tab filters (scoped styles don't cross components) */
.filter-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-outline, #727687);
  margin-left: 0.25rem;
  display: block;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.filter-wrap { position: relative; }
.filter-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.7rem 2.25rem 0.7rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}
.filter-select:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }
.filter-select:hover:not(:focus) { background: #e6e8ea; }
.filter-caret {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-outline, #727687);
  font-size: 0.7rem;
  pointer-events: none;
}
/* date inputs share the .filter-select surface look */
.filter-date {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}
.filter-date:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }
.filter-date:hover:not(:focus) { background: #e6e8ea; }
/* primary submit button */
.apply-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: #3d7fbf;
  box-shadow: 0 6px 16px rgba(61, 127, 191, 0.25);
  transition: all 0.18s ease;
}
.apply-btn:hover { background: #356fa8; }
</style>