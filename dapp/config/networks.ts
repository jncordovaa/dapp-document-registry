export interface NetworkConfig {
    name: string
    chainId: number
    rpcUrl: string
    contractAddress: string
    mnemonic: string
    explorerUrl?: string
    isTestnet: boolean
    supportsENS: boolean
}

export const NETWORKS: Record<string, NetworkConfig> = {
    anvil: {
        name: 'Anvil Local',
        chainId: 31337,
        rpcUrl: process.env.NEXT_PUBLIC_ANVIL_RPC_URL || 'http://localhost:8545',
        contractAddress: process.env.NEXT_PUBLIC_ANVIL_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        mnemonic: process.env.NEXT_PUBLIC_ANVIL_MNEMONIC || 'test test test test test test test test test test test junk',
        isTestnet: false,
        supportsENS: false
    },
    sepolia: {
        name: 'Sepolia Testnet',
        chainId: 11155111,
        rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
        contractAddress: process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS || '',
        mnemonic: process.env.NEXT_PUBLIC_SEPOLIA_MNEMONIC || '',
        explorerUrl: 'https://sepolia.etherscan.io',
        isTestnet: true,
        supportsENS: true
    }
}

export const getDefaultNetwork = (): string => {
    return 'anvil'
}
