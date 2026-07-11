<!-- app/components/IdScanner.vue
     Capture-then-scan ID reader. Three internal phases:
       1. capture/captured — live preview + framing guide, then freeze + confirm
       2. scanning          — dual pipeline (barcode + MRZ OCR) on the SINGLE still
       3. review            — editable, pre-filled fields (unverified = check-digit fail)
     Emits @scanned { identity, image } and @cancel (fall back to manual entry).
     Everything runs client-side — no image or MRZ data leaves the browser. -->
<template>
  <div class="space-y-5">

    <!-- ░░ CAPTURE / CAPTURED ░░ -->
    <div v-if="phase === 'capture' || phase === 'captured'">
      <div class="relative bg-black rounded-2xl overflow-hidden aspect-[1.586/1] max-h-[55vh] flex items-center justify-center">
        <video v-show="phase === 'capture'" ref="videoRef" autoplay playsinline muted class="w-full h-full object-cover" />
        <img v-if="phase === 'captured' && stillUrl" :src="stillUrl" class="w-full h-full object-contain bg-black" alt="Captured document" />

        <!-- Framing guide — aid only, no decoding here -->
        <div v-if="phase === 'capture'" class="absolute inset-0 pointer-events-none flex items-center justify-center p-5">
          <div ref="guideRef" class="relative w-full max-w-md aspect-[1.586/1] rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
            <span class="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
            <span class="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
            <span class="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
            <span class="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
            <!-- MRZ strip hint along the bottom third -->
            <div class="absolute left-0 right-0 bottom-0 h-1/3 border-t-2 border-dashed border-white/60 bg-white/5 rounded-b-xl flex items-end justify-center pb-1">
              <span class="text-[10px] font-mono tracking-widest text-white/70 uppercase">align mrz here</span>
            </div>
          </div>
        </div>

        <div v-if="camLoading" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
          <font-awesome-icon :icon="['fas', 'spinner']" spin class="text-white text-2xl" />
          <p class="text-white text-sm font-medium">Starting camera…</p>
        </div>
        <div v-if="camError && phase === 'capture'" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
          <font-awesome-icon :icon="['fas', 'camera-slash']" class="text-red-400 text-3xl" />
          <p class="text-white text-sm font-semibold">Camera unavailable</p>
          <p class="text-white/60 text-xs">{{ camError }}</p>
        </div>
      </div>

      <p v-if="phase === 'capture'" class="text-xs text-on-surface-variant text-center mt-3">
        Lay the ID card or passport photo page flat inside the frame, with the machine-readable zone (the «&lt;&lt;&lt;» lines) along the bottom.
      </p>

      <div class="flex items-center justify-between gap-3 mt-4">
        <button type="button" class="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-xl hover:bg-surface-low transition-colors" @click="$emit('cancel')">
          <font-awesome-icon :icon="['fas', 'keyboard']" /> Enter manually
        </button>
        <div class="flex items-center gap-2">
          <button v-if="phase === 'captured'" type="button" class="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-xl hover:bg-surface-low transition-colors" @click="retake">
            <font-awesome-icon :icon="['fas', 'rotate-left']" /> Retake
          </button>
          <button v-if="phase === 'capture'" type="button" class="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50" :disabled="!camReady" @click="capture">
            <font-awesome-icon :icon="['fas', 'camera']" /> Capture
          </button>
          <button v-else type="button" class="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-container transition-all active:scale-95" @click="runScan">
            <font-awesome-icon :icon="['fas', 'check']" /> Use this photo
          </button>
        </div>
      </div>
    </div>

    <!-- ░░ SCANNING STATUS ░░ -->
    <div v-else-if="phase === 'scanning'" class="min-h-[260px] flex flex-col items-center justify-center text-center gap-4 py-8">
      <div class="relative w-20 h-20">
        <div class="absolute inset-0 rounded-full border-4 border-primary/15" />
        <div class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <font-awesome-icon :icon="['fas', scanIcon]" class="absolute inset-0 m-auto text-primary text-2xl" />
      </div>
      <div>
        <p class="text-base font-bold text-on-surface">{{ scanTitle }}</p>
        <p class="text-xs text-on-surface-variant mt-1">{{ scanHint }}</p>
      </div>
      <div class="flex items-center gap-2 mt-1">
        <span v-for="s in scanOrder" :key="s" class="w-2 h-2 rounded-full transition-colors" :class="scanReached(s) ? 'bg-primary' : 'bg-outline-variant/40'" />
      </div>
    </div>

    <!-- ░░ ERROR ░░ -->
    <div v-else-if="phase === 'error'" class="min-h-[260px] flex flex-col items-center justify-center text-center gap-3 py-8 px-6">
      <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-red-500 text-2xl" />
      </div>
      <p class="text-base font-bold text-on-surface">Couldn't read the document</p>
      <p class="text-sm text-on-surface-variant max-w-sm">{{ errorMessage }}</p>
      <div class="flex items-center gap-2 mt-2">
        <button type="button" class="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all active:scale-95" @click="retake">
          <font-awesome-icon :icon="['fas', 'rotate-left']" /> Retake photo
        </button>
        <button type="button" class="text-sm font-bold text-on-surface-variant hover:text-on-surface px-3 py-2.5 rounded-xl hover:bg-surface-low transition-colors" @click="$emit('cancel')">
          Enter manually
        </button>
      </div>
    </div>

    <!-- ░░ REVIEW (editable extracted fields) ░░ -->
    <div v-else-if="phase === 'review'" class="space-y-4">
      <div class="flex items-start gap-3 bg-green-50 border border-green-200 p-3 rounded-xl">
        <font-awesome-icon :icon="['fas', 'circle-check']" class="text-green-600 text-sm mt-0.5" />
        <p class="text-sm text-green-800 leading-snug">
          Extracted from the {{ docTypeLabel }}. Review and correct any field — anything tagged
          <span class="font-bold">unverified</span> failed its check digit and should be double-checked.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Customer Category (required) -->
        <div class="sm:col-span-2 relative" @click.stop>
          <label class="cust-label">Customer Category <span class="text-error">*</span></label>
          <div class="relative">
            <font-awesome-icon :icon="['fas', 'tag']" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
            <input v-model="categorySearch" class="cust-input has-icon has-caret" placeholder="Search category…" autocomplete="off" @focus="showCategoryDrop = true" @input="showCategoryDrop = true" />
            <font-awesome-icon :icon="['fas', 'chevron-down']" class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
          </div>
          <Transition name="dropdown">
            <div v-if="showCategoryDrop && filteredCategories.length" class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-48 overflow-y-auto">
              <button v-for="cat in filteredCategories" :key="cat.id" type="button" class="w-full text-left px-4 py-2.5 hover:bg-primary/8 hover:text-primary transition-colors" @click="selectCategory(cat)">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold">{{ cat.name }}</span>
                  <font-awesome-icon v-if="cat.accept_insurance" :icon="['fas', 'shield-halved']" class="text-green-500 text-xs ml-auto" />
                </div>
                <p v-if="cat.description" class="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{{ cat.description }}</p>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Names -->
        <div v-for="f in nameFields" :key="f.key">
          <label class="cust-label">{{ f.label }} <span v-if="!f.optional" class="text-error">*</span></label>
          <div class="relative">
            <font-awesome-icon :icon="['fas', f.icon]" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
            <input v-model="editAny[f.key]" class="cust-input has-icon" :class="f.flag && flag(f.flag) ? 'unverified' : ''" />
            <span v-if="f.flag && flag(f.flag)" class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 uppercase tracking-wide">unverified</span>
          </div>
        </div>

        <!-- Gender -->
        <div>
          <label class="cust-label"><font-awesome-icon :icon="['fas','venus-mars']" class="mr-1 text-outline/60" />Gender</label>
          <select v-model="edit.sex" class="cust-input appearance-none cursor-pointer">
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="X">Other / Unspecified</option>
          </select>
        </div>

        <!-- ID number, dates, nationality -->
        <div v-for="f in restFields" :key="f.key">
          <label class="cust-label">{{ f.label }} <span v-if="!f.optional" class="text-error">*</span></label>
          <div class="relative">
            <font-awesome-icon :icon="['fas', f.icon]" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
            <input v-model="editAny[f.key]" :type="f.type || 'text'" class="cust-input has-icon" :class="[f.mono ? 'font-mono tracking-wide' : '', f.flag && flag(f.flag) ? 'unverified' : '']" />
            <span v-if="f.flag && flag(f.flag)" class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 uppercase tracking-wide">unverified</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 pt-1">
        <button type="button" class="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-xl hover:bg-surface-low transition-colors" @click="retake">
          <font-awesome-icon :icon="['fas', 'rotate-left']" /> Rescan
        </button>
        <button type="button" class="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!selectedCategoryId" @click="confirm">
          <font-awesome-icon :icon="['fas', 'check']" /> Use these details
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCamera } from '~/composables/useCamera'
import { useDocumentParser, type ParsedIdentity } from '~/composables/useDocumentParser'

