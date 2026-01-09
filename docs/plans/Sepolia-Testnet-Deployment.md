# Plan: Deployment en Sepolia Testnet

## Contexto del Proyecto

**Arquitectura actual:**
- ethers.js v6 con HD wallets (mnemonic)
- 20 wallets generadas desde mnemonic de Anvil
- NO usa extensión MetaMask (`window.ethereum`)
- Funciona en Anvil local (ChainID 31337)

**Objetivo:**
- Deploy en Sepolia testnet
- Mantener funcionalidad de Anvil local
- Selector de red en frontend para cambiar entre Anvil y Sepolia

---

## Comparación: Anvil vs Sepolia

| Característica | Anvil (local) | Sepolia (testnet) |
|----------------|---------------|-------------------|
| **Red** | Local | Pública (Internet) |
| **ChainID** | 31337 | 11155111 |
| **RPC URL** | http://localhost:8545 | https://ethereum-sepolia-rpc.publicnode.com |
| **Velocidad** | Instantáneo | ~15 segundos/tx |
| **Persistencia** | Se pierde al cerrar Anvil | Permanente |
| **Explorador** | No disponible | https://sepolia.etherscan.io |

---

## Paso 1: Obtener SepoliaETH

Necesitas SepoliaETH para pagar gas. Usa tu wallet de desarrollo con un faucet que NO requiera balance en Ethereum Mainnet. Al final utilice GCP pero si requiere que se tenga minimo 0.001 ETH en la mainnet de ETH, no Arbitrium ni ningun L2.

**Opciones sin requisitos:**
- Google Cloud Faucet
- Otros faucets públicos (buscar "Sepolia faucet no requirements")

**Objetivo:** Obtener 0.05-0.1 SepoliaETH

**Verificar balance:**
```
https://sepolia.etherscan.io/address/TU_DIRECCION
```

---

## Paso 2: Deploy del Contrato a Sepolia

### 2.1 Verificar contrato localmente

```bash
cd sc
forge build
forge test
```

### 2.2 Deploy a Sepolia

  # Muestra una dirección en base a un mnemonic():
  cast wallet address --mnemonic "$MNEMONIC"
  cast wallet address --mnemonic "$MNEMONIC" --mnemonic-index 0
  

  # Revisar si tienes fondos en tu cuenta:

  cast wallet address --mnemonic "$MNEMONIC" | xargs -I {} cast balance {} --rpc-url https://ethereum-sepolia-rpc.publicnode.com --ether
  
  cast wallet address --mnemonic "$MNEMONIC" --mnemonic-index 1 | xargs -I {} cast balance {} --rpc-url https://ethereum-sepolia-rpc.publicnode.com --ether

  Directamente en Etherscan (reemplaza con tu dirección):
  https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS

  Opción 1: Variables de Entorno (Recomendada)

  # Desde sc/

  # Exportar tu mnemonic como variable de entorno (no se guarda en archivos)
  export MNEMONIC="tus 12 palabras aquí"

  # Deploy usando la variable
  forge script script/Deploy.s.sol \
      --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
      --broadcast \
      --mnemonics "$MNEMONIC" \
      --mnemonic-indexes 1

  Ventaja: El mnemonic no queda en el historial si usas export antes. confirma que mnemonic-indexes 1 contiene la llave publica correcta tambien podría estar en el index 0 o 2.

  ---
  Opción 2: Archivo .env (Más conveniente)

  # 1. Crear archivo .env en sc/
  cd sc
  nano .env  # o usa tu editor preferido

  # sc/.env
  SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
  MNEMONIC=tus 12 palabras aquí

  # 2. Asegurar que .env está en .gitignore
  echo ".env" >> .gitignore

  # 3. Cargar variables y deployar
  source .env

  forge script script/Deploy.s.sol \
      --rpc-url $SEPOLIA_RPC_URL \
      --broadcast \
      --mnemonic "$MNEMONIC"

  ---
  Opción 3: Keystore (Más seguro para producción)

  # 1. Crear keystore encriptado (una sola vez)
  cast wallet import sepolia-dev --interactive

  # Te pedirá:
  # Enter private key: [tu private key]
  # Enter password: [contraseña segura]

  # 2. Deploy con keystore
  forge script script/Deploy.s.sol \
      --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
      --broadcast \
      --account sepolia-dev \
      --sender TU_DIRECCION

  # Te pedirá la contraseña del keystore

