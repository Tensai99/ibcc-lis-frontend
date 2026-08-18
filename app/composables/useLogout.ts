// app/composables/useLogout.ts
//
// Single source of truth for signing out. Both TopBar and the idle-timeout
// modal call this so behaviour stays consistent:
//   1. DELETE /session on the backend to invalidate the server-side session
//      (network errors ignored — we still want the client sign-out to succeed
//      even if the network drops mid-logout).
//   2. auth.clear() — triggers the auth watcher in server-notifications
//      and idle-timeout plugins to stop their background loops.
//   3. Redirect to /login. When `keepRedirect: true` (used by the idle modal
//      on auto-logout), the current path is preserved so the user can pick
//      up where they left off after re-authenticating.

export function useLogout() {
  async function logout(opts: { keepRedirect?: boolean } = {}) {
    const auth  = useAuthStore()
    const route = useRoute()

    // Best-effort server session revoke
    try {
      const { request } = useApi()
      await request('/session', { method: 'DELETE' })
    } catch {
      // ignore network errors on logout — client-side clear still runs
    }

    auth.clear()

    const target = opts.keepRedirect && route.fullPath && route.fullPath !== '/login'
      ? `/login?redirect=${encodeURIComponent(route.fullPath)}`
      : '/login'

    await navigateTo(target)
  }

  return { logout }
}