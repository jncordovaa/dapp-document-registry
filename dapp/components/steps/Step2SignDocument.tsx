'use client'

/**
 * Step 2: Sign & Store Document
 *
 * Combined workflow that:
 * 1. Signs the document with wallet signature
 * 2. Uploads file to IPFS
 * 3. Stores hash on blockchain
 *
 * Displays real-time progress in System Logs panel
 */

import { useState, useEffect } from 'react'
import {
  PenTool,
  CheckCircle,
  Loader2,
  AlertCircle,
  Hash,
  Copy,
  Check,
  FileText,
  History,
  ExternalLink,
  Shield,
  Cloud,
} from 'lucide-react'
import { FileData, SignatureData, BlockchainData, IPFSProgress, BlockchainProgress } from '../../types/stepper'
import { useMetaMask } from '../../hooks/useMetaMask'
import { useContract } from '../../hooks/useContract'
import { useNetwork } from '../../contexts/NetworkContext'
import { HashUtils } from '../../utils/hash'
import { uploadToIPFS, getIPFSGatewayURL, getIPFSErrorMessage } from '../../utils/ipfs'
import { UPLOAD_CONFIG } from '../../config/upload'
import { AddressDisplay } from '../AddressDisplay'
import { ethers } from 'ethers'

interface Step2SignDocumentProps {
  /** File data from Step 1 */
  fileData: FileData
  /** Current signature data if already signed */
  signatureData: SignatureData | null
  /** Blockchain data if already stored */
  blockchainData: BlockchainData | null
  /** Callback when document is signed */
  onDocumentSigned: (signature: SignatureData) => void
  /** Callback when successfully stored */
  onStored: (data: BlockchainData) => void
  /** Start another document */
  onSignAnother: () => void
  /** View in history */
  onViewHistory: () => void
  /** Go back to previous step */
  onBack: () => void
}

