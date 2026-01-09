import { useState, useEffect } from 'react'
import { lookupENSName, isENSAvailable } from '../utils/ens'
import { useNetwork } from '../contexts/NetworkContext'

/**
 * Hook para obtener nombre ENS de una dirección
 * @param address - Dirección Ethereum
 * @returns { ensName, isLoading, isENSSupported }
 */
export function useENS(address: string | null) {
    const { networkConfig } = useNetwork()
    const [ensName, setEnsName] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const isENSSupported = isENSAvailable(networkConfig.chainId)

    useEffect(() => {
        if (!address || !isENSSupported) {
            setEnsName(null)
            setIsLoading(false)
            return
        }

        let mounted = true
        setIsLoading(true)

        async function fetchENS() {
            const name = await lookupENSName(address!, networkConfig.chainId)
            if (mounted) {
                setEnsName(name)
                setIsLoading(false)
            }
        }

        fetchENS()

        return () => {
            mounted = false
        }
    }, [address, networkConfig.chainId, isENSSupported])

    return { ensName, isLoading, isENSSupported }
}
