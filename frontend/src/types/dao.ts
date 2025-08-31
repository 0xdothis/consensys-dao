export interface Member {
  memberAddress: string
  status: MemberStatus
  joinDate: number
  contributionAmount: bigint
  shareBalance: bigint
  hasActiveLoan: boolean
  lastLoanDate: number
}

export enum MemberStatus {
  NON_MEMBER = 0,
  ACTIVE_MEMBER = 1,
  INACTIVE_MEMBER = 2,
  SUSPENDED_MEMBER = 3,
}

export enum ProposalStatus {
  PENDING = 0,
  IN_EDITING = 1,
  IN_VOTING = 2,
  APPROVED = 3,
  REJECTED = 4,
  EXECUTED = 5,
  CANCELLED = 6,
}

export enum ProposalType {
  LOAN_REQUEST = 0,
  TREASURY_ALLOCATION = 1,
  PARAMETER_CHANGE = 2,
  MEMBER_REMOVAL = 3,
}

export interface LoanProposal {
  id: number
  borrower: string
  amount: bigint
  purpose: string
  interestRate: number
  repaymentTerm: number
  collateralAmount: bigint
  status: ProposalStatus
  votesFor: number
  votesAgainst: number
  creationTime: number
  votingStartTime: number
  votingEndTime: number
  isPrivate: boolean
  privacyCommitment: string
  documentHash: string
}

export interface TreasuryProposal {
  id: number
  proposer: string
  title: string
  description: string
  amount: bigint
  recipient: string
  status: ProposalStatus
  votesFor: number
  votesAgainst: number
  creationTime: number
  votingStartTime: number
  votingEndTime: number
}

export interface Loan {
  id: number
  borrower: string
  amount: bigint
  interestRate: number
  repaymentTerm: number
  startTime: number
  endTime: number
  amountPaid: bigint
  totalInterest: bigint
  isActive: boolean
  collateralAmount: bigint
}

export interface LoanPolicy {
  maxLoanAmount: bigint
  minInterestRate: number
  maxInterestRate: number
  maxRepaymentTerm: number
  collateralRequirementBPS: number
  gracePeriod: number
}

export interface SimpleOperator {
  operatorAddress: string
  name: string
  expectedAPY: number
  totalStaked: bigint
  isApproved: boolean
}

export interface DAOStats {
  totalMembers: number
  activeMembers: number
  totalLoans: number
  activeLoans: number
  treasuryBalance: bigint
  totalYieldGenerated: bigint
  totalRestaked: bigint
}

export interface ContractConfig {
  address: string
  initialized: boolean
  consensusThreshold: number
  membershipFee: bigint
  ensVotingEnabled: boolean
  documentStorageEnabled: boolean
  privateVotingEnabled: boolean
  confidentialLoansEnabled: boolean
  restakingEnabled: boolean
  privacyLevel: number
}

export interface UserData {
  isConnected: boolean
  address?: string
  isMember: boolean
  isAdmin: boolean
  member?: Member
  ensName?: string
  votingWeight: number
  pendingRewards: bigint
  pendingYield: bigint
  hasActiveLoan: boolean
  loans: Loan[]
}

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
  read: boolean
}

// Event types for real-time updates
export interface DAOEvent {
  event: string
  args: Record<string, unknown>
  blockNumber: number
  transactionHash: string
  timestamp: number
}

export interface MemberRegisteredEvent extends DAOEvent {
  args: {
    member: string
    membershipFee: bigint
    timestamp: number
  }
}

export interface LoanRequestedEvent extends DAOEvent {
  args: {
    proposalId: number
    borrower: string
    amount: bigint
    purpose: string
    isPrivate: boolean
  }
}

export interface VoteCastEvent extends DAOEvent {
  args: {
    proposalId: number
    voter: string
    support: boolean
    votes: number
  }
}

export interface LoanApprovedEvent extends DAOEvent {
  args: {
    loanId: number
    borrower: string
    amount: bigint
    interestRate: number
  }
}

export interface YieldDistributedEvent extends DAOEvent {
  args: {
    totalYield: bigint
    memberShare: bigint
  }
}
