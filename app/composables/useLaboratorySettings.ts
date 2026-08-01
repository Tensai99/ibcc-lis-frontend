// app/composables/useLaboratorySettings.ts
// Thin wrapper over apiService for the Laboratory Settings endpoints.
// State is module-scoped so all callers share the same cache — the plugin
// preloads it once on boot and the settings page reads it instantly.
import apiService from '~/services/apiService'

// ── Types ─────────────────────────────────────────────────────────────────
export interface LabConfigurations {
  accession_prefix: string
  dashboard_max_window_days: number
  block_retention_years: number
  slide_retention_years: number
  wet_specimen_retention_days: number
  critical_value_notification: boolean
  auto_verify_normal_results: boolean
}

export interface EncounterType {
  uuid: string
  name: string
  code: string
  description: string | null
  sequence: number
  turn_around_time: number
  verifiable: boolean
  active: boolean
}

export interface SpecimenSite {
  uuid: string
  name: string
  description: string | null
  body_system: string
  active: boolean
}

export interface ContainerType {
  uuid: string
  name: string
  code: string
  category: 'block' | 'container' | 'slide' | 'vessel' | string
  description: string | null
  active: boolean
}

export interface TurnaroundBand {
  uuid: string
  description: string
  minimum_hours: number
  maximum_hours: number
  active: boolean
}

// ── Singleton state (module scope — shared across all callers) ────────────
const configurations  = ref<LabConfigurations | null>(null)
const encounterTypes  = ref<EncounterType[]>([])
const specimenSites   = ref<SpecimenSite[]>([])
const containerTypes  = ref<ContainerType[]>([])
const turnaroundBands = ref<TurnaroundBand[]>([])
const loaded  = ref(false)
const loading = ref(false)
const error   = ref<string | null>(null)
let inflight: Promise<void> | null = null

// ── Composable ────────────────────────────────────────────────────────────
export const useLaboratorySettings = () => {
  // Reads ───────────────────────────────────────────────
  const getConfigurations  = () => apiService('/laboratories/settings/configurations')
  const getEncounterTypes  = () => apiService('/laboratories/settings/encounter_types')
  const getSpecimenSites   = () => apiService('/laboratories/settings/specimen_sites')
  const getContainerTypes  = () => apiService('/laboratories/settings/container_types')
  const getTurnaroundBands = () => apiService('/laboratories/settings/turnaround_bands')

  // Preload — de-duplicates concurrent calls; no-op after success unless forced.
  const preload = (force = false): Promise<void> => {
    if (loaded.value && !force) return Promise.resolve()
    if (inflight) return inflight

    loading.value = true
    error.value = null

    inflight = (async () => {
      try {
        const [cfg, enc, sites, cts, bands] = await Promise.all([
          getConfigurations(),
          getEncounterTypes(),
          getSpecimenSites(),
          getContainerTypes(),
          getTurnaroundBands(),
        ])
        configurations.value  = cfg?.configurations ?? null
        encounterTypes.value  = Array.isArray(enc)   ? enc   : []
        specimenSites.value   = Array.isArray(sites) ? sites : []
        containerTypes.value  = Array.isArray(cts)   ? cts   : []
        turnaroundBands.value = Array.isArray(bands) ? bands : []
        loaded.value = true
      } catch (e: any) {
        error.value = e?.message ?? 'Failed to load laboratory settings'
      } finally {
        loading.value = false
        inflight = null
      }
    })()

    return inflight
  }

  return {
    // reactive state
    configurations, encounterTypes, specimenSites, containerTypes, turnaroundBands,
    loaded, loading, error,
    // actions
    preload,
    // raw endpoints (for one-off refetches / future write actions)
    getConfigurations, getEncounterTypes, getSpecimenSites, getContainerTypes, getTurnaroundBands,
  }
}