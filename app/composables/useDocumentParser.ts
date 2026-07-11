// app/composables/useDocumentParser.ts
// App-side wrapper so components auto-import the parser as a composable. The heavy
// lifting (mrz 7-3-1 check-digit validation) lives in the shared module and is
// reused verbatim by the server route.
// If you haven't enabled the `#shared` alias, swap to: '../../shared/utils/documentParser'
import { parseRawCode, detectFormat, type ParsedIdentity, type RawFormat }
  from '#shared/utils/documentParser'

export function useDocumentParser() {
  return { parseRawCode, detectFormat }
}

export type { ParsedIdentity, RawFormat }