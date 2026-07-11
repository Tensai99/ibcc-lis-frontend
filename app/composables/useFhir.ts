// app/composables/useFhir.ts
// ── FHIR R4 Patient resource parser ───────────────────────────────────────
// Extracts flat, display-ready fields from a FHIR Patient resource or a
// FHIR Bundle (searchset) so the rest of the app never has to touch FHIR
// path logic directly.

export interface FhirPatient {
  id:             string
  mrn:            string
  full_name:      string
  family:         string
  given:          string
  preferred_name: string | null
  gender:         string
  date_of_birth:  string
  active:         boolean
  phone_primary:  string | null
  phone_secondary:string | null
  email:          string | null
  address_line1:  string | null
  address_line2:  string | null
  city:           string | null
  state:          string | null
  postal_code:    string | null
  country:        string | null
  nok_name:       string | null
  nok_relationship: string | null
  nok_phone:      string | null
  // FHIR extensions (cancer-specific)
  cancer_type:    string | null
  cancer_stage:   string | null
  ecog_status:    string | null
  blood_group:    string | null
  treatment_protocol: string | null
  // Raw resource for detail views
  _raw: Record<string, unknown>
}

/**
 * Parse a single FHIR Patient resource into FhirPatient.
 */
export function parseFhirPatient(res: Record<string, unknown>): FhirPatient {
  // ── Identifiers ────────────────────────────────────────────────────────
  const identifiers = (res.identifier as Record<string,unknown>[] | undefined) ?? []
  const mrn = identifiers.find((id: Record<string,unknown>) => {
    const coding = ((id.type as Record<string,unknown>)?.coding as Record<string,unknown>[] | undefined) ?? []
    return coding.some((c: Record<string,unknown>) => c.code === 'MR')
  })
  const mrnValue = (mrn?.value as string) ?? ''

  // ── Name ───────────────────────────────────────────────────────────────
  const names = (res.name as Record<string,unknown>[] | undefined) ?? []
  const official = names.find((n: Record<string,unknown>) => n.use === 'official') ?? names[0] ?? {}
  const nickname = names.find((n: Record<string,unknown>) => n.use === 'nickname')
  const given    = ((official.given as string[] | undefined) ?? []).join(' ')
  const family   = (official.family as string) ?? ''
  const fullName = (official.text as string) ?? `${given} ${family}`.trim()

  // ── Telecom ────────────────────────────────────────────────────────────
  const telecoms = (res.telecom as Record<string,unknown>[] | undefined) ?? []
  const mobile   = telecoms.find((t: Record<string,unknown>) => t.system === 'phone' && t.use === 'mobile')
  const home     = telecoms.find((t: Record<string,unknown>) => t.system === 'phone' && t.use === 'home')
  const emailT   = telecoms.find((t: Record<string,unknown>) => t.system === 'email')

  // ── Address ────────────────────────────────────────────────────────────
  const addresses = (res.address as Record<string,unknown>[] | undefined) ?? []
  const homeAddr  = addresses.find((a: Record<string,unknown>) => a.use === 'home') ?? addresses[0] ?? {}
  const addrLines = (homeAddr.line as string[] | undefined) ?? []

  // ── Contact (next of kin) ──────────────────────────────────────────────
  const contacts = (res.contact as Record<string,unknown>[] | undefined) ?? []
  const nok      = contacts[0] ?? {}
  const nokName  = ((nok.name as Record<string,unknown>)?.text as string) ?? null
  const nokRels  = (nok.relationship as Record<string,unknown>[] | undefined) ?? []
  const nokRel   = nokRels[0]?.text as string ?? null
  const nokTels  = (nok.telecom as Record<string,unknown>[] | undefined) ?? []
  const nokPhone = (nokTels[0]?.value as string) ?? null

  // ── FHIR Extensions ───────────────────────────────────────────────────
  const extensions = (res.extension as Record<string,unknown>[] | undefined) ?? []
  const extVal = (urlSuffix: string) => {
    const ext = extensions.find((e: Record<string,unknown>) =>
      (e.url as string)?.endsWith(urlSuffix)
    )
    return (ext?.valueString ?? ext?.valueInteger ?? null) as string | null
  }

  return {
    id:               String(res.id ?? ''),
    mrn:              mrnValue,
    full_name:        fullName,
    family,
    given,
    preferred_name:   (nickname?.text as string) ?? null,
    gender:           (res.gender as string) ?? '',
    date_of_birth:    (res.birthDate as string) ?? '',
    active:           (res.active as boolean) ?? true,
    phone_primary:    (mobile?.value as string) || null,
    phone_secondary:  (home?.value as string) || null,
    email:            (emailT?.value as string) || null,
    address_line1:    addrLines[0] ?? null,
    address_line2:    addrLines[1] ?? null,
    city:             (homeAddr.city as string)       ?? null,
    state:            (homeAddr.state as string)      ?? null,
    postal_code:      (homeAddr.postalCode as string) ?? null,
    country:          (homeAddr.country as string)    ?? null,
    nok_name:         nokName,
    nok_relationship: nokRel,
    nok_phone:        nokPhone,
    cancer_type:      extVal('cancer-type'),
    cancer_stage:     extVal('cancer-stage'),
    ecog_status:      String(extVal('ecog-status') ?? ''),
    blood_group:      extVal('blood-group'),
    treatment_protocol: extVal('treatment-protocol'),
    _raw: res,
  }
}

/**
 * Parse a FHIR Bundle searchset into an array of FhirPatient.
 */
export function parseFhirBundle(bundle: Record<string, unknown>): FhirPatient[] {
  if (bundle.resourceType !== 'Bundle') return []
  const entries = (bundle.entry as Record<string,unknown>[] | undefined) ?? []
  return entries
    .map((e: Record<string,unknown>) => e.resource as Record<string,unknown>)
    .filter(Boolean)
    .map(parseFhirPatient)
}
