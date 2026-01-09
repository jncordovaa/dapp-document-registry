# Broadcast Deployment Logs

This directory contains Foundry broadcast logs generated during contract deployments.

## Security Notice

⚠️ **Broadcast files contain sensitive information:**
- Wallet addresses used for deployment
- Transaction hashes
- Contract addresses
- Network details (RPC URLs, chain IDs)

## .gitignore Configuration

The following directories are **excluded from version control**:

```
sc/broadcast/*/31337/      # Anvil local deployments
sc/broadcast/*/11155111/   # Sepolia testnet deployments
sc/broadcast/**/dry-run/   # Dry-run simulations
```

## What Gets Committed

Only the directory structure is tracked in git. **No actual deployment files** are committed to prevent:
- Exposing wallet addresses publicly
- Linking your GitHub identity to on-chain addresses
- Privacy concerns with transaction history

## For Deployment Records

If you need to keep deployment records:
1. Store them **locally only** (ignored by git)
2. Use secure backup solutions (encrypted storage)
3. Never commit real deployment files to public repositories

## Example Structure

```
sc/broadcast/
├── Deploy.s.sol/
│   ├── 31337/           # Ignored (Anvil)
│   └── 11155111/        # Ignored (Sepolia)
├── RegisterENS.s.sol/
│   └── 11155111/        # Ignored (Sepolia)
└── README.md            # This file (tracked)
```
