'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { mainnet, sepolia, localhost } from 'wagmi/chains'
import { CONTRACT_ADDRESS } from '@/constants'

// Define the localhost chain
const localhostChain = {
  ...localhost,
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
} as const

export const config = getDefaultConfig({
  appName: 'UnifiedLendingDAO',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default-project-id',
  chains: [localhostChain, sepolia, mainnet],
  transports: {
    [localhostChain.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com'),
  },
  ssr: true,
})

export const CONTRACT_CONFIG = {
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: [], // We'll import this separately
} as const

// Chain-specific contract addresses
export const getContractAddress = (chainId: number): `0x${string}` => {
  switch (chainId) {
    case 31337: // Localhost
      return (process.env.NEXT_PUBLIC_LOCAL_CONTRACT_ADDRESS || CONTRACT_ADDRESS) as `0x${string}`
    case 11155111: // Sepolia
      return (process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS || CONTRACT_ADDRESS) as `0x${string}`
    case 1: // Mainnet
      return (process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS || CONTRACT_ADDRESS) as `0x${string}`
    default:
      return CONTRACT_ADDRESS as `0x${string}`
  }
}

export const SUPPORTED_CHAIN_IDS = [31337, 11155111, 1] as const
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number]

export const getExplorerUrl = (chainId: number) => {
  switch (chainId) {
    case 31337:
      return 'http://localhost:8545' // Local blockchain explorer
    case 11155111:
      return 'https://sepolia.etherscan.io'
    case 1:
      return 'https://etherscan.io'
    default:
      return 'https://etherscan.io'
  }
}

export const getTransactionUrl = (chainId: number, txHash: string) => {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`
}

export const getAddressUrl = (chainId: number, address: string) => {
  return `${getExplorerUrl(chainId)}/address/${address}`
}
