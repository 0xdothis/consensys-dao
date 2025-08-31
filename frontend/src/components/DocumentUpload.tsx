'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  EyeIcon, 
  EyeSlashIcon,
  LockClosedIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { uploadToIPFS, uploadMultipleDocuments, DocumentMetadata } from '@/lib/ipfs'

interface DocumentUploadProps {
  onUpload?: (documents: DocumentMetadata[]) => void
  onError?: (error: string) => void
  multiple?: boolean
  accept?: string
  maxSize?: number // in MB
  className?: string
  allowEncryption?: boolean
  requireEncryption?: boolean
  showPermissions?: boolean
}

export default function DocumentUpload({
  onUpload,
  onError,
  multiple = false,
  accept,
  maxSize = 10,
  className = '',
  allowEncryption = true,
  requireEncryption = false,
  showPermissions = true
}: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [encrypt, setEncrypt] = useState(requireEncryption)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [permissions, setPermissions] = useState({
    public: !requireEncryption,
    allowedUsers: [] as string[],
    allowedRoles: [] as string[]
  })
  const [newUser, setNewUser] = useState('')
  const [newRole, setNewRole] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    if (!multiple) {
      setFiles([droppedFiles[0]].filter(Boolean))
    } else {
      setFiles(prev => [...prev, ...droppedFiles])
    }
  }, [multiple])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      onError?.(
        `Some files exceed the ${maxSize}MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`
      )
      return
    }
    
    if (!multiple) {
      setFiles([selectedFiles[0]].filter(Boolean))
    } else {
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      onError?.('Please select files to upload')
      return
    }
    
    if (encrypt && !password.trim()) {
      onError?.('Password is required for encrypted uploads')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadedDocuments = await uploadMultipleDocuments(
        files,
        encrypt,
        password || undefined,
        setUploadProgress
      )

      // Apply permissions to metadata
      const documentsWithPermissions = uploadedDocuments.map(doc => ({
        ...doc,
        permissions: encrypt ? {
          public: permissions.public,
          allowedUsers: permissions.allowedUsers,
          allowedRoles: permissions.allowedRoles
        } : { public: true }
      }))

      onUpload?.(documentsWithPermissions)
      setFiles([])
      setPassword('')
      setUploadProgress(0)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const addAllowedUser = () => {
    if (newUser.trim() && !permissions.allowedUsers.includes(newUser.trim())) {
      setPermissions(prev => ({
        ...prev,
        allowedUsers: [...prev.allowedUsers, newUser.trim()]
      }))
      setNewUser('')
    }
  }

  const addAllowedRole = () => {
    if (newRole.trim() && !permissions.allowedRoles.includes(newRole.trim())) {
      setPermissions(prev => ({
        ...prev,
        allowedRoles: [...prev.allowedRoles, newRole.trim()]
      }))
      setNewRole('')
    }
  }

  const removeAllowedUser = (user: string) => {
    setPermissions(prev => ({
      ...prev,
      allowedUsers: prev.allowedUsers.filter(u => u !== user)
    }))
  }

  const removeAllowedRole = (role: string) => {
    setPermissions(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.filter(r => r !== role)
    }))
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
      >
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {accept ? `Supported: ${accept}` : 'All file types supported'} 
              {' '}• Max {maxSize}MB {multiple ? 'per file' : ''}
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)} • {file.type || 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encryption Settings */}
      {allowEncryption && (
        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="encrypt"
              checked={encrypt}
              onChange={(e) => setEncrypt(e.target.checked)}
              disabled={requireEncryption}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="encrypt" className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-white">
              <LockClosedIcon className="h-4 w-4" />
              <span>Encrypt files</span>
              {requireEncryption && <span className="text-xs text-blue-600 dark:text-blue-400">(Required)</span>}
            </label>
          </div>

          {encrypt && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter encryption password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose a strong password. This will be required to decrypt and view the files.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Permissions */}
      {showPermissions && encrypt && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white">Access Permissions</h4>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="public"
              checked={permissions.public}
              onChange={(e) => setPermissions(prev => ({ ...prev, public: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="public" className="text-sm text-gray-900 dark:text-white">
              Allow public access (with password)
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Allowed Users (Addresses)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="0x..."
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={addAllowedUser}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {permissions.allowedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {permissions.allowedUsers.map((user, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {user.slice(0, 8)}...
                    <button
                      onClick={() => removeAllowedUser(user)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Allowed Roles
            </label>
            <div className="flex space-x-2">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select role...</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
                <option value="borrower">Borrower</option>
                <option value="lender">Lender</option>
              </select>
              <button
                type="button"
                onClick={addAllowedRole}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {permissions.allowedRoles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {permissions.allowedRoles.map((role, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded"
                  >
                    {role}
                    <button
                      onClick={() => removeAllowedRole(role)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading || (encrypt && !password.trim())}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <CloudArrowUpIcon className="h-4 w-4" />
            <span>Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Files'}</span>
          </>
        )}
      </button>
    </div>
  )
}
