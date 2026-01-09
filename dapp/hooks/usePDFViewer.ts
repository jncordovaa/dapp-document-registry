/**
 * Hook for managing PDF viewer state (navigation and zoom)
 */

import { useState, useCallback } from 'react'
import { UPLOAD_CONFIG } from '../config/upload'

interface UsePDFViewerProps {
  /** Total number of pages in the PDF */
  numPages: number
}

interface UsePDFViewerReturn {
  /** Current page number being viewed */
  currentPage: number
  /** Zoom level */
  zoom: number
  /** Navigate to specific page */
  goToPage: (page: number) => void
  /** Go to next page */
  nextPage: () => void
  /** Go to previous page */
  previousPage: () => void
  /** Set zoom level */
  setZoom: (zoom: number) => void
  /** Zoom in */
  zoomIn: () => void
  /** Zoom out */
  zoomOut: () => void
  /** Fit to page width */
  fitWidth: () => void
  /** Fit to page height */
  fitPage: () => void
}

export function usePDFViewer({ numPages }: UsePDFViewerProps): UsePDFViewerReturn {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoomLevel] = useState(UPLOAD_CONFIG.pdfViewer.defaultZoom)

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= numPages) {
        setCurrentPage(page)
      }
    },
    [numPages]
  )

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [currentPage, numPages])

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [currentPage])

  /**
   * Set zoom level
   */
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(
      UPLOAD_CONFIG.pdfViewer.minZoom,
      Math.min(UPLOAD_CONFIG.pdfViewer.maxZoom, newZoom)
    )
    setZoomLevel(clampedZoom)
  }, [])

  /**
   * Zoom in
   */
  const zoomIn = useCallback(() => {
    setZoom(zoom + UPLOAD_CONFIG.pdfViewer.zoomStep)
  }, [zoom, setZoom])

  /**
   * Zoom out
   */
  const zoomOut = useCallback(() => {
    setZoom(zoom - UPLOAD_CONFIG.pdfViewer.zoomStep)
  }, [zoom, setZoom])

  /**
   * Fit to page width
   */
  const fitWidth = useCallback(() => {
    setZoom(1.0)
  }, [setZoom])

  /**
   * Fit to page height
   */
  const fitPage = useCallback(() => {
    setZoom(1.0)
  }, [setZoom])

  return {
    currentPage,
    zoom,
    goToPage,
    nextPage,
    previousPage,
    setZoom,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
  }
}
