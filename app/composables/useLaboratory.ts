// app/composables/useLaboratory.ts
//
// Laboratory Orders API — the list + detail reads and the
// update / collect / receive PATCH workflow. All writes go out as multipart
// FormData (via toForm), matching the rest of the app's write endpoints.

// ── FormData helpers ─────────────────────────────────────────────────────────
// Build multipart FormData; objects are JSON-stringified, empty values skipped.
const toForm = (obj: Record<string, any>) => {
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
  })
  return fd
}

// Prefix a flat object's keys → { 'laboratory_order[key]': value }
const wrap = (prefix: string, obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [`${prefix}[${k}]`, v]),
  )

// ── types ────────────────────────────────────────────────────────────────────
export interface LabOrderDept {
  name: string; code: string; section: string | null; section_code: string | null
}
export interface LabOrderRow {
  uuid: string
  scheduled_for: string | null
  accession_number: string
  status: string
  urgency: string
  disposition: string | null
  patient_name: string
  age: number | null
  gender: string | null
  department: LabOrderDept | null
  specimen: string | null
  site: string | null
  collection_time: string | null
  reception_time: string | null
  referring_facility: string | null
  created_at: string
}
export interface LabListMeta {
  page: number; per_page: number; total: number; total_pages: number
  range: string | null; mode: string | null
}
export interface LabOrdersResponse { data: LabOrderRow[]; meta: LabListMeta }

export interface LabOrderTest {
  uuid: string; accession_number: string; status: string
  test_name: string; test_code: string; sample_name: string | null
  container: string | null; sample_measurement: string | null
  sample_volume_received: string | null
  prepared_smears: number | null; prepared_cellblocks: number | null
  total_submitted_cassettes: number; total_submitted_slides: number
  verified_by: string | null
  blocks: any[]; slides: any[]; results: any[]; notes: any[]
}
export interface LabOrderEncounter {
  id: number; type: string; status: string; test_id: number | null
  started_at: string | null; ended_at: string | null; due_at: string | null
  tat_status: string | null; instrument: string | null; workstation: string | null
  performed_by: string | null; verified_by: string | null; turnaround_hours: number | null
}
export interface LabOrderDetail extends LabOrderRow {
  requested_by: string | null
  requested_by_occupation: string | null
  received_by: string | null
  clinical_details: Record<string, any>
  tests: LabOrderTest[]
  encounters: LabOrderEncounter[]
  notes: any[]
}

// ── composable ───────────────────────────────────────────────────────────────
export const useLaboratory = () => {
  const { request } = useApi()

  const buildQuery = (params: Record<string, any>) => {
    const p = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
    })
    const qs = p.toString()
    return qs ? `?${qs}` : ''
  }

  // GET list — filters: from, to, q, status, urgency, department_id,
  // sub_department_id, page, per_page
  const listOrders = (params: Record<string, any> = {}) =>
    request<LabOrdersResponse>(`/laboratories/orders${buildQuery(params)}`)

  // GET single order (full detail: tests, encounters, notes)
  const showOrder = (uuid: string) =>
    request<LabOrderDetail>(`/laboratory/order/show?uuid=${uuid}`)

  // PATCH update — uuid + laboratory_order[...] keys
  const updateOrder = (uuid: string, fields: Record<string, any>) =>
    request<LabOrderDetail>('/laboratory/order/update', {
      method: 'PATCH',
      body: toForm({ uuid, ...wrap('laboratory_order', fields) }),
    })

  // PATCH collect — uuid + collected_at + laboratory_specimen_site_id (flat keys)
  const collectOrder = (uuid: string, payload: Record<string, any>) =>
    request<LabOrderDetail>('/laboratory/order/collect', {
      method: 'PATCH',
      body: toForm({ uuid, ...payload }),
    })

  // PATCH receive — uuid only
  const receiveOrder = (uuid: string) =>
    request<LabOrderDetail>('/laboratory/order/receive', {
      method: 'PATCH',
      body: toForm({ uuid }),
    })

  return { listOrders, showOrder, updateOrder, collectOrder, receiveOrder }
}