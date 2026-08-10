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
  uuid: string; type: string; status: string; test_uuid: string | null
  started_at: string | null; ended_at: string | null; due_at: string | null
  tat_status: string | null; instrument: string | null; workstation: string | null
  performed_by: string | null; verified_by: string | null; turnaround_hours: number | null
}

// ADD — after LabOrderEncounter
export interface LabOrderTimelineStation {
  uuid: string
  station: string
  code: string            // 'RECEPTION' | 'GROSSING' | 'MICROTOMY' | 'STAINING' | 'IMAGING' | 'REPORTING' | 'RELEASE' | ...
  sequence: number
  status: string          // 'planned' | 'in_progress' | 'completed' | 'verified' | ...
  test_uuid: string | null
  started_at: string | null
  ended_at: string | null
  due_at: string | null
  tat_status: string | null
  turnaround_hours: number | null
  performed_by: string | null
  verified_by: string | null
}
export interface LabOrderTimeline {
  accession_number: string
  status: string
  timeline: LabOrderTimelineStation[]
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

export interface LabTestDetail {
  order: LabOrderDetail
  test: LabOrderTest
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

  // GET order timeline — station-by-station status/TAT
  const getOrderTimeline = (uuid: string) =>
    request<LabOrderTimeline>(`/laboratory/order/timeline?uuid=${uuid}`)

  // GET single test (order context + full test payload)
  const showTest = (uuid: string, testUuid: string) =>
    request<LabTestDetail>(`/laboratory/order/test/show${buildQuery({ uuid, test_uuid: testUuid })}`)

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

  // PATCH void — uuid + voided_reason (flat keys)
  const voidOrder = (uuid: string, voided_reason: string) =>
    request<LabOrderDetail>('/laboratory/order/void', {
      method: 'PATCH',
      body: toForm({ uuid, voided_reason }),
    })

  // POST report — uuid + comments (flat keys)
  const reportOrder = (uuid: string, comments: string) =>
    request<LabOrderDetail>('/laboratory/order/report', {
      method: 'POST',
      body: toForm({ uuid, comments }),
    })

  // PATCH release — uuid + released_to + comments (flat keys)
  const releaseOrder = (uuid: string, released_to: string, comments: string) =>
    request<LabOrderDetail>('/laboratory/order/release', {
      method: 'PATCH',
      body: toForm({ uuid, released_to, comments }),
    })

  // POST gross — uuid + test_uuid + blocks[] (each block: laboratory_order_test_container_type_uuid,
  // label_range, description, decalcified, tissue_embedded)
  const grossTest = (
    uuid: string,
    testUuid: string,
    blocks: Record<string, any>[],
  ) =>
    request<LabTestDetail>('/laboratory/order/test/gross', {
      method: 'POST',
      body: ({ uuid, test_uuid: testUuid, blocks }),
      headers: { 'Content-Type': 'application/json' },
    })

  // POST section blocks — uuid + test_uuid + slides[]
  // each slide: laboratory_order_test_block_uuid, label_range, stain, stain_category
  const sectionBlocks = (
    uuid: string,
    testUuid: string,
    slides: Record<string, any>[],
  ) =>
    request<LabTestDetail>('/laboratory/order/test/blocks/section', {
      method: 'POST',
      body: ({ uuid, test_uuid: testUuid, slides }),
      headers: { 'Content-Type': 'application/json' },
    })

  // PATCH stain slides — uuid + test_uuid + slide_uuids[]
  const stainSlides = (
    uuid: string,
    testUuid: string,
    slideUuids: string[],
  ) =>
    request<LabTestDetail>('/laboratory/order/test/slides/stain', {
      method: 'PATCH',
      body: ({ uuid, test_uuid: testUuid, slide_uuids: slideUuids }),
      headers: { 'Content-Type': 'application/json' },
    })

  // PATCH image slides — uuid + test_uuid + slides[{ uuid, image_url }]
  const imageSlides = (
    uuid: string,
    testUuid: string,
    slides: { uuid: string; image_url: string }[],
  ) =>
    request<LabTestDetail>('/laboratory/order/test/slides/image', {
      method: 'PATCH',
      body: ({ uuid, test_uuid: testUuid, slides }),
      headers: { 'Content-Type': 'application/json' },
    })

  // POST results — uuid + test_uuid + results[]
  // each row: analyte_name, one of (value_numeric | value_coded | value_text),
  // optional: analyte_code, loinc_code, unit, reference_low/high/text,
  // flag, status, is_critical, instrument, method, comment,
  // critical_notified_to, critical_notified_at
  const createResults = (
    uuid: string,
    testUuid: string,
    results: Record<string, any>[],
  ) =>
    request<LabTestDetail>('/laboratory/order/test/results', {
      method: 'POST',
      body: ({ uuid, test_uuid: testUuid, results }),
      headers: { 'Content-Type': 'application/json' },
    })

  // PATCH validate a single result — uuid + test_uuid + result_uuid + level (+ optional status)
  const validateResult = (
    uuid: string,
    testUuid: string,
    resultUuid: string,
    level: 'technical' | 'clinical',
    status?: 'final' | 'corrected' | 'amended',
  ) =>
    request<LabTestDetail>('/laboratory/order/test/result/validate', {
      method: 'PATCH',
      body: ({
        uuid,
        test_uuid: testUuid,
        result_uuid: resultUuid,
        level,
        ...(status ? { status } : {}),
      }),
      headers: { 'Content-Type': 'application/json' },
    })

  return {
    listOrders, showOrder, showTest, updateOrder, collectOrder, receiveOrder,
    voidOrder, reportOrder, releaseOrder, grossTest, sectionBlocks, stainSlides, imageSlides,
    createResults, validateResult,
    getOrderTimeline,
  }
}