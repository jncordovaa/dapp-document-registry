/**
 * IPFS Utility Usage Examples
 *
 * This file provides usage examples for the IPFS utility functions.
 * These examples demonstrate how to integrate IPFS functionality into React components.
 *
 * @module utils/ipfs.example
 */

import {
  uploadToIPFS,
  getIPFSGatewayURL,
  downloadFromIPFS,
  isIPFSConfigured,
  getIPFSErrorMessage,
  IPFSError,
  IPFSErrorType,
  type IPFSUploadResult,
} from './ipfs'

// ============================================================================
// Example 1: Basic File Upload in a React Component
// ============================================================================

/**
 * Example: Upload file from input element
 */
export async function handleFileUploadExample(
  event: React.ChangeEvent<HTMLInputElement>
): Promise<void> {
  const file = event.target.files?.[0]

  if (!file) {
    console.error('No file selected')
    return
  }

  try {
    // Upload to IPFS
    const result = await uploadToIPFS(file)

    console.log('Upload successful!')
    console.log('CID:', result.cid)
    console.log('Size:', result.size, 'bytes')
    console.log('Timestamp:', result.timestamp)

    // Get gateway URL
    const url = getIPFSGatewayURL(result.cid, { filename: file.name })
    console.log('Gateway URL:', url)

    // Store CID in your application state or send to smart contract
    // Example: await storeDocumentWithCID(result.cid)
  } catch (error) {
    if (error instanceof IPFSError) {
      switch (error.type) {
        case IPFSErrorType.FILE_TOO_LARGE:
          alert('File is too large. Please select a smaller file.')
          break
        case IPFSErrorType.MISSING_JWT:
          alert('IPFS is not configured. Please contact support.')
          break
        case IPFSErrorType.NETWORK_ERROR:
          alert('Network error. Please check your connection and try again.')
          break
        default:
          alert(`Upload failed: ${error.message}`)
      }
    } else {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred.')
    }
  }
}

// ============================================================================
// Example 2: React Component with Upload State
// ============================================================================

/**
 * Example: React component with upload progress state
 */
export function UploadComponentExample() {
  // const [uploading, setUploading] = useState(false)
  // const [uploadResult, setUploadResult] = useState<IPFSUploadResult | null>(null)
  // const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    // setUploading(true)
    // setError(null)

    try {
      const result = await uploadToIPFS(file, { name: file.name })
      // setUploadResult(result)

      // Optional: Store CID in smart contract
      // await contractInstance.storeDocumentHash(documentHash, timestamp, signature, cid)
    } catch (err) {
      const errorMessage = getIPFSErrorMessage(err)
      // setError(errorMessage)
      console.error('Upload error:', errorMessage)
    } finally {
      // setUploading(false)
    }
  }

  return { handleUpload }
}

// ============================================================================
// Example 3: Download File from IPFS
// ============================================================================

/**
 * Example: Download file and trigger browser download
 */
export async function downloadFileExample(
  cid: string,
  filename: string = 'download'
): Promise<void> {
  try {
    // Download from IPFS
    const blob = await downloadFromIPFS(cid)

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('Download complete!')
  } catch (error) {
    console.error('Download failed:', getIPFSErrorMessage(error))
    alert('Failed to download file from IPFS.')
  }
}

// ============================================================================
// Example 4: Preview File from IPFS
// ============================================================================

/**
 * Example: Load file from IPFS and display in browser
 */
export async function previewFileExample(cid: string): Promise<string | null> {
  try {
    const blob = await downloadFromIPFS(cid)
    const url = URL.createObjectURL(blob)

    // For images: set as img src
    // For PDFs: use in iframe or object tag
    // Remember to revoke URL when done: URL.revokeObjectURL(url)

    return url
  } catch (error) {
    console.error('Preview failed:', getIPFSErrorMessage(error))
    return null
  }
}

// ============================================================================
// Example 5: Configuration Check
// ============================================================================

/**
 * Example: Check IPFS configuration on app startup
 */
export function checkIPFSConfiguration(): void {
  if (!isIPFSConfigured()) {
    console.warn(
      'IPFS is not configured. Set NEXT_PUBLIC_PINATA_JWT in .env.local'
    )
    // Optionally disable IPFS features in UI
  } else {
    console.log('IPFS is configured and ready to use.')
  }
}

// ============================================================================
// Example 6: Integration with Smart Contract
// ============================================================================

/**
 * Example: Complete workflow - Upload to IPFS and store in contract
 */
