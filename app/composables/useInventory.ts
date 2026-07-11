// app/composables/useInventory.ts
// Thin wrapper over apiService for the Inventory + Stock endpoints.
// NOTE the path inconsistency mirrored from the API spec:
//   - dashboards / lists / types live under  /inventories/...
//   - single-item + stock actions live under /inventory/...
// All write endpoints use multipart/form-data (FormData); apiService leaves the
// Content-Type unset for FormData so the browser can add the multipart boundary.
import apiService from '~/services/apiService'

const api = apiService as (
  url: string,
  opts?: { method?: string; body?: any; headers?: Record<string, string> }
) => Promise<any>

// ── helpers ──────────────────────────────────────────────────────────────
// Build a query string, skipping null / undefined / '' values.
const qs = (params: Record<string, any> = {}): string => {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === '') continue
    sp.append(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

// Append fields to a FormData, skipping null / undefined / '' values.
const toForm = (fields: Record<string, any> = {}): FormData => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined || v === '') continue
    fd.append(k, v as any)
  }
  return fd
}

// Re-key a flat object to `name[key]` form, matching the strong-params shape.
const wrap = (name: string, obj: Record<string, any> = {}): Record<string, any> => {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) out[`${name}[${k}]`] = v
  return out
}

// ── display formatters (auto-imported alongside useInventory) ──────────────
export const fmtQty = (v: any): string => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (v ?? '—')
}

export const fmtMoney = (v: any, currency = 'MWK'): string => {
  const n = Number(v)
  return Number.isFinite(n)
    ? `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'
}

// ── composable ─────────────────────────────────────────────────────────────
export const useInventory = () => {
  // Reads ───────────────────────────────────────────────
  const getDashboard = (filters = {}) => apiService(`/inventories/dashboard${qs(filters)}`)
  const getDepartmentDashboard = (filters = {}) => apiService(`/inventories/department_dashboard${qs(filters)}`)
  const getTypes = (filters = {}) => apiService(`/inventories/types${qs(filters)}`)
  const listItems = (filters = {}) => apiService(`/inventories${qs(filters)}`)
  const showItem = (uuid: string) => apiService(`/inventory/show${qs({ uuid })}`)
  const showStock = (uuid: string) => apiService(`/inventory/stock/show${qs({ uuid })}`)
  const getCountries = () => apiService('/countries')
  const getUsers = (filters = {}) => apiService(`/users${qs(filters)}`)
  const getDepartments = () => apiService('/departments')
  const showDepartment = (uuid: string) => apiService(`/department/show${qs({ uuid })}`)
  const downloadImportTemplate = () => apiService('/inventories/bulk_import_template/download')
  // ── cross-item history feeds (All Inventory Stock/Usage/Damages/Disposals/Expiration tabs) ──
  const getAllStock = (filters = {}) => apiService(`/inventories/all_stock${qs(filters)}`)
  const getUsage = (filters = {}) => apiService(`/inventories/usage${qs(filters)}`)
  const getDamaged = (filters = {}) => apiService(`/inventories/damaged${qs(filters)}`)
  const getDisposed = (filters = {}) => apiService(`/inventories/disposed${qs(filters)}`)
  const getExpiredItems = (filters = {}) => apiService(`/inventories/expired_items${qs(filters)}`)

  // Writes (FormData) ───────────────────────────────────
  // create: flat fields (inventory_type_id, code, name, …)
  const createItem = (fields: Record<string, any>) =>
    api('/inventory/create', { method: 'POST', body: toForm(fields) })

  // update: uuid + inventory[...] keys
  const updateItem = (uuid: string, inventory: Record<string, any>) =>
    api('/inventory/update', { method: 'PATCH', body: toForm({ uuid, ...wrap('inventory', inventory) }) })

  // price set: uuid + inventory_price[...] keys
  const setPrice = (uuid: string, price: Record<string, any>) =>
    api('/inventory/price/set', { method: 'PATCH', body: toForm({ uuid, ...wrap('inventory_price', price) }) })

  // price approve: uuid + price_uuid
  const approvePrice = (uuid: string, price_uuid: string) =>
    api('/inventory/price/approve', { method: 'PATCH', body: toForm({ uuid, price_uuid }) })

  // stock capture: uuid + inventory_stock[...] keys
  const captureStock = (uuid: string, stock: Record<string, any>) =>
    api('/inventory/stock/capture', { method: 'POST', body: toForm({ uuid, ...wrap('inventory_stock', stock) }) })

  // stock allocate: uuid + flat keys (inventory_stock_batch_no, department_uuid, …)
  const allocateStock = (uuid: string, payload: Record<string, any>) =>
    api('/inventory/stock/allocate', { method: 'POST', body: toForm({ uuid, ...payload }) })

  // report damage: uuid + flat keys (department_inventory_stock_batch_no, quantity, …)
  const reportDamage = (uuid: string, payload: Record<string, any>) =>
    api('/inventory/stock/report_damage', { method: 'POST', body: toForm({ uuid, ...payload }) })

  // report disposal: uuid + flat keys
  const reportDisposal = (uuid: string, payload: Record<string, any>) =>
    api('/inventory/stock/report_disposal', { method: 'POST', body: toForm({ uuid, ...payload }) })

  // approve adjustment: kind (damage|disposal) + adjustment_uuid
  const approveAdjustment = (kind: 'damage' | 'disposal', adjustment_uuid: string) =>
    api('/inventory/stock/approve_adjustment', { method: 'PATCH', body: toForm({ kind, adjustment_uuid }) })

  return {
    getDashboard, getDepartmentDashboard, getTypes, listItems, showItem, showStock, getCountries,
    getUsers, getDepartments, showDepartment, downloadImportTemplate,
    getAllStock, getUsage, getDamaged, getDisposed, getExpiredItems,
    createItem, updateItem, setPrice, approvePrice, captureStock, allocateStock,
    reportDamage, reportDisposal, approveAdjustment,
  }
}