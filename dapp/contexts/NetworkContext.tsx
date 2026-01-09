'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { NETWORKS, NetworkConfig, getDefaultNetwork } from '../config/networks'

interface NetworkContextType {
    currentNetwork: string
    networkConfig: NetworkConfig
    switchNetwork: (networkKey: string) => void
    availableNetworks: typeof NETWORKS
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

export function NetworkProvider({ children }: { children: ReactNode }) {
    const [currentNetwork, setCurrentNetwork] = useState<string>(getDefaultNetwork())
    const networkConfig = NETWORKS[currentNetwork]

    const switchNetwork = (networkKey: string) => {
        if (NETWORKS[networkKey]) {
            setCurrentNetwork(networkKey)
            localStorage.setItem('selectedNetwork', networkKey)
        }
    }

    useEffect(() => {
        const savedNetwork = localStorage.getItem('selectedNetwork')
        if (savedNetwork && NETWORKS[savedNetwork]) {
            setCurrentNetwork(savedNetwork)
        }
    }, [])

    return (
        <NetworkContext.Provider value={{ currentNetwork, networkConfig, switchNetwork, availableNetworks: NETWORKS }}>
            {children}
        </NetworkContext.Provider>
    )
}

export function useNetwork() {
    const context = useContext(NetworkContext)
    if (!context) throw new Error('useNetwork must be used within NetworkProvider')
    return context
}