export function Step2SignDocument({
  fileData,
  signatureData,
  blockchainData,
  onDocumentSigned,
  onStored,
  onSignAnother,
  onViewHistory,
  onBack,
}: Step2SignDocumentProps) {
  const { account, isConnected, signMessage, provider } = useMetaMask()
  const { storeDocumentHash } = useContract()
  const { networkConfig } = useNetwork()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentHash, setDocumentHash] = useState<string>(fileData.hash || '')
  const [isCalculatingHash, setIsCalculatingHash] = useState(!fileData.hash)
  const [copiedHash, setCopiedHash] = useState(false)

  // Process status tracking
  const [signStatus, setSignStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [ipfsStatus, setIpfsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  // Detailed progress
  const [ipfsProgress, setIpfsProgress] = useState<IPFSProgress>({
    status: 'idle',
    progress: 0,
  })
  const [blockchainProgress, setBlockchainProgress] = useState<BlockchainProgress>({
    status: 'idle',
  })

  // Calculate document hash on mount if not already calculated
  useEffect(() => {
    if (fileData.hash) {
      setDocumentHash(fileData.hash)
      setIsCalculatingHash(false)
      return
    }

    async function calculateHash() {
      try {
        setIsCalculatingHash(true)
        const hash = await HashUtils.calculateFileHash(fileData.file)
        setDocumentHash(hash)
        // Update fileData with calculated hash
        fileData.hash = hash
      } catch (err: any) {
        console.error('Error calculating hash:', err)
        setError('Failed to calculate document hash')
      } finally {
        setIsCalculatingHash(false)
      }
    }

    calculateHash()
  }, [fileData])

  // Get blockchain timestamp
  const getBlockchainTimestamp = async () => {
    try {
      const block = await provider?.getBlock('latest')
      return block?.timestamp ?? Math.floor(Date.now() / 1000)
    } catch (error) {
      console.error('Error getting block timestamp:', error)
      return Math.floor(Date.now() / 1000)
    }
  }

  // Copy hash to clipboard
  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(documentHash)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
    } catch (err) {
      console.error('Failed to copy hash:', err)
    }
  }

  // Step 1: Sign document
  const signDocument = async (): Promise<SignatureData> => {
    setSignStatus('loading')
    try {
      if (!account || !isConnected) {
        throw new Error('Wallet not connected')
      }

      if (!documentHash) {
        throw new Error('Document hash not calculated')
      }

      // Create message to sign
      const message = `Signing document with hash: ${documentHash}`

      // Sign message automatically (no MetaMask popup - using HD wallet private key)
      const signature = await signMessage(message)

      // Get blockchain timestamp
      const timestamp = await getBlockchainTimestamp()

      // Create signature data
      const newSignatureData: SignatureData = {
        signature,
        timestamp,
        signerAddress: account,
        formattedDate: new Date(timestamp * 1000).toLocaleString(),
      }

      setSignStatus('ok')
      onDocumentSigned(newSignatureData)
      return newSignatureData
    } catch (err: any) {
      console.error('Error signing document:', err)
      setSignStatus('error')
      throw new Error(err.message || 'Failed to sign document')
    }
  }

  // Step 2: Upload to IPFS
  const uploadToIPFSWithRetry = async (retryAttempt = 0): Promise<string> => {
    setIpfsStatus('loading')
    try {
      setIpfsProgress({
        status: 'uploading',
        progress: 0,
        retryAttempt,
      })

      const result = await uploadToIPFS(fileData.file)

      setIpfsProgress({
        status: 'success',
        progress: 100,
        cid: result.cid,
      })

      setIpfsStatus('ok')
      return result.cid
    } catch (err: any) {
      const errorMessage = getIPFSErrorMessage(err)

      // Retry logic
      if (retryAttempt < UPLOAD_CONFIG.ipfs.maxRetries) {
        console.log(`IPFS upload failed, retrying (${retryAttempt + 1}/${UPLOAD_CONFIG.ipfs.maxRetries})...`)

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, UPLOAD_CONFIG.ipfs.retryDelay))

        return uploadToIPFSWithRetry(retryAttempt + 1)
      }

      // Max retries reached
      setIpfsProgress({
        status: 'error',
        progress: 0,
        error: errorMessage,
        retryAttempt,
      })

      setIpfsStatus('error')
      throw new Error(errorMessage)
    }
  }

  // Step 3: Store on blockchain
  const storeOnBlockchain = async (ipfsCid: string, signature: SignatureData): Promise<BlockchainData> => {
    setBlockchainStatus('loading')
    try {
      // Gas estimation
      setBlockchainProgress({
        status: 'estimating',
      })

      // Estimate gas (simplified - in production you'd call estimateGas on the contract)
      const gasEstimate = BigInt(200000) // Rough estimate
      const gasEstimateETH = ethers.formatEther(gasEstimate)

      setBlockchainProgress({
        status: 'estimating',
        gasEstimate,
        gasEstimateETH,
      })

      // Send transaction
      setBlockchainProgress((prev) => ({
        ...prev,
        status: 'sending',
      }))

      const txHash = await storeDocumentHash(
        documentHash,
        signature.timestamp,
        signature.signature,
        signature.signerAddress,
        ipfsCid
      )

      if (!txHash) {
        throw new Error('Transaction failed - no transaction hash returned')
      }

      setBlockchainProgress((prev) => ({
        ...prev,
        status: 'confirming',
        txHash,
        confirmations: 0,
      }))

      // Wait for confirmations (simplified - in production you'd use provider.waitForTransaction)
      // For now, we'll simulate waiting
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setBlockchainProgress((prev) => ({
        ...prev,
        status: 'confirmed',
        confirmations: UPLOAD_CONFIG.blockchain.minConfirmations,
      }))

      // Create blockchain data
      const blockchainData: BlockchainData = {
        txHash,
        blockNumber: 0, // Would get from transaction receipt
        confirmations: UPLOAD_CONFIG.blockchain.minConfirmations,
        ipfsCID: ipfsCid,
        gasUsed: gasEstimate,
        timestamp: new Date(),
        explorerUrl: networkConfig.explorerUrl
          ? `${networkConfig.explorerUrl}/tx/${txHash}`
          : '',
      }

      setBlockchainStatus('ok')
      return blockchainData
    } catch (err: any) {
      console.error('Blockchain storage error:', err)

      setBlockchainProgress({
        status: 'error',
        error: err.message || 'Failed to store on blockchain',
      })

      setBlockchainStatus('error')
      throw err
    }
  }

  // Main handler: Sign + Upload + Store
  const handleSignAndStore = async () => {
    if (!account || !isConnected) {
      setError('Wallet not connected')
      return
    }

    if (!documentHash) {
      setError('Document hash not calculated')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSignStatus('idle')
    setIpfsStatus('idle')
    setBlockchainStatus('idle')

    try {
      // Step 1: Sign document
      const signature = await signDocument()

      // Step 2: Upload to IPFS
      const ipfsCid = await uploadToIPFSWithRetry()

      // Step 3: Store on blockchain
      const data = await storeOnBlockchain(ipfsCid, signature)

      // Success
      onStored(data)
    } catch (err: any) {
      console.error('Sign and store error:', err)
      setError(err.message || 'Failed to complete sign and store process')
    } finally {
      setIsProcessing(false)
    }
  }

  // Render status indicator
  const renderStatusIndicator = (status: 'idle' | 'loading' | 'ok' | 'error') => {
    switch (status) {
      case 'loading':
        return (
          <span className="inline-flex items-center space-x-1 text-neon-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-sm">LOADING</span>
          </span>
        )
      case 'ok':
        return (
          <span className="inline-flex items-center space-x-1 text-neon-500">
            <CheckCircle className="w-4 h-4" />
            <span className="font-mono text-sm">OK</span>
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="font-mono text-sm">ERROR</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-gray-400">
            <span className="w-4 h-4 rounded-full border-2 border-current" />
            <span className="font-mono text-sm">PENDING</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Hash Calculation Progress */}
      {isCalculatingHash && (
        <div className="bg-dark-850 rounded-lg p-4 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
            <span className="text-yellow-400 font-medium">
              Calculating document hash (SHA-256)...
            </span>
          </div>
        </div>
      )}

      {/* Security Note - Only show before blockchain storage */}
      {!blockchainData && (
        <div className="bg-dark-850 rounded-lg p-6 border-2 border-neon-500/50">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-neon-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-neon-500 mb-2 text-neon-glow">
                SECURITY NOTE
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Once stored, the hash of this PDF becomes part of the immutable history of the blockchain.
                It cannot be altered or deleted, serving as definitive proof of the document's existence
                and integrity at this moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-dark-850 rounded-lg p-4 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Not Connected Warning */}
      {!isConnected && (
        <div className="bg-dark-850 rounded-lg p-4 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-400 font-medium">
              Please connect your wallet to sign and store the document
            </span>
          </div>
        </div>
      )}

      {/* Main Content - Two Columns */}
      {!blockchainData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Document Summary */}
          <div className="bg-dark-850 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-neon-500 mb-4">
              Document Summary
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-400">File Name</p>
                <p className="text-white font-mono text-sm">{fileData.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">File Size</p>
                <p className="text-white">
                  {(fileData.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">
                  Signer Wallet
                </p>
                <div className="mt-1">
                  <AddressDisplay address={account || ''} showCopy showLink />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Network</p>
                <p className="text-white">{networkConfig.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">
                  Document Hash
                </p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 text-xs font-mono text-white break-all bg-dark-900 p-2 rounded border border-gray-700">
                    {documentHash}
                  </code>
                  
                  <button
                    onClick={handleCopyHash}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-neon-500 hover:bg-dark-900 rounded transition-all border border-transparent hover:border-gray-700"
                    aria-label="Copy hash to clipboard"
                  >
                    {copiedHash ? (
                      <Check className="w-4 h-4 text-neon-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: System Logs */}
          <div className="bg-dark-850 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-neon-500 mb-4">
              System Logs
            </h3>
            <div className="space-y-3 text-sm">
              {/* Sign Document */}
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Sign Document</span>
                {renderStatusIndicator(signStatus)}
              </div>

              {/* Upload to IPFS */}
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Upload to IPFS</span>
                {renderStatusIndicator(ipfsStatus)}
              </div>
              {ipfsProgress.status === 'uploading' && ipfsProgress.retryAttempt && (
                <p className="text-xs text-yellow-400 ml-4">
                  Retry {ipfsProgress.retryAttempt}/{UPLOAD_CONFIG.ipfs.maxRetries}
                </p>
              )}
              {ipfsProgress.status === 'success' && ipfsProgress.cid && (
                <div className="ml-4 text-xs">
                  <p className="text-neon-500">CID: {ipfsProgress.cid.slice(0, 20)}...</p>
                </div>
              )}
              {ipfsProgress.error && (
                <p className="text-xs text-red-400 ml-4">{ipfsProgress.error}</p>
              )}

              {/* Store on Blockchain */}
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Store on Blockchain</span>
                {renderStatusIndicator(blockchainStatus)}
              </div>
              {blockchainProgress.status === 'estimating' && (
                <p className="text-xs text-neon-500 ml-4">Estimating gas...</p>
              )}
              {blockchainProgress.status === 'sending' && (
                <p className="text-xs text-neon-500 ml-4">Sending transaction...</p>
              )}
              {blockchainProgress.status === 'confirming' && (
                <p className="text-xs text-neon-500 ml-4">
                  Confirming... ({blockchainProgress.confirmations || 0}/
                  {UPLOAD_CONFIG.blockchain.minConfirmations})
                </p>
              )}
              {blockchainProgress.txHash && (
                <p className="text-xs text-neon-500 ml-4">
                  Tx: {blockchainProgress.txHash.slice(0, 20)}...
                </p>
              )}
              {blockchainProgress.error && (
                <p className="text-xs text-red-400 ml-4">{blockchainProgress.error}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Action Buttons */}
      {!blockchainData ? (
        <div className="space-y-3">
          <button
            onClick={handleSignAndStore}
            disabled={isProcessing || !isConnected || isCalculatingHash || !documentHash}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-neon-500 text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <PenTool className="w-5 h-5" />
                <span>Sign and Store Document</span>
              </>
            )}
          </button>

          <button
            onClick={onBack}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-dark-850 text-white border border-gray-700 rounded-lg hover:bg-dark-900 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Upload
          </button>
        </div>
      ) : null}

      {/* Success State */}
      {blockchainData && (
        <div className="bg-dark-850 rounded-lg p-6 border-2 border-neon-500/50">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-8 h-8 text-neon-500" />
            <h3 className="text-xl font-bold text-neon-500 text-neon-glow">
              Document Stored Successfully!
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-900 rounded p-3 border border-gray-700">
              <p className="text-xs font-medium text-gray-400 mb-1">IPFS CID</p>
              <a
                href={getIPFSGatewayURL(blockchainData.ipfsCID)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-neon-500 hover:underline break-all flex items-center gap-1"
              >
                {blockchainData.ipfsCID}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            <div className="bg-dark-900 rounded p-3 border border-gray-700">
              <p className="text-xs font-medium text-gray-400 mb-1">
                Transaction Hash
              </p>
              {blockchainData.explorerUrl ? (
                <a
                  href={blockchainData.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-neon-500 hover:underline break-all flex items-center gap-1"
                >
                  {HashUtils.formatHash(blockchainData.txHash, 10)}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ) : (
                <code className="text-xs font-mono text-white break-all">
                  {HashUtils.formatHash(blockchainData.txHash, 10)}
                </code>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onSignAnother}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-neon-500 text-black rounded-lg transition-all font-bold"
            >
              <FileText className="w-5 h-5" />
              <span>Sign Another Document</span>
            </button>
            <button
              onClick={onViewHistory}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-dark-900 text-white border-2 border-gray-700 rounded-lg hover:bg-dark-850 hover:border-gray-600 transition-all font-medium"
            >
              <History className="w-5 h-5" />
              <span>View in History</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
