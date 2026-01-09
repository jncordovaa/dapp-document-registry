'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { ethers } from 'ethers'
import { useNetwork } from './NetworkContext'

// Helper function to derive wallets from mnemonic
function deriveWallets(mnemonic: string, count: number = 20) {
  if (!mnemonic) return []

  try {
    return Array.from({ length: count }, (_, i) => {
      const path = `m/44'/60'/0'/0/${i}`
      const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path)
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        index: i
      }
    })
  } catch (error) {
    console.error('Error deriving wallets from mnemonic:', error)
    return []
  }
}

interface MetaMaskContextType {
  account: string | null
  isConnected: boolean
  isConnecting: boolean
  provider: ethers.JsonRpcProvider | null
  error: string | null
  connect: (walletIndex?: number) => Promise<void>
  disconnect: () => void
  signMessage: (message: string) => Promise<string>
  getSigner: () => Promise<ethers.Wallet>
  switchWallet: (walletIndex: number) => Promise<void>
  currentWalletIndex: number
  availableWallets: Array<{ index: number; address: string }>
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined)

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const { networkConfig } = useNetwork()
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0)

  // Derive wallets from current network's mnemonic
  const wallets = useMemo(() => {
    console.log('🔑 Deriving wallets for network:', networkConfig.name)
    return deriveWallets(networkConfig.mnemonic)
  }, [networkConfig.mnemonic, networkConfig.name])

  // Disconnect when network changes
  useEffect(() => {
    console.log('🔄 Network changed to:', networkConfig.name)
    setAccount(null)
    setIsConnected(false)
    setError(null)
    setCurrentWalletIndex(0)
  }, [networkConfig.name])

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔄 MetaMask Context state changed:', {
      account,
      isConnected,
      isConnecting,
      hasProvider: !!provider,
      error,
      currentWalletIndex,
      network: networkConfig.name,
      walletsCount: wallets.length
    })
  }, [account, isConnected, isConnecting, provider, error, currentWalletIndex, networkConfig.name, wallets.length])

  useEffect(() => {
    // Initialize provider based on selected network
    const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
    setProvider(jsonRpcProvider)
    console.log('🌐 Provider initialized:', networkConfig.rpcUrl, '| Network:', networkConfig.name)
  }, [networkConfig.rpcUrl, networkConfig.name])

  const connect = async (walletIndex: number = 0) => {
    console.log('🔌 Connect called with walletIndex:', walletIndex, 'on network:', networkConfig.name)

    try {
      setIsConnecting(true)
      setError(null)

      if (wallets.length === 0) {
        throw new Error(`No mnemonic configured for ${networkConfig.name}. Please set NEXT_PUBLIC_${networkConfig.name.toUpperCase().replace(' ', '_')}_MNEMONIC in .env.local`)
      }

      if (walletIndex < 0 || walletIndex >= wallets.length) {
        throw new Error('Invalid wallet index')
      }

      const wallet = wallets[walletIndex]
      console.log('📝 Wallet data:', { address: wallet.address, index: walletIndex })

      const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)

      console.log('🔧 Provider created for network:', networkConfig.name)

      // Update all states
      setCurrentWalletIndex(walletIndex)
      setAccount(wallet.address)
      setProvider(jsonRpcProvider)
      setIsConnected(true)
      setIsConnecting(false)

      console.log(`✅ Connected to wallet ${walletIndex}: ${wallet.address} on ${networkConfig.name}`)
    } catch (error: any) {
      console.error('❌ Connection error:', error)
      setError(error.message || 'Failed to connect to wallet')
      setIsConnecting(false)
      setIsConnected(false)
      setAccount(null)
    }
  }

  const disconnect = () => {
    console.log('🔌 Disconnecting wallet')
    setAccount(null)
    setIsConnected(false)
    setError(null)
  }

  const switchWallet = async (walletIndex: number) => {
    console.log('🔄 Switching to wallet:', walletIndex)
    await connect(walletIndex)
  }

  const signMessage = async (message: string) => {
    console.log('✍️ signMessage called:', {
      account,
      isConnected,
      currentWalletIndex,
      network: networkConfig.name,
      message: message.substring(0, 50) + '...'
    })

    if (!account || !isConnected) {
      console.error('❌ Cannot sign - not connected')
      throw new Error('Not connected to wallet')
    }

    try {
      console.log('🔧 Creating signer from wallet data...')
      const wallet = wallets[currentWalletIndex]
      const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
      const walletSigner = new ethers.Wallet(wallet.privateKey, jsonRpcProvider)

      console.log('📝 Calling signer.signMessage...')
      const signature = await walletSigner.signMessage(message)
      console.log('✅ Signature generated successfully:', signature.substring(0, 20) + '...')
      return signature
    } catch (error: any) {
      console.error('❌ Error in signMessage:', error)
      throw new Error(error.message || 'Failed to sign message')
    }
  }

  const getSigner = async () => {
    if (!account || !isConnected) {
      throw new Error('Not connected to wallet')
    }
    const wallet = wallets[currentWalletIndex]
    const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
    const walletSigner = new ethers.Wallet(wallet.privateKey, jsonRpcProvider)
    return walletSigner
  }

  const value: MetaMaskContextType = {
    account,
    isConnected,
    isConnecting,
    provider,
    error,
    connect,
    disconnect,
    signMessage,
    getSigner,
    switchWallet,
    currentWalletIndex,
    availableWallets: wallets.map((w, i) => ({
      index: i,
      address: w.address
    }))
  }

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  )
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext)
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider')
  }
  return context
}
