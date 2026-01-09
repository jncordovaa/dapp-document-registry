'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react'
import { useENS } from '../hooks/useENS'
import { useNetwork } from '../contexts/NetworkContext'
import { formatAddress } from '../utils/ens'

interface AddressDisplayProps {
    address: string
    showCopy?: boolean
    showLink?: boolean
    className?: string
}

export function AddressDisplay({
    address,
    showCopy = true,
    showLink = true,
    className = ''
}: AddressDisplayProps) {
    const { ensName, isLoading } = useENS(address)
    const { networkConfig } = useNetwork()
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const explorerUrl = networkConfig.explorerUrl
        ? `${networkConfig.explorerUrl}/address/${address}`
        : null

    // Display: ENS name o dirección truncada
    const displayText = isLoading
        ? formatAddress(address)
        : ensName || formatAddress(address)

    return (
        <span className={`inline-flex items-center gap-1.5 ${className}`}>
            <code className="text-xs font-mono text-neon-500">
                {displayText}
            </code>

            {/* Mostrar dirección truncada si hay ENS */}
            {ensName && !isLoading && (
                <span className="text-xs text-gray-500">
                    ({formatAddress(address)})
                </span>
            )}

            {/* Botón copiar */}
            {showCopy && (
                <button
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-neon-500 transition-colors"
                    title={copied ? 'Copied!' : 'Copy address'}
                >
                    {copied ? (
                        <Check className="w-3 h-3 text-neon-500" />
                    ) : (
                        <Copy className="w-3 h-3" />
                    )}
                </button>
            )}

            {/* Link a explorer */}
            {showLink && explorerUrl && (
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon-500 hover:text-neon-400 transition-colors"
                    title="View on Explorer"
                >
                    <ExternalLink className="w-3 h-3" />
                </a>
            )}
        </span>
    )
}
