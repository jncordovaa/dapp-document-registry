'use client'

import { useState } from 'react'
import { PenTool, CheckCircle, AlertCircle, Loader2, Shield, ExternalLink, Upload } from 'lucide-react'
import { useMetaMask } from '../hooks/useMetaMask'
import { useContract } from '../hooks/useContract'
import { AddressDisplay } from './AddressDisplay'
import { ConfirmDialog } from './ConfirmDialog'

interface DocumentSignerProps {
  documentHash?: string
  ipfsCID?: string
  onSigned?: (signature: string, timestamp: number) => void
}

export function DocumentSigner({ documentHash, ipfsCID, onSigned }: DocumentSignerProps) {
  const { account, isConnected, signMessage, provider } = useMetaMask()
  const { storeDocumentHash, isLoading, error } = useContract()

  const [isSigning, setIsSigning] = useState(false)
  const [isStoring, setIsStoring] = useState(false)
  const [signature, setSignature] = useState<string>('')
  const [timestamp, setTimestamp] = useState<number>(0)
  const [txHash, setTxHash] = useState<string>('')
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null>(null)
  const [showSignConfirm, setShowSignConfirm] = useState(false)
  const [showStoreConfirm, setShowStoreConfirm] = useState(false)

  // Debug logging
  console.log('DocumentSigner - isConnected:', isConnected, 'account:', account)

  const getBlockchainTimestamp = async () => {
    // Obtener timestamp del último bloque de la blockchain
    // Esto evita problemas de sincronización de reloj local
    try {
      const block = await provider?.getBlock('latest')
      return block?.timestamp ?? Math.floor(Date.now() / 1000) - 60
    } catch (error) {
      console.error('Error getting block timestamp:', error)
      return Math.floor(Date.now() / 1000) - 60
    }
  }

  const handleSign = () => {
    console.log('handleSign called - documentHash:', documentHash, 'isConnected:', isConnected, 'account:', account)

    if (!documentHash) {
      setNotification({ type: 'warning', message: 'Please upload a file first' })
      return
    }

    if (!isConnected || !account) {
      console.error('Not connected or no account:', { isConnected, account })
      setNotification({ type: 'warning', message: 'Please connect your wallet first' })
      return
    }

    setShowSignConfirm(true)
  }

  const confirmSign = async () => {
    setShowSignConfirm(false)
    const message = `Signing document with hash: ${documentHash}`

    setIsSigning(true)
    setSignature('')
    setTimestamp(0)
    setTxHash('')
    setNotification(null)

    try {
      console.log('About to sign message...')
      const sig = await signMessage(message)
      console.log('Signature received:', sig)
      const ts = await getBlockchainTimestamp()
      console.log('Blockchain timestamp:', ts)

      setSignature(sig)
      setTimestamp(ts)
      onSigned?.(sig, ts)

      // Success notification
      setNotification({
        type: 'success',
        message: `Document signed successfully! Signature: ${sig.substring(0, 10)}...${sig.substring(sig.length - 10)}`
      })
    } catch (err: any) {
      console.error('Error signing:', err)
      setNotification({
        type: 'error',
        message: `Error signing document: ${err.message}`
      })
    } finally {
      setIsSigning(false)
    }
  }

  const handleStore = () => {
    if (!documentHash || !signature || !timestamp) {
      setNotification({ type: 'warning', message: 'Please sign the document first' })
      return
    }

    if (!isConnected || !account) {
      console.error('Not connected or no account:', { isConnected, account })
      setNotification({ type: 'warning', message: 'Please connect your wallet first' })
      return
    }

    setShowStoreConfirm(true)
  }

  const confirmStore = async () => {
    setShowStoreConfirm(false)
    setIsStoring(true)
    setTxHash('')
    setNotification(null)

    try {
      console.log('Storing document hash on blockchain...')
      console.log('IPFS CID:', ipfsCID || '(none)')

      // Store on blockchain with signature and IPFS CID
      // Pass empty string if no IPFS CID available
      const tx = await storeDocumentHash(
        documentHash!,
        timestamp,
        signature,
        account!,
        ipfsCID || ''  // Include IPFS CID (empty string if not available)
      )
      console.log('Transaction hash:', tx)
      setTxHash(tx || '')

      // Success notification
      if (tx) {
        setNotification({
          type: 'success',
          message: `Document stored successfully on blockchain! Transaction: ${tx.substring(0, 10)}...${tx.substring(tx.length - 10)}`
        })
      }
    } catch (err: any) {
      console.error('Error storing:', err)
      setNotification({
        type: 'error',
        message: `Error storing on blockchain: ${err.message}`
      })
    } finally {
      setIsStoring(false)
    }
  }

  const reset = () => {
    setSignature('')
    setTimestamp(0)
    setTxHash('')
    setNotification(null)
  }

  return (
    <div className="bg-dark-900 rounded-xl border border-neon-500/30 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-dark-850 border border-neon-500/50 rounded-lg flex items-center justify-center">
          <PenTool className="w-6 h-6 text-neon-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neon-500">Sign Document</h2>
          <p className="text-gray-400">Sign the document hash with your wallet</p>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`mb-6 rounded-lg p-4 border flex items-start space-x-3 ${
          notification.type === 'success' ? 'bg-dark-850 border-neon-500/50' :
          notification.type === 'error' ? 'bg-dark-850 border-red-500/50' :
          notification.type === 'warning' ? 'bg-dark-850 border-yellow-500/50' :
          'bg-dark-850 border-cyber-500/50'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-neon-500 flex-shrink-0 mt-0.5" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
          {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-cyber-500 flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-neon-500' :
              notification.type === 'error' ? 'text-red-400' :
              notification.type === 'warning' ? 'text-yellow-400' :
              'text-cyber-500'
            }`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-neon-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-dark-850 border border-neon-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-neon-500" />
          </div>
          <h3 className="text-lg font-semibold text-neon-500 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to sign documents
          </p>
        </div>
      ) : !documentHash ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-dark-850 border border-cyber-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-cyber-500" />
          </div>
          <h3 className="text-lg font-semibold text-cyber-500 mb-2">
            No Document Hash
          </h3>
          <p className="text-gray-400">
            Please upload a file first to generate its hash
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Hash Display */}
          <div className="bg-dark-850 rounded-lg p-4 border border-neon-500/30">
            <h3 className="text-sm font-medium text-neon-500 mb-2">
              Document Hash to Sign:
            </h3>
            <code className="text-sm font-mono text-gray-300 break-all bg-dark-900 p-2 rounded border border-neon-500/20 block">
              {documentHash}
            </code>
          </div>

          {/* Sign Button */}
          {!signature && (
            <button
              onClick={handleSign}
              disabled={isSigning}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-neon-500 text-black font-bold rounded-lg hover:bg-neon-400 disabled:opacity-50 transition-all"
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing...</span>
                </>
              ) : (
                <>
                  <PenTool className="w-5 h-5" />
                  <span>Sign Document</span>
                </>
              )}
            </button>
          )}

          {/* Signature Display */}
          {signature && (
            <div className="space-y-4">
              <div className="bg-dark-850 rounded-lg p-4 border border-neon-500/50">
                <div className="flex items-center space-x-2 text-neon-500 mb-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Document Signed Successfully!</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-neon-500">
                      Signature:
                    </label>
                    <code className="block text-xs font-mono text-gray-300 break-all bg-dark-900 border border-neon-500/30 p-2 rounded mt-1">
                      {signature}
                    </code>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neon-500">
                      Timestamp:
                    </label>
                    <code className="block text-xs font-mono text-gray-300 bg-dark-900 border border-neon-500/30 p-2 rounded mt-1">
                      {new Date(timestamp * 1000).toLocaleString()}
                    </code>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neon-500">
                      Signer Address:
                    </label>
                    <div className="bg-dark-900 border border-neon-500/30 p-2 rounded mt-1">
                      <AddressDisplay address={account || ''} showCopy showLink />
                    </div>
                  </div>
                </div>
              </div>

              {/* Store on Blockchain Button */}
              {!txHash && (
                <button
                  onClick={handleStore}
                  disabled={isStoring}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-cyber-500 text-black font-bold rounded-lg hover:bg-cyber-400 disabled:opacity-50 transition-all"
                >
                  {isStoring ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Storing on Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Store on Blockchain</span>
                    </>
                  )}
                </button>
              )}

              {/* Transaction Hash Display */}
              {txHash && (
                <div className="bg-dark-850 rounded-lg p-4 border border-cyber-500/50">
                  <div className="flex items-center space-x-2 text-cyber-500 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Transaction Confirmed!</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm font-mono text-gray-300 break-all">
                      {txHash}
                    </code>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyber-500 hover:text-cyber-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={reset}
                className="w-full px-6 py-3 text-gray-400 border border-neon-500/30 rounded-lg hover:bg-dark-850 hover:border-neon-500/50 hover:text-neon-500 transition-all"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-dark-850 rounded-lg p-4 border border-red-500/50">
          <div className="flex items-center space-x-2 text-red-500 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Error:</span>
          </div>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Sign Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSignConfirm}
        title="Confirm Signature"
        message="You are about to sign this document with your wallet. This action will open MetaMask to request your signature."
        details={[
          { label: 'Document Hash', value: documentHash || '' },
          { label: 'Signer', value: account || '' }
        ]}
        onConfirm={confirmSign}
        onCancel={() => setShowSignConfirm(false)}
        confirmText="Sign Document"
        cancelText="Cancel"
        type="info"
      />

      {/* Store Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showStoreConfirm}
        title="Store on Blockchain"
        message="You are about to store this document signature on the blockchain. This action requires gas fees and cannot be undone."
        details={[
          { label: 'Document Hash', value: documentHash || '' },
          { label: 'Signer', value: account || '' },
          { label: 'Timestamp', value: new Date(timestamp * 1000).toLocaleString() },
          { label: 'Signature', value: signature ? `${signature.substring(0, 20)}...${signature.substring(signature.length - 10)}` : '' },
          { label: 'IPFS CID', value: ipfsCID || '(not uploaded)' }
        ]}
        onConfirm={confirmStore}
        onCancel={() => setShowStoreConfirm(false)}
        confirmText="Store on Blockchain"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  )
}
