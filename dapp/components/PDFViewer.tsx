'use client'

/**
 * PDF Viewer Component
 *
 * Full-featured PDF viewer with:
 * - Page-by-page reading tracking
 * - Zoom controls
 * - Navigation
 * - Progress indicator
 * - Accessibility features
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface PDFViewerProps {
  /** PDF file to display */
  file: File
  /** Current page number */
  currentPage: number
  /** Zoom level */
  zoom: number
  /** Navigate to page */
  onPageChange: (page: number) => void
  /** Zoom change */
  onZoomChange: (zoom: number) => void
  /** Callback when PDF loads with page count */
  onPDFLoad?: (numPages: number) => void
}

export function PDFViewer({
  file,
  currentPage,
  zoom,
  onPageChange,
  onZoomChange,
  onPDFLoad,
}: PDFViewerProps) {
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load PDF document using pdfjs-dist
  useEffect(() => {
    let mounted = true
    let loadingTask: any = null

    async function loadPDF() {
      try {
        setIsLoading(true)
        setError(null)
        setPdfDocument(null) // Clear previous document
        setNumPages(0)

        // Import from centralized configuration (worker already configured)
        const { getPDFJS } = await import('../lib/pdfWorker')
        const pdfjsLib = await getPDFJS()

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()

        // Load PDF document
        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise

        if (mounted) {
          setPdfDocument(pdf)
          setNumPages(pdf.numPages)
          setIsLoading(false)
          // Notify parent of PDF load
          onPDFLoad?.(pdf.numPages)
        }
      } catch (err: any) {
        console.error('Error loading PDF:', err)
        if (mounted) {
          setError(err.message || 'Failed to load PDF')
          setIsLoading(false)
        }
      }
    }

    loadPDF()

    return () => {
      mounted = false
      // Cancel loading if component unmounts
      if (loadingTask) {
        loadingTask.destroy()
      }
    }
  }, [file])

  // Render current page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return

    let mounted = true
    let renderTask: any = null

    async function renderPage() {
      try {
        const page = await pdfDocument.getPage(currentPage)
        const viewport = page.getViewport({ scale: zoom })

        const canvas = canvasRef.current
        if (!canvas || !mounted) return

        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        // Cancel any pending render task before starting new one
        if (renderTask) {
          renderTask.cancel()
        }

        // Start new render task
        renderTask = page.render(renderContext)
        await renderTask.promise
      } catch (err: any) {
        // Ignore cancellation errors
        if (err.name === 'RenderingCancelledException') {
          return
        }
        console.error('Error rendering page:', err)
        if (mounted) {
          setError(err.message || 'Failed to render page')
        }
      }
    }

    renderPage()

    return () => {
      mounted = false
      // Cancel ongoing render when unmounting or dependencies change
      if (renderTask) {
        renderTask.cancel()
      }
    }
  }, [pdfDocument, currentPage, zoom])

  // Navigation handlers
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Zoom handlers
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.25, 2.0))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.25, 0.5))
  }

  const handleFitWidth = () => {
    onZoomChange(1.0)
  }

  // Download PDF
  const handleDownload = () => {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-dark-850 rounded-lg border border-neon-500/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-neon-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-dark-850 rounded-lg p-6 border border-red-500/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-500 font-semibold mb-2">
              Failed to Load PDF
            </h3>
            <p className="text-red-400 text-sm mb-3">
              {error}
            </p>

            <div className="bg-dark-900 rounded p-3 text-sm border border-red-500/30">
              <p className="font-medium text-red-400 mb-1">Try these solutions:</p>
              <ul className="list-disc list-inside space-y-1 text-red-400">
                <li>Ensure the file is a valid PDF document</li>
                <li>Try uploading a different PDF file</li>
                <li>Refresh the page and try again</li>
                <li>Check your internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-dark-850 rounded-lg p-4 border border-gray-700">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage <= 1}
            className="p-2 text-neon-500 hover:bg-dark-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all border border-transparent hover:border-neon-500/30"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-300 min-w-[80px] text-center font-mono">
            Page {currentPage} / {numPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage >= numPages}
            className="p-2 text-neon-500 hover:bg-dark-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all border border-transparent hover:border-neon-500/30"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 text-neon-500 hover:bg-dark-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all border border-transparent hover:border-neon-500/30"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-300 min-w-[50px] text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 2.0}
            className="p-2 text-neon-500 hover:bg-dark-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all border border-transparent hover:border-neon-500/30"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleFitWidth}
            className="p-2 text-neon-500 hover:bg-dark-900 rounded transition-all border border-transparent hover:border-neon-500/30"
            aria-label="Fit to width"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="p-2 text-neon-500 hover:bg-dark-900 rounded transition-all border border-transparent hover:border-neon-500/30"
          aria-label="Download PDF"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* PDF Canvas */}
      <div
        className="bg-dark-850 rounded-lg p-4 border border-gray-700 overflow-auto"

        /*bg-dark-850 rounded-lg p-4 border border-gray-700*/
        style={{ maxHeight: '600px' }}
      >
        <div className="p-4 flex justify-center">
          <canvas ref={canvasRef} className="shadow-lg" />
        </div>
      </div>
    </div>
  )
}
