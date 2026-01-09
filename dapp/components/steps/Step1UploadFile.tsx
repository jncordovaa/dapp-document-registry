'use client'

/**
 * Step 1: Upload & Review
 *
 * Allows users to:
 * - Upload a PDF file
 * - Review all pages with full PDF viewer
 * - Track reading progress
 * - Confirm they have read all pages
 */

import { useCallback, useState } from 'react'
import { Upload, File, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { FileData } from '../../types/stepper'
import { UPLOAD_CONFIG } from '../../config/upload'
import { usePDFViewer } from '../../hooks/usePDFViewer'
import { PDFViewer } from '../PDFViewer'

interface Step1UploadFileProps {
  /** Current file data if already uploaded */
  fileData: FileData | null
  /** Callback when file is uploaded and ready */
  onFileReady: (fileData: FileData) => void
  /** Callback when file is removed */
  onRemoveFile: () => void
  /** Confirmed reading flag */
  confirmedReading: boolean
  /** Set confirmed reading */
  onSetConfirmedReading: (confirmed: boolean) => void
  /** Continue to next step */
  onContinue: () => void
}

export function Step1UploadFile({
  fileData,
  onFileReady,
  onRemoveFile,
  confirmedReading,
  onSetConfirmedReading,
  onContinue,
}: Step1UploadFileProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(fileData?.file || null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)

  const pdfViewer = usePDFViewer({ numPages })

  // Handle file selection
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setUploadError(null)

      // Validate file type
      if (!UPLOAD_CONFIG.allowedTypes.includes(selectedFile.type)) {
        setUploadError('Invalid file type. Please upload a PDF file.')
        return
      }

      // Validate file size
      if (selectedFile.size > UPLOAD_CONFIG.maxFileSize) {
        const maxSizeMB = UPLOAD_CONFIG.maxFileSize / (1024 * 1024)
        setUploadError(`File size exceeds maximum allowed size of ${maxSizeMB}MB.`)
        return
      }

      setFile(selectedFile)

      // Create file data (hash will be calculated in Step 2)
      const newFileData: FileData = {
        file: selectedFile,
        size: selectedFile.size,
        name: selectedFile.name,
        type: selectedFile.type,
        uploadedAt: new Date(),
      }

      onFileReady(newFileData)
    },
    [onFileReady]
  )

  // File input change handler
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (selectedFile) {
        await handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect]
  )

  // Drag and drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)

      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        if (files.length > 1) {
          setUploadError('Please drop only one file at a time')
          return
        }
        await handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  // Remove file handler
  const handleRemoveFile = () => {
    setFile(null)
    setUploadError(null)
    setNumPages(0)
    onSetConfirmedReading(false)
    onRemoveFile()
  }

  // Continue button handler
  const handleContinue = () => {
    if (file && confirmedReading) {
      onContinue()
    }
  }

  // Can continue check
  const canContinue = file && confirmedReading

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out
            ${
              isDragging
                ? 'border-neon-500 bg-neon-900/20 scale-[1.02]'
                : 'border-gray-700 bg-dark-850 hover:border-gray-600'
            }
          `}
          role="button"
          aria-label="File upload area. Drag and drop a PDF file here, or click to browse"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              document.getElementById('pdf-file-input')?.click()
            }
          }}
        >
          <div className="space-y-6 pointer-events-none">
            <div
              className={`
              w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-200 border-2
              ${
                isDragging
                  ? 'bg-neon-900/30 border-neon-500 scale-110'
                  : 'bg-dark-900 border-gray-700'
              }
            `}
            >
              <Upload
                className={`
                w-10 h-10 transition-all duration-200
                ${
                  isDragging
                    ? 'text-neon-500 animate-bounce'
                    : 'text-gray-400'
                }
              `}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {isDragging ? 'Drop Here' : 'Upload a Document'}
              </h3>
              <p
                className={`
                mb-6 transition-colors duration-200
                ${
                  isDragging
                    ? 'text-neon-400 font-medium'
                    : 'text-gray-400'
                }
              `}
              >
                {isDragging
                  ? 'Release to upload'
                  : 'Drag and drop a file here, or click to browse'}
              </p>

              <input
                id="pdf-file-input"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="application/pdf"
                aria-label="Choose PDF file to upload"
              />

              <label
                htmlFor="pdf-file-input"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-neon-500 text-black font-bold rounded-lg hover:bg-neon-400 cursor-pointer transition-all pointer-events-auto"
              >
                <File className="w-5 h-5" />
                <span>Choose File</span>
              </label>

              <p className="text-sm text-gray-500 mt-4">
                Maximum file size: {UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Error Display */}
      {uploadError && (
        <div className="bg-dark-850 rounded-lg p-4 border border-red-500/50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400 font-medium">
              {uploadError}
            </span>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {file && (
        <>
          {/* File Info Header */}
          <div className="bg-dark-850 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="flex items-center space-x-2 px-3 py-2 text-neon-500 hover:bg-neon-900/20 rounded-lg transition-colors"
                aria-label="Remove file"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Remove</span>
              </button>
            </div>
          </div>

          {/* PDF Viewer Component */}
          <PDFViewer
            file={file}
            currentPage={pdfViewer.currentPage}
            zoom={pdfViewer.zoom}
            onPageChange={pdfViewer.goToPage}
            onZoomChange={pdfViewer.setZoom}
            onPDFLoad={(pages) => setNumPages(pages)}
          />

          {/* Reading Confirmation */}
          
            <div className="space-y-4">
              {/* Confirmation Checkbox */}
              <label className="flex items-start space-x-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input
                    type="checkbox"
                    checked={confirmedReading}
                    onChange={(e) => onSetConfirmedReading(e.target.checked)}
                    className="w-5 h-5 text-neon-500 border-gray-700 rounded focus:ring-neon-500 bg-dark-900 accent-neon-500"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-300 group-hover:text-white transition-colors">
                    I have read and reviewed all pages of this document
                  </p>
                </div>
              </label>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-neon-500 text-black font-bold rounded-lg hover:bg-neon-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span>Continue to Sign</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              {!canContinue && (
                <p className="text-sm text-gray-400 text-center">
                  Please confirm you have read and reviewed the document
                </p>
              )}
            </div>
          
        </>
      )}
    </div>
  )
}
