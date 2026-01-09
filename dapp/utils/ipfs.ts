/**
 * IPFS Integration Utilities
 *
 * Provides functions for uploading, retrieving, and downloading files from IPFS
 * using Pinata as the service provider.
 *
 * @module utils/ipfs
 */

import { PinataSDK } from "pinata"

// ============================================================================
// Types
// ============================================================================

/**
 * IPFS upload result containing the CID and metadata
 */
export interface IPFSUploadResult {
  /** Content Identifier (CID) - unique hash of the uploaded file */
  cid: string
  /** Size of the uploaded file in bytes */
  size: number
  /** Timestamp when the file was uploaded */
  timestamp: Date
}

/**
 * IPFS error types for better error handling
 */
export enum IPFSErrorType {
  MISSING_JWT = 'MISSING_JWT',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CID = 'INVALID_CID',
}

/**
 * Custom error class for IPFS operations
 */
export class IPFSError extends Error {
  constructor(
    public type: IPFSErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'IPFSError'
  }
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Maximum file size for uploads (100 MB for Pinata free tier)
 * Adjust based on your Pinata plan limits
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB in bytes

/**
 * Pinata dedicated gateway URL
 */
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs'

/**
 * Public IPFS gateway fallback (slower but works without authentication)
 */
const PUBLIC_GATEWAY = 'https://ipfs.io/ipfs'

// ============================================================================
// Pinata SDK Initialization
// ============================================================================

/**
 * Initialize Pinata SDK instance
 * Throws if JWT token is not configured
 */
function getPinataClient(): PinataSDK {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT

  if (!jwt || jwt.trim() === '') {
    throw new IPFSError(
      IPFSErrorType.MISSING_JWT,
      'Pinata JWT token is not configured. Please set NEXT_PUBLIC_PINATA_JWT in your .env.local file.'
    )
  }

  return new PinataSDK({
    pinataJwt: jwt,
  })
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Upload a file to IPFS via Pinata
 *
 * @param file - The file to upload
 * @param options - Optional configuration
 * @param options.name - Custom name for the file (defaults to original filename)
 * @returns Promise resolving to upload result with CID
 *
 * @throws {IPFSError} If upload fails or file is too large
 *
 * @example
 * ```typescript
 * const file = event.target.files[0]
 * try {
 *   const result = await uploadToIPFS(file)
 *   console.log('File uploaded with CID:', result.cid)
 * } catch (error) {
 *   if (error instanceof IPFSError) {
 *     // Handle specific IPFS errors
 *   }
 * }
 * ```
 */
export async function uploadToIPFS(
  file: File,
  options?: { name?: string }
): Promise<IPFSUploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new IPFSError(
      IPFSErrorType.FILE_TOO_LARGE,
      `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)}). Please use a smaller file.`
    )
  }

  // Validate file exists and has content
  if (file.size === 0) {
    throw new IPFSError(
      IPFSErrorType.UPLOAD_FAILED,
      'Cannot upload empty file. Please select a valid file.'
    )
  }

  try {
    const pinata = getPinataClient()

    // Upload file to Pinata using the correct SDK API
    const upload: any = await (pinata.upload as any).public.file(file)

    // Validate response (new SDK returns 'cid' property, not 'IpfsHash')
    if (!upload || !upload.cid) {
      throw new IPFSError(
        IPFSErrorType.UPLOAD_FAILED,
        'Upload succeeded but no CID was returned from Pinata.'
      )
    }

    return {
      cid: upload.cid,
      size: upload.size || file.size,
      timestamp: new Date(upload.created_at || Date.now()),
    }
  } catch (error) {
    // Re-throw IPFSError instances
    if (error instanceof IPFSError) {
      throw error
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new IPFSError(
        IPFSErrorType.NETWORK_ERROR,
        'Network error occurred while uploading to IPFS. Please check your internet connection and try again.',
        error
      )
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('401')) {
      throw new IPFSError(
        IPFSErrorType.MISSING_JWT,
        'Invalid Pinata JWT token. Please verify your NEXT_PUBLIC_PINATA_JWT configuration.',
        error
      )
    }

    // Generic upload failure
    throw new IPFSError(
      IPFSErrorType.UPLOAD_FAILED,
      error instanceof Error
        ? `Upload failed: ${error.message}`
        : 'An unexpected error occurred while uploading to IPFS.',
      error
    )
  }
}

