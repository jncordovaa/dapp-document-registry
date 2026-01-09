# Makefile for DocumentRegistry smart contract

.PHONY: install build test clean deploy

# Install dependencies
install:
	forge install OpenZeppelin/openzeppelin-contracts

# Build the project
build:
	forge build

# Run tests
test:
	forge test

# Run tests with coverage
coverage:
	forge coverage

# Run tests with gas reporting
test-gas:
	forge test --gas-report

# Clean build artifacts
clean:
	forge clean

# Deploy to local network
deploy-local:
	forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to Sepolia testnet
deploy-sepolia:
	forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify

# Deploy to mainnet
deploy-mainnet:
	forge script script/Deploy.s.sol --rpc-url mainnet --broadcast --verify

# Verify contract on Etherscan
verify:
	forge verify-contract --chain-id 1 --num-of-optimizations 200 --watch --etherscan-api-key ${ETHERSCAN_API_KEY} --constructor-args $(cast abi-encode "constructor()") DocumentRegistry 0xYourContractAddress

# Run all tests with detailed output
test-verbose:
	forge test -vvv

# Run specific test
test-specific:
	forge test --match-test testStoreDocument -vvv

# Gas optimization
gas-report:
	forge test --gas-report --gas-report-format markdown
