// app/composables/useApi.ts
import apiService from '~/services/apiService'

export const useApi = () => {
  const loading = ref(false)
  const error   = ref<string | null>(null)

  /**
   * Wraps apiService with loading/error state.
   * Pattern mirrors: const response = await apiService(url, { method, body })
   * Pass { silent: true } to suppress the automatic error toast.
   */
  const request = async <T = unknown>(
    url: string,
    options: { method?: string; body?: unknown; headers?: Record<string, string>; silent?: boolean } = {}
  ): Promise<T | null> => {
    loading.value = true
    error.value   = null
    try {
      const data = await apiService(url, {
        method:  options.method,
        body:    options.body as BodyInit | null,
        headers: options.headers ?? {},
        silent:  options.silent ?? false,
      })
      return data as T
    } catch (e: unknown) {
      const err = e as Error & { status?: number }
      error.value = err.message || 'An unexpected error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { request, loading, error }
}