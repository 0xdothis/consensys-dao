export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export const SUPPORTED_CHAINS = {
  LOCALHOST: {
    id: 31337,
    name: 'Localhost',
    network: 'localhost',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
      public: { http: ['http://127.0.0.1:8545'] },
    },
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    network: 'sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia Ether',
      symbol: 'SEP',
    },
    rpcUrls: {
      default: { http: ['https://sepolia.infura.io/v3/'] },
      public: { http: ['https://sepolia.infura.io/v3/'] },
    },
  },
}

export const DAO_CONSTANTS = {
  PROPOSAL_EDITING_PERIOD: 3 * 24 * 60 * 60, // 3 days in seconds
  VOTING_PERIOD: 7 * 24 * 60 * 60, // 7 days in seconds
  BASIS_POINTS: 10000,
  DEFAULT_CONSENSUS_THRESHOLD: 5100, // 51%
  MAX_LOAN_AMOUNT: '1000', // ETH
  MIN_INTEREST_RATE: 500, // 5% in basis points
  MAX_INTEREST_RATE: 2000, // 20% in basis points
  DEFAULT_REPAYMENT_TERM: 365 * 24 * 60 * 60, // 1 year in seconds
} as const

export const PRIVACY_LEVELS = {
  BASIC: { value: 1, label: 'Basic', description: 'Standard operations with minimal privacy' },
  ENHANCED: { value: 2, label: 'Enhanced', description: 'Private voting and confidential loans' },
  MAXIMUM: { value: 3, label: 'Maximum', description: 'Full privacy suite with anonymous participation' },
} as const

export const MEMBER_STATUS_LABELS = {
  0: 'Non-Member',
  1: 'Active Member',
  2: 'Inactive Member',
  3: 'Suspended Member',
} as const

export const PROPOSAL_STATUS_LABELS = {
  0: 'Pending',
  1: 'In Editing',
  2: 'In Voting',
  3: 'Approved',
  4: 'Rejected',
  5: 'Executed',
  6: 'Cancelled',
} as const

export const PROPOSAL_TYPE_LABELS = {
  0: 'Loan Request',
  1: 'Treasury Allocation',
  2: 'Parameter Change',
  3: 'Member Removal',
} as const

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: 'home' },
  { name: 'Loans', href: '/loans', icon: 'banknotes' },
  { name: 'Governance', href: '/governance', icon: 'users' },
  { name: 'Treasury', href: '/treasury', icon: 'building-library' },
  { name: 'Privacy', href: '/privacy', icon: 'shield-check' },
] as const

export const ADMIN_NAVIGATION_ITEMS = [
  { name: 'Admin', href: '/admin', icon: 'cog-6-tooth' },
  { name: 'Operators', href: '/admin/operators', icon: 'server' },
  { name: 'Settings', href: '/admin/settings', icon: 'adjustments-horizontal' },
] as const

export const FEATURE_FLAGS = {
  ENS_VOTING: 'ensVotingEnabled',
  DOCUMENT_STORAGE: 'documentStorageEnabled',
  PRIVATE_VOTING: 'privateVotingEnabled',
  CONFIDENTIAL_LOANS: 'confidentialLoansEnabled',
  RESTAKING: 'restakingEnabled',
} as const

export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'

export const DEFAULT_ENS_VOTING_WEIGHT = 100
export const SHORT_ENS_VOTING_WEIGHT = 200
export const VARIABLE_ENS_VOTING_WEIGHT = 150

export const RESTAKING_ALLOCATION_BPS = 2000 // 20%
export const YIELD_DISTRIBUTION_SHARES = 6000 // 60%

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
} as const

export const QUERY_KEYS = {
  USER_DATA: ['userData'],
  DAO_STATS: ['daoStats'],
  LOANS: ['loans'],
  PROPOSALS: ['proposals'],
  MEMBERS: ['members'],
  TREASURY: ['treasury'],
  OPERATORS: ['operators'],
} as const
