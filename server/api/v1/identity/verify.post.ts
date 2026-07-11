// server/api/identity/verify.post.ts
import { parseRawCode } from '#shared/utils/documentParser'

export default defineEventHandler(async (event) => {
  const { raw } = await readBody<{ raw: string }>(event)
  const identity = parseRawCode(raw)
  if (!identity) throw createError({ statusCode: 422, statusMessage: 'Unrecognised document' })
  return identity
})