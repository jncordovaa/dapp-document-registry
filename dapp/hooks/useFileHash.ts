import { useState } from 'react'
import { HashUtils } from '../utils/hash'

export function useFileHash() {
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateFileHash = async (file: File): Promise<string> => {
    setIsCalculating(true)
    setError(null)
    
    try {
      const hash = await HashUtils.calculateFileHash(file)
      return hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate hash'
      setError(errorMessage)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateStringHash = (content: string): string => {
    try {
      return HashUtils.calculateStringHash(content)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate hash'
      setError(errorMessage)
      throw err
    }
  }

  const validateHash = (hash: string): boolean => {
    return HashUtils.isValidHash(hash)
  }

  const compareHashes = (hash1: string, hash2: string): boolean => {
    return HashUtils.compareHashes(hash1, hash2)
  }

  const formatHash = (hash: string, length?: number): string => {
    return HashUtils.formatHash(hash, length)
  }

  return {
    isCalculating,
    error,
    calculateFileHash,
    calculateStringHash,
    validateHash,
    compareHashes,
    formatHash,
    clearError: () => setError(null)
  }
}