**Salida esperada:**
```
##### sepolia
buser@LNV01537-NB:/mnt/c/Users/buser.LNV01537-NB/Documents/Curso-Solidity/foundry/documentSignStorage/sc$ forge script script/Deploy.s.sol \
      --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
      --broadcast \
      --mnemonics "$MNEMONIC" \
      --mnemonic-indexes 1
[⠘] Compiling...
No files changed, compilation skipped
Script ran successfully.

== Logs ==
  Deploying DocumentRegistry...
  Chain ID: 11155111
  DocumentRegistry deployed at: 0x046803bAB680bC9062d398Dcda22f8218820b092

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 0.001109455 gwei

Estimated total gas used for script: 822991

Estimated amount required: 0.000000913071479905 ETH

==========================

##### sepolia
✅  [Success] Hash: 0x3a23df1e5f68d98c45c471332d079191eda4b7bc5d274b3d0a07cf91aac1f041
Contract Address: 0x046803bAB680bC9062d398Dcda22f8218820b092
Block: 9922033
Paid: 0.00000070233545484 ETH (633070 gas * 0.001109412 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.00000070233545484 ETH (633070 gas * avg 0.001109412 gwei)          
                                                                                                             
                                                                                                             
==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /mnt/c/Users/buser.LNV01537-NB/Documents/Curso-Solidity/foundry/documentSignStorage/sc/broadcast/Deploy.s.sol/11155111/run-latest.json

Sensitive values saved to: /mnt/c/Users/buser.LNV01537-NB/Documents/Curso-Solidity/foundry/documentSignStorage/sc/cache/Deploy.s.sol/11155111/run-latest.json
```

### 2.3 Verificar en Etherscan (Opcional)

# Tu contrato se desplegó en:
# 0x046803bAB680bC9062d398Dcda22f8218820b092

# Ábrelo en el navegador:
https://sepolia.etherscan.io/address/0x046803bAB680bC9062d398Dcda22f8218820b092

```bash
# Get free API key from: https://etherscan.io/myapikey
forge verify-contract <CONTRACT_ADDRESS> \
    src/DocumentRegistry.sol:DocumentRegistry \
    --chain sepolia \
    --etherscan-api-key <YOUR_ETHERSCAN_API_KEY>
```

---

## Paso 3: Configuración Multi-Red

### Actualizar dapp/.env.local

```env
# Anvil local
NEXT_PUBLIC_ANVIL_RPC_URL=http://localhost:8545
NEXT_PUBLIC_ANVIL_CHAIN_ID=31337
NEXT_PUBLIC_ANVIL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Sepolia testnet
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=TU_CONTRACT_ADDRESS_AQUI

# Mnemonic (para generar HD wallets)
NEXT_PUBLIC_MNEMONIC="tu mnemonic de 12 palabras"
```

---

## Paso 4: Implementar Selector de Red

### 4.1 Crear config/networks.ts

```typescript
// dapp/config/networks.ts

export interface NetworkConfig {
    name: string
    chainId: number
    rpcUrl: string
    contractAddress: string
    explorerUrl?: string
    isTestnet: boolean
}

export const NETWORKS: Record<string, NetworkConfig> = {
    anvil: {
        name: 'Anvil Local',
        chainId: 31337,
        rpcUrl: process.env.NEXT_PUBLIC_ANVIL_RPC_URL || 'http://localhost:8545',
        contractAddress: process.env.NEXT_PUBLIC_ANVIL_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        isTestnet: false
    },
    sepolia: {
        name: 'Sepolia Testnet',
        chainId: 11155111,
        rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
        contractAddress: process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS || '',
        explorerUrl: 'https://sepolia.etherscan.io',
        isTestnet: true
    }
}

export const getDefaultNetwork = (): string => {
    const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID
    return envChainId === '11155111' ? 'sepolia' : 'anvil'
}
```

### 4.2 Crear contexts/NetworkContext.tsx

```typescript
// dapp/contexts/NetworkContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { NETWORKS, NetworkConfig, getDefaultNetwork } from '@/config/networks'

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
```

### 4.3 Actualizar contexts/MetaMaskContext.tsx

**Cambios necesarios:**
1. Importar `useNetwork` hook
2. Eliminar `const RPC_URL = 'http://localhost:8545'`
3. Usar `networkConfig.rpcUrl` en todas las funciones

```typescript
// dapp/contexts/MetaMaskContext.tsx
'use client'

import { useNetwork } from './NetworkContext'

export function MetaMaskProvider({ children }: { children: ReactNode }) {
    const { networkConfig } = useNetwork()

    // ... estados existentes ...

    useEffect(() => {
        const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
        setProvider(jsonRpcProvider)
    }, [networkConfig.rpcUrl])

    const connect = async (walletIndex: number = 0) => {
        const wallet = ANVIL_WALLETS[walletIndex]
        const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
        // ... resto del código ...
    }

    const signMessage = async (message: string) => {
        const wallet = ANVIL_WALLETS[currentWalletIndex]
        const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
        const walletSigner = new ethers.Wallet(wallet.privateKey, jsonRpcProvider)
        return await walletSigner.signMessage(message)
    }

    const getSigner = async () => {
        const wallet = ANVIL_WALLETS[currentWalletIndex]
        const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl)
        return new ethers.Wallet(wallet.privateKey, jsonRpcProvider)
    }

    // ... resto del código ...
}
```

