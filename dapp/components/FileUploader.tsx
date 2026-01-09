'use client'

import { useState, useCallback } from 'react'
import { Upload, File, Hash, CheckCircle, AlertCircle, Loader2, Cloud } from 'lucide-react'
import { HashUtils } from '../utils/hash'
import { uploadToIPFS, getIPFSErrorMessage, IPFSError, IPFSErrorType } from '../utils/ipfs'

interface FileUploaderProps {
  onFileHash?: (hash: string) => void
  onIPFSCID?: (cid: string) => void
}

export function FileUploader({ onFileHash, onIPFSCID }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [hash, setHash] = useState<string>('')
  const [ipfsCID, setIpfsCID] = useState<string>('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isUploadingIPFS, setIsUploadingIPFS] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ipfsError, setIpfsError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setIpfsError(null)
    setHash('')
    setIpfsCID('')
    setIsCalculating(true)

    try {
      // Step 1: Calculate file hash
      const fileHash = await HashUtils.calculateFileHash(selectedFile)
      setHash(fileHash)
      onFileHash?.(fileHash)

      // Step 2: Upload to IPFS
      setIsUploadingIPFS(true)
      try {
        const result = await uploadToIPFS(selectedFile)
        setIpfsCID(result.cid)
        onIPFSCID?.(result.cid)
        console.log('File uploaded to IPFS successfully. CID:', result.cid)
      } catch (ipfsErr: any) {
        // Handle IPFS error separately - don't block the hash calculation
        const errorMessage = getIPFSErrorMessage(ipfsErr)
        setIpfsError(errorMessage)
        console.error('IPFS upload failed:', ipfsErr)

        // Allow continuing without IPFS - pass empty string
        onIPFSCID?.('')
      } finally {
        setIsUploadingIPFS(false)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to calculate file hash')
    } finally {
      setIsCalculating(false)
    }
  }, [onFileHash, onIPFSCID])

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
    // Only set isDragging to false if we're leaving the drop zone entirely
    // Check if the related target is outside the drop zone
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const files = event.dataTransfer.files

    if (!files || files.length === 0) {
      return
    }

    if (files.length > 1) {
      setError('Please drop only one file at a time')
      return
    }

    const droppedFile = files[0]
    if (droppedFile) {
      const input = document.getElementById('file-input') as HTMLInputElement
      if (input) {
        input.files = files
        handleFileChange({ target: { files } } as any)
      }
    }
  }, [handleFileChange])

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-neon-500 bg-neon-900/20 scale-[1.02]'
            : 'border-neon-500/30 bg-dark-850 hover:border-neon-500/60'
          }
        `}
        role="button"
        aria-label="File upload area. Drag and drop a file here, or click to browse"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById('file-input')?.click()
          }
        }}
      >
        <div className="space-y-6 pointer-events-none">
          <div className={`
            w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-200 border-2
            ${isDragging
              ? 'bg-neon-900/30 border-neon-500 scale-110'
              : 'bg-dark-900 border-neon-500/50'
            }
          `}>
            <Upload className={`
              w-10 h-10 transition-all duration-200
              ${isDragging
                ? 'text-neon-500 animate-bounce'
                : 'text-neon-500'
              }
            `} />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-neon-500 mb-2">
              {isDragging ? 'Drop File Here' : 'Upload a Document'}
            </h3>
            <p className={`
              mb-6 transition-colors duration-200
              ${isDragging
                ? 'text-neon-400 font-medium'
                : 'text-gray-400'
              }
            `}>
              {isDragging ? 'Release to upload' : 'Drag and drop a file here, or click to browse'}
            </p>

            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="*/*"
              aria-label="Choose file to upload"
            />

            <label
              htmlFor="file-input"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-neon-500 text-black font-bold rounded-lg hover:bg-neon-400 cursor-pointer transition-all pointer-events-auto"
            >
              <File className="w-5 h-5" />
              <span>Choose File</span>
            </label>
          </div>
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div className="bg-dark-850 rounded-lg p-4 border border-neon-500/30">
          <div className="flex items-center space-x-3 mb-3">
            <File className="w-5 h-5 text-neon-500" />
            <span className="font-medium text-neon-500">
              {file.name}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Size: {(file.size / 1024).toFixed(2)} KB
          </div>
        </div>
      )}

      {/* Hash Calculation Status */}
      {isCalculating && (
        <div className="bg-dark-850 rounded-lg p-4 border border-neon-500/50">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-neon-500" />
            <span className="text-neon-500 font-medium">
              Calculating file hash...
            </span>
          </div>
        </div>
      )}

      {/* IPFS Upload Status */}
      {isUploadingIPFS && (
        <div className="bg-dark-850 rounded-lg p-4 border border-cyber-500/50">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-cyber-500" />
            <div className="flex-1">
              <span className="text-cyber-500 font-medium">
                Uploading to IPFS...
              </span>
              <p className="text-sm text-gray-400 mt-1">
                This may take a few seconds depending on file size
              </p>
            </div>
          </div>
        </div>
      )}

      {hash && !isCalculating && (
        <div className="bg-dark-850 rounded-lg p-4 border border-neon-500/50">
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="w-5 h-5 text-neon-500" />
            <span className="font-medium text-neon-500">
              File Hash Generated Successfully
            </span>
          </div>
          <div className="bg-dark-900 rounded p-3 border border-neon-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <Hash className="w-4 h-4 text-neon-500" />
              <span className="text-sm font-medium text-neon-500">SHA-256 Hash:</span>
            </div>
            <code className="text-sm font-mono text-gray-300 break-all">
              {hash}
            </code>
          </div>
        </div>
      )}

      {/* IPFS CID Display */}
      {ipfsCID && !isUploadingIPFS && (
        <div className="bg-dark-850 rounded-lg p-4 border border-cyber-500/50">
          <div className="flex items-center space-x-3 mb-3">
            <Cloud className="w-5 h-5 text-cyber-500" />
            <span className="font-medium text-cyber-500">
              File Uploaded to IPFS Successfully
            </span>
          </div>
          <div className="bg-dark-900 rounded p-3 border border-cyber-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <Cloud className="w-4 h-4 text-cyber-500" />
              <span className="text-sm font-medium text-cyber-500">IPFS CID:</span>
            </div>
            <code className="text-sm font-mono text-gray-300 break-all">
              {ipfsCID}
            </code>
            <div className="mt-3">
              <a
                href={`https://gateway.pinata.cloud/ipfs/${ipfsCID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm text-cyber-500 hover:text-cyber-400 hover:underline transition-colors"
              >
                <span>View on IPFS Gateway</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* IPFS Error Display */}
      {ipfsError && !isUploadingIPFS && (
        <div className="bg-dark-850 rounded-lg p-4 border border-red-500/50">
          <div className="flex items-center space-x-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-500">
              IPFS Upload Failed
            </span>
          </div>
          <p className="text-sm text-red-400 mb-2">
            {ipfsError}
          </p>
          <p className="text-sm text-gray-400">
            You can still continue signing the document. The file hash has been calculated successfully.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-dark-850 rounded-lg p-4 border border-red-500/50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400 font-medium">
              {error}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
