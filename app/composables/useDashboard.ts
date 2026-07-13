// app/composables/useDashboard.ts
//
// Single source of truth for "which dashboard does this role land on?".
// Used by:
//   • the sidebar Dashboard link            (Sidebar.vue)
//   • the post-login redirect                (pages/login.vue)
//   • the /dashboard dispatcher page         (pages/dashboard/index.vue)

// ── role → dashboard route ───────────────────────────────────────────────────
export const LAB_ADMIN_ROLES = ['system_administrator', 'lab_technician'] as const

/** Resolve the laboratory dashboard path for a role. */
export function dashboardPathForRole(role?: string | null): string {
  return role && (LAB_ADMIN_ROLES as readonly string[]).includes(role)
    ? '/dashboard/laboratory-admin'
    : '/dashboard/laboratory'
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