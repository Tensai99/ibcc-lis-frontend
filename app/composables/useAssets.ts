// app/composables/useAssets.ts
// Thin wrapper over apiService for the Assets, Maintenance, Inspection and
// Checklist-Template endpoints. Mirrors useInventory conventions.
//   - dashboards / lists / types / templates live under /assets/...
//   - single-asset actions live under /asset/...
// Write endpoints that carry files use multipart/form-data (FormData); the
// inspect / maintenance endpoints take JSON bodies (apiService JSON-encodes
// any non-FormData body automatically).
import apiService from '~/services/apiService'

// apiService is plain JS, so TS infers its `body` param as `null | undefined`
// from the default value. Cast once to a permissive signature so FormData / JSON
// bodies type-check at every call site below.
const call = apiService as unknown as (
  url: string,
  opts?: { method?: string; body?: any; headers?: Record<string, any> },
) => Promise<any>

// ── helpers ──────────────────────────────────────────────────────────────
const qs = (params: Record<string, any> = {}): string => {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === '') continue
    sp.append(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

// Append flat fields to a FormData, skipping null / undefined / '' values.
const toForm = (fields: Record<string, any> = {}): FormData => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined || v === '') continue
    fd.append(k, v as any)
  }
  return fd
}

// Append an array of File objects under `key[]` (Rails array-param shape).
const appendFiles = (fd: FormData, key: string, files?: File[] | FileList | null) => {
  if (!files) return
  Array.from(files).forEach((f) => { if (f) fd.append(`${key}[]`, f) })
}

// Re-key a flat object to `name[key]` form, skipping null / '' values.
const wrap = (name: string, obj: Record<string, any> = {}): Record<string, any> => {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue
    out[`${name}[${k}]`] = v
  }
  return out
}

