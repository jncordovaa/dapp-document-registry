'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Loader2, Upload, Hash, Shield, User, Clock, File as FileIcon, Trash2 } from 'lucide-react'
import { useContract } from '../hooks/useContract'
import { HashUtils } from '../utils/hash'
import { AddressDisplay } from './AddressDisplay'
import { resolveENSName } from '../utils/ens'
import { useNetwork } from '../contexts/NetworkContext'

export function DocumentVerifier() {
  const { getDocumentInfo, isDocumentStored } = useContract()
  const { networkConfig } = useNetwork()
  const [file, setFile] = useState<File | null>(null)
  const [signerAddress, setSignerAddress] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    documentInfo: any
    error?: string
  } | null>(null)

  // Maximum file size (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024

  const handleFileSelect = useCallback((selectedFile: File) => {
    setUploadError(null)
    setVerificationResult(null)

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      setUploadError(`File size exceeds maximum allowed size of ${maxSizeMB}MB.`)
      return
    }

    setFile(selectedFile)
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

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
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)

      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        if (files.length > 1) {
          setUploadError('Please drop only one file at a time')
          return
        }
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleRemoveFile = () => {
    setFile(null)
    setUploadError(null)
    setVerificationResult(null)
  }

  const handleVerify = async () => {
    if (!file) {
      alert('Please select a file to verify')
      return
    }

    if (!signerAddress.trim()) {
      alert('Please enter the signer address or ENS name')
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      console.log('🔍 Starting document verification...')

      // Resolve ENS name if provided
      const resolvedAddress = await resolveENSName(signerAddress.trim(), networkConfig.chainId)
      if (!resolvedAddress) {
        setVerificationResult({
          isValid: false,
          documentInfo: null,
          error: 'Invalid address or ENS name not found. Please check and try again.'
        })
        return
      }
      console.log('📍 Resolved address:', resolvedAddress)

      // Calculate file hash
      const fileHash = await HashUtils.calculateFileHash(file)
      console.log('📝 File hash calculated:', fileHash)

      // Check if document exists
      console.log('🔎 Checking if document is stored...')
      const exists = await isDocumentStored(fileHash)
      console.log('✅ Document exists:', exists)

      if (!exists) {
        setVerificationResult({
          isValid: false,
          documentInfo: null,
          error: 'Document not found in registry. It may not have been signed and stored yet.'
        })
        return
      }

      // Get document info
      console.log('📄 Getting document info...')
      const documentInfo = await getDocumentInfo(fileHash)
      console.log('📊 Document info:', documentInfo)

      if (!documentInfo) {
        setVerificationResult({
          isValid: false,
          documentInfo: null,
          error: 'Document not found in blockchain'
        })
        return
      }

      // Verify signer matches (use resolved address)
      const isValid = documentInfo.signer.toLowerCase() === resolvedAddress.toLowerCase()
      console.log('🔐 Signer verification:', {
        input: signerAddress,
        resolved: resolvedAddress.toLowerCase(),
        actual: documentInfo.signer.toLowerCase(),
        isValid
      })

      setVerificationResult({
        isValid,
        documentInfo,
        error: isValid ? undefined : 'Signer address does not match. The document was signed by a different address.'
      })
    } catch (error: any) {
      console.error('❌ Verification error:', error)

      let errorMessage = 'Verification failed'

      // Better error messages
      if (error.message.includes('could not decode result data')) {
        errorMessage = 'Contract error: Please make sure the contract is deployed and Anvil is running.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error: Cannot connect to Anvil. Make sure it\'s running on http://localhost:8545'
      } else {
        errorMessage = error.message || 'Verification failed'
      }

      setVerificationResult({
        isValid: false,
        documentInfo: null,
        error: errorMessage
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const reset = () => {
    setFile(null)
    setSignerAddress('')
    setVerificationResult(null)
  }

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
          aria-label="File upload area. Drag and drop a file here, or click to browse"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              document.getElementById('verify-file-input')?.click()
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
                {isDragging ? 'Drop File Here' : 'Upload a Document'}
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
                id="verify-file-input"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="*/*"
                aria-label="Choose file to verify"
              />

              <label
                htmlFor="verify-file-input"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-neon-500 text-black font-bold rounded-lg hover:bg-neon-400 cursor-pointer transition-all pointer-events-auto"
              >
                <FileIcon className="w-5 h-5" />
                <span>Choose File</span>
              </label>

              <p className="text-sm text-gray-500 mt-4">
                Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
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

      {/* File Info Display */}
      {file && (
        <div className="bg-dark-850 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <FileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
              className="flex items-center space-x-2 px-3 py-2 text-neon-500 hover:bg-neon-500/10 rounded-lg transition-colors"
              aria-label="Remove file"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Remove</span>
            </button>
          </div>
        </div>
      )}

      {file && (
        <div className="space-y-6">

          {/* Signer Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Signer Address
            </label>
            <input
              type="text"
              value={signerAddress}
              onChange={(e) => setSignerAddress(e.target.value)}
              placeholder="0x... or alice.eth"
              className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-neon-500 focus:border-neon-500 bg-black text-white placeholder-gray-500 transition-all"
            />
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={!file || !signerAddress.trim() || isVerifying}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-neon-500 text-black font-bold rounded-lg hover:bg-neon-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Verify Document</span>
              </>
            )}
          </button>

          {/* Verification Result */}
          {verificationResult && (
            <div className={`rounded-lg p-6 border ${
              verificationResult.isValid
                ? 'bg-dark-850 border-neon-500/50'
                : 'bg-dark-850 border-red-500/50'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                {verificationResult.isValid ? (
                  <CheckCircle className="w-6 h-6 text-neon-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <span className={`text-lg font-semibold ${
                  verificationResult.isValid
                    ? 'text-neon-500'
                    : 'text-red-500'
                }`}>
                  {verificationResult.isValid ? 'Document Verified Successfully' : 'Verification Failed'}
                </span>
              </div>

              {verificationResult.error && (
                <div className="mb-4 p-3 bg-dark-900 rounded border border-red-500/30">
                  <p className={`text-sm ${
                    verificationResult.isValid
                      ? 'text-neon-400'
                      : 'text-red-400'
                  }`}>
                    {verificationResult.error}
                  </p>
                </div>
              )}

              {verificationResult.documentInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-400">Document Hash:</span>
                      </div>
                      <div className="bg-dark-900 rounded p-3 border border-gray-700">
                        <code className="text-xs font-mono text-white break-all">
                          {verificationResult.documentInfo.hash}
                        </code>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-400">Signer:</span>
                      </div>
                      <div className="bg-dark-900 rounded p-3 border border-gray-700">
                        <AddressDisplay address={verificationResult.documentInfo.signer} showCopy showLink />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-400">Timestamp:</span>
                    </div>
                    <div className="bg-dark-900 rounded p-3 border border-gray-700">
                      <code className="text-sm font-mono text-white">
                        {new Date(Number(verificationResult.documentInfo.timestamp) * 1000).toLocaleString()}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset Button */}
          {(signerAddress || verificationResult) && (
            <button
              onClick={reset}
              className="w-full px-4 py-2 text-gray-400 border border-gray-700 rounded-lg hover:bg-dark-850 hover:border-gray-600 hover:text-white transition-all"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}
