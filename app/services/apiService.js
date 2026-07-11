// app/services/apiService.js
import { ref } from 'vue'

const baseURLRef = ref('')

export const initApiService = ({ baseURL } = {}) => {
  if (baseURL) baseURLRef.value = baseURL
}

// pulls a human-readable message out of a FHIR OperationOutcome error body,
// falls back to plain {message}/{error} shapes, then to the HTTP status
function extractErrorMessage(errorData, fallback) {
  if (errorData?.resourceType === 'OperationOutcome' && Array.isArray(errorData.issue)) {
    const msg = errorData.issue
      .map(i => i.diagnostics || i.details?.text)
      .filter(Boolean)
      .join('; ')
    if (msg) return msg
  }
  return errorData?.message || errorData?.error || fallback
}

// lazy import so this module has no hard dependency on Pinia being ready
// (SSR / very first client tick before plugins run)
async function notifyError(message, title) {
  if (!import.meta.client) return
  try {
    const { useNotificationsStore } = await import('~/stores/notifications')
    useNotificationsStore().push('error', message, title ? { title } : {})
  } catch {
    // notification store unavailable — never let a toast failure mask the real error
  }
}

// maps an HTTP status to a short, specific toast title — falls back to a
// generic one for anything not called out explicitly
function titleForStatus(status) {
  if (status === 422) return "Couldn't save changes"
  if (status === 409) return 'Conflict'
  if (status === 404) return 'Not found'
  if (status === 429) return 'Too many requests'
  if (status >= 500) return 'Server error'
  return 'Request failed'
}

/**
 * Core fetch wrapper.
 * Authentication: Authorization: Bearer <token> read from the Pinia auth store
 * (persisted in localStorage under 'ibcc_auth').
 *
 * options.silent — skip the automatic error toast (e.g. background polling)
 *
 * @param {string} url
 * @param {{
 *   method?: string,
 *   body?: BodyInit | Record<string, unknown> | null,
 *   headers?: Record<string, string>,
 *   silent?: boolean
 * }} [options]
 */
export default async function apiService(
  url,
  { method = 'GET', body = null, headers = {}, silent = false } = {}
) {
  if (!baseURLRef.value) {
    throw new Error('apiService not initialized. Call initApiService first.')
  }

  try {
    const isFormData = body instanceof FormData

    if (body && !isFormData) {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }

    const rawAuth = localStorage.getItem('ibcc_auth')
    if (rawAuth) {
      try {
        const auth = JSON.parse(rawAuth)
        if (auth?.token) {
          headers['Authorization'] = `Bearer ${auth.token}`
        }
      } catch {
        // malformed storage entry — ignore
      }
    }

    const fullURL = baseURLRef.value + url
    console.log(`[API] ${method} ${fullURL}`)

    const hadToken = !!localStorage.getItem('ibcc_auth')

    const response = await fetch(fullURL, {
      method,
      body,
      headers: isFormData ? { ...headers } : headers,
    })

    console.log(`[API] ${response.status} ${fullURL}`)

    if (response.status === 401) {
      localStorage.removeItem('ibcc_auth')

      let errorData = null
      let errorMessage = 'Invalid credentials'
      try {
        errorData = await response.json()
        errorMessage = extractErrorMessage(errorData, errorMessage)
      } catch {
        // no JSON body — keep fallback message
      }

      if (!silent) {
        // hadToken → an authenticated request got rejected mid-session (expiry/revocation)
        // !hadToken → this was the login attempt itself, surface the real reason
        if (hadToken) {
          notifyError('Please sign in again to continue.', 'Session expired')
        } else {
          notifyError(errorMessage, 'Sign-in failed')
        }
      }

      if (hadToken && import.meta.client) {
        const { navigateTo } = await import('#app')
        navigateTo('/login')
      }

      const error = new Error(errorMessage)
      error.status = 401
      error.data = errorData
      throw error
    }

    if (response.status === 403) {
      if (!silent) notifyError("You don't have permission to do that.", 'Access denied')
    }

    if (!response.ok) {
      let errorData = null
      let errorMessage = `HTTP ${response.status}`

      try {
        errorData = await response.json()
        errorMessage = extractErrorMessage(errorData, errorMessage)
      } catch {
        try { errorMessage = (await response.text()) || errorMessage } catch { /* ignore */ }
      }

      if (!silent && response.status !== 401 && response.status !== 403) {
        notifyError(errorMessage, titleForStatus(response.status))
      }

      const error = new Error(errorMessage)
      error.status = response.status
      error.data = errorData
      throw error
    }

    if (response.status === 204) return null

    return await response.json()
  } catch (error) {
    console.error('[API] Error:', error.message)
    if (!silent && !error.status) {
      // network failure / CORS / offline — status is undefined here
      notifyError('Could not reach the server. Check your connection and try again.', 'Connection issue')
    }
    throw error
  }
}