'use client'

/**
 * Document Signer Stepper
 *
 * Main component orchestrating the 3-step document signing workflow:
 * 1. Upload & Review PDF
 * 2. Sign Document
 * 3. Store on Blockchain
 */

import { useReducer, useCallback } from 'react'
import { StepperState, StepperAction, FileData, SignatureData, BlockchainData } from '../types/stepper'
import { StepId } from '../config/upload'
import { Step1UploadFile } from './steps/Step1UploadFile'
import { Step2SignDocument } from './steps/Step2SignDocument'

// Initial stepper state
const initialState: StepperState = {
  currentStep: 'upload',
  stepStatuses: {
    upload: 'active',
    sign: 'pending',
  },
  documentData: {},
  confirmedReading: false,
  ipfsProgress: {
    status: 'idle',
    progress: 0,
  },
  blockchainProgress: {
    status: 'idle',
  },
}

// Stepper reducer
function stepperReducer(state: StepperState, action: StepperAction): StepperState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
        stepStatuses: {
          upload: action.payload === 'upload' ? 'active' : 'completed',
          sign: action.payload === 'sign' ? 'active' : 'pending',
        },
      }

    case 'SET_STEP_STATUS':
      return {
        ...state,
        stepStatuses: {
          ...state.stepStatuses,
          [action.payload.step]: action.payload.status,
        },
      }

    case 'SET_FILE_DATA':
      return {
        ...state,
        documentData: {
          ...state.documentData,
          fileData: action.payload,
        },
      }

    case 'SET_SIGNATURE_DATA':
      return {
        ...state,
        documentData: {
          ...state.documentData,
          signatureData: action.payload,
        },
      }

    case 'SET_BLOCKCHAIN_DATA':
      return {
        ...state,
        documentData: {
          ...state.documentData,
          blockchainData: action.payload,
        },
      }

    case 'SET_CONFIRMED_READING':
      return {
        ...state,
        confirmedReading: action.payload,
      }

    case 'UPDATE_IPFS_PROGRESS':
      return {
        ...state,
        ipfsProgress: {
          ...state.ipfsProgress,
          ...action.payload,
        },
      }

    case 'UPDATE_BLOCKCHAIN_PROGRESS':
      return {
        ...state,
        blockchainProgress: {
          ...state.blockchainProgress,
          ...action.payload,
        },
      }

    case 'REMOVE_FILE':
      return {
        ...initialState,
      }

    case 'REMOVE_SIGNATURE':
      return {
        ...state,
        currentStep: 'sign',
        documentData: {
          ...state.documentData,
          signatureData: undefined,
          blockchainData: undefined,
        },
        stepStatuses: {
          ...state.stepStatuses,
          sign: 'active',
        },
      }

    case 'RESET_STEPPER':
      return initialState

    default:
      return state
  }
}

interface DocumentSignerStepperProps {
  /** Callback when switching to history tab */
  onViewHistory?: () => void
}

export function DocumentSignerStepper({ onViewHistory }: DocumentSignerStepperProps) {
  const [state, dispatch] = useReducer(stepperReducer, initialState)

  // Step navigation handlers
  const goToStep = useCallback((step: StepId) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step })
  }, [])

  const handleFileReady = useCallback((fileData: FileData) => {
    dispatch({ type: 'SET_FILE_DATA', payload: fileData })
  }, [])

  const handleRemoveFile = useCallback(() => {
    dispatch({ type: 'REMOVE_FILE' })
  }, [])

  const handleContinueToSign = useCallback(() => {
    goToStep('sign')
  }, [goToStep])

  const handleDocumentSigned = useCallback((signatureData: SignatureData) => {
    dispatch({ type: 'SET_SIGNATURE_DATA', payload: signatureData })
  }, [])

  const handleBackToUpload = useCallback(() => {
    goToStep('upload')
  }, [goToStep])

  const handleStored = useCallback((blockchainData: BlockchainData) => {
    dispatch({ type: 'SET_BLOCKCHAIN_DATA', payload: blockchainData })
    dispatch({ type: 'SET_STEP_STATUS', payload: { step: 'sign', status: 'completed' } })
  }, [])

  const handleSignAnother = useCallback(() => {
    dispatch({ type: 'RESET_STEPPER' })
  }, [])

  const handleViewHistory = useCallback(() => {
    onViewHistory?.()
  }, [onViewHistory])

  const handleSetConfirmedReading = useCallback((confirmed: boolean) => {
    dispatch({ type: 'SET_CONFIRMED_READING', payload: confirmed })
  }, [])

  return (
    <div>
      {/* Step Content */}
      <div className="space-y-6">
        {state.currentStep === 'upload' && (
          <Step1UploadFile
            fileData={state.documentData.fileData || null}
            onFileReady={handleFileReady}
            onRemoveFile={handleRemoveFile}
            confirmedReading={state.confirmedReading}
            onSetConfirmedReading={handleSetConfirmedReading}
            onContinue={handleContinueToSign}
          />
        )}

        {state.currentStep === 'sign' && state.documentData.fileData && (
          <Step2SignDocument
            fileData={state.documentData.fileData}
            signatureData={state.documentData.signatureData || null}
            blockchainData={state.documentData.blockchainData || null}
            onDocumentSigned={handleDocumentSigned}
            onStored={handleStored}
            onSignAnother={handleSignAnother}
            onViewHistory={handleViewHistory}
            onBack={handleBackToUpload}
          />
        )}
      </div>
    </div>
  )
}