declare global { interface Window { BarcodeDetector?: any } }

interface ScanCategory { id: number; name: string; description?: string; accept_insurance?: boolean }

const props = withDefaults(defineProps<{ categories?: ScanCategory[] }>(), { categories: () => [] })

const emit = defineEmits<{
  scanned: [payload: { identity: ParsedIdentity; image: File; categoryId: string }]
  cancel: []
}>()

const { videoRef, loading: camLoading, ready: camReady, error: camError, start: startCamera, stop: stopCamera } = useCamera()

// ── Customer category (same behaviour as the manual-entry combobox) ──────────
const categorySearch = ref('')
const showCategoryDrop = ref(false)
const selectedCategoryId = ref('')
const filteredCategories = computed(() => {
  const q = categorySearch.value.toLowerCase()
  return q ? props.categories.filter(c => c.name.toLowerCase().includes(q)) : props.categories
})
function selectCategory(cat: ScanCategory) {
  selectedCategoryId.value = String(cat.id)
  categorySearch.value = cat.name
  showCategoryDrop.value = false
}

const guideRef = ref<HTMLElement | null>(null)
const { parseRawCode } = useDocumentParser()

const SCAN_TIMEOUT_MS = 12000

const phase = ref<'capture' | 'captured' | 'scanning' | 'review' | 'error'>('capture')
const scanStatus = ref<'scanning' | 'detected' | 'validating' | 'success' | 'error'>('scanning')
const errorMessage = ref('')
const stillUrl = ref<string | null>(null)
let stillCanvas: HTMLCanvasElement | null = null
let stillFile: File | null = null
const identity = ref<ParsedIdentity | null>(null)

