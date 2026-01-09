import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useMetaMask } from './useMetaMask'
import { useNetwork } from '../contexts/NetworkContext'

// ABI del contrato DocumentRegistry (updated with IPFS support)
const CONTRACT_ABI = [
  "function storeDocumentHash(bytes32 _hash, uint256 _timestamp, bytes memory _signature, address _signer, string memory _ipfsCid) external",
  "function verifyDocument(bytes32 _hash, address _signer, bytes memory _signature) external returns (bool)",
  "function getDocumentInfo(bytes32 _hash) external view returns (tuple(bytes32 hash, uint256 timestamp, address signer, bytes signature, string ipfsCid))",
  "function getDocumentSignature(bytes32 _hash) external view returns (bytes memory)",
  "function getDocumentCid(bytes32 _hash) external view returns (string memory)",
  "function isDocumentStored(bytes32 _hash) external view returns (bool)",
  "function getDocumentCount() external view returns (uint256)",
  "function getDocumentHashByIndex(uint256 _index) external view returns (bytes32)",
  "event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp, bytes signature, string ipfsCid)",
  "event DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid)"
]

// Tipo para el contrato (updated with IPFS support)
type DocumentRegistryContract = ethers.Contract & {
  storeDocumentHash: (hash: string, timestamp: number, signature: string, signer: string, ipfsCid: string) => Promise<ethers.TransactionResponse>
  verifyDocument: (hash: string, signer: string, signature: string) => Promise<boolean>
  getDocumentInfo: (hash: string) => Promise<{
    hash: string
    timestamp: bigint
    signer: string
    signature: string
    ipfsCid: string
  }>
  getDocumentSignature: (hash: string) => Promise<string>
  getDocumentCid: (hash: string) => Promise<string>
  isDocumentStored: (hash: string) => Promise<boolean>
  getDocumentCount: () => Promise<bigint>
  getDocumentHashByIndex: (index: number) => Promise<string>
}

export function useContract() {
  const { provider, account, isConnected, getSigner } = useMetaMask()
  const { networkConfig } = useNetwork()
  const [contract, setContract] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contractAddress = networkConfig.contractAddress
  console.log('Contract address:', contractAddress)
  console.log('Network:', networkConfig.name)
  console.log('Provider:', provider)
  console.log('Is connected:', isConnected)
  console.log('Account:', account)

  useEffect(() => {
    if (provider && contractAddress) {
      try {
        console.log('Creating contract instance for network:', networkConfig.name)
        console.log('Contract address:', contractAddress)
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider)
        setContract(contract)
      } catch (error: any) {
        setError(error.message || 'Failed to create contract instance')
      }
    }
  }, [provider, contractAddress, networkConfig.name])

  const storeDocumentHash = async (
    hash: string,
    timestamp: number,
    signature: string,
    signerAddress: string,
    ipfsCid: string = ''
  ) => {
    if (!contract || !isConnected || !account) {
      setError('Contract not loaded or wallet not connected.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const signer = await getSigner()
      const contractWithSigner = contract.connect(signer)
      console.log('Contract with signer:', contractWithSigner)
      console.log('Storing with IPFS CID:', ipfsCid || '(empty)')

      // Call contract with 5 parameters including IPFS CID
      const tx = await contractWithSigner.storeDocumentHash(
        hash,
        timestamp,
        signature,
        signerAddress,
        ipfsCid
      )
      await tx.wait()

      return tx.hash
    } catch (err: any) {
      setError(err.message || 'Failed to store document hash.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const verifyDocument = async (hash: string, signer: string, signature: string) => {
    if (!contract) {
      setError('Contract not loaded.')
      return false
    }
    setIsLoading(true)
    setError(null)
    try {
      const isValid = await contract.verifyDocument(hash, signer, signature)
      return isValid
    } catch (err: any) {
      setError(err.message || 'Failed to verify document.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentInfo = async (hash: string) => {
    if (!contract) {
      setError('Contract not loaded.')
      return null
    }
    setIsLoading(true)
    setError(null)
    try {
      const info = await contract.getDocumentInfo(hash)
      return {
        hash: info.hash,
        timestamp: Number(info.timestamp),
        signer: info.signer,
        signature: info.signature,
        ipfsCid: info.ipfsCid || '', // Include IPFS CID from contract
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get document info.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentCid = async (hash: string) => {
    if (!contract) {
      setError('Contract not loaded.')
      return ''
    }
    setIsLoading(true)
    setError(null)
    try {
      const cid = await contract.getDocumentCid(hash)
      return cid
    } catch (err: any) {
      setError(err.message || 'Failed to get document CID.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentSignature = async (hash: string) => {
    if (!contract) {
      setError('Contract not loaded.')
      return ''
    }
    setIsLoading(true)
    setError(null)
    try {
      const signature = await contract.getDocumentSignature(hash)
      return signature
    } catch (err: any) {
      setError(err.message || 'Failed to get document signature.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const isDocumentStored = async (hash: string) => {
    if (!contract) {
      setError('Contract not loaded.')
      return false
    }
    setIsLoading(true)
    setError(null)
    try {
      const stored = await contract.isDocumentStored(hash)
      return stored
    } catch (err: any) {
      setError(err.message || 'Failed to check if document is stored.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentCount = async () => {
    if (!contract) {
      setError('Contract not loaded.')
      return 0
    }
    setIsLoading(true)
    setError(null)
    try {
      const count = await contract.getDocumentCount()
      return Number(count)
    } catch (err: any) {
      setError(err.message || 'Failed to get document count.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentHashByIndex = async (index: number) => {
    if (!contract) {
      setError('Contract not loaded.')
      return ''
    }
    setIsLoading(true)
    setError(null)
    try {
      const hash = await contract.getDocumentHashByIndex(index)
      return hash
    } catch (err: any) {
      setError(err.message || 'Failed to get document hash by index.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    contract,
    isLoading,
    error,
    storeDocumentHash,
    verifyDocument,
    getDocumentInfo,
    getDocumentSignature,
    getDocumentCid,
    isDocumentStored,
    getDocumentCount,
    getDocumentHashByIndex,
  }
}