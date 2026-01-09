# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-ready decentralized document verification dApp with blockchain-based signing and verification capabilities.

**Core Components:**
- **Smart Contract** (`sc/`): Foundry-based Solidity contract for document hash storage with cryptographic signatures
- **Frontend dApp** (`dapp/`): Next.js 14 application with multi-network support, dark mode, and ENS integration

**Key Features:**
- Multi-network support (Anvil Local, Sepolia Testnet)
- ENS name resolution (Sepolia/Mainnet)
- Dark/Light theme toggle
- HD wallet derivation (BIP-44) with 20 wallet support
- Document hash verification with signature validation
- Real-time network switching

## Architecture

### Smart Contract (`sc/src/DocumentRegistry.sol`)

**Contract Structure:**
```solidity
struct Document {
    bytes32 hash;        // Document hash (keccak256)
    uint256 timestamp;   // Registration timestamp
    address signer;      // Signer address (used for existence check)
    bytes signature;     // Cryptographic signature
}
```

**Key Functions:**
- `storeDocumentHash()`: Store document with signature and timestamp validation
- `verifyDocument()`: Verify document authenticity by comparing stored signature and signer
- `getDocumentInfo()`: Retrieve complete document metadata
- `isDocumentStored()`: Check document existence (signer != address(0))
- `getDocumentCount()`: Total registered documents
- `getDocumentHashByIndex()`: Enumerate documents

**Compiler Configuration:**
- Solidity 0.8.20
- Optimizer: Enabled (200 runs, via_ir)
- Events: `DocumentStored`, `DocumentVerified`

**Security Features:**
- Timestamp validation (must be > 0 and <= block.timestamp)
- Signature length validation (1-2048 bytes)
- Existence checks via modifiers

### Frontend Structure

```
dapp/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # Main application page with tabs
│   ├── providers.tsx             # Global providers wrapper
│   └── layout.tsx                # Root layout with metadata
├── components/
│   ├── FileUploader.tsx          # File upload + hash calculation
│   ├── DocumentSigner.tsx        # Document signing UI
│   ├── DocumentVerifier.tsx      # Verification interface
│   ├── DocumentHistory.tsx       # Document list viewer
│   ├── ThemeToggle.tsx           # Dark/Light mode switcher
│   ├── NetworkSelector.tsx       # Multi-network selector
│   ├── AddressDisplay.tsx        # ENS-aware address display
│   └── ConfirmDialog.tsx         # Confirmation modal
├── contexts/
│   ├── MetaMaskContext.tsx       # Wallet state + HD derivation
│   └── NetworkContext.tsx        # Network configuration manager
├── hooks/
│   ├── useContract.ts            # Contract interaction hook
│   ├── useFileHash.ts            # File hashing utilities
│   ├── useMetaMask.ts            # Re-exports MetaMaskContext
│   └── useENS.ts                 # ENS resolution hook
├── config/
│   └── networks.ts               # Network configurations
└── utils/
    ├── ethers.ts                 # Ethers.js utilities
    ├── hash.ts                   # Hashing functions
    └── ens.ts                    # ENS resolution utilities
```

### Multi-Network Support

**Network Configuration** (`dapp/config/networks.ts`):
```typescript
export interface NetworkConfig {
    name: string              // Display name
    chainId: number          // Chain ID (31337, 11155111)
    rpcUrl: string           // RPC endpoint
    contractAddress: string  // Deployed contract address
    mnemonic: string         // HD wallet seed phrase
    explorerUrl?: string     // Block explorer URL
    isTestnet: boolean       // Testnet flag
    supportsENS: boolean     // ENS availability
}
```

**Supported Networks:**
- **Anvil Local** (chainId: 31337): Local development with Foundry
- **Sepolia Testnet** (chainId: 11155111): Ethereum testnet with ENS support

**Network Switching:**
- User-selectable via NetworkSelector component
- Persisted in localStorage
- Auto-reconnects wallet on network change
- NetworkContext provides global network state

### Wallet Management

**HD Wallet Derivation:**
- BIP-44 standard path: `m/44'/60'/0'/0/{index}`
- Derives 20 wallets from mnemonic (configurable in MetaMaskContext.tsx:8)
- Network-specific mnemonics (separate for Anvil and Sepolia)
- Wallet switching without re-connection

