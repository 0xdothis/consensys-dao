import { create } from 'ipfs-http-client'

// IPFS client configuration
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
]

// Initialize IPFS client
let ipfsClient: ReturnType<typeof create> | null = null

try {
  ipfsClient = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: process.env.NEXT_PUBLIC_IPFS_AUTH || ''
    }
  })
} catch {
  console.warn('IPFS client initialization failed, using mock mode')
}

// Encryption utilities
export async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  // Generate salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  
  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(data)
  )
  
  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  return btoa(String.fromCharCode(...combined))
}

export async function decryptData(encryptedData: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  // Decode base64
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  )
  
  // Extract components
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const encrypted = combined.slice(28)
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  
  // Decrypt data
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  )
  
  return decoder.decode(decrypted)
}

// IPFS upload with encryption
export async function uploadToIPFS(
  file: File, 
  encrypt: boolean = false, 
  password?: string
): Promise<{ hash: string; size: number; encrypted: boolean }> {
  try {
    if (!ipfsClient) {
      // Mock implementation for development
      const mockHash = `Qm${Math.random().toString(36).substring(2).padEnd(44, 'a')}`
      return {
        hash: mockHash,
        size: file.size,
        encrypted: encrypt
      }
    }
    
    const fileContent = await file.arrayBuffer()
    let processedData: Uint8Array
    
    if (encrypt && password) {
      const fileText = new TextDecoder().decode(fileContent)
      const encryptedText = await encryptData(fileText, password)
      processedData = new TextEncoder().encode(encryptedText)
    } else {
      processedData = new Uint8Array(fileContent)
    }
    
    const result = await ipfsClient.add(processedData, {
      pin: true,
      wrapWithDirectory: false
    })
    
    return {
      hash: result.cid.toString(),
      size: processedData.length,
      encrypted: encrypt
    }
  } catch (error) {
    console.error('IPFS upload failed:', error)
    throw new Error('Failed to upload document to IPFS')
  }
}

// IPFS download with decryption
export async function downloadFromIPFS(
  hash: string, 
  encrypted: boolean = false, 
  password?: string
): Promise<{ content: Uint8Array; decrypted: boolean }> {
  try {
    if (!ipfsClient) {
      // Mock implementation for development
      const mockContent = new TextEncoder().encode(`Mock document content for ${hash}`)
      return {
        content: mockContent,
        decrypted: false
      }
    }
    
    const chunks: Uint8Array[] = []
    for await (const chunk of ipfsClient.cat(hash)) {
      chunks.push(chunk)
    }
    
    const fileData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      fileData.set(chunk, offset)
      offset += chunk.length
    }
    
    if (encrypted && password) {
      const encryptedText = new TextDecoder().decode(fileData)
      const decryptedText = await decryptData(encryptedText, password)
      return {
        content: new TextEncoder().encode(decryptedText),
        decrypted: true
      }
    }
    
    return {
      content: fileData,
      decrypted: false
    }
  } catch (error) {
    console.error('IPFS download failed:', error)
    throw new Error('Failed to download document from IPFS')
  }
}

// Get IPFS URL for direct access
export function getIPFSUrl(hash: string, gatewayIndex: number = 0): string {
  return `${IPFS_GATEWAYS[gatewayIndex]}${hash}`
}

// Validate IPFS hash
export function validateIPFSHash(hash: string): boolean {
  // Basic validation for IPFS CID v0 and v1
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
  const cidV1Regex = /^b[a-z2-7]{58}$/
  return cidV0Regex.test(hash) || cidV1Regex.test(hash)
}

// Generate document metadata
export interface DocumentMetadata {
  name: string
  type: string
  size: number
  uploadedAt: Date
  encrypted: boolean
  hash: string
  tags?: string[]
  permissions?: {
    public: boolean
    allowedUsers?: string[]
    allowedRoles?: string[]
  }
}

export function createDocumentMetadata(
  file: File,
  hash: string,
  encrypted: boolean,
  permissions?: DocumentMetadata['permissions']
): DocumentMetadata {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    uploadedAt: new Date(),
    encrypted,
    hash,
    permissions: permissions || { public: !encrypted }
  }
}

// Document access control
export function canAccessDocument(
  metadata: DocumentMetadata,
  userAddress: string,
  userRoles: string[] = []
): boolean {
  if (metadata.permissions?.public) {
    return true
  }
  
  if (metadata.permissions?.allowedUsers?.includes(userAddress.toLowerCase())) {
    return true
  }
  
  if (metadata.permissions?.allowedRoles?.some(role => userRoles.includes(role))) {
    return true
  }
  
  return false
}

// Batch upload multiple documents
export async function uploadMultipleDocuments(
  files: File[],
  encrypt: boolean = false,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<DocumentMetadata[]> {
  const results: DocumentMetadata[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const uploadResult = await uploadToIPFS(file, encrypt, password)
    const metadata = createDocumentMetadata(file, uploadResult.hash, encrypt)
    results.push(metadata)
    
    if (onProgress) {
      onProgress((i + 1) / files.length * 100)
    }
  }
  
  return results
}

// Document search and filtering
export interface DocumentFilter {
  type?: string
  encrypted?: boolean
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  sizeMin?: number
  sizeMax?: number
}

export function filterDocuments(
  documents: DocumentMetadata[],
  filter: DocumentFilter
): DocumentMetadata[] {
  return documents.filter(doc => {
    if (filter.type && doc.type !== filter.type) return false
    if (filter.encrypted !== undefined && doc.encrypted !== filter.encrypted) return false
    if (filter.tags && !filter.tags.some(tag => doc.tags?.includes(tag))) return false
    if (filter.dateFrom && doc.uploadedAt < filter.dateFrom) return false
    if (filter.dateTo && doc.uploadedAt > filter.dateTo) return false
    if (filter.sizeMin && doc.size < filter.sizeMin) return false
    if (filter.sizeMax && doc.size > filter.sizeMax) return false
    return true
  })
}
