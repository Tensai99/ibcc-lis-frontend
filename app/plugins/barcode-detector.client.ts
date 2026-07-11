// Point zxing-wasm at our self-hosted binary (CSP-safe + offline) instead of its
// default jsDelivr CDN. Runs once at app start, before any scan.
import { setZXingModuleOverrides } from 'barcode-detector/pure'

export default defineNuxtPlugin(() => {
  setZXingModuleOverrides({
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? `/zxing/${path}` : prefix + path,
  })
})