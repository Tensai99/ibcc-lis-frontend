// app/plugins/idle-timeout.client.ts
//
// Client-only plugin that owns the lifecycle of the idle-timeout guard.
// Mirrors server-notifications.client.ts — starts when the user is signed
// in, stops on logout.

export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { start, stop } = useIdleTimeout()

  if (auth.token) start()

  watch(
    () => auth.token,
    (token, prev) => {
      if (token && !prev) start()
      else if (!token && prev) stop()
    }
  )
})