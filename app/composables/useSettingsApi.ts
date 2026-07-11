// app/composables/useSettingsApi.ts
//
// Thin wrapper over the project-wide useApi().request composable.
// Centralises the two things every settings page repeats:
//   1. Rails-style nested FormData bodies  ->  billing_setting[name], department[code] ...
//   2. list / show / create / update / destroy verbs against a REST resource path.
//
// All write calls go out as multipart/form-data (project convention) — never raw JSON.

type Json = Record<string, unknown>

export function useSettingsApi() {
  // request() handles base URL, auth header and JSON parsing for us.
  const { request } = useApi()

  // Build a Rails strong-params payload: { name: 'x' } -> billing_setting[name]=x
  // Booleans are normalised to the literal strings Rails expects from multipart.
  function buildForm(root: string, payload: Json): FormData {
    const fd = new FormData()
    for (const [key, raw] of Object.entries(payload)) {
      if (raw === undefined || raw === null) continue
      const value =
        typeof raw === 'boolean' ? (raw ? 'true' : 'false') : (raw as string | Blob)
      fd.append(`${root}[${key}]`, value)
    }
    return fd
  }

  const list = (path: string) => request(path)
  const show = (path: string) => request(path)

  const create = (path: string, root: string, payload: Json) =>
    request(path, { method: 'POST', body: buildForm(root, payload) })

  const update = (path: string, root: string, payload: Json) =>
    request(path, { method: 'PATCH', body: buildForm(root, payload) })

  const destroy = (path: string) => request(path, { method: 'DELETE' })

  return { request, buildForm, list, show, create, update, destroy }
}