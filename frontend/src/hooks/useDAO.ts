'use client'

import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi'
import { UNIFIED_LENDING_DAO_ABI } from '@/lib/contract-abi'
import { getContractAddress } from '@/lib/web3'
import type { UserData, DAOStats } from '@/types/dao'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function useDAOContract() {
  const { chainId } = useAccount()
  
  return {
    address: getContractAddress(chainId || 31337),
    abi: UNIFIED_LENDING_DAO_ABI,
  }
}

export function useUserData() {
  const { address, isConnected } = useAccount()
  const contract = useDAOContract()

  const { data: isMember } = useReadContract({
    ...contract,
    functionName: 'isMember',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  const { data: isAdmin } = useReadContract({
    ...contract,
    functionName: 'admins',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  const { data: memberData } = useReadContract({
    ...contract,
    functionName: 'members',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && isMember,
    },
  })

  const { data: pendingRewards } = useReadContract({
    ...contract,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && isMember,
    },
  })

  const { data: pendingYield } = useReadContract({
    ...contract,
    functionName: 'pendingYield',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && isMember,
    },
  })

  const userData: UserData = {
    isConnected,
    address,
    isMember: !!isMember,
    isAdmin: !!isAdmin,
    member: memberData ? {
      memberAddress: memberData[0],
      status: memberData[1],
      joinDate: Number(memberData[2]),
      contributionAmount: memberData[3],
      shareBalance: memberData[4],
      hasActiveLoan: memberData[5],
      lastLoanDate: Number(memberData[6]),
    } : undefined,
    votingWeight: 100, // Default weight, would need additional call for ENS weight
    pendingRewards: pendingRewards || BigInt(0),
    pendingYield: pendingYield || BigInt(0),
    hasActiveLoan: memberData?.[5] || false,
    loans: [], // Would need additional calls to get user loans
  }

  return userData
}

export function useDAOStats() {
  const contract = useDAOContract()

  const { data: totalMembers } = useReadContract({
    ...contract,
    functionName: 'totalMembers',
  })

  const { data: activeMembers } = useReadContract({
    ...contract,
    functionName: 'activeMembers',
  })

  const { data: initialized } = useReadContract({
    ...contract,
    functionName: 'initialized',
  })

  const { data: membershipFee } = useReadContract({
    ...contract,
    functionName: 'membershipFee',
  })

  const { data: consensusThreshold } = useReadContract({
    ...contract,
    functionName: 'consensusThreshold',
  })

  // Feature flags
  const { data: ensVotingEnabled } = useReadContract({
    ...contract,
    functionName: 'ensVotingEnabled',
  })

  const { data: documentStorageEnabled } = useReadContract({
    ...contract,
    functionName: 'documentStorageEnabled',
  })

  const { data: privateVotingEnabled } = useReadContract({
    ...contract,
    functionName: 'privateVotingEnabled',
  })

  const { data: confidentialLoansEnabled } = useReadContract({
    ...contract,
    functionName: 'confidentialLoansEnabled',
  })

  const { data: restakingEnabled } = useReadContract({
    ...contract,
    functionName: 'restakingEnabled',
  })

  const stats: DAOStats & { 
    initialized: boolean
    membershipFee: bigint
    consensusThreshold: number
    features: {
      ensVoting: boolean
      documentStorage: boolean
      privateVoting: boolean
      confidentialLoans: boolean
      restaking: boolean
    }
  } = {
    totalMembers: Number(totalMembers || 0),
    activeMembers: Number(activeMembers || 0),
    totalLoans: 0, // Would need additional contract calls
    activeLoans: 0,
    treasuryBalance: BigInt(0), // Would need balance check
    totalYieldGenerated: BigInt(0), // Would need additional call
    totalRestaked: BigInt(0), // Would need additional call
    initialized: !!initialized,
    membershipFee: membershipFee || BigInt(0),
    consensusThreshold: Number(consensusThreshold || 0),
    features: {
      ensVoting: !!ensVotingEnabled,
      documentStorage: !!documentStorageEnabled,
      privateVoting: !!privateVotingEnabled,
      confidentialLoans: !!confidentialLoansEnabled,
      restaking: !!restakingEnabled,
    },
  }

  return stats
}

export function useMemberRegistration() {
  const { writeContract, isPending, error, isSuccess } = useWriteContract()
  const contract = useDAOContract()

  const registerMember = async (ensName?: string, kycHash?: string, membershipFee?: bigint) => {
    try {
      if (ensName || kycHash) {
        // Enhanced registration
        await writeContract({
          ...contract,
          functionName: 'registerMember',
          args: [ensName || '', kycHash || ''],
          value: membershipFee,
        })
      } else {
        // Simple registration
        await writeContract({
          ...contract,
          functionName: 'registerMember',
          value: membershipFee,
        })
      }
    } catch (err) {
      console.error('Registration failed:', err)
      throw err
    }
  }

  return {
    registerMember,
    isPending,
    error,
    isSuccess,
  }
}

export function useLoanRequest() {
  const { writeContract, isPending, error, isSuccess } = useWriteContract()
  const contract = useDAOContract()

  const requestLoan = async (
    amount: bigint,
    isPrivate: boolean = false,
    commitment?: string,
    documentHash?: string
  ) => {
    try {
      if (isPrivate || documentHash) {
        // Enhanced loan request
        await writeContract({
          ...contract,
          functionName: 'requestLoan',
          args: [
            amount,
            isPrivate,
            commitment ? commitment as `0x${string}` : '0x0000000000000000000000000000000000000000000000000000000000000000',
            documentHash || '',
          ],
        })
      } else {
        // Simple loan request
        await writeContract({
          ...contract,
          functionName: 'requestLoan',
          args: [amount],
        })
      }
    } catch (err) {
      console.error('Loan request failed:', err)
      throw err
    }
  }

  return {
    requestLoan,
    isPending,
    error,
    isSuccess,
  }
}

export function useVoting() {
  const { writeContract, isPending, error, isSuccess } = useWriteContract()
  const contract = useDAOContract()

  const voteOnProposal = async (proposalId: number, support: boolean) => {
    try {
      await writeContract({
        ...contract,
        functionName: 'voteOnLoanProposal',
        args: [BigInt(proposalId), support],
      })
    } catch (err) {
      console.error('Voting failed:', err)
      throw err
    }
  }

  return {
    voteOnProposal,
    isPending,
    error,
    isSuccess,
  }
}

export function useLoanRepayment() {
  const { writeContract, isPending, error, isSuccess } = useWriteContract()
  const contract = useDAOContract()

  const repayLoan = async (loanId: number, amount: bigint) => {
    try {
      await writeContract({
        ...contract,
        functionName: 'repayLoan',
        args: [BigInt(loanId)],
        value: amount,
      })
    } catch (err) {
      console.error('Loan repayment failed:', err)
      throw err
    }
  }

  return {
    repayLoan,
    isPending,
    error,
    isSuccess,
  }
}

export function useRewards() {
  const { writeContract, isPending, error, isSuccess } = useWriteContract()
  const contract = useDAOContract()

  const claimRewards = async () => {
    try {
      await writeContract({
        ...contract,
        functionName: 'claimAllRewards',
      })
    } catch (err) {
      console.error('Claiming rewards failed:', err)
      throw err
    }
  }

  const claimYield = async () => {
    try {
      await writeContract({
        ...contract,
        functionName: 'claimYield',
      })
    } catch (err) {
      console.error('Claiming yield failed:', err)
      throw err
    }
  }

  return {
    claimRewards,
    claimYield,
    isPending,
    error,
    isSuccess,
  }
}

// Event listening hook
export function useDAOEvents() {
  const contract = useDAOContract()
  const [events, setEvents] = useState<Record<string, unknown>[]>([])

  // Listen for member registration events
  useWatchContractEvent({
    ...contract,
    eventName: 'MemberActivated',
    onLogs(logs) {
      logs.forEach(log => {
        toast.success(`New member registered: ${log.args.member}`)
        setEvents(prev => [...prev, { type: 'MemberRegistered', ...log }])
      })
    },
  })

  // Listen for loan request events
  useWatchContractEvent({
    ...contract,
    eventName: 'LoanRequested',
    onLogs(logs) {
      logs.forEach(log => {
        toast(`New loan request: ${log.args.amount} ETH`)
        setEvents(prev => [...prev, { type: 'LoanRequested', ...log }])
      })
    },
  })

  // Listen for loan approval events
  useWatchContractEvent({
    ...contract,
    eventName: 'LoanApproved',
    onLogs(logs) {
      logs.forEach(log => {
        toast.success(`Loan approved: ${log.args.amount} ETH`)
        setEvents(prev => [...prev, { type: 'LoanApproved', ...log }])
      })
    },
  })

  // Listen for voting events
  useWatchContractEvent({
    ...contract,
    eventName: 'LoanVoteCast',
    onLogs(logs) {
      logs.forEach(log => {
        const support = log.args.support ? 'YES' : 'NO'
        toast(`Vote cast: ${support} on proposal ${log.args.proposalId}`)
        setEvents(prev => [...prev, { type: 'VoteCast', ...log }])
      })
    },
  })

  return { events, setEvents }
}

