// app/stores/auth.ts
import { defineStore } from 'pinia'

// ── Types ──────────────────────────────────────────────────────────────────
export interface AuthUser {
  full_name: string
  username: string
  email: string
  role: string
  role_label: string
  department: string
  permissions: string[]
}

export interface AuthState {
  token: string | null
  expires_at: string | null
  user: AuthUser | null
}

const STORAGE_KEY = 'ibcc_auth'

// ── Permissions matrix ─────────────────────────────────────────────────────
// Canonical reference for role → permission mapping (synced with server payloads).
// Each role below now mirrors the exact `permissions` array the server returns on
// /session — including the inventory_* and asset_* permission families.
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_administrator: [
    'customer_registration', 'customer_search', 'customer_view',
    'pre_costing_create', 'pre_costing_search', 'pre_costing_view', 'pre_costing_approve',
    'proforma_invoice_create', 'proforma_invoice_search', 'proforma_invoice_view',
    'proforma_invoice_settle', 'proforma_invoice_schedule',
    'receipt_search', 'receipt_view', 'receipt_revoke',
    'patient_registration', 'patient_search', 'patient_view',
    'vitals_capture', 'consultation',
    'lab_referral', 'lab_results',
    'radiology_referral', 'radiology_results',
    'pharmacy_dispensing',
    'billing_view', 'billing_create', 'billing_approve',
    'encounter_management', 'next_encounter_assignment',
    'report_view', 'report_export',
    'admin_users', 'admin_system',
    // Inventory + Asset (full control)
    'inventory_view', 'inventory_management', 'inventory_pricing', 'inventory_stock', 'inventory_adjustment',
    'asset_view', 'asset_management', 'asset_custody', 'asset_maintenance', 'asset_writeoff',
  ],
  oncologist: [
    'patient_search', 'patient_view',
    'vitals_capture', 'consultation',
    'lab_referral', 'lab_results',
    'radiology_referral', 'radiology_results',
    'next_encounter_assignment',
    'report_view',
  ],
  resident_doctor: [
    'patient_search', 'patient_view',
    'vitals_capture', 'consultation',
    'lab_referral', 'lab_results',
    'radiology_referral',
    'next_encounter_assignment',
  ],
  oncology_nurse: [
    'patient_search', 'patient_view',
    'vitals_capture',
    'next_encounter_assignment',
    // Inventory + Asset (operational read + stock movement / custody)
    'inventory_view', 'inventory_stock', 'inventory_adjustment',
    'asset_view', 'asset_custody',
  ],
  clinical_nurse: [
    'patient_search', 'patient_view',
    'vitals_capture',
    'next_encounter_assignment',
    'inventory_view', 'inventory_stock', 'inventory_adjustment',
    'asset_view', 'asset_custody',
  ],
  receptionist: [
    'customer_registration', 'customer_search', 'customer_view',
    'pre_costing_search', 'pre_costing_view',
    'proforma_invoice_search', 'proforma_invoice_view', 'proforma_invoice_schedule',
    'patient_registration', 'patient_search', 'patient_view',
    'next_encounter_assignment',
    'billing_view',
  ],
  medical_records: [
    'patient_registration', 'patient_search', 'patient_view',
    'report_view',
  ],
  lab_technician: [
    'patient_search', 'patient_view',
    'lab_referral', 'lab_results',
    // Inventory + Asset (reagent stock + custody)
    'inventory_view', 'inventory_stock', 'inventory_adjustment',
    'asset_view', 'asset_custody',
  ],
  radiographer: [
    'patient_search', 'patient_view',
    'radiology_referral', 'radiology_results',
    'asset_view', 'asset_custody',
  ],
  pharmacist: [
    'patient_search', 'patient_view',
    'pharmacy_dispensing',
    'inventory_view', 'inventory_stock', 'inventory_adjustment',
    'asset_view', 'asset_custody',
  ],
  finance_officer: [
    'customer_search', 'customer_view',
    'pre_costing_create', 'pre_costing_search', 'pre_costing_view', 'pre_costing_approve',
    'proforma_invoice_search', 'proforma_invoice_view', 'proforma_invoice_settle',
    'receipt_search', 'receipt_view', 'receipt_revoke',
    'patient_view',
    'billing_view', 'billing_create', 'billing_approve',
    'report_view', 'report_export',
    // Inventory + Asset (pricing + write-off oversight)
    'inventory_view', 'inventory_pricing',
    'asset_view', 'asset_writeoff',
  ],
  social_worker: ['patient_view'],
  palliative_nurse: ['patient_view', 'vitals_capture'],
  medical_director: [
    'patient_registration', 'patient_search', 'patient_view',
    'vitals_capture', 'consultation',
    'lab_referral', 'lab_results',
    'radiology_referral', 'radiology_results',
    'billing_view', 'billing_create', 'billing_approve',
    'encounter_management', 'next_encounter_assignment',
    'report_view', 'report_export',
    'admin_users',
    'inventory_view', 'asset_view',
  ],

  // ── NEW ROLES ─────────────────────────────────────────────────────────────
  // Owns the central store + departmental holdings, pricing and stock movements.
  inventory_officer: [
    'inventory_view', 'inventory_management', 'inventory_pricing', 'inventory_stock', 'inventory_adjustment',
  ],
  // Biomedical Engineering Lead — owns the asset register, maintenance and disposals.
  bme_lead: [
    'asset_view', 'asset_management', 'asset_custody', 'asset_maintenance', 'asset_writeoff',
  ],
}

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
      this.user       = payload.user

      // Merge server permissions with local role permissions for resilience
      const rolePerms: string[] = ROLE_PERMISSIONS[payload.user?.role] ?? []
      if (rolePerms.length) {
        const merged = Array.from(new Set([
          ...(payload.user.permissions ?? []),
          ...rolePerms,
        ]))
        this.user = { ...payload.user, permissions: merged }
      }

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