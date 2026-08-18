// composables/usePrintLabel.ts
export const usePrintLabel = () => {
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const message = ref('')
  const visible = ref(false)

  const printLabel = async (free_text: string, barcode_value: string) => {
    visible.value = true
    status.value = 'loading'
    message.value = 'Sending print job...'

    try {
      await $fetch('/api/print-label', { // hits Nuxt server, not the printer directly
        method: 'POST',
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
      message.value = e?.data?.data?.error || 'Print job failed'
    } finally {
      setTimeout(() => { visible.value = false }, 5000)
    }
  }

  return { printLabel, status, message, visible }
}