const edit = reactive({
  first_name: '', middle_name: '', last_name: '',
  sex: 'X' as 'M' | 'F' | 'X',
  idNumber: '', dateOfBirth: '', expiryDate: '', nationality: '',
})
const editAny = edit as Record<string, any>

interface ReviewField {
  key: string
  label: string
  icon: string
  optional?: boolean
  flag?: string
  mono?: boolean
  type?: string
}
const nameFields: ReviewField[] = [
  { key: 'first_name', label: 'First Name', icon: 'user' },
  { key: 'middle_name', label: 'Middle Name', icon: 'user', optional: true },
  { key: 'last_name', label: 'Last Name', icon: 'user', flag: 'lastName' },
]
const restFields: ReviewField[] = [
  { key: 'idNumber', label: 'ID Number', icon: 'hashtag', mono: true, flag: 'documentNumber' },
  { key: 'dateOfBirth', label: 'Date of Birth', icon: 'cake-candles', type: 'date', flag: 'birthDate' },
  { key: 'expiryDate', label: 'Expiry Date', icon: 'calendar-xmark', type: 'date', optional: true, flag: 'expirationDate' },
  { key: 'nationality', label: 'Nationality', icon: 'flag', mono: true, optional: true },
]

const flag = (name: string) => identity.value?.unverifiedFields?.includes(name) ?? false
const docTypeLabel = computed(() => ({
  passport: 'passport MRZ', national_id: 'national ID', drivers_license: 'driver licence',
}[identity.value?.documentType ?? 'national_id']))

// ── Scan status presentation ───────────────────────────────────────────────
const scanOrder = ['scanning', 'detected', 'validating', 'success'] as const
const scanIcon = computed(() => (({ scanning: 'magnifying-glass', detected: 'barcode', validating: 'shield-halved', success: 'check', error: 'xmark' } as const)[scanStatus.value]))
const scanTitle = computed(() => (({ scanning: 'Scanning document…', detected: 'Code detected', validating: 'Validating fields…', success: 'Done', error: 'Scan failed' } as const)[scanStatus.value]))
const scanHint = computed(() => (({ scanning: 'Reading QR / barcode and the machine-readable zone.', detected: 'Decoding the identity payload.', validating: 'Checking ICAO check digits.', success: 'Opening the review form.', error: '' } as const)[scanStatus.value]))
const scanReached = (s: typeof scanOrder[number]) => scanOrder.indexOf(s) <= scanOrder.indexOf(scanStatus.value as any)

