'use client'

import { useNetwork } from '../contexts/NetworkContext'
import { ChevronDown, Wifi, Server } from 'lucide-react'
import { useState } from 'react'

export function NetworkSelector() {
    const { currentNetwork, networkConfig, switchNetwork, availableNetworks } = useNetwork()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg hover:bg-gray-900 transition-all duration-200"
            >
                {networkConfig.isTestnet ? (
                    <Wifi className="w-4 h-4 text-white" />
                ) : (
                    <Server className="w-4 h-4 text-white" />
                )}
                <span className="text-sm font-medium text-white">
                    {networkConfig.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-dark-900 rounded-lg border border-neon-500/30 z-50">
                        <div className="p-3 border-b border-neon-500/30">
                            <h3 className="text-sm font-semibold">Select Network</h3>
                        </div>
                        <div className="p-2">
                            {Object.entries(availableNetworks).map(([key, network]) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        switchNetwork(key)
                                        setIsOpen(false)
                                    }}
                                    className={`w-full text-left px-3 py-3 rounded-md mb-1 transition-all ${
                                        currentNetwork === key
                                            ? 'bg-neon-900/30 border border-neon-500/50 text-neon-500'
                                            : 'hover:bg-dark-850 border border-transparent hover:border-neon-500/20 text-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            {network.isTestnet ? (
                                                <Wifi className="w-4 h-4 text-neon-500" />
                                            ) : (
                                                <Server className="w-4 h-4 text-neon-500" />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium">{network.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    ChainID: {network.chainId}
                                                </div>
                                            </div>
                                        </div>
                                        {currentNetwork === key && (
                                            <div className="w-2 h-2 bg-neon-500 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-3 border-t border-neon-500/30 bg-dark-850 rounded-b-lg">
                            <div className="text-xs text-gray-400 space-y-1">
                                <div className="flex justify-between">
                                    <span>Contract:</span>
                                    <span className="font-mono">
                                        {networkConfig.contractAddress
                                            ? `${networkConfig.contractAddress.substring(0, 6)}...${networkConfig.contractAddress.substring(38)}`
                                            : 'Not configured'}
                                    </span>
                                </div>
                                {networkConfig.explorerUrl && (
                                    <div className="flex justify-between">
                                        <span>Explorer:</span>
                                        <a
                                            href={`${networkConfig.explorerUrl}/address/${networkConfig.contractAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-neon-500 hover:text-neon-400 hover:underline transition-colors"
                                        >
                                            View Contract
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
