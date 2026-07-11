// app/plugins/api.js
import { initApiService } from '~/services/apiService'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  initApiService({ baseURL: config.public.backEndUrl })
})
