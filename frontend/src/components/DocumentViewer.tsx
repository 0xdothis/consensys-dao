'use client'

import { useState, useEffect } from 'react'
import {
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  DownloadIcon,
  ShareIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { DocumentMetadata, downloadFromIPFS, getIPFSUrl, canAccessDocument } from '@/lib/ipfs'

interface DocumentViewerProps {
  document: DocumentMetadata
  userAddress: string
  userRoles?: string[]
  onClose?: () => void
  onError?: (error: string) => void
  className?: string
}

export default function DocumentViewer({
  document,
  userAddress,
  userRoles = [],
  onClose,
  onError,
  className = ''
}: DocumentViewerProps) {
  const [content, setContent] = useState<Uint8Array | null>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [decrypted, setDecrypted] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Check if user has access
  const hasAccess = canAccessDocument(document, userAddress, userRoles)

  useEffect(() => {
    if (hasAccess && !document.encrypted) {
      loadDocument()
    }
  }, [hasAccess, document.hash])

  const loadDocument = async (decryptPassword?: string) => {
    if (!hasAccess) {
      setError('You do not have permission to view this document')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await downloadFromIPFS(
        document.hash,
        document.encrypted,
        decryptPassword
      )

      setContent(result.content)
      setDecrypted(result.decrypted)

      // Create preview URL for supported file types
      if (result.content) {
        const blob = new Blob([result.content], { type: document.type })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load document'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDecrypt = () => {
    if (!password.trim()) {
      setError('Password is required to decrypt this document')
      return
    }
    loadDocument(password)
  }

  const downloadDocument = () => {
    if (!content) return

    const blob = new Blob([content], { type: document.type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = document.name
    link.click()
    URL.revokeObjectURL(url)
  }

  const shareDocument = async () => {
    if (navigator.share && previewUrl) {
      try {
        await navigator.share({
          title: document.name,
          text: `Document: ${document.name}`,
          url: previewUrl
        })
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    const url = getIPFSUrl(document.hash)
    navigator.clipboard.writeText(url).then(() => {
      // Show success message
      const originalText = 'Share'
      const button = document.querySelector('[data-share-button]') as HTMLButtonElement
      if (button) {
        button.textContent = 'Copied!'
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('text')) return '📝'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    return '📁'
  }

  const canPreview = (type: string) => {
    return type.startsWith('image/') || 
           type.startsWith('text/') || 
           type.includes('pdf') ||
           type.startsWith('video/') ||
           type.startsWith('audio/')
  }

  const renderPreview = () => {
    if (!previewUrl || !content) return null

    if (document.type.startsWith('image/')) {
      return (
        <img
          src={previewUrl}
          alt={document.name}
          className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
        />
      )
    }

    if (document.type.startsWith('text/')) {
      const text = new TextDecoder().decode(content)
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
            {text.slice(0, 5000)}{text.length > 5000 && '...'}
          </pre>
        </div>
      )
    }

    if (document.type.includes('pdf')) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600"
          title={document.name}
        />
      )
    }

    if (document.type.startsWith('video/')) {
      return (
        <video
          src={previewUrl}
          controls
          className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
        >
          Your browser does not support the video tag.
        </video>
      )
    }

    if (document.type.startsWith('audio/')) {
      return (
        <audio
          src={previewUrl}
          controls
          className="w-full"
        >
          Your browser does not support the audio tag.
        </audio>
      )
    }

    return null
  }

  if (!hasAccess) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            Access Denied
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          You don&apos;t have permission to view this document. Contact the document owner for access.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon(document.type)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {document.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatFileSize(document.size)}</span>
              <span>{document.uploadedAt.toLocaleDateString()}</span>
              {document.encrypted && (
                <div className="flex items-center space-x-1">
                  <LockClosedIcon className="h-4 w-4" />
                  <span>Encrypted</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {content && (
            <>
              <button
                onClick={downloadDocument}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="Download"
              >
                <DownloadIcon className="h-5 w-5" />
              </button>
              <button
                onClick={shareDocument}
                data-share-button
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="Share"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Encryption/Decryption Interface */}
        {document.encrypted && !decrypted && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <LockClosedIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                This document is encrypted
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Enter the password to decrypt and view the document content.
            </p>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter decryption password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDecrypt()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <button
                onClick={handleDecrypt}
                disabled={!password.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <LockOpenIcon className="h-4 w-4" />
                )}
                <span>Decrypt</span>
              </button>
            </div>
          </div>
        )}

        {/* Success message for decrypted content */}
        {decrypted && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <LockOpenIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Document decrypted successfully
              </span>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading document...</span>
          </div>
        )}

        {/* Content preview */}
        {content && !loading && (
          <div className="space-y-4">
            {canPreview(document.type) ? (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Preview</h4>
                {renderPreview()}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Preview not available for this file type
                </p>
                <button
                  onClick={downloadDocument}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download to View
                </button>
              </div>
            )}
          </div>
        )}

        {/* Document metadata */}
        {!loading && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Document Information</h4>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Type</dt>
                <dd className="text-gray-600 dark:text-gray-400">{document.type || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Size</dt>
                <dd className="text-gray-600 dark:text-gray-400">{formatFileSize(document.size)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Uploaded</dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  {document.uploadedAt.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">IPFS Hash</dt>
                <dd className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all">
                  {document.hash}
                </dd>
              </div>
              {document.tags && document.tags.length > 0 && (
                <div className="col-span-2">
                  <dt className="font-medium text-gray-700 dark:text-gray-300">Tags</dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {document.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
