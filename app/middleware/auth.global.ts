// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware entirely on server — we can't read localStorage there.
  // The client-side pass will handle auth immediately after hydration.
  if (import.meta.server) return

  const auth = useAuthStore()
  auth.hydrate()

  const publicRoutes = ['/login']

  if (publicRoutes.includes(to.path)) {
    if (auth.isAuthenticated) return navigateTo('/dashboard')
    return
  }

  if (!auth.isAuthenticated) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})