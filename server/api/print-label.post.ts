// server/api/print-label.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  return await $fetch(config.printMiddlewareLabelUrl, {
    method: 'POST',
    body
  })
})