**Wallet Context** (`MetaMaskContext.tsx`):
```typescript
{
  account: string | null           // Current connected address
  isConnected: boolean             // Connection status
  provider: JsonRpcProvider | null // Ethers.js provider
  currentWalletIndex: number       // Active wallet index (0-19)
  availableWallets: WalletInfo[]   // All 20 derived wallets
  connect(walletIndex?: number)    // Connect specific wallet
  switchWallet(walletIndex)        // Switch between wallets
  signMessage(message)             // Sign arbitrary message
  getSigner()                      // Get ethers Wallet signer
}
```

### ENS Integration

**ENS Support:**
- Forward resolution: name.eth -> 0x address
- Reverse resolution: 0x address -> name.eth
- Supported chains: Mainnet (1), Sepolia (11155111)
- Caching for performance
- Graceful degradation on unsupported networks

**ENS Utilities** (`utils/ens.ts`):
- `resolveENSName()`: Resolve ENS to address
- `lookupENSName()`: Reverse lookup (address to ENS)
- `isENSAvailable()`: Check network ENS support
- `formatAddress()`: Address shortening utility

**AddressDisplay Component:**
- Shows ENS names when available
- Fallback to truncated address (0x1234...5678)
- Copy to clipboard functionality
- Explorer link generation
- Loading states

### Theme System

**Dark Mode Implementation:**
- `next-themes` library integration
- System preference detection
- Class-based theme switching
- Smooth transitions
- Persistent preference (localStorage)

**Theme Configuration:**
- Tailwind CSS dark mode classes
- Global theme provider in `app/providers.tsx`
- ThemeToggle component with animated icons

## Development Commands

### Smart Contract (run from `sc/` directory)

```bash
# Compile contracts
forge build

# Run all tests
forge test

# Run specific test with verbosity
forge test --match-test testStoreDocument -vvv

# Test coverage report
forge coverage

# Gas report
forge test --gas-report

# Format Solidity code
forge fmt

# Start local Anvil node
anvil

# Deploy to Anvil Local
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy to Sepolia Testnet
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify

# ENS Registration (Sepolia) - Step 1: Commitment
forge script script/RegisterENS.s.sol:RegisterENS --rpc-url sepolia --broadcast

# ENS Registration (Sepolia) - Step 2: Complete (wait 60s after step 1)
forge script script/RegisterENS.s.sol:RegisterENS --sig 'completeRegistration()' --rpc-url sepolia --broadcast

# ENS Verification
forge script script/RegisterENS.s.sol:RegisterENS --sig 'verifyRegistration()' --rpc-url sepolia
```

### Frontend (run from `dapp/` directory)

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Test coverage
npm run test:coverage

# Lint code
npm run lint
```

## Environment Setup

### Smart Contract Environment (`sc/.env`)

**For Anvil Local:**
```bash
# Anvil uses default test mnemonic, no .env needed
```

**For Sepolia Testnet** (`sc/.env` or `sc/.env.sepolia`):
```bash
# Deployment account
MNEMONIC="your twelve word mnemonic phrase here"
MNEMONIC_INDEX=0  # Account index (0 = first account)

# Optional: Direct private key (less secure)
# PRIVATE_KEY=0xabc123...

# Etherscan verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Sepolia RPC (optional, has defaults)
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

**For ENS Registration** (`sc/.env.sepolia`):
```bash
# Required
ENS_NAME=alice  # Name without .eth suffix
ENS_SECRET=my-unique-secret-salt-12345-change-this

# Account credentials (same as above)
MNEMONIC="your twelve word mnemonic phrase here"
MNEMONIC_INDEX=0
```

### Frontend Environment (`dapp/.env.local`)

```bash
# Anvil Local Network
NEXT_PUBLIC_ANVIL_RPC_URL=http://localhost:8545
NEXT_PUBLIC_ANVIL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_ANVIL_MNEMONIC="test test test test test test test test test test test junk"

# Sepolia Testnet Network
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=0x...  # Your deployed contract
NEXT_PUBLIC_SEPOLIA_MNEMONIC="your twelve word mnemonic for sepolia"

# Optional: Mainnet RPC for ENS resolution
NEXT_PUBLIC_MAINNET_RPC_URL=https://eth.llamarpc.com
```