// ── display formatters (auto-imported alongside useAssets) ─────────────────
export const fmtAssetMoney = (v: any, currency = 'MWK'): string => {
  const n = Number(v)
  return Number.isFinite(n)
    ? `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'
}
// pretty-print an UPPER_SNAKE enum → "Title Case"
export const titleCase = (v: any): string =>
  String(v ?? '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—'

// ── composable ─────────────────────────────────────────────────────────────
export const useAssets = () => {
  // Reads ───────────────────────────────────────────────
  const getDashboard = (filters = {}) => call(`/assets/dashboard${qs(filters)}`)
  const getDepartmentDashboard = (filters = {}) => call(`/assets/department_dashboard${qs(filters)}`)
  const getTypes = (filters = {}) => call(`/assets/types${qs(filters)}`)
  const listAssets = (filters = {}) => call(`/assets${qs(filters)}`)
  const showAsset = (uuid: string) => call(`/asset/show${qs({ uuid })}`)
  const getHistory = (uuid: string) => call(`/asset/history${qs({ uuid })}`)
  const showInspection = (inspection_uuid: string) => call(`/asset/inspection/show${qs({ inspection_uuid })}`)
  const showMaintenance = (maintenance_uuid: string) => call(`/asset/maintenance/show${qs({ maintenance_uuid })}`)
  // Templates use POST per the API spec
  const getChecklistTemplates = (filters = {}) => call(`/assets/checklist_templates${qs(filters)}`)
  const showChecklistTemplate = (uuid: string) => call(`/assets/checklist_template/show${qs({ uuid })}`)
  // create a checklist template (JSON body: code, name, description, asset_type_id, inspection_type, frequency, checklist.sections)
  const saveChecklistTemplate = (payload: Record<string, any>) =>
    call('/assets/checklist_template/save', { method: 'POST', body: payload })
  // update a checklist template (JSON body: uuid, description?, checklist.sections)
  const updateChecklistTemplate = (payload: Record<string, any>) =>
    call('/assets/checklist_template/update', { method: 'PATCH', body: payload })

  // Shared lookups (same endpoints used by the inventory pages)
  const getCountries = () => call('/countries')
  const getDepartments = () => call('/departments')
  const showDepartment = (uuid: string) => call(`/department/show${qs({ uuid })}`)
  const getUsers = (filters = {}) => call(`/users${qs(filters)}`)
  const downloadImportTemplate = () => call('/assets/bulk_import/template/download')
  // process a filled bulk-import workbook: multipart `file`
  const processImport = (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return call('/assets/bulk_import/template/process', { method: 'POST', body: fd })
  }
  // ── cross-asset history feeds (All Assets Issues/Maintenances/Inspections/Damages/Disposals tabs) ──
  const getAllIssues = (filters = {}) => call(`/assets/all_issues${qs(filters)}`)
  const getAllMaintenances = (filters = {}) => call(`/assets/all_maintenances${qs(filters)}`)
  const getAllInspections = (filters = {}) => call(`/assets/all_inspections${qs(filters)}`)
  const getDamaged = (filters = {}) => call(`/assets/damaged${qs(filters)}`)
  const getDisposed = (filters = {}) => call(`/assets/disposed${qs(filters)}`)

  // Writes ─────────────────────────────────────────────
  // create: asset[...] keys + asset[pictures][] files
  const createAsset = (asset: Record<string, any>, pictures?: File[] | FileList | null) => {
    const fd = toForm(wrap('asset', asset))
    appendFiles(fd, 'asset[pictures]', pictures)
    return call('/asset/create', { method: 'POST', body: fd })
  }

  // update: uuid + asset[...] keys + asset[pictures][] files
  const updateAsset = (uuid: string, asset: Record<string, any>, pictures?: File[] | FileList | null) => {
    const fd = toForm({ uuid, ...wrap('asset', asset) })
    appendFiles(fd, 'asset[pictures]', pictures)
    return call('/asset/update', { method: 'PATCH', body: fd })
  }

  // allocate: uuid + flat keys (quantity, department_uuid, sub_department_uuid, room_description, custodian_uuid)
  const allocateAsset = (uuid: string, payload: Record<string, any>) =>
    call('/asset/allocate', { method: 'POST', body: toForm({ uuid, ...payload }) })

  // report issue: uuid + flat keys (quantity, fault_description, severity) + pictures[] files
  const reportIssue = (uuid: string, payload: Record<string, any>, pictures?: File[] | FileList | null) => {
    const fd = toForm({ uuid, ...payload })
    appendFiles(fd, 'pictures', pictures)
    return call('/asset/report_issue', { method: 'POST', body: fd })
  }

  // inspect: JSON body
  const inspectAsset = (payload: Record<string, any>) =>
    call('/asset/inspect', { method: 'POST', body: payload })

  // maintenance schedule / complete: JSON bodies
  const scheduleMaintenance = (payload: Record<string, any>) =>
    call('/asset/maintenance/schedule', { method: 'POST', body: payload })
  const completeMaintenance = (payload: Record<string, any>) =>
    call('/asset/maintenance/complete', { method: 'PATCH', body: payload })

  // report damage: uuid + flat keys
  const reportDamage = (uuid: string, payload: Record<string, any>) =>
    call('/asset/damage/report', { method: 'POST', body: toForm({ uuid, ...payload }) })

  // dispose: uuid + flat keys
  const disposeAsset = (uuid: string, payload: Record<string, any>) =>
    call('/asset/dispose', { method: 'POST', body: toForm({ uuid, ...payload }) })

  // write-off approval (damage|disposal): record_uuid + kind
  const approveWriteoff = (record_uuid: string, kind: 'damage' | 'disposal') =>
    call('/asset/writeoff/approve', { method: 'PATCH', body: toForm({ record_uuid, kind }) })

  // ── Tools (BME tool crib) ───────────────────────────────
  const getTools = (filters = {}) => call(`/assets/tools${qs(filters)}`)
  const getToolRegisters = (filters = {}) => call(`/assets/tools/registers${qs(filters)}`)
  // create tool: name, description, category, quantity, condition, custodian_uuid
  const createTool = (payload: Record<string, any>) =>
    call('/assets/tool/create', { method: 'POST', body: toForm(payload) })
  // checkout: tool_uuid, taken_by_uuid, date_taken, expected_return_date, purpose, asset_maintenance_uuid?
  const checkoutTool = (payload: Record<string, any>) =>
    call('/assets/tool/checkout', { method: 'POST', body: toForm(payload) })
  // checkin: tool_register_uuid, returned_on, condition, comment
  const checkinTool = (payload: Record<string, any>) =>
    call('/assets/tool/checkin', { method: 'PATCH', body: toForm(payload) })

  return {
    getDashboard, getDepartmentDashboard, getTypes, listAssets, showAsset, getHistory,
    showInspection, showMaintenance,
    getChecklistTemplates, showChecklistTemplate, saveChecklistTemplate, updateChecklistTemplate,
    getCountries, getDepartments, showDepartment, getUsers, downloadImportTemplate, processImport,
    getAllIssues, getAllMaintenances, getAllInspections, getDamaged, getDisposed,
    createAsset, updateAsset, allocateAsset, reportIssue, inspectAsset,
    scheduleMaintenance, completeMaintenance, reportDamage, disposeAsset, approveWriteoff,
    getTools, getToolRegisters, createTool, checkoutTool, checkinTool,
  }
}