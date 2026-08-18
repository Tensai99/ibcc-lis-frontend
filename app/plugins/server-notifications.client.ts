// app/plugins/server-notifications.client.ts
//
// Client-only plugin that owns the lifecycle of the notification poller.
//
//   • On boot: if user is already authenticated (page reload with valid
//     session in localStorage), start immediately.
//   • Watch the auth store — when `auth.token` transitions from falsy → truthy
//     (login), start(). When truthy → falsy (logout / 401 clear), stop().
//   • Runs only on the client; SSR skips it entirely via the .client suffix.

export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { start, stop } = useServerNotifications()

  if (auth.token) {
    // Fire and forget — start() is async but plugins shouldn't block boot
    start()
  }

  watch(
    () => auth.token,
    (token, prev) => {
      if (token && !prev) start()
      else if (!token && prev) stop()
    }
  )
})