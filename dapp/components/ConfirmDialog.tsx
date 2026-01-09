'use client'

import { AlertCircle, Shield } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  details?: { label: string; value: string }[]
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  details = [],
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-xl max-w-md w-full border border-neon-500/30 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`p-6 border-b ${
          type === 'warning'
            ? 'bg-dark-850 border-yellow-500/30'
            : 'bg-dark-850 border-neon-500/30'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              type === 'warning'
                ? 'bg-dark-900 border-yellow-500/50'
                : 'bg-dark-900 border-neon-500/50'
            }`}>
              {type === 'warning' ? (
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              ) : (
                <Shield className="w-6 h-6 text-neon-500" />
              )}
            </div>
            <h3 className={`text-xl font-bold ${
              type === 'warning'
                ? 'text-yellow-500'
                : 'text-neon-500'
            }`}>
              {title}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300">
            {message}
          </p>

          {/* Details */}
          {details.length > 0 && (
            <div className="bg-dark-850 rounded-lg p-4 space-y-2 border border-neon-500/30">
              {details.map((detail, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-gray-400">
                    {detail.label}:
                  </span>
                  <div className="mt-1 font-mono text-xs text-gray-300 break-all bg-dark-900 p-2 rounded border border-neon-500/20">
                    {detail.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neon-500/30 flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-dark-850 text-gray-300 border border-neon-500/30 rounded-lg hover:bg-dark-800 hover:border-neon-500/50 hover:text-neon-500 transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-black rounded-lg transition-all font-bold ${
              type === 'warning'
                ? 'bg-yellow-500 hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]'
                : 'bg-neon-500 hover:bg-neon-400'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