/**
 * Get the public IPFS gateway URL for a given CID
 *
 * @param cid - The IPFS Content Identifier
 * @param options - Optional configuration
 * @param options.filename - Optional filename to append to URL (helps with downloads)
 * @param options.usePublicGateway - Use public IPFS gateway instead of Pinata (default: false)
 * @returns The full IPFS gateway URL
 *
 * @throws {IPFSError} If CID is invalid
 *
 * @example
 * ```typescript
 * const url = getIPFSGatewayURL('QmXYZ...', { filename: 'document.pdf' })
 * // Returns: https://gateway.pinata.cloud/ipfs/QmXYZ.../document.pdf
 * ```
 */
export function getIPFSGatewayURL(
  cid: string,
  options?: { filename?: string; usePublicGateway?: boolean }
): string {
  // Validate CID
  if (!cid || cid.trim() === '') {
    throw new IPFSError(
      IPFSErrorType.INVALID_CID,
      'Invalid CID: CID cannot be empty.'
    )
  }

  // Basic CID format validation (starts with Qm for v0 or b for v1)
  const cidPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,})$/
  if (!cidPattern.test(cid.trim())) {
    throw new IPFSError(
      IPFSErrorType.INVALID_CID,
      'Invalid CID format. Please provide a valid IPFS CID.'
    )
  }

  const gateway = options?.usePublicGateway ? PUBLIC_GATEWAY : PINATA_GATEWAY
  const baseUrl = `${gateway}/${cid.trim()}`

  // Append filename if provided (helps browsers with downloads)
  if (options?.filename) {
    const sanitizedFilename = sanitizeFilename(options.filename)
    return `${baseUrl}?filename=${encodeURIComponent(sanitizedFilename)}`
  }

  return baseUrl
}

/**
 * Download a file from IPFS by its CID
 *
 * @param cid - The IPFS Content Identifier
 * @param options - Optional configuration
 * @param options.usePublicGateway - Use public IPFS gateway instead of Pinata (default: false)
 * @param options.timeout - Request timeout in milliseconds (default: 30000)
 * @returns Promise resolving to the file as a Blob
 *
 * @throws {IPFSError} If download fails or CID is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const blob = await downloadFromIPFS('QmXYZ...')
 *   const url = URL.createObjectURL(blob)
 *   // Use url to display or download the file
 * } catch (error) {
 *   console.error('Download failed:', error)
 * }
 * ```
 */
export async function downloadFromIPFS(
  cid: string,
  options?: { usePublicGateway?: boolean; timeout?: number }
): Promise<Blob> {
  try {
    const url = getIPFSGatewayURL(cid, {
      usePublicGateway: options?.usePublicGateway,
    })

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeout = options?.timeout ?? 30000 // 30 seconds default

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          throw new IPFSError(
            IPFSErrorType.DOWNLOAD_FAILED,
            'File not found on IPFS. The CID may be invalid or the file may not have been pinned.'
          )
        }

        throw new IPFSError(
          IPFSErrorType.DOWNLOAD_FAILED,
          `Failed to download file from IPFS. Status: ${response.status}`
        )
      }

      return await response.blob()
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new IPFSError(
          IPFSErrorType.NETWORK_ERROR,
          `Download timed out after ${timeout / 1000} seconds. The file may be too large or the network is slow.`
        )
      }

      throw error
    }
  } catch (error) {
    // Re-throw IPFSError instances
    if (error instanceof IPFSError) {
      throw error
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new IPFSError(
        IPFSErrorType.NETWORK_ERROR,
        'Network error occurred while downloading from IPFS. Please check your internet connection and try again.',
        error
      )
    }

    // Generic download failure
    throw new IPFSError(
      IPFSErrorType.DOWNLOAD_FAILED,
      error instanceof Error
        ? `Download failed: ${error.message}`
        : 'An unexpected error occurred while downloading from IPFS.',
      error
    )
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format file size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Sanitize filename to prevent path traversal and other security issues
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for URLs
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255) // Limit length
}

/**
 * Check if IPFS is properly configured
 *
 * @returns true if Pinata JWT is configured, false otherwise
 */
export function isIPFSConfigured(): boolean {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT
  return !!jwt && jwt.trim() !== ''
}

/**
 * Get user-friendly error message from IPFSError
 *
 * @param error - The error to process
 * @returns User-friendly error message
 */
export function getIPFSErrorMessage(error: unknown): string {
  if (error instanceof IPFSError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred with IPFS operations.'
}

// ============================================================================
// Exports
// ============================================================================

export default {
  uploadToIPFS,
  getIPFSGatewayURL,
  downloadFromIPFS,
  isIPFSConfigured,
  getIPFSErrorMessage,
}
