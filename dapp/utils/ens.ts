import { ethers } from 'ethers'
import { NETWORKS } from '../config/networks'

// Cache para evitar llamadas repetidas
const ensCache = new Map<string, string | null>()
const addressCache = new Map<string, string | null>()

// Redes que soportan ENS
const ENS_SUPPORTED_CHAINS = [1, 11155111] // Mainnet, Sepolia

/**
 * Obtiene provider para resolución ENS según la red
 */
function getENSProvider(chainId: number): ethers.JsonRpcProvider | null {
    if (!ENS_SUPPORTED_CHAINS.includes(chainId)) {
        return null
    }

    if (chainId === 11155111) {
        const rpcUrl = NETWORKS.sepolia?.rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com'
        return new ethers.JsonRpcProvider(rpcUrl)
    }

    if (chainId === 1) {
        const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com'
        return new ethers.JsonRpcProvider(rpcUrl)
    }

    return null
}

/**
 * Resuelve nombre ENS a dirección (forward resolution)
 * @param nameOrAddress - Nombre ENS (alice.eth) o dirección (0x...)
 * @param chainId - ID de la red actual
 * @returns Dirección Ethereum o null
 */
export async function resolveENSName(
    nameOrAddress: string,
    chainId: number
): Promise<string | null> {
    // Validate input
    if (!nameOrAddress || typeof nameOrAddress !== 'string') {
        return null
    }

    // Si ya es dirección válida, retornarla
    if (ethers.isAddress(nameOrAddress)) {
        return nameOrAddress
    }

    // Type assertion to bypass ethers.js type narrowing issue
    const inputString = nameOrAddress as string

    // Si no termina en .eth, no es ENS
    if (!inputString.endsWith('.eth')) {
        return null
    }

    // Check cache
    const cacheKey = `${chainId}:${inputString}`
    if (addressCache.has(cacheKey)) {
        return addressCache.get(cacheKey)!
    }

    const provider = getENSProvider(chainId)
    if (!provider) {
        console.warn('ENS not available on chainId:', chainId)
        return null
    }

    try {
        const address = await provider.resolveName(inputString)
        addressCache.set(cacheKey, address)
        return address
    } catch (error) {
        console.error('ENS resolution failed:', error)
        addressCache.set(cacheKey, null)
        return null
    }
}

/**
 * Busca nombre ENS de una dirección (reverse resolution)
 * @param address - Dirección Ethereum
 * @param chainId - ID de la red actual
 * @returns Nombre ENS o null
 */
export async function lookupENSName(
    address: string,
    chainId: number
): Promise<string | null> {
    if (!ethers.isAddress(address)) {
        return null
    }

    // Check cache
    const cacheKey = `${chainId}:${address}`
    if (ensCache.has(cacheKey)) {
        return ensCache.get(cacheKey)!
    }

    const provider = getENSProvider(chainId)
    if (!provider) {
        return null
    }

    try {
        const name = await provider.lookupAddress(address)
        ensCache.set(cacheKey, name)
        return name
    } catch (error) {
        console.error('ENS lookup failed:', error)
        ensCache.set(cacheKey, null)
        return null
    }
}

/**
 * Verifica si ENS está disponible en la red
 */
export function isENSAvailable(chainId: number): boolean {
    return ENS_SUPPORTED_CHAINS.includes(chainId)
}

/**
 * Formatea dirección para display
 */
export function formatAddress(address: string): string {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Limpia cache (útil para testing)
 */
export function clearENSCache(): void {
    ensCache.clear()
    addressCache.clear()
}
