import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format ethereum values from wei to readable format
export function formatEther(value: bigint | string | number, decimals: number = 4): string {
  try {
    const bigValue = typeof value === 'bigint' ? value : BigInt(value.toString())
    const divisor = BigInt('1000000000000000000') // 1e18 wei in 1 ether
    const etherValue = Number(bigValue) / Number(divisor)
    return etherValue.toFixed(decimals)
  } catch {
    return '0.0000'
  }
}

// Format dates to readable format
export function formatDate(timestamp: number | string | Date): string {
  try {
    let date: Date
    if (typeof timestamp === 'number') {
      // If it's a unix timestamp (seconds), convert to milliseconds
      date = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp)
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    } else {
      date = timestamp
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid date'
  }
}

// Format ethereum addresses to shortened format
export function formatAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

// Calculate percentage for voting results
export function calculatePercentage(votes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0
  return Math.round((votes / totalVotes) * 100)
}

// Parse ether from string to wei (BigInt)
export function parseEther(value: string): bigint {
  try {
    const cleanValue = value.trim()
    if (!cleanValue || isNaN(Number(cleanValue))) {
      throw new Error('Invalid number')
    }
    const etherValue = Number(cleanValue)
    const weiValue = BigInt(Math.floor(etherValue * 1e18))
    return weiValue
  } catch {
    return BigInt(0)
  }
}

// Generate commitment for private voting (simple hash for demo)
export function generateCommitment(secret: string, data: string): string {
  try {
    // In a real app, this would use proper cryptographic commitment schemes
    // For demo purposes, we'll use a simple hash-like function
    const combined = secret + data
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  } catch {
    return ''
  }
}
