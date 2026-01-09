'use client'

import { useState, useEffect } from 'react'
import { useMetaMask } from '../hooks/useMetaMask'
import { DocumentSignerStepper } from '../components/DocumentSignerStepper'
import { DocumentVerifier } from '../components/DocumentVerifier'
import { DocumentHistory } from '../components/DocumentHistory'
import { NetworkSelector } from '../components/NetworkSelector'
import { FileText, Shield, CheckCircle, History, Wallet, AlertCircle } from 'lucide-react'

export default function Home() {
  const { account, isConnected, connect, disconnect, isConnecting, error, switchWallet, currentWalletIndex, availableWallets } = useMetaMask()
  const [activeTab, setActiveTab] = useState<'upload' | 'verify' | 'history'>('upload')
  const [showWalletSelector, setShowWalletSelector] = useState(false)

  // Debug info
  useEffect(() => {
    console.log('MetaMask Status:', { account, isConnected, isConnecting, error })
  }, [account, isConnected, isConnecting, error])

  // Close wallet selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showWalletSelector && !target.closest('.wallet-selector-container')) {
        setShowWalletSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWalletSelector])

  const tabs = [
    { id: 'upload', label: 'Upload & Sign', icon: FileText, description: 'Upload files and sign them with your wallet' },
    { id: 'verify', label: 'Verify Authenticity', icon: Shield, description: 'Verify document authenticity' },
    { id: 'history', label: 'Blockchain Records', icon: History, description: 'View document history' }
  ]

  const handleViewHistory = () => {
    setActiveTab('history')
  }

  return (
    <div className="min-h-screen bg-dark-950 dark:bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900/95 dark:bg-dark-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-850 rounded-lg flex items-center justify-center border border-gray-700">
                <Shield className="w-6 h-6 text-neon-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  <span className="text-white">SECURE</span>
                  <span className="text-neon-500">PROOF</span>
                </h1>
                <p className="text-sm text-gray-400 dark:text-gray-400">
                  Sign, store and verify PDF documents on Ethereum blockchain with cryptographic signatures and IPFS storage.
                </p>
              </div>
            </div>

            {/* Network Selector & Wallet Connection */}
            <div className="flex items-center space-x-4">
              <NetworkSelector />
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="relative wallet-selector-container">
                    <button
                      onClick={() => setShowWalletSelector(!showWalletSelector)}
                      className="flex items-center space-x-2 bg-gray-950 border border-gray-700 px-3 py-2 rounded-lg hover:bg-gray-900 transition-all duration-200"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-white">
                        Wallet {currentWalletIndex}: {account?.slice(0, 6)}...{account?.slice(-4)}
                      </span>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showWalletSelector && (
                      <div className="absolute right-0 mt-2 w-80 bg-dark-900 rounded-lg border border-gray-700 z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-gray-700">
                          <h3 className="text-sm font-semibold text-white">Select Wallet</h3>
                        </div>
                        <div className="p-2">
                          {availableWallets.map((wallet) => (
                            <button
                              key={wallet.index}
                              onClick={() => {
                                switchWallet(wallet.index)
                                setShowWalletSelector(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-all ${
                                currentWalletIndex === wallet.index
                                  ? 'bg-neon-900/30 border border-neon-500/50 text-neon-500'
                                  : 'hover:bg-dark-850 border border-transparent hover:border-gray-700 text-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-medium text-white">Wallet {wallet.index}</div>
                                  <div className="text-xs font-mono text-gray-400">{wallet.address}</div>
                                </div>
                                {currentWalletIndex === wallet.index && (
                                  <CheckCircle className="w-4 h-4 text-neon-500" fill="currentColor" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm font-medium text-white hover:bg-gray-900 transition-all duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="relative wallet-selector-container">
                  <button
                    onClick={() => setShowWalletSelector(!showWalletSelector)}
                    disabled={isConnecting}
                    className="flex items-center space-x-2 px-4 py-2 bg-neon-500 text-black font-bold rounded-lg hover:bg-neon-400 disabled:opacity-50 transition-all"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                  {showWalletSelector && !isConnected && (
                    <div className="absolute right-0 mt-2 w-80 bg-dark-900 rounded-lg border border-gray-700 z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-semibold text-white">Select Wallet</h3>
                      </div>
                      <div className="p-2">
                        {availableWallets.map((wallet) => (
                          <button
                            key={wallet.index}
                            onClick={() => {
                              connect(wallet.index)
                              setShowWalletSelector(false)
                            }}
                            disabled={isConnecting}
                            className="w-full text-left px-3 py-2 rounded-md mb-1 hover:bg-dark-850 border border-transparent hover:border-gray-700 text-gray-300 transition-all disabled:opacity-50"
                          >
                            <div className="text-xs font-medium text-white">Wallet {wallet.index}</div>
                            <div className="text-xs font-mono text-gray-400">{wallet.address}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}

        {/* Debug Info
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-8 border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info:</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Account: {account || 'None'}</div>
              <div>Connecting: {isConnecting ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>Document Hash: {documentHash || 'None'}</div>
              <div>Contract Address: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'Not configured'}</div>
            </div>
          </div>
        )} */}

        {/* Navigation Tabs - Pill Style */}
        <div className="flex justify-center gap-4 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-neon-500 text-black font-bold'
                    : 'bg-transparent text-white hover:bg-gray-900/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="bg-dark-900 rounded-xl border border-gray-700 p-8">
          {!isConnected ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-dark-850 border border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Connect Your Wallet
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Please select a wallet to access the dApp features and start verifying documents.
              </p>
              {error && (
                <div className="bg-dark-850 rounded-lg p-4 mb-4 border border-red-500/50 max-w-md mx-auto">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              <div className="max-w-md mx-auto">
                <div className="bg-dark-850 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-4">Select Wallet</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableWallets.map((wallet) => (
                      <button
                        key={wallet.index}
                        onClick={() => connect(wallet.index)}
                        disabled={isConnecting}
                        className="w-full text-left px-4 py-3 bg-dark-900 rounded-lg border border-gray-700 hover:border-neon-500 transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">Wallet {wallet.index}</div>
                            <div className="text-xs font-mono text-gray-400">{wallet.address}</div>
                          </div>
                          <Wallet className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'upload' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Upload & Sign Document
                    </h2>
                    <p className="text-gray-400">
                      Upload a PDF, review all pages, sign it with your wallet, and store it on the blockchain
                    </p>
                  </div>
                  <DocumentSignerStepper onViewHistory={handleViewHistory} />
                </div>
              )}

              {activeTab === 'verify' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Audit Layer
                    </h2>
                    <p className="text-gray-400">
                      Provide the document and the associated address to run a verification audit.
                    </p>
                  </div>
                  <DocumentVerifier />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <DocumentHistory />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}