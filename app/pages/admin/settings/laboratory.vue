<!-- app/pages/admin/settings/laboratory.vue -->
<!--
  Laboratory Settings
  ────────────────────────────────────────────────────────────────────────────
  Design language mirrors app/pages/inventory/department.vue:
    • glass g-cards, primary-gradient icon square headers
    • circle icon section heads (bg-ribbon-X/15) + ribbon-l-4 KPI cards
    • alive-tbl tbl-rainbow with green gradient thead
    • glass refresh-btn, cust-input search, ribbon-tinted content islands

  Data source: useLaboratorySettings() — preloaded by the client plugin.
-->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- ── Header ───────────────────────────────────────────────────── -->
      <header class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'sliders']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words">
              Laboratory Settings
            </h1>
            <p class="text-[11px] sm:text-xs text-outline mt-0.5 break-words">
              Configuration, workflow, taxonomy and SLA definitions — histopathology &amp; cytology
            </p>
          </div>
        </div>
        <button type="button" class="refresh-btn shrink-0" :disabled="loading" @click="reload">
          <font-awesome-icon :icon="['fas', loading ? 'circle-notch' : 'rotate-right']"
            :class="loading ? 'animate-spin' : ''" />
          <span>Refresh</span>
        </button>
      </header>

      <!-- feedback -->
      <div v-if="error" class="alert-error">
        <font-awesome-icon :icon="['fas', 'circle-exclamation']" class="mt-0.5" />
        <span class="break-words">{{ error }}</span>
      </div>

      <!-- ── Tab bar (glass pills) ───────────────────────────────────── -->
      <div class="g-card p-2 sm:p-3">
        <div class="flex flex-wrap gap-2">
          <button v-for="t in tabs" :key="t.key" type="button" class="tab-pill"
            :class="activeTab === t.key ? 'tab-pill-active' : ''"
            :style="activeTab === t.key
              ? { background: t.hex, borderColor: t.hex, color: '#fff', boxShadow: `0 4px 14px ${t.hex}40` }
              : { color: t.hex, borderColor: t.hex + '40' }"
            @click="activeTab = t.key">
            <font-awesome-icon :icon="t.icon" class="text-xs sm:text-sm" />
            <span class="text-xs sm:text-sm font-bold">{{ t.label }}</span>
            <span v-if="t.count !== null" class="tab-pill-count"
              :style="activeTab === t.key
                ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                : { background: t.hex + '1a', color: t.hex }">
              {{ t.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- ── Loading skeleton ─────────────────────────────────────────── -->
      <template v-if="loading && !loaded">
        <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
        <div class="g-card p-6 sm:p-8">
          <SkeletonBase width="25%" height="1.25rem" class="mb-5" />
          <SkeletonTableRows :columns="6" :rows="5" />
        </div>
      </template>

      <template v-else>

        <!-- ═══════════════════════ CONFIGURATIONS ═══════════════════════ -->
        <template v-if="activeTab === 'configurations'">
          <div v-if="!cfg" class="g-card p-8 text-center text-on-surface-variant">
            No configuration loaded.
          </div>

          <template v-else>
            <!-- Numeric KPIs — border-l-4 ribbon-blue cards -->
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
              <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
                <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Accession Prefix</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-on-surface font-mono break-words">{{ cfg.accession_prefix }}</p>
                <p class="text-[11px] text-on-surface-variant mt-1">stamped on every accession number</p>
              </div>
              <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
                <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Dashboard Window</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {{ cfg.dashboard_max_window_days }} <span class="text-xs text-outline">days</span>
                </p>
                <p class="text-[11px] text-on-surface-variant mt-1">maximum dashboard lookback</p>
              </div>
              <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-purple">
                <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-2">Block Retention</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {{ cfg.block_retention_years }} <span class="text-xs text-outline">years</span>
                </p>
                <p class="text-[11px] text-on-surface-variant mt-1">statutory retention for paraffin blocks</p>
              </div>
              <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-purple">
                <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-2">Slide Retention</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {{ cfg.slide_retention_years }} <span class="text-xs text-outline">years</span>
                </p>
                <p class="text-[11px] text-on-surface-variant mt-1">statutory retention for stained slides</p>
              </div>
              <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-amber bg-ribbon-amber/5">
                <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider mb-2">Wet Specimen</p>
                <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {{ cfg.wet_specimen_retention_days }} <span class="text-xs text-outline">days</span>
                </p>
                <p class="text-[11px] text-on-surface-variant mt-1">retention before biohazard disposal</p>
              </div>
            </div>

            <!-- Toggle panels -->
            <div class="g-card p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal">
                  <font-awesome-icon :icon="['fas', 'toggle-on']" />
                </div>
                <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Behavioural switches</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl border transition-colors"
                  :class="cfg.critical_value_notification
                    ? 'bg-ribbon-teal/5 border-ribbon-teal/25'
                    : 'bg-surface-low border-outline-variant/30'">
                  <div class="flex items-start gap-3">
                    <div class="toggle" :class="cfg.critical_value_notification ? 'toggle-on-teal' : 'toggle-off'">
                      <div class="toggle-thumb" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm sm:text-base font-bold text-on-surface break-words">Critical Value Notifications</p>
                      <p class="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 break-words">
                        Alert clinicians immediately when a result exceeds the critical threshold.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="p-4 rounded-xl border transition-colors"
                  :class="cfg.auto_verify_normal_results
                    ? 'bg-ribbon-teal/5 border-ribbon-teal/25'
                    : 'bg-surface-low border-outline-variant/30'">
                  <div class="flex items-start gap-3">
                    <div class="toggle" :class="cfg.auto_verify_normal_results ? 'toggle-on-teal' : 'toggle-off'">
                      <div class="toggle-thumb" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm sm:text-base font-bold text-on-surface break-words">Auto-verify Normal Results</p>
                      <p class="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 break-words">
                        Skip manual verification when a result falls within the reference range.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- ═══════════════════════ ENCOUNTER TYPES ═══════════════════════ -->
        <template v-else-if="activeTab === 'encounter_types'">
          <div class="g-card p-6 sm:p-8">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-full bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal">
                <font-awesome-icon :icon="['fas', 'diagram-project']" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Encounter Types</h3>
                <p class="text-[11px] text-outline">{{ encounterTypesSorted.length }} workflow stages, in processing order</p>
              </div>
            </div>

            <div class="rounded-t-2xl overflow-hidden border border-outline-variant/20">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-rainbow">
                  <thead>
                    <tr class="text-[11px] text-white uppercase tracking-widest font-bold">
                      <th class="py-4 px-5">Seq</th>
                      <th class="py-4 px-5">Name</th>
                      <th class="py-4 px-5">Code</th>
                      <th class="py-4 px-5">Description</th>
                      <th class="py-4 px-5 text-right">TAT</th>
                      <th class="py-4 px-5 text-center">Verify</th>
                      <th class="py-4 px-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/10">
                    <tr v-for="e in encounterTypesSorted" :key="e.uuid" class="transition-colors">
                      <td class="py-4 px-5 font-mono text-ribbon-blue font-bold">{{ e.sequence }}</td>
                      <td class="py-4 px-5">
                        <p class="font-bold break-words">{{ e.name }}</p>
                      </td>
                      <td class="py-4 px-5 font-mono text-[11px] sm:text-xs text-ribbon-purple">{{ e.code }}</td>
                      <td class="py-4 px-5 text-xs sm:text-sm text-on-surface-variant break-words max-w-[380px]">
                        {{ e.description || '—' }}
                      </td>
                      <td class="py-4 px-5 text-right font-mono">
                        <span v-if="e.turn_around_time > 0" class="text-ribbon-teal font-bold">
                          {{ e.turn_around_time }}h
                        </span>
                        <span v-else class="text-outline">—</span>
                      </td>
                      <td class="py-4 px-5 text-center">
                        <font-awesome-icon v-if="e.verifiable" :icon="['fas', 'circle-check']"
                          class="text-ribbon-teal text-base" />
                        <span v-else class="text-outline-variant">—</span>
                      </td>
                      <td class="py-4 px-5 text-center">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          :class="e.active
                            ? 'bg-ribbon-teal/10 text-ribbon-teal'
                            : 'bg-surface-low text-on-surface-variant'">
                          <span class="w-1.5 h-1.5 rounded-full"
                            :class="e.active ? 'bg-ribbon-teal' : 'bg-outline'" />
                          {{ e.active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══════════════════════ SPECIMEN SITES ═══════════════════════ -->
        <template v-else-if="activeTab === 'specimen_sites'">
          <div class="g-card p-6 sm:p-8">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple shrink-0">
                  <font-awesome-icon :icon="['fas', 'person-half-dress']" />
                </div>
                <div class="min-w-0">
                  <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Specimen Sites</h3>
                  <p class="text-[11px] text-outline">
                    {{ specimenSites.length }} sites &middot; {{ specimenSiteGroups.length }} body systems
                  </p>
                </div>
              </div>
              <div class="relative w-full md:w-72">
                <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="siteSearch" type="text" autocomplete="off"
                  placeholder="Search sites or body systems…" class="cust-input has-icon" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div v-for="grp in filteredSiteGroups" :key="grp.system"
                class="p-4 sm:p-5 rounded-2xl bg-ribbon-purple/5 border border-ribbon-purple/15">
                <div class="flex items-center gap-2 mb-3">
                  <font-awesome-icon :icon="['fas', 'folder-tree']" class="text-ribbon-purple text-sm" />
                  <h4 class="text-sm sm:text-base font-bold text-on-surface break-words">{{ grp.system }}</h4>
                  <span class="ml-auto text-[10px] font-bold text-ribbon-purple bg-ribbon-purple/10 px-2 py-0.5 rounded-full">
                    {{ grp.sites.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1.5 sm:gap-2">
                  <span v-for="s in grp.sites" :key="s.uuid"
                    class="site-chip"
                    :class="!s.active && 'opacity-40'">
                    {{ s.name }}
                  </span>
                </div>
              </div>
              <div v-if="!filteredSiteGroups.length"
                class="md:col-span-2 text-center py-10 text-on-surface-variant">
                <font-awesome-icon :icon="['fas', 'inbox']" class="text-2xl opacity-40 mb-2 block mx-auto" />
                No specimen sites match your search.
              </div>
            </div>
          </div>
        </template>

        <!-- ═══════════════════════ CONTAINER TYPES ═══════════════════════ -->
        <template v-else-if="activeTab === 'container_types'">
          <div class="g-card p-6 sm:p-8">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-full bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber">
                <font-awesome-icon :icon="['fas', 'flask-vial']" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Container Types</h3>
                <p class="text-[11px] text-outline">
                  {{ containerTypes.length }} types &middot; {{ containerCategories.length }} categories
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div v-for="cat in containerCategories" :key="cat.name"
                class="p-4 sm:p-5 rounded-2xl bg-ribbon-amber/5 border border-ribbon-amber/15">
                <div class="flex items-center gap-2 mb-3 pb-3 border-b border-ribbon-amber/20">
                  <div class="w-8 h-8 rounded-full bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber shrink-0">
                    <font-awesome-icon :icon="categoryIcon(cat.name)" class="text-xs" />
                  </div>
                  <h4 class="text-sm sm:text-base font-bold text-on-surface capitalize truncate">{{ cat.name }}</h4>
                  <span class="ml-auto text-[10px] font-bold text-ribbon-amber bg-ribbon-amber/15 px-2 py-0.5 rounded-full">
                    {{ cat.items.length }}
                  </span>
                </div>
                <ul class="space-y-2">
                  <li v-for="c in cat.items" :key="c.uuid"
                    class="p-3 rounded-xl bg-white/60 border border-ribbon-amber/10 flex items-start gap-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-sm sm:text-base font-bold text-on-surface break-words">{{ c.name }}</span>
                        <span class="text-[10px] font-mono text-ribbon-amber bg-ribbon-amber/10 px-1.5 py-0.5 rounded">
                          {{ c.code }}
                        </span>
                      </div>
                      <p v-if="c.description" class="text-[11px] sm:text-xs text-on-surface-variant mt-1 break-words">
                        {{ c.description }}
                      </p>
                    </div>
                    <span v-if="!c.active"
                      class="text-[10px] font-bold text-outline bg-surface-low px-2 py-0.5 rounded-full shrink-0">
                      Inactive
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══════════════════════ TURNAROUND BANDS ═══════════════════════ -->
        <template v-else-if="activeTab === 'turnaround_bands'">
          <div class="g-card p-6 sm:p-8">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-full bg-ribbon-red/15 flex items-center justify-center text-ribbon-red">
                <font-awesome-icon :icon="['fas', 'stopwatch']" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Turnaround Bands</h3>
                <p class="text-[11px] text-outline">
                  {{ turnaroundBandsSorted.length }} SLA tiers, minimum-hours ascending
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <div v-for="(b, i) in turnaroundBandsSorted" :key="b.uuid"
                class="p-4 sm:p-5 rounded-2xl bg-ribbon-red/5 border border-ribbon-red/15 flex flex-col sm:flex-row sm:items-center gap-4">
                <!-- Tier badge -->
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="w-12 h-12 rounded-2xl bg-ribbon-red/15 flex flex-col items-center justify-center text-ribbon-red shrink-0">
                    <span class="text-[9px] font-bold uppercase leading-none">Tier</span>
                    <span class="text-base font-extrabold leading-none">{{ i + 1 }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm sm:text-base md:text-lg font-bold text-on-surface break-words">
                      {{ b.description }}
                    </p>
                    <p class="text-[11px] sm:text-xs font-mono text-on-surface-variant mt-0.5">
                      {{ b.minimum_hours }}h &nbsp;→&nbsp; {{ b.maximum_hours }}h window
                    </p>
                  </div>
                </div>

                <!-- Hour range visual -->
                <div class="flex items-center gap-4 shrink-0">
                  <div class="text-right">
                    <div class="text-2xl sm:text-3xl font-extrabold text-ribbon-red leading-none font-mono">
                      {{ b.maximum_hours - b.minimum_hours }}
                    </div>
                    <div class="text-[10px] font-bold text-outline uppercase tracking-wider mt-1">
                      hr range
                    </div>
                  </div>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    :class="b.active
                      ? 'bg-ribbon-red/10 text-ribbon-red'
                      : 'bg-surface-low text-on-surface-variant'">
                    <span class="w-1.5 h-1.5 rounded-full"
                      :class="b.active ? 'bg-ribbon-red' : 'bg-outline'" />
                    {{ b.active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useLaboratorySettings } from '~/composables/useLaboratorySettings'

definePageMeta({ layout: 'default' })

// Composable — module-scoped singleton state (preloaded by the plugin).
const {
  configurations, encounterTypes, specimenSites, containerTypes, turnaroundBands,
  loaded, loading, error, preload,
} = useLaboratorySettings()

onMounted(() => { if (!loaded.value) preload() })
const reload = () => preload(true)

// ─── Tabs ─────────────────────────────────────────────────────────────────
type TabKey = 'configurations' | 'encounter_types' | 'specimen_sites' | 'container_types' | 'turnaround_bands'
const activeTab = ref<TabKey>('configurations')

const tabs = computed(() => ([
  { key: 'configurations'   as TabKey, label: 'Configurations',   icon: ['fas', 'sliders']           as [string, string], hex: '#3d7fbf', count: null as number | null },
  { key: 'encounter_types'  as TabKey, label: 'Encounter Types',  icon: ['fas', 'diagram-project']   as [string, string], hex: '#3dae8c', count: encounterTypes.value.length  || null },
  { key: 'specimen_sites'   as TabKey, label: 'Specimen Sites',   icon: ['fas', 'person-half-dress'] as [string, string], hex: '#b05fa8', count: specimenSites.value.length   || null },
  { key: 'container_types'  as TabKey, label: 'Container Types',  icon: ['fas', 'flask-vial']        as [string, string], hex: '#e8a33d', count: containerTypes.value.length  || null },
  { key: 'turnaround_bands' as TabKey, label: 'Turnaround Bands', icon: ['fas', 'stopwatch']         as [string, string], hex: '#c0395a', count: turnaroundBands.value.length || null },
]))

// ─── Derived data ─────────────────────────────────────────────────────────
const cfg = computed(() => configurations.value)

const encounterTypesSorted = computed(() =>
  [...encounterTypes.value].sort((a, b) => a.sequence - b.sequence),
)

const specimenSiteGroups = computed(() => {
  const map = new Map<string, typeof specimenSites.value>()
  for (const s of specimenSites.value) {
    const key = s.body_system || 'Unspecified'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return [...map.entries()]
    .map(([system, sites]) => ({
      system,
      sites: [...sites].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.system.localeCompare(b.system))
})

// Specimen site search
const siteSearch = ref('')
const filteredSiteGroups = computed(() => {
  const term = siteSearch.value.trim().toLowerCase()
  if (!term) return specimenSiteGroups.value
  return specimenSiteGroups.value
    .map(g => ({
      system: g.system,
      sites: g.sites.filter(s =>
        s.name.toLowerCase().includes(term) || g.system.toLowerCase().includes(term),
      ),
    }))
    .filter(g => g.sites.length)
})

const containerCategories = computed(() => {
  const map = new Map<string, typeof containerTypes.value>()
  for (const c of containerTypes.value) {
    const key = c.category || 'other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(c)
  }
  const order = ['container', 'vessel', 'block', 'slide']
  return [...map.entries()]
    .map(([name, items]) => ({
      name,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => (order.indexOf(a.name) + 999) - (order.indexOf(b.name) + 999))
})

const turnaroundBandsSorted = computed(() =>
  [...turnaroundBands.value].sort((a, b) => a.minimum_hours - b.minimum_hours),
)

const categoryIcon = (name: string): [string, string] => {
  switch (name) {
    case 'block':     return ['fas', 'cube']
    case 'slide':     return ['fas', 'square']
    case 'vessel':    return ['fas', 'box']
    case 'container': return ['fas', 'flask']
    default:          return ['fas', 'circle']
  }
}
</script>

<style scoped>
/* ── Glass card — identical to inventory/department.vue ─────────────────── */
.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.5s ease-out backwards;
}

/* ── Refresh button (glass) ─────────────────────────────────────────────── */
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(61, 127, 191, 0.25);
  color: #3d7fbf;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.15s ease, transform 0.15s ease;
}
.refresh-btn:hover:not(:disabled) { background: #fff; transform: translateY(-1px); }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Search input ───────────────────────────────────────────────────────── */
.cust-input {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}
.cust-input::placeholder { color: rgba(114, 118, 135, 0.6); }
.cust-input:focus { outline: none; box-shadow: inset 0 0 0 1.5px #3d7fbf; background: #f7f9fb; }
.cust-input.has-icon { padding-left: 2.5rem; }

/* ── Glass pill tabs ────────────────────────────────────────────────────── */
.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid transparent;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}
.tab-pill:hover:not(.tab-pill-active) { background: rgba(255, 255, 255, 0.9); transform: translateY(-1px); }
.tab-pill-active { transform: translateY(-1px); }
.tab-pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  padding: 0 0.4rem;
  height: 1.1rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
}

/* ── Alive rainbow table (encounter types) — teal/green header ──────────── */
.alive-tbl tbody tr { transition: background 0.15s ease; }
.alive-tbl tbody tr:nth-child(even) { background: rgba(25, 28, 30, 0.018); }
.alive-tbl tbody tr:hover { background: rgba(61, 174, 140, 0.06); }

.tbl-rainbow thead tr {
  background: linear-gradient(90deg, #3dae8c 0%, #5bdbaa 100%);
}
.tbl-rainbow thead th {
  border-bottom: 2px solid rgba(46, 138, 110, 0.5);
  color: #ffffff;
}

/* Column-tint row stripes for encounter types table */
.tbl-rainbow tbody td:nth-child(1) { background: rgba(61,127,191,0.04); } /* Seq         — blue   */
.tbl-rainbow tbody td:nth-child(2) { background: rgba(61,174,140,0.04); } /* Name        — teal   */
.tbl-rainbow tbody td:nth-child(3) { background: rgba(176,95,168,0.04); } /* Code        — purple */
.tbl-rainbow tbody td:nth-child(4) { background: rgba(25,28,30,0.02);   } /* Description — plain  */
.tbl-rainbow tbody td:nth-child(5) { background: rgba(232,163,61,0.05); } /* TAT         — amber  */
.tbl-rainbow tbody td:nth-child(6) { background: rgba(61,174,140,0.04); } /* Verify      — teal   */
.tbl-rainbow tbody td:nth-child(7) { background: rgba(61,127,191,0.04); } /* Status      — blue   */

/* ── Specimen site chips ────────────────────────────────────────────────── */
.site-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(176, 95, 168, 0.25);
  color: #7a4073;
  font-size: 0.75rem;
  font-weight: 700;
  max-width: 100%;
  word-break: break-word;
  transition: all 0.15s ease;
}
.site-chip:hover { background: #fff; border-color: #b05fa8; transform: translateY(-1px); }

/* ── Custom toggle switches (configurations tab) ─────────────────────────── */
.toggle {
  width: 2.5rem;
  height: 1.4rem;
  border-radius: 999px;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s ease;
}
.toggle-thumb {
  position: absolute;
  top: 0.15rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: left 0.2s ease;
}
.toggle-on-teal { background: #3dae8c; }
.toggle-on-teal .toggle-thumb { left: 1.25rem; }
.toggle-off { background: #c2c6d8; }
.toggle-off .toggle-thumb { left: 0.15rem; }

@keyframes island-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>