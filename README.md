# SecureProof - Document Verification dApp

A production-ready decentralized application for blockchain-based document verification with cryptographic signatures and IPFS storage.

## Features

- **Multi-Network Support**: Switch between Anvil Local and Sepolia Testnet
- **IPFS Integration**: Document storage via Pinata with CID tracking
- **HD Wallet Management**: 20 BIP-44 derived wallets per network
- **ENS Resolution**: Forward/reverse ENS name lookup on Sepolia/Mainnet
- **Document Operations**: Upload, sign, verify, and view document history
- **Real-time Verification**: On-chain signature validation with blockchain timestamps
- **PDF Preview**: Built-in PDF viewer with zoom and page navigation

## ⚠️ Security Notice

**IMPORTANT:** This project is designed for **educational purposes and portfolio demonstration**.

### Mnemonic Configuration
- **Anvil Local**: Uses test mnemonic `"test test test test..."` (safe, no real funds)
- **Sepolia Testnet**: Should use MetaMask wallet connection (user-controlled keys)

### Never Do This:
- ❌ Configure real mnemonics with funds in `.env.local`
- ❌ Deploy to production with embedded mnemonics
- ❌ Share mnemonics in documentation or code comments
- ❌ Commit `.env` or `.env.local` files to version control

### For Production Use:
This application would need to be refactored to use **MetaMask** or **WalletConnect** instead of embedded mnemonics. The current HD wallet derivation approach is suitable only for local development and testing.

## Tech Stack

**Smart Contract**
- Solidity 0.8.20 (via_ir optimizer, 200 runs)
- Foundry (Forge, Anvil)
- OpenZeppelin Contracts

**Frontend**
- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Ethers.js v6
- React Query (TanStack)
- PDF.js + Pinata SDK

**Blockchain**
- Ethereum (Anvil Local, Sepolia Testnet)
- IPFS (Pinata)