export async function completeDocumentWorkflowExample(
  file: File,
  contractInstance: any, // Replace with your contract type
  signer: any // Replace with ethers.Signer type
) {
  try {
    // Step 1: Calculate document hash (existing functionality)
    const arrayBuffer = await file.arrayBuffer()
    const hashArray = new Uint8Array(
      await crypto.subtle.digest('SHA-256', arrayBuffer)
    )
    const documentHash =
      '0x' + Array.from(hashArray).map((b) => b.toString(16).padStart(2, '0')).join('')

    // Step 2: Upload file to IPFS
    console.log('Uploading to IPFS...')
    const ipfsResult = await uploadToIPFS(file)
    console.log('Upload successful! CID:', ipfsResult.cid)

    // Step 3: Sign message (existing functionality)
    const timestamp = Math.floor(Date.now() / 1000)
    const message = `Document: ${documentHash}\nTimestamp: ${timestamp}`
    const signature = await signer.signMessage(message)

    // Step 4: Store in smart contract with CID
    console.log('Storing in blockchain...')
    const tx = await contractInstance.storeDocumentHash(
      documentHash,
      timestamp,
      signature,
      ipfsResult.cid // Pass CID to contract
    )

    await tx.wait()
    console.log('Document registered successfully!')

    return {
      documentHash,
      cid: ipfsResult.cid,
      timestamp,
      transactionHash: tx.hash,
    }
  } catch (error) {
    console.error('Workflow failed:', error)
    throw error
  }
}

// ============================================================================
// Example 7: Error Handling Best Practices
// ============================================================================

/**
 * Example: Comprehensive error handling
 */
export async function robustUploadExample(file: File): Promise<string | null> {
  // Pre-flight checks
  if (!isIPFSConfigured()) {
    alert('IPFS service is not available. Please contact support.')
    return null
  }

  if (file.size === 0) {
    alert('Cannot upload empty file.')
    return null
  }

  try {
    const result = await uploadToIPFS(file)
    return result.cid
  } catch (error) {
    if (error instanceof IPFSError) {
      // Handle specific error types
      switch (error.type) {
        case IPFSErrorType.FILE_TOO_LARGE:
          alert(
            'File exceeds maximum size limit. Please select a smaller file (max 100 MB).'
          )
          break

        case IPFSErrorType.MISSING_JWT:
          console.error('Configuration error:', error.message)
          alert('IPFS service is misconfigured. Please contact support.')
          break

        case IPFSErrorType.NETWORK_ERROR:
          alert(
            'Network error. Please check your internet connection and try again.'
          )
          break

        case IPFSErrorType.UPLOAD_FAILED:
          console.error('Upload error:', error.message)
          alert('Upload failed. Please try again.')
          break

        default:
          console.error('IPFS error:', error)
          alert(`Error: ${error.message}`)
      }

      // Log original error for debugging
      if (error.originalError) {
        console.error('Original error:', error.originalError)
      }
    } else {
      // Unexpected error
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
    }

    return null
  }
}

// ============================================================================
// Example 8: React Hook for IPFS Upload
// ============================================================================

/**
 * Example: Custom React hook for IPFS operations
 */
export function useIPFSUploadExample() {
  // const [uploading, setUploading] = useState(false)
  // const [result, setResult] = useState<IPFSUploadResult | null>(null)
  // const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    // setUploading(true)
    // setError(null)
    // setResult(null)

    try {
      const uploadResult = await uploadToIPFS(file)
      // setResult(uploadResult)
      return uploadResult
    } catch (err) {
      const errorMsg = getIPFSErrorMessage(err)
      // setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      // setUploading(false)
    }
  }

  const getURL = (cid: string, filename?: string) => {
    try {
      return getIPFSGatewayURL(cid, { filename })
    } catch (err) {
      console.error('Invalid CID:', err)
      return null
    }
  }

  return {
    upload,
    getURL,
    // uploading,
    // result,
    // error,
  }
}

// ============================================================================
// Notes for Integration
// ============================================================================

/*
 * INTEGRATION CHECKLIST:
 *
 * 1. Environment Configuration:
 *    - Add NEXT_PUBLIC_PINATA_JWT to dapp/.env.local
 *    - Get JWT from https://app.pinata.cloud/developers/api-keys
 *
 * 2. Component Updates:
 *    - DocumentSigner.tsx: Add IPFS upload before contract interaction
 *    - DocumentVerifier.tsx: Add download/preview buttons for files
 *    - DocumentHistory.tsx: Display IPFS links for stored documents
 *
 * 3. Contract Updates:
 *    - Ensure contract accepts CID parameter (already done in Phase 2)
 *    - Update contract calls to include CID
 *
 * 4. User Experience:
 *    - Show upload progress indicator
 *    - Display file preview before signing
 *    - Provide download/view options for verified documents
 *    - Handle errors gracefully with user-friendly messages
 *
 * 5. Testing:
 *    - Test with various file sizes (small, medium, large)
 *    - Test with different file types (PDF, images, text)
 *    - Test error scenarios (no internet, invalid JWT, etc.)
 *    - Test on different networks (Anvil, Sepolia)
 */
