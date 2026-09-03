// composables/usePrintLabel.ts
export const usePrintLabel = () => {
  const config = useRuntimeConfig()
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const message = ref('')
  const visible = ref(false)

  const printLabel = async (free_text: string, barcode_value: string) => {
    visible.value = true
    status.value = 'loading'
    message.value = 'Sending print job...'

    try {
      await $fetch(config.public.printMiddlewareLabelUrl, { // hits 127.0.0.1 directly from the browser
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: {
          source: {
            mode: 'template_data',
            template_id: 'barcode_default',
            fields: { free_text, barcode_value }
          }
        }
      })
      status.value = 'success'
      message.value = 'Print job completed'
    } catch (e: any) {
      status.value = 'error'
      if (!e?.response) {
        message.value = 'Could not reach print service — check that it allows this origin (CORS) and is running'
      } else {
        message.value = e?.data?.message || 'Print job failed'
      }
    } finally {
      setTimeout(() => { visible.value = false }, 5000)
    }
  }

  return { printLabel, status, message, visible }
}