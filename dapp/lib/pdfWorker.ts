/**
 * PDF.js CDN Loader
 *
 * Loads PDF.js from CDN to avoid webpack/Next.js compatibility issues.
 * Uses the global pdfjsLib API instead of importing the npm package.
 *
 * @see https://github.com/mozilla/pdf.js/
 */

// PDF.js version to load from CDN
const PDFJS_VERSION = '4.0.379'
const PDFJS_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`

let isLoading = false
let loadPromise: Promise<any> | null = null

/**
 * Load PDF.js from CDN and return the global pdfjsLib object
 */
export async function getPDFJS(): Promise<any> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used in browser environment')
  }

  // Return existing instance if already loaded
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib
  }

  // Return existing load promise if currently loading
  if (isLoading && loadPromise) {
    return loadPromise
  }

  // Start loading
  isLoading = true
  loadPromise = new Promise((resolve, reject) => {
    try {
      // Create script element
      const script = document.createElement('script')
      script.type = 'module'
      script.src = PDFJS_CDN_URL

      script.onload = () => {
        // Wait a bit for the library to initialize
        setTimeout(() => {
          if ((window as any).pdfjsLib) {
            const pdfjsLib = (window as any).pdfjsLib

            // Configure worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL

            console.log(`[PDF.js] Loaded v${PDFJS_VERSION} from CDN`)
            isLoading = false
            resolve(pdfjsLib)
          } else {
            const error = new Error('PDF.js library not found on window object')
            console.error('[PDF.js] Load failed:', error)
            isLoading = false
            reject(error)
          }
        }, 100)
      }

      script.onerror = (error) => {
        console.error('[PDF.js] Failed to load script:', error)
        isLoading = false
        reject(new Error('Failed to load PDF.js from CDN'))
      }

      // Append to document
      document.head.appendChild(script)
    } catch (error) {
      console.error('[PDF.js] Error during load:', error)
      isLoading = false
      reject(error)
    }
  })

  return loadPromise
}
