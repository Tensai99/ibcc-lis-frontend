// app/composables/useDashboard.ts
//
// Single source of truth for "which dashboard does this role land on?".
// Used by:
//   • the sidebar Dashboard link            (Sidebar.vue)
//   • the post-login redirect                (pages/login.vue)
//   • the /dashboard dispatcher page         (pages/dashboard/index.vue)

// ── role → dashboard route ───────────────────────────────────────────────────
export const DASHBOARD_ROUTES: Record<string, string> = {
  system_administrator: '/dashboard/system-administrator',
  medical_director:     '/dashboard/system-administrator', // shares the admin view
  oncologist:           '/dashboard/oncologist',
  resident_doctor:      '/dashboard/resident-doctor',
  oncology_nurse:       '/dashboard/oncology-nurse',
  clinical_nurse:       '/dashboard/oncology-nurse',
  palliative_nurse:     '/dashboard/oncology-nurse',
  receptionist:         '/dashboard/receptionist',
  medical_records:      '/dashboard/receptionist',
  lab_technician:       '/dashboard/lab-technician',
  finance_officer:      '/dashboard/finance-officer',
  inventory_officer:    '/dashboard/inventory-officer',
  bme_lead:             '/dashboard/bme-lead',
}

/** Resolve the dashboard path for a role, falling back to the generic overview. */
export function dashboardPathForRole(role?: string | null): string {
  if (!role) return '/dashboard/overview'
  return DASHBOARD_ROUTES[role] ?? '/dashboard/overview'
}

// ── generic fetch helper ─────────────────────────────────────────────────────
// Every role dashboard hits the same endpoint; the server returns the payload
// shaped for the authenticated user's role. No seed/fallback data — the page
// renders a loading state, then the live payload, or an error with retry.
export function useDashboardData<T>() {
  const { request } = useApi()
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const d = await request<T>('/dashboard')
      data.value = (d ?? null) as T | null
      if (!data.value) error.value = 'The dashboard service returned no data.'
    } catch (e: unknown) {
      const err = e as { message?: string; status?: number }
      error.value = err?.status
        ? `Failed to load dashboard (${err.status}). Please try again.`
        : (err?.message || 'Failed to load dashboard. Please check your connection and try again.')
      data.value = null
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { data, loading, error, reload: load }
}

// Payload interfaces live inside each dashboard page now — every dashboard is a
// single self-contained file, so a design/shape change to one never touches the
// others. This composable keeps only role→route resolution and the fetch helper.