**Important Security Notes:**
- Never commit `.env` or `.env.local` files to git
- Use test mnemonics only for Anvil/Sepolia
- For mainnet, use hardware wallets or secure key management
- Rotate secrets if accidentally exposed

## Foundry Profiles

**Available Profiles:**

| Profile | Optimizer | Fuzz Runs | Invariant | Use Case |
|---------|-----------|-----------|-----------|----------|
| `default` | On (200 runs) | 1000 | - | Standard development |
| `ci` | On (200 runs) | 10000 | 1000 runs, depth 20 | CI/CD pipelines |
| `lite` | Off | 10 | 10 runs, depth 5 | Quick testing |

**Usage:**
```bash
FOUNDRY_PROFILE=ci forge test      # Use CI profile
FOUNDRY_PROFILE=lite forge build   # Use lite profile
```

## Key Integration Patterns

### 1. Contract Interaction Pattern

```typescript
// Get signer from MetaMaskContext
const { getSigner, account } = useMetaMask()
const { networkConfig } = useNetwork()

// Create contract instance
const signer = await getSigner()
const contract = new ethers.Contract(
    networkConfig.contractAddress,
    CONTRACT_ABI,
    signer
)

// Execute transaction
const tx = await contract.storeDocumentHash(hash, timestamp, signature, account)
await tx.wait()
```

### 2. Network Switching Pattern

```typescript
// In component
const { currentNetwork, switchNetwork, networkConfig } = useNetwork()

// Switch network (disconnects wallet automatically)
switchNetwork('sepolia')

// Access network-specific config
const contractAddress = networkConfig.contractAddress
```

### 3. ENS Resolution Pattern

```typescript
// In component
const { ensName, isLoading, isENSSupported } = useENS(address)

// Display ENS name or fallback to address
<span>{ensName || formatAddress(address)}</span>
```

### 4. HD Wallet Derivation

```typescript
// MetaMaskContext derives wallets automatically
function deriveWallets(mnemonic: string, count: number = 20) {
  return Array.from({ length: count }, (_, i) => {
    const path = `m/44'/60'/0'/0/${i}`
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path)
    return { address: wallet.address, privateKey: wallet.privateKey, index: i }
  })
}
```

## RPC Endpoints Configuration

**Configured in `foundry.toml`:**
```toml
[rpc_endpoints]
mainnet = "https://eth.llamarpc.com"
sepolia = "https://sepolia.gateway.tenderly.co"
polygon = "https://polygon.llamarpc.com"
arbitrum = "https://arb1.arbitrum.io/rpc"
```

**Usage in scripts:**
```bash
forge script script/Deploy.s.sol --rpc-url mainnet --broadcast
```

## Deployment Workflow

### Local Development (Anvil)

1. **Start Anvil:**
   ```bash
   cd sc && anvil
   ```

2. **Deploy Contract:**
   ```bash
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

3. **Copy contract address to `dapp/.env.local`:**
   ```bash
   NEXT_PUBLIC_ANVIL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

4. **Start frontend:**
   ```bash
   cd dapp && npm run dev
   ```

### Sepolia Testnet Deployment

1. **Configure environment** (`sc/.env`):
   ```bash
   MNEMONIC="your twelve word mnemonic"
   ETHERSCAN_API_KEY=your_api_key
   ```

2. **Deploy and verify:**
   ```bash
   cd sc
   forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
   ```

3. **Update frontend config** (`dapp/.env.local`):
   ```bash
   NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS=0x...  # Deployed address
   ```

4. **Switch network in UI:**
   - Open dApp
   - Click NetworkSelector
   - Select "Sepolia Testnet"

## Testing Strategy

### Smart Contract Tests

**Test Structure** (`sc/test/DocumentRegistry.t.sol`):
- Unit tests for all public functions
- Edge case coverage (zero addresses, invalid timestamps)
- Event emission verification
- Gas optimization tests
- Fuzz testing for signature validation

**Run tests:**
```bash
cd sc

# All tests
forge test

# Specific test with traces
forge test --match-test testStoreDocument -vvv

# Coverage report
forge coverage

# Gas report
forge test --gas-report
```

### Frontend Tests

**Test Files:**
- Component tests (Jest + React Testing Library)
- Integration tests
- Hook tests

**Run tests:**
```bash
cd dapp

# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Common Tasks

### Add New Network

1. **Update `dapp/config/networks.ts`:**
   ```typescript
   polygon: {
       name: 'Polygon',
       chainId: 137,
       rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || '...',
       contractAddress: process.env.NEXT_PUBLIC_POLYGON_CONTRACT_ADDRESS || '',
       mnemonic: process.env.NEXT_PUBLIC_POLYGON_MNEMONIC || '',
       explorerUrl: 'https://polygonscan.com',
       isTestnet: false,
       supportsENS: false
   }
   ```

2. **Add environment variables to `dapp/.env.local`**

3. **Deploy contract to new network**

4. **Update NetworkSelector component if needed**

### Register ENS Name (Sepolia)

1. **Configure `sc/.env.sepolia`:**
   ```bash
   ENS_NAME=alice
   ENS_SECRET=my-random-secret-12345
   MNEMONIC="your mnemonic"
   ```

2. **Step 1 - Commitment:**
   ```bash
   forge script script/RegisterENS.s.sol:RegisterENS --rpc-url sepolia --broadcast
   ```

3. **Wait 60 seconds**

4. **Step 2 - Registration:**
   ```bash
   forge script script/RegisterENS.s.sol:RegisterENS --sig 'completeRegistration()' --rpc-url sepolia --broadcast
   ```

5. **Verify:**
   ```bash
   forge script script/RegisterENS.s.sol:RegisterENS --sig 'verifyRegistration()' --rpc-url sepolia
   ```

### Update Contract ABI in Frontend

After modifying the smart contract:

1. **Rebuild contract:**
   ```bash
   cd sc && forge build
   ```

2. **Update ABI in `dapp/hooks/useContract.ts`:**
   ```typescript
   const CONTRACT_ABI = [
       "function newFunction() external",
       // ... other functions
   ]
   ```

3. **Update TypeScript types if needed**

## Dependencies

### Smart Contract
- `forge-std`: Foundry testing utilities
- `openzeppelin-contracts`: Standard contract implementations

### Frontend
- `next`: 14.0.4 (App Router)
- `react`: ^18
- `ethers`: ^6.8.1 (Blockchain interaction)
- `@tanstack/react-query`: ^5.8.4 (Async state management)
- `next-themes`: ^0.2.1 (Theme system)
- `lucide-react`: ^0.294.0 (Icons)
- `tailwindcss`: ^3.3.0 (Styling)

## Troubleshooting

### Contract Deployment Fails
- Check Anvil is running for local deployment
- Verify sufficient ETH balance for Sepolia
- Ensure correct RPC URL in environment variables
- Check private key/mnemonic is correct

### Wallet Connection Issues
- Verify mnemonic is configured in `.env.local`
- Check RPC URL is accessible
- Ensure network configuration matches deployed contract
- Clear browser localStorage and reconnect

### ENS Not Resolving
- Verify network supports ENS (Sepolia/Mainnet only)
- Check Sepolia RPC URL is correct
- Ensure ENS name is registered on correct network
- Clear ENS cache: `clearENSCache()` in browser console

### Transaction Failures
- Check contract address is correct for selected network
- Verify wallet has sufficient gas
- Ensure parameters match contract requirements
- Review transaction revert reason in explorer

## File References

**Key Smart Contract Files:**
- `sc/src/DocumentRegistry.sol` - Main contract
- `sc/script/Deploy.s.sol` - Deployment script
- `sc/script/RegisterENS.s.sol` - ENS registration script (multi-network)
- `sc/test/DocumentRegistry.t.sol` - Contract tests

**Key Frontend Files:**
- `dapp/app/page.tsx` - Main application UI
- `dapp/contexts/MetaMaskContext.tsx` - Wallet state management
- `dapp/contexts/NetworkContext.tsx` - Network configuration
- `dapp/hooks/useContract.ts` - Contract interaction
- `dapp/config/networks.ts` - Network configurations
- `dapp/utils/ens.ts` - ENS resolution utilities

**Configuration Files:**
- `sc/foundry.toml` - Foundry configuration
- `dapp/next.config.js` - Next.js configuration
- `dapp/tailwind.config.js` - Tailwind CSS configuration
- `dapp/tsconfig.json` - TypeScript configuration
