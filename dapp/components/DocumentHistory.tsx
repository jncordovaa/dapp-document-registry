'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { History, Hash, Clock, User, AlertCircle, Loader2, RefreshCw, FileText, Search, X, ArrowUpDown, Calendar, Download, Cloud, Copy, ExternalLink, CheckCircle } from 'lucide-react'
import { useContract } from '../hooks/useContract'
import { AddressDisplay } from './AddressDisplay'
import { getIPFSGatewayURL } from '../utils/ipfs'

interface Document {
  hash: string
  timestamp: number
  signer: string
  signature: string
  ipfsCid: string
  index: number
}

type SortField = 'timestamp' | 'signer' | 'hash'
type SortOrder = 'asc' | 'desc'

export function DocumentHistory() {
  const { getDocumentCount, getDocumentHashByIndex, getDocumentInfo, contract } = useContract()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedCID, setCopiedCID] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [copiedSignature, setCopiedSignature] = useState<string | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('month')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const loadDocuments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const count = await getDocumentCount()
      console.log('Total documents:', count)

      if (count === 0) {
        setDocuments([])
        setIsLoading(false)
        return
      }

      const docs: Document[] = []

      for (let i = 0; i < count; i++) {
        try {
          const hash = await getDocumentHashByIndex(i)
          const info = await getDocumentInfo(hash)

          if (info) {
            docs.push({
              hash,
              timestamp: info.timestamp,
              signer: info.signer,
              signature: info.signature,
              ipfsCid: info.ipfsCid || '',
              index: i
            })
          }
        } catch (docError) {
          console.error(`Error loading document ${i}:`, docError)
        }
      }

      setDocuments(docs)
    } catch (error: any) {
      console.error('Error loading documents:', error)
      setError(error.message || 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  // Reference to track if documents have been loaded
  const hasLoadedRef = useRef(false)

  // Load documents once when contract is available
  useEffect(() => {
    // Only load if not loaded before AND contract is available
    if (!hasLoadedRef.current && contract) {
      loadDocuments()
      hasLoadedRef.current = true
    }
  }, [contract])

  // Filter documents by search query and date
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents]

    // Search filter (hash or signer address)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.hash.toLowerCase().includes(query) ||
        doc.signer.toLowerCase().includes(query)
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000

      filtered = filtered.filter(doc => {
        const docDate = doc.timestamp * 1000
        switch (dateFilter) {
          case 'today':
            return now - docDate < oneDayMs
          case 'week':
            return now - docDate < 7 * oneDayMs
          case 'month':
            return now - docDate < 30 * oneDayMs
          default:
            return true
        }
      })
    }

    return filtered
  }, [documents, searchQuery, dateFilter])

  // Sort documents
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp
          break
        case 'signer':
          comparison = a.signer.localeCompare(b.signer)
          break
        case 'hash':
          comparison = a.hash.localeCompare(b.hash)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredDocuments, sortField, sortOrder])

  // Paginated documents
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedDocuments.slice(startIndex, endIndex)
  }, [sortedDocuments, currentPage])

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage)

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  // Clear search & filters
  const clearSearch = () => {
    setSearchQuery('')
    setDateFilter('month')
    setCurrentPage(1)
  }

  // Copy handlers
  const handleCopyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const handleCopySignature = async (signature: string) => {
    await navigator.clipboard.writeText(signature)
    setCopiedSignature(signature)
    setTimeout(() => setCopiedSignature(null), 2000)
  }

  const handleCopyCID = async (cid: string) => {
    await navigator.clipboard.writeText(cid)
    setCopiedCID(cid)
    setTimeout(() => setCopiedCID(null), 2000)
  }

  // Export to CSV
  const exportToCSV = () => {
    if (sortedDocuments.length === 0) return

    const headers = ['Index', 'Document Hash', 'Signer Address', 'Timestamp', 'Date', 'Signature', 'IPFS CID']
    const rows = sortedDocuments.map(doc => [
      doc.index,
      doc.hash,
      doc.signer,
      doc.timestamp,
      new Date(doc.timestamp * 1000).toISOString(),
      doc.signature,
      doc.ipfsCid || '(not uploaded)'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `documents_${Date.now()}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            All Documents
          </h3>
          <p className="text-sm text-gray-400">
            {documents.length} document{documents.length !== 1 ? 's' : ''} stored
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDocuments}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-950 border border-gray-700 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={sortedDocuments.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-950 border border-gray-700 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title={`Export ${sortedDocuments.length} document${sortedDocuments.length !== 1 ? 's' : ''} to CSV`}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
            {sortedDocuments.length > 0 && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                {sortedDocuments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-dark-850 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by hash or signer address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-10 py-2 bg-dark-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-neon-500 focus:border-neon-500 text-white placeholder-gray-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="flex-1 px-3 py-2 bg-dark-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-neon-500 focus:border-neon-500 text-white transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || dateFilter !== 'all') && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                Showing {sortedDocuments.length} of {documents.length} documents
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Sort by:</span>
        <button
          onClick={() => toggleSort('timestamp')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            sortField === 'timestamp'
              ? 'bg-neon-900/30 border border-neon-500/50 text-neon-500'
              : 'bg-dark-850 border border-gray-700 text-gray-400 hover:bg-dark-800 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center space-x-1">
            <span>Date</span>
            {sortField === 'timestamp' && <ArrowUpDown className="w-3 h-3" />}
          </div>
        </button>
        <button
          onClick={() => toggleSort('signer')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            sortField === 'signer'
              ? 'bg-neon-900/30 border border-neon-500/50 text-neon-500'
              : 'bg-dark-850 border border-gray-700 text-gray-400 hover:bg-dark-800 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center space-x-1">
            <span>Signer</span>
            {sortField === 'signer' && <ArrowUpDown className="w-3 h-3" />}
          </div>
        </button>
        <span className="text-xs text-gray-500">
          ({sortOrder === 'asc' ? '↑' : '↓'})
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-dark-850 rounded-lg p-4 border border-red-500/50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400 font-medium">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-neon-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading documents...</p>
          </div>
        </div>
      ) : sortedDocuments.length === 0 ? (
        <div className="text-center py-16 bg-dark-850 rounded-lg border border-gray-700">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery || dateFilter !== 'all' ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery || dateFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Sign and store your first document to see it here'}
          </p>
        </div>
      ) : (
        <>
          {/* Documents Table */}
          <div className="bg-dark-850 rounded-lg border border-gray-700 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-900 border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Document Hash
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Signer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Signature
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      IPFS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedDocuments.map((doc, idx) => (
                    <tr key={doc.hash} className="hover:bg-gray-900/50 transition-colors">
                      {/* Index */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-neon-900/30 border border-neon-500/50 text-neon-500 text-xs font-mono rounded">
                          #{doc.index}
                        </span>
                      </td>

                      {/* Document Hash */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <code className="text-xs font-mono text-white">
                            {doc.hash.substring(0, 10)}...{doc.hash.substring(doc.hash.length - 8)}
                          </code>
                          <button
                            onClick={() => handleCopyHash(doc.hash)}
                            className="text-gray-400 hover:text-neon-500 transition-colors"
                            title="Copy hash"
                          >
                            {copiedHash === doc.hash ? (
                              <CheckCircle className="w-4 h-4 text-neon-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Signer */}
                      <td className="px-4 py-4">
                        <AddressDisplay address={doc.signer} showCopy={false} showLink />
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {new Date(doc.timestamp * 1000).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(doc.timestamp * 1000).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Signature */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <code className="text-xs font-mono text-white">
                            {doc.signature.substring(0, 8)}...{doc.signature.substring(doc.signature.length - 6)}
                          </code>
                          <button
                            onClick={() => handleCopySignature(doc.signature)}
                            className="text-gray-400 hover:text-neon-500 transition-colors"
                            title="Copy signature"
                          >
                            {copiedSignature === doc.signature ? (
                              <CheckCircle className="w-4 h-4 text-neon-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* IPFS */}
                      <td className="px-4 py-4">
                        {doc.ipfsCid ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCopyCID(doc.ipfsCid)}
                              className="text-gray-400 hover:text-cyber-500 transition-colors"
                              title="Copy CID"
                            >
                              {copiedCID === doc.ipfsCid ? (
                                <CheckCircle className="w-4 h-4 text-cyber-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href={getIPFSGatewayURL(doc.ipfsCid)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyber-500 hover:text-cyber-400 transition-colors"
                              title="View on IPFS"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-700">
              {paginatedDocuments.map((doc) => (
                <div key={doc.hash} className="p-4 hover:bg-gray-900/50 transition-colors">
                  <div className="space-y-3">
                    {/* Index Badge */}
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-neon-900/30 border border-neon-500/50 text-neon-500 text-xs font-mono rounded">
                        #{doc.index}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(doc.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Document Hash */}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400">Hash</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono text-white break-all flex-1">
                          {doc.hash.substring(0, 16)}...{doc.hash.substring(doc.hash.length - 16)}
                        </code>
                        <button
                          onClick={() => handleCopyHash(doc.hash)}
                          className="text-gray-400 hover:text-neon-500 transition-colors"
                        >
                          {copiedHash === doc.hash ? (
                            <CheckCircle className="w-4 h-4 text-neon-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Signer */}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400">Signer</span>
                      </div>
                      <AddressDisplay address={doc.signer} showCopy showLink />
                    </div>

                    {/* Signature */}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400">Signature</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono text-white break-all flex-1">
                          {doc.signature.substring(0, 12)}...{doc.signature.substring(doc.signature.length - 12)}
                        </code>
                        <button
                          onClick={() => handleCopySignature(doc.signature)}
                          className="text-gray-400 hover:text-neon-500 transition-colors"
                        >
                          {copiedSignature === doc.signature ? (
                            <CheckCircle className="w-4 h-4 text-neon-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* IPFS */}
                    {doc.ipfsCid && (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Cloud className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-400">IPFS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyCID(doc.ipfsCid)}
                            className="text-gray-400 hover:text-cyber-500 transition-colors"
                          >
                            {copiedCID === doc.ipfsCid ? (
                              <CheckCircle className="w-4 h-4 text-cyber-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={getIPFSGatewayURL(doc.ipfsCid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyber-500 hover:text-cyber-400 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-dark-850 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-dark-900 border border-gray-700 text-white rounded-lg hover:bg-dark-800 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-neon-500 text-black'
                          : 'bg-dark-900 border border-gray-700 text-gray-400 hover:bg-dark-800 hover:border-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-dark-900 border border-gray-700 text-white rounded-lg hover:bg-dark-800 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
