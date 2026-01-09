/**
 * Type definitions for the document signing stepper workflow
 */

import { StepId } from '../config/upload'

/**
 * Status of a step in the stepper
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'error'

/**
 * File data from upload step
 */
export interface FileData {
  /** The uploaded file object */
  file: File
  /** Document hash (SHA-256) - calculated in Step 2 */
  hash?: string
  /** File size in bytes */
  size: number
  /** File name */
  name: string
  /** MIME type */
  type: string
  /** Upload timestamp */
  uploadedAt: Date
}

/**
 * Signature data from signing step
 */
export interface SignatureData {
  /** Cryptographic signature */
  signature: string
  /** Timestamp when document was signed */
  timestamp: number
  /** Address of the signer */
  signerAddress: string
  /** Formatted date string */
  formattedDate: string
}

/**
 * IPFS upload progress
 */
export interface IPFSProgress {
  /** Current status */
  status: 'idle' | 'uploading' | 'success' | 'error'
  /** Upload progress percentage (0-100) */
  progress: number
  /** IPFS CID if successful */
  cid?: string
  /** Error message if failed */
  error?: string
  /** Retry attempt number */
  retryAttempt?: number
}

/**
 * Blockchain transaction progress
 */
export interface BlockchainProgress {
  /** Current status */
  status: 'idle' | 'estimating' | 'sending' | 'confirming' | 'confirmed' | 'error'
  /** Transaction hash */
  txHash?: string
  /** Number of confirmations received */
  confirmations?: number
  /** Gas estimate in wei */
  gasEstimate?: bigint
  /** Gas estimate in ETH */
  gasEstimateETH?: string
  /** Gas estimate in USD (optional) */
  gasEstimateUSD?: string
  /** Error message if failed */
  error?: string
}

/**
 * Complete blockchain data after successful storage
 */
export interface BlockchainData {
  /** Transaction hash */
  txHash: string
  /** Block number where transaction was included */
  blockNumber: number
  /** Number of confirmations */
  confirmations: number
  /** IPFS CID */
  ipfsCID: string
  /** Gas used */
  gasUsed: bigint
  /** Transaction timestamp */
  timestamp: Date
  /** Block explorer URL */
  explorerUrl: string
}

/**
 * Complete document data spanning all steps
 */
export interface DocumentData {
  /** File data from Step 1 */
  fileData?: FileData
  /** Signature data from Step 2 */
  signatureData?: SignatureData
  /** Blockchain data from Step 3 */
  blockchainData?: BlockchainData
}

/**
 * Stepper state
 */
export interface StepperState {
  /** Current active step */
  currentStep: StepId
  /** Status of each step */
  stepStatuses: Record<StepId, StepStatus>
  /** Document data accumulated across steps */
  documentData: DocumentData
  /** Whether user confirmed reading (Step 1) */
  confirmedReading: boolean
  /** IPFS upload progress (Step 3) */
  ipfsProgress: IPFSProgress
  /** Blockchain transaction progress (Step 3) */
  blockchainProgress: BlockchainProgress
}

/**
 * Actions for stepper state management
 */
export type StepperAction =
  | { type: 'SET_CURRENT_STEP'; payload: StepId }
  | { type: 'SET_STEP_STATUS'; payload: { step: StepId; status: StepStatus } }
  | { type: 'SET_FILE_DATA'; payload: FileData }
  | { type: 'SET_SIGNATURE_DATA'; payload: SignatureData }
  | { type: 'SET_BLOCKCHAIN_DATA'; payload: BlockchainData }
  | { type: 'SET_CONFIRMED_READING'; payload: boolean }
  | { type: 'UPDATE_IPFS_PROGRESS'; payload: Partial<IPFSProgress> }
  | { type: 'UPDATE_BLOCKCHAIN_PROGRESS'; payload: Partial<BlockchainProgress> }
  | { type: 'RESET_STEPPER' }
  | { type: 'REMOVE_FILE' }
  | { type: 'REMOVE_SIGNATURE' }
