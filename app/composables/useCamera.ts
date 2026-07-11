// app/composables/useCamera.ts
// getUserMedia wrapper with rear-camera preference and an ON-DEMAND frame freeze.
// captureFrame() runs ONCE per call (not a continuous loop): it draws the current
// video frame into a fresh canvas and returns it + a JPEG Blob/File for upload.
import { ref, nextTick, onScopeDispose } from 'vue'

export interface CapturedFrame {
  canvas: HTMLCanvasElement
  blob: Blob
  file: File
}

export function useCamera() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const loading = ref(false)
  const ready = ref(false)
  const error = ref('')
  let stream: MediaStream | null = null

  async function start() {
    if (!import.meta.client) return
    error.value = ''; ready.value = false; loading.value = true
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API not supported on this device.')
      // Prefer the rear/environment camera on mobile; desktops fall back to default.
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      await nextTick()
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        await videoRef.value.play().catch(() => {})
      }
      ready.value = true
    } catch (e: any) {
      error.value =
        e?.name === 'NotAllowedError' ? 'Camera permission was denied.'
        : e?.name === 'NotFoundError' ? 'No camera was found on this device.'
        : e?.message || 'Could not start the camera.'
    } finally {
      loading.value = false
    }
  }

  function stop() {
    stream?.getTracks().forEach(t => t.stop())
    stream = null; ready.value = false
    if (videoRef.value) videoRef.value.srcObject = null
  }

  // Freeze the current frame → canvas (for OCR/decoding) + JPEG File (for the
  // multipart upload as identification_documentation). NOTE: async (toBlob).
  async function captureFrame(): Promise<CapturedFrame> {
    const v = videoRef.value
    if (!v || !v.videoWidth) throw new Error('Camera is not ready yet.')
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth; canvas.height = v.videoHeight
    canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height)
    const blob: Blob = await new Promise((res, rej) =>
      canvas.toBlob(b => (b ? res(b) : rej(new Error('Capture failed.'))), 'image/jpeg', 0.95))
    const file = new File([blob], `id_capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
    return { canvas, blob, file }
  }

  onScopeDispose(stop)
  return { videoRef, loading, ready, error, start, stop, captureFrame }
}