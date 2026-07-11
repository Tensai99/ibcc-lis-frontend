// shared/utils/documentParser.ts
// Pure identity-document parser. Safe to import from BOTH the Nuxt app and Nitro
// server routes (Nuxt 4 `shared/`) — only depends on the pure-JS `mrz` package
// (no DOM, no tesseract, no zxing). Reuse server-side for re-validating submitted
// fields:  import { parseRawCode } from '#shared/utils/documentParser'
import { parse as parseMrz } from 'mrz'

export interface ParsedIdentity {
  documentType: 'national_id' | 'passport' | 'drivers_license'
  country: string            // ISO 3166-1 alpha-3
  idNumber: string
  surname: string
  givenNames: string
  sex: 'M' | 'F' | 'X'
  dateOfBirth: string        // ISO 8601 (YYYY-MM-DD)
  expiryDate?: string        // ISO 8601
  issueDate?: string         // ISO 8601
  nationality: string        // ISO 3166-1 alpha-3
  raw: string                // original decoded string
  unverifiedFields?: string[] // fields whose 7-3-1 modulo-10 check digit failed
}

export type RawFormat = 'mrz_td1' | 'mrz_td2' | 'mrz_td3' | 'mosip' | 'aamva'

// ── Detection ─────────────────────────────────────────────────────────────────
export function detectFormat(raw: string): RawFormat | null {
  const s = raw.trim()
  if (!s) return null

  // AAMVA (US/CA driver licences, PDF417): compliance header or DL subfile tags.
  if (/^@/.test(s) || /\bANSI\s/.test(s) || /\bDAQ[A-Z0-9]/.test(s)) return 'aamva'

  // MOSIP national-ID QR: tilde-delimited payload (deployment-specific ordering).
  if (s.includes('~') && !s.includes('<')) return 'mosip'

  // MRZ: heavy use of the filler char '<'. Normalise to lines.
  const lines = s.split(/\r?\n/).map(l => l.replace(/\s+/g, '')).filter(Boolean)
  if (lines.some(l => l.includes('<'))) {
    if (lines.length === 3 && lines.every(l => l.length >= 28 && l.length <= 30)) return 'mrz_td1'
    if (lines.length === 2 && lines.every(l => l.length >= 34 && l.length <= 36)) return 'mrz_td2'
    if (lines.length === 2 && lines.every(l => l.length >= 42 && l.length <= 44)) return 'mrz_td3'
    if (lines.length === 2 || lines.length === 3) return lines[0]!.length > 40 ? 'mrz_td3' : 'mrz_td1'
  }
  return null
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const toIso = (d?: string | null): string | undefined => {
  if (!d) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const m = /^(\d{2})(\d{2})(\d{2})$/.exec(d) // mrz returns YYMMDD
  if (!m) return undefined
  const yy = m[1]!, mm = m[2]!, dd = m[3]!
  const year = Number(yy)
  const pivot = (new Date().getFullYear() % 100) + 10 // beyond ~now+10y → 1900s
  return `${(year > pivot ? 1900 : 2000) + year}-${mm}-${dd}`
}

const mapSex = (v?: string | null): 'M' | 'F' | 'X' => {
  const s = (v ?? '').toString().toLowerCase()
  return s.startsWith('m') ? 'M' : s.startsWith('f') ? 'F' : 'X'
}

const cleanName = (v?: string | null) =>
  (v ?? '').replace(/</g, ' ').replace(/\s+/g, ' ').trim()

// ── MRZ (TD1 / TD2 / TD3) — delegated to `mrz`, incl. 7-3-1 check digits ──────
function parseMrzRaw(raw: string, format: RawFormat): ParsedIdentity | null {
  const lines = raw.trim().split(/\r?\n/).map(l => l.replace(/\s+/g, '')).filter(Boolean)
  let result: ReturnType<typeof parseMrz>
  try { result = parseMrz(lines) } catch { return null }

  const f: any = result.fields
  const unverified = (result.details ?? [])
    .filter((d: any) => d.valid === false && d.field)
    .map((d: any) => d.field as string)

  const documentType: ParsedIdentity['documentType'] =
    (f.documentCode || '').toUpperCase().startsWith('P') || format === 'mrz_td3'
      ? 'passport' : 'national_id'

  return {
    documentType,
    country: (f.issuingState || '').toUpperCase(),
    idNumber: (f.documentNumber || '').replace(/</g, '').trim(),
    surname: cleanName(f.lastName),
    givenNames: cleanName(f.firstName),
    sex: mapSex(f.sex),
    dateOfBirth: toIso(f.birthDate) ?? '',
    expiryDate: toIso(f.expirationDate),
    nationality: (f.nationality || '').toUpperCase(),
    raw,
    unverifiedFields: unverified.length ? unverified : undefined,
  }
}

// ── MOSIP (tilde-delimited QR) ─────────────────────────────────────────────────
// NOTE: MOSIP QR field ORDER is deployment-specific. This positional map follows
// the common reference layout — adjust indices to your issuer's spec.
function parseMosip(raw: string): ParsedIdentity | null {
  const p = raw.trim().split('~')
  if (p.length < 5) return null
  const [idNumber = '', fullName = '', dob = '', sex = '', , nationality = 'MWI'] = p
  const parts = fullName.trim().split(/\s+/)
  return {
    documentType: 'national_id',
    country: (nationality || 'MWI').toUpperCase(),
    idNumber: idNumber.trim(),
    surname: parts.length > 1 ? (parts[parts.length - 1] ?? '') : '',
    givenNames: parts.length > 1 ? parts.slice(0, -1).join(' ') : fullName.trim(),
    sex: mapSex(sex),
    dateOfBirth: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : (toIso(dob.replace(/\D/g, '').slice(0, 6)) ?? ''),
    nationality: (nationality || 'MWI').toUpperCase(),
    raw,
  }
}

// ── AAMVA (US/CA PDF417 driver licences) ──────────────────────────────────────
function parseAamva(raw: string): ParsedIdentity | null {
  const get = (tag: string) => (new RegExp(`${tag}([^\\n\\r]*)`).exec(raw)?.[1] ?? '').trim()
  const idNumber = get('DAQ')
  const last = get('DCS') || get('DAB')
  const first = get('DAC') || get('DCT')
  const middle = get('DAD')
  const sex = get('DBC')                 // 1=M, 2=F
  const country = get('DCG') || 'USA'

  const aamvaDate = (v: string): string | undefined => {
    const x = v.replace(/\D/g, '')
    if (x.length !== 8) return undefined
    // US layout MMDDCCYY; ISO/CA layout CCYYMMDD — disambiguate by leading digits.
    return Number(x.slice(0, 2)) > 12
      ? `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6, 8)}`
      : `${x.slice(4, 8)}-${x.slice(0, 2)}-${x.slice(2, 4)}`
  }

  if (!idNumber && !last) return null
  return {
    documentType: 'drivers_license',
    country: country.toUpperCase(),
    idNumber,
    surname: cleanName(last),
    givenNames: cleanName([first, middle].filter(Boolean).join(' ')),
    sex: sex === '1' ? 'M' : sex === '2' ? 'F' : mapSex(sex),
    dateOfBirth: aamvaDate(get('DBB')) ?? '',
    expiryDate: aamvaDate(get('DBA')),
    issueDate: aamvaDate(get('DBD')),
    nationality: country.toUpperCase(),
    raw,
  }
}

// ── Public entry point (reusable client- and server-side) ──────────────────────
export function parseRawCode(raw: string): ParsedIdentity | null {
  const format = detectFormat(raw)
  if (!format) return null
  switch (format) {
    case 'mrz_td1':
    case 'mrz_td2':
    case 'mrz_td3': return parseMrzRaw(raw, format)
    case 'mosip':   return parseMosip(raw)
    case 'aamva':   return parseAamva(raw)
  }
}