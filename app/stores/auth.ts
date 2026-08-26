// app/stores/auth.ts
import { defineStore } from 'pinia'

// ── Types ──────────────────────────────────────────────────────────────────
export interface AuthUser {
  full_name: string
  username: string
  email: string
  role: string
  role_label: string
  is_doctor: boolean
  department: string
  permissions: string[]
}

export interface AuthState {
  token: string | null
  expires_at: string | null
  user: AuthUser | null
}

const STORAGE_KEY = 'ibcc_auth'

// ── Store ──────────────────────────────────────────────────────────────────
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token:      null,
    expires_at: null,
    user:       null,
  }),

  getters: {
    isAuthenticated: (state): boolean => {
      if (!state.token || !state.expires_at) return false
      return new Date(state.expires_at) > new Date()
    },

    /** Check if the current user has a given permission */
    can: (state) => (permission: string): boolean => {
      return state.user?.permissions?.includes(permission) ?? false
    },

    /** Check if user has ALL of the given permissions */
    canAll: (state) => (permissions: string[]): boolean => {
      return permissions.every(p => state.user?.permissions?.includes(p) ?? false)
    },

    /** Check if user has ANY of the given permissions */
    canAny: (state) => (permissions: string[]): boolean => {
      return permissions.some(p => state.user?.permissions?.includes(p) ?? false)
    },

    currentRole: (state): string => state.user?.role ?? '',
    currentUser: (state): AuthUser | null => state.user,
    authHeader:  (state): string => state.token ? `Bearer ${state.token}` : '',
  },

  actions: {
    /** Called after a successful /session POST */
    setAuth(payload: { token: string; expires_at: string; user: AuthUser }) {
      this.token      = payload.token
      this.expires_at = payload.expires_at
      // Trust the server's permissions array exactly as returned — no local
      // overrides or merging.
      this.user       = payload.user

      this._persist()
    },

    /** Restore auth from localStorage (called in app.vue or middleware) */
    hydrate() {
      if (!import.meta.client) return
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        if (data?.token && data?.expires_at && new Date(data.expires_at) > new Date()) {
          this.token      = data.token
          this.expires_at = data.expires_at
          this.user       = data.user
        } else {
          this.clear()
        }
      } catch {
        this.clear()
      }
    },

    /** Clear all auth state (logout) */
    clear() {
      this.token      = null
      this.expires_at = null
      this.user       = null
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
    },

    _persist() {
      if (!import.meta.client) return
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        token:      this.token,
        expires_at: this.expires_at,
        user:       this.user,
      }))
    },
  },
})