**IMPORTANTE:** `MetaMaskProvider` debe estar dentro de `NetworkProvider`.

### 4.4 Actualizar hooks/useContract.ts

```typescript
// dapp/hooks/useContract.ts
import { useNetwork } from '@/contexts/NetworkContext'

export function useContract() {
    const { networkConfig } = useNetwork()

    const getProvider = () => {
        return new ethers.JsonRpcProvider(networkConfig.rpcUrl)
    }

    const getContract = () => {
        const provider = getProvider()
        return new ethers.Contract(
            networkConfig.contractAddress,
            DocumentRegistryABI,
            provider
        )
    }

    // ... resto de funciones ...
}
```

### 4.5 Crear components/NetworkSelector.tsx

```typescript
// dapp/components/NetworkSelector.tsx
'use client'

import { useNetwork } from '@/contexts/NetworkContext'
import { ChevronDown, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

export function NetworkSelector() {
    const { currentNetwork, networkConfig, switchNetwork, availableNetworks } = useNetwork()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
                {networkConfig.isTestnet ? (
                    <Wifi className="w-4 h-4 text-blue-500" />
                ) : (
                    <WifiOff className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {networkConfig.name}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select Network</h3>
                    </div>
                    <div className="p-2">
                        {Object.entries(availableNetworks).map(([key, network]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    switchNetwork(key)
                                    setIsOpen(false)
                                }}
                                className={`w-full text-left px-3 py-3 rounded-md mb-1 transition-colors ${
                                    currentNetwork === key
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {network.isTestnet ? (
                                            <Wifi className="w-4 h-4 text-blue-500" />
                                        ) : (
                                            <WifiOff className="w-4 h-4 text-gray-500" />
                                        )}
                                        <div>
                                            <div className="text-sm font-medium">{network.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                ChainID: {network.chainId}
                                            </div>
                                        </div>
                                    </div>
                                    {currentNetwork === key && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <div className="flex justify-between">
                                <span>RPC:</span>
                                <span className="font-mono">{networkConfig.rpcUrl.substring(0, 25)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Contract:</span>
                                <span className="font-mono">
                                    {networkConfig.contractAddress.substring(0, 6)}...
                                    {networkConfig.contractAddress.substring(38)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
```

### 4.6 Integrar en app/page.tsx

```typescript
// dapp/app/page.tsx
import { NetworkSelector } from '@/components/NetworkSelector'

export default function Home() {
    return (
        <div className="min-h-screen">
            <header className="...">
                <div className="flex items-center justify-between">
                    <div>{/* Logo */}</div>
                    <div className="flex items-center space-x-4">
                        <NetworkSelector />
                        <ThemeToggle />
                        {/* Wallet connection */}
                    </div>
                </div>
            </header>
            {/* ... resto del contenido ... */}
        </div>
    )
}
```

### 4.7 Actualizar app/providers.tsx

```typescript
// dapp/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { NetworkProvider } from '@/contexts/NetworkContext'
import { MetaMaskProvider } from '@/contexts/MetaMaskContext'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <NetworkProvider>
                    <MetaMaskProvider>
                        {children}
                    </MetaMaskProvider>
                </NetworkProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
```

**Orden crítico:** `ThemeProvider` → `NetworkProvider` → `MetaMaskProvider`

---

## Paso 5: Testing

### 5.1 Iniciar dApp

```bash
cd dapp
npm install
npm run dev
```

### 5.2 Testing en Sepolia

**Test 1: Upload & Sign**
1. Cambiar a red Sepolia (selector de red)
2. Conectar wallet (la que tiene SepoliaETH)
3. Upload & Sign tab
4. Subir archivo
5. Sign Document
6. Esperar ~15 segundos
7. Verificar transacción en Etherscan

**Test 2: Verify Document**
1. Tab Verify
2. Subir mismo archivo
3. Ingresar dirección de la wallet
4. Click Verify
5. Confirmar verificación exitosa

**Test 3: Cambiar entre redes**
1. Firmar documento en Sepolia
2. Cambiar a Anvil Local (selector)
3. Firmar otro documento en Anvil
4. Volver a Sepolia
5. Verificar persistencia de datos en Sepolia

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| **"Insufficient funds"** | Wallet no tiene SepoliaETH suficiente |
| **"Network mismatch"** | Verificar selector de red y .env.local |
| **Selector no aparece** | Verificar NetworkProvider en providers.tsx |
| **"Hook error: useNetwork"** | NetworkProvider debe envolver MetaMaskProvider |
| **Transacciones lentas en Sepolia** | Normal, esperar ~15 segundos |