## Prerequisites

  ### Required
  - Node.js 18+ and npm
  - Foundry ([installation guide](https://book.getfoundry.sh/getting-started/installation))
  - Git
  - MetaMask or compatible Ethereum wallet

  ### Optional - For Sepolia Testnet Deployment
  - **Sepolia Test ETH**: Get free test ETH from:
    - [Google Cloude web3 ](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
  - **Etherscan API Key**: For contract verification - [Get free API key](https://etherscan.io/myapikey)

  ### Optional - For IPFS Storage
  - **Pinata Account**: [Sign up](https://pinata.cloud/) and generate JWT token

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd documentSignStorage
```

### 2. Install Dependencies

```bash
# Smart contract dependencies
cd sc
forge install

# Frontend dependencies
cd ../dapp
npm install
```

### 3. Configure Environment

**Frontend** (`dapp/.env.local`):

```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local with your values:
# - Update contract address after deployment
# - Add your Sepolia mnemonic if using testnet
# - Add Pinata JWT if using IPFS storage

```

**Smart Contract Sepolia** (`sc/.env` - optional):

```bash
cp .env.sepolia.example .env
```

### 4. Build and Test Smart Contract

```bash
cd sc

# Compile contracts
forge build

# Run all tests (should see ✓ [PASS] for all tests)
forge test

# Optional: View detailed test results
forge test -vvv

# Optional: Check gas costs
forge test --gas-report
```

**Expected output:** All tests should pass (green checkmarks).

### 5. Deploy Smart Contract

**Option A: Anvil Local**

```bash
# Terminal 1: Start Anvil
cd sc
anvil

# Terminal 2: Deploy contract
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Option B: Sepolia Testnet**

```bash
cd sc

# Deploy using MNEMONIC from .env (account index 1)
source .env
forge script script/Deploy.s.sol \
   --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
   --broadcast \
   --mnemonics "$MNEMONIC" \
   --mnemonic-indexes 1   
```

**Note:**
- Foundry reads `MNEMONIC` automatically from `sc/.env`
- `--mnemonic-index 1` uses the second account (index 1) from the mnemonic
- `--verify` uses `ETHERSCAN_API_KEY` from `sc/.env` to verify on Etherscan

Copy the deployed contract address to `dapp/.env.local`.

### 6. Run Frontend

```bash
cd dapp
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
documentSignStorage/
├── sc/                          # Smart contracts (Foundry)
│   ├── src/
│   │   └── DocumentRegistry.sol # Main contract
│   ├── script/
│   │   ├── Deploy.s.sol         # Deployment script
│   │   └── RegisterENS.s.sol    # ENS registration
│   ├── test/
│   │   └── DocumentRegistry.t.sol
│   └── foundry.toml
├── dapp/                        # Next.js frontend
│   ├── app/                     # App Router pages
│   ├── components/              # React components
│   │   ├── DocumentSigner.tsx
│   │   ├── DocumentVerifier.tsx
│   │   ├── DocumentHistory.tsx
│   │   ├── PDFViewer.tsx
│   │   └── ...
│   ├── contexts/                # Global state
│   │   ├── MetaMaskContext.tsx  # Wallet management
│   │   └── NetworkContext.tsx   # Network config
│   ├── hooks/                   # Custom hooks
│   │   ├── useContract.ts       # Contract interaction
│   │   ├── useENS.ts            # ENS resolution
│   │   └── usePDFViewer.ts
│   ├── config/
│   │   └── networks.ts          # Network configs
│   └── utils/
│       ├── hash.ts              # Document hashing
│       ├── ipfs.ts              # IPFS operations
│       └── ens.ts               # ENS utilities
└── docs/                        # Additional documentation
```

## Configuration

### Network Settings

Networks are configured in `dapp/config/networks.ts`:

| Network | Chain ID | RPC URL | ENS Support |
|---------|----------|---------|-------------|
| Anvil Local | 31337 | http://localhost:8545 | No |
| Sepolia Testnet | 11155111 | https://rpc.sepolia.org | Yes |

Switch networks using the NetworkSelector component in the UI.

### HD Wallet Derivation

- **Standard**: BIP-44 path `m/44'/60'/0'/0/{index}`
- **Wallets**: 20 wallets derived per network (configurable in `MetaMaskContext.tsx`)
- **Network-specific**: Separate mnemonics for Anvil and Sepolia

## Development Commands

### Smart Contract (from `sc/` directory)

| Command | Description |
|---------|-------------|
| `forge build` | Compile contracts |
| `forge test` | Run all tests |
| `forge test -vvv` | Run tests with traces |
| `forge coverage` | Generate coverage report |
| `forge test --gas-report` | Gas usage report |
| `forge fmt` | Format Solidity code |
| `anvil` | Start local blockchain |
| `forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify --mnemonic-index 1` | Deploy to Sepolia (uses MNEMONIC from .env, account index 1) |

### Frontend (from `dapp/` directory)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Lint code |

## Smart Contract API

### Main Functions

| Function | Description | Access |
|----------|-------------|--------|
| `storeDocumentHash()` | Store document hash with signature, timestamp, and IPFS CID | External |
| `verifyDocument()` | Verify document signature and signer | External |
| `getDocumentInfo()` | Retrieve complete document metadata | View |
| `getDocumentCid()` | Get IPFS CID for a document | View |
| `isDocumentStored()` | Check if document exists | View |
| `getDocumentCount()` | Total registered documents | View |
| `getDocumentHashByIndex()` | Enumerate documents by index | View |

### Events

- `DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp, bytes signature)`
- `DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid)`

### Document Structure

```solidity
struct Document {
    bytes32 hash;       // keccak256 hash of document
    uint256 timestamp;  // Registration timestamp
    address signer;     // Signer address
    bytes signature;    // Cryptographic signature
    string ipfsCid;     // IPFS Content Identifier
}
```

### ENS Registration (Sepolia)

1. **Configure** (`sc/.env.sepolia`):
   ```bash
   ENS_NAME=yourname
   ENS_SECRET=your-unique-secret-salt
   MNEMONIC="your mnemonic"
   ```

2. **Step 1 - Commitment**:
   ```bash
   forge script script/RegisterENS.s.sol:RegisterENS --rpc-url sepolia --broadcast
   ```

3. **Wait 60 seconds**

4. **Step 2 - Complete Registration**:
   ```bash
   forge script script/RegisterENS.s.sol:RegisterENS --sig 'completeRegistration()' --rpc-url sepolia --broadcast
   ```

5. **Verify**:
   ```bash
   forge script script/RegisterENS.s.sol:RegisterENS --sig 'verifyRegistration()' --rpc-url sepolia
   ```

## Troubleshooting

**Wallet Connection Issues**
- Verify mnemonic is configured in `dapp/.env.local`
- Check RPC URL is accessible
- Clear browser localStorage and reconnect

**Contract Deployment Fails**
- Ensure Anvil is running for local deployment
- Verify sufficient ETH balance for Sepolia
- Check private key/mnemonic is correct

**Transaction Failures**
- Verify contract address matches selected network
- Ensure wallet has sufficient gas
- Check transaction revert reason in block explorer

**ENS Not Resolving**
- Only works on Sepolia/Mainnet networks
- Verify ENS name is registered on correct network

## License

MIT License - See LICENSE file for details

---

For detailed technical documentation, see [CLAUDE.md](./CLAUDE.md)
