// app/plugins/laboratory-settings.client.ts
//
// Preloads /laboratories/settings/* into the useLaboratorySettings module
// state on app boot so the settings page opens instantly.
//
import { useLaboratorySettings } from '~/composables/useLaboratorySettings'

export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { preload } = useLaboratorySettings()

  const kick = () => {
    if (!auth.isAuthenticated) return
    preload().catch(() => { /* error is exposed via the composable */ })
  }

  // 1) Boot: preload immediately if already logged in.
  kick()

  // 2) After login: watch the flag and preload once the token is available.
  watch(() => auth.isAuthenticated, (v) => { if (v) kick() })
})