// ── Flow ──────────────────────────────────────────────────────────────────
const tick = (ms: number) => new Promise(r => setTimeout(r, ms))
const timeout = (ms: number) => new Promise<null>(r => setTimeout(() => r(null), ms))

async function capture() {
  try {
    const v = videoRef.value
    if (!v || !v.videoWidth) throw new Error('Camera is not ready yet.')
    // Crop to the on-screen guide rect (mapped through object-cover) so both the
    // stored image AND the OCR input are just the document — no room/hand noise.
    const crop = guideRef.value
      ? mapGuideToSource(v, guideRef.value)
      : { sx: 0, sy: 0, sw: v.videoWidth, sh: v.videoHeight }
    const outW = 1280
    const outH = Math.max(1, Math.round((outW * crop.sh) / crop.sw))
    const canvas = document.createElement('canvas')
    canvas.width = outW; canvas.height = outH
    canvas.getContext('2d')!.drawImage(v, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outW, outH)
    const blob: Blob = await new Promise((res, rej) =>
      canvas.toBlob(b => (b ? res(b) : rej(new Error('Capture failed.'))), 'image/jpeg', 0.95))
    stillCanvas = canvas
    stillFile = new File([blob], `id_capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
    if (stillUrl.value) URL.revokeObjectURL(stillUrl.value)
    stillUrl.value = URL.createObjectURL(blob)
    stopCamera()
    phase.value = 'captured'
  } catch (e: any) {
    errorMessage.value = e?.message || 'Capture failed.'; phase.value = 'error'
  }
}

// Map the guide rectangle (CSS px) → source-video px, accounting for object-cover.
function mapGuideToSource(video: HTMLVideoElement, guide: HTMLElement) {
  const vr = video.getBoundingClientRect()
  const gr = guide.getBoundingClientRect()
  const vw = video.videoWidth, vh = video.videoHeight
  const scale = Math.max(vr.width / vw, vr.height / vh) // object-cover fills + crops
  const offX = (vw * scale - vr.width) / 2
  const offY = (vh * scale - vr.height) / 2
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
  const sx = clamp((gr.left - vr.left + offX) / scale, 0, vw)
  const sy = clamp((gr.top - vr.top + offY) / scale, 0, vh)
  return { sx, sy, sw: clamp(gr.width / scale, 1, vw - sx), sh: clamp(gr.height / scale, 1, vh - sy) }
}

async function retake() {
  identity.value = null
  if (stillUrl.value) { URL.revokeObjectURL(stillUrl.value); stillUrl.value = null }
  stillCanvas = null; stillFile = null
  phase.value = 'capture'
  await startCamera()
}

async function runScan() {
  if (!stillCanvas) return
  phase.value = 'scanning'; scanStatus.value = 'scanning'; errorMessage.value = ''

  let candidates: string[] = []
  try {
    candidates = await Promise.race([
      collectRawCandidates(stillCanvas),
      new Promise<string[]>(r => setTimeout(() => r([]), SCAN_TIMEOUT_MS)),
    ])
  } catch { candidates = [] }

  if (!candidates.length)
    return fail('No QR code, barcode or machine-readable zone was detected. Try again with brighter, even lighting and the document filling the frame.')
  scanStatus.value = 'detected'; await tick(250)

  scanStatus.value = 'validating'; await tick(250)
  // A proprietary QR we can't parse must NOT block a valid MRZ — try each in turn.
  let parsed: ParsedIdentity | null = null
  for (const raw of candidates) { parsed = parseRawCode(raw); if (parsed) break }
  if (!parsed)
    return fail('We read the document but couldn’t interpret a supported ID, passport or licence code. You can enter the details manually.')

  identity.value = parsed
  prefillEdit(parsed)
  scanStatus.value = 'success'; await tick(300)
  phase.value = 'review'
}

function fail(msg: string) { scanStatus.value = 'error'; errorMessage.value = msg; phase.value = 'error' }

function prefillEdit(p: ParsedIdentity) {
  const given = p.givenNames.split(/\s+/).filter(Boolean)
  edit.first_name = given[0] ?? ''
  edit.middle_name = given.slice(1).join(' ')
  edit.last_name = p.surname
  edit.sex = p.sex
  edit.idNumber = p.idNumber
  edit.dateOfBirth = p.dateOfBirth
  edit.expiryDate = p.expiryDate ?? ''
  edit.nationality = p.nationality
}

function confirm() {
  if (!identity.value || !stillFile) return
  if (!selectedCategoryId.value) { showCategoryDrop.value = true; return } // category is required
  const merged: ParsedIdentity = {
    ...identity.value,
    surname: edit.last_name.trim(),
    givenNames: [edit.first_name, edit.middle_name].filter(Boolean).join(' ').trim(),
    sex: edit.sex,
    idNumber: edit.idNumber.trim(),
    dateOfBirth: edit.dateOfBirth,
    expiryDate: edit.expiryDate || undefined,
    nationality: edit.nationality.trim(),
  }
  emit('scanned', { identity: merged, image: stillFile, categoryId: selectedCategoryId.value })
}

// ── Dual extraction pipeline (run ONCE on the confirmed still) ───────────────
async function collectRawCandidates(canvas: HTMLCanvasElement): Promise<string[]> {
  const [barcode, mrz] = await Promise.all([
    decodeBarcode(canvas).catch(() => null),
    ocrMrz(canvas).catch(() => null),
  ])
  return [barcode, mrz].filter((x): x is string => !!x)
}

// (a) QR / Barcode — native BarcodeDetector first, @zxing/library fallback.
async function decodeBarcode(canvas: HTMLCanvasElement): Promise<string | null> {
  const formats = ['qr_code', 'pdf417', 'aztec', 'data_matrix'] // QR/MOSIP, PDF417/AAMVA, Aztec, DataMatrix
  // 1) Native — fast on Android/Chrome. On Linux/Safari/Firefox it's absent or
  //    reports no formats, so we skip cleanly to the wasm ponyfill (no logging).
  try {
    const Native = (globalThis as any).BarcodeDetector
    const supported: string[] = (await Native?.getSupportedFormats?.()) ?? []
    if (supported.includes('qr_code')) {
      const det = new Native({ formats: formats.filter(f => supported.includes(f)) })
      const codes = await det.detect(canvas)
      if (codes?.length) return codes[0].rawValue
    }
  } catch { /* fall through */ }
  // 2) zxing-wasm ponyfill.
  try {
    const { BarcodeDetector } = await import('barcode-detector/pure')
    const codes = await new BarcodeDetector({ formats: formats as any }).detect(canvas)
    return codes[0]?.rawValue ?? null
  } catch { return null }
}

// (b) MRZ OCR — the worldwide path (ICAO 9303). Crop the bottom band of the document,
// preprocess, OCR, then length-fit so slightly-misread lines still reach the parser
// (it tolerates check-digit failures and flags them "unverified" for the operator).
async function ocrMrz(cardCanvas: HTMLCanvasElement): Promise<string | null> {
  for (const frac of [0.42, 0.6]) {                  // tight band first, then larger
    const band = preprocessForOcr(cropBottom(cardCanvas, frac))
    const text = await recognizeMrzLine(band)
    if (import.meta.dev) console.debug(`[IdScanner] OCR band ${frac}:\n${text}`)
    const lines = normaliseMrzLines(text)
    if (lines.length >= 2) {
      const take = lines.length >= 3 ? lines.slice(-3) : lines.slice(-2) // MRZ is bottom-most
      return fitMrzLines(take).join('\n')
    }
  }
  return null
}

function cropBottom(src: HTMLCanvasElement, frac: number): HTMLCanvasElement {
  const h = Math.round(src.height * frac)
  const c = document.createElement('canvas')
  c.width = src.width; c.height = h
  c.getContext('2d')!.drawImage(src, 0, src.height - h, src.width, h, 0, 0, src.width, h)
  return c
}

// Upscale → grayscale → Otsu binarise. The single biggest OCR-accuracy lever for MRZ.
function preprocessForOcr(src: HTMLCanvasElement): HTMLCanvasElement {
  const targetW = 1500
  const scale = src.width < targetW ? targetW / src.width : 1
  const w = Math.round(src.width * scale), h = Math.round(src.height * scale)
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(src, 0, 0, w, h)
  const img = ctx.getImageData(0, 0, w, h), d = img.data
  const hist = new Array(256).fill(0)
  const gray = new Uint8ClampedArray(w * h)
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = (d[i]! * 0.299 + d[i + 1]! * 0.587 + d[i + 2]! * 0.114) | 0
    gray[p] = g; hist[g]++
  }
  const total = w * h
  let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t]
  let sumB = 0, wB = 0, max = 0, thr = 127
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue
    const wF = total - wB; if (!wF) break
    sumB += t * hist[t]
    const between = wB * wF * Math.pow(sumB / wB - (sum - sumB) / wF, 2)
    if (between > max) { max = between; thr = t }
  }
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = gray[p]! > thr ? 255 : 0
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

function normaliseMrzLines(text: string): string[] {
  return text.toUpperCase().split(/\r?\n/)
    .map(l => l.replace(/[^A-Z0-9<]/g, ''))             // keep only MRZ glyphs
    .filter(l => l.length >= 25 && (l.match(/</g)?.length ?? 0) >= 2)
}

// Snap to the nearest ICAO line length (TD1=30, TD2=36, TD3=44) so the strict parser
// accepts slightly over/under-read lines — pad short with '<', trim long.
function fitMrzLines(lines: string[]): string[] {
  const target = lines.length === 3 ? 30 : (lines[0]?.length ?? 0) > 40 ? 44 : 36
  return lines.map(l => (l.length >= target ? l.slice(0, target) : l.padEnd(target, '<')))
}

// ── SEAM: MRZ glyph recognition ──────────────────────────────────────────────
// Default = tesseract.js, OCR-B/MRZ charset restricted to A–Z, 0–9 and filler '<',
// run on the cropped MRZ region only (not the full frame). This is the SINGLE point
// to swap for a higher-accuracy MRZ recogniser without touching the parser/pipeline:
//   • a small ONNX char-classifier (Conv→Pool→Conv→Pool→Dense, ~37-class MRZ symbol
//     set) via onnxruntime-web is measurably more accurate for MRZ and adds no network
//     dependency (WASM, fully client-side). Slice the region into fixed character cells,
//     classify each, rejoin into lines, and reassign `recognizeMrzLine` below.
// NOTE: tesseract.js fetches `eng` traineddata from a CDN by default — set langPath/
// workerPath/corePath to self-hosted assets for offline clinic use.
let recognizeMrzLine = async (region: HTMLCanvasElement): Promise<string> => {
  const { createWorker, PSM } = await import('tesseract.js')
  // Self-hosted under /public so the worker/core/lang load same-origin (CSP-safe + offline).
  // workerBlobURL:false avoids the blob: worker your script-src doesn't allow.
  const worker = await createWorker('eng', 1, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract',
    langPath: '/tessdata',
    workerBlobURL: false,
  })
  try {
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '0',
    })
    const { data } = await worker.recognize(region)
    return data.text || ''
  } finally {
    await worker.terminate()
  }
}

onMounted(() => { if (import.meta.client) startCamera() })
onBeforeUnmount(() => { stopCamera(); if (stillUrl.value) URL.revokeObjectURL(stillUrl.value) })
</script>

<style scoped>
/* Mirror the page's cust-input tokens so the scanner matches the wizard. */
.cust-label { @apply text-xs font-bold text-outline ml-1 block mb-1; }
.cust-input {
  @apply w-full bg-surface-low border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/50 transition-all duration-200 focus:outline-none;
  box-shadow: inset 0 0 0 1.5px transparent;
}
.cust-input:focus { box-shadow: inset 0 0 0 1.5px #0050cb; background-color: #f7f9fb; }
.cust-input.has-icon { padding-left: 2.5rem; }
.cust-input.unverified { box-shadow: inset 0 0 0 1.5px #f59e0b; background-color: #fffbeb; }
.cust-input.has-caret { padding-right: 2.25rem; }
.dropdown-enter-active, .dropdown-leave-active { transition: opacity .15s ease, transform .15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>