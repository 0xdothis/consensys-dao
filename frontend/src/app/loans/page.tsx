'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Banknote,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  FileText,
} from 'lucide-react'
import { useUserData, useVoting } from '@/hooks/useDAO'
import { formatEther, formatDate, formatAddress, calculatePercentage } from '@/lib/utils'
import { PROPOSAL_STATUS_LABELS } from '@/constants'
import toast from 'react-hot-toast'

// Mock data for loan proposals - in real app this would come from contract
const mockLoanProposals = [
  {
    id: 1,
    borrower: '0x742d35Cc7e5e9E8A8c9A8E8fD0E8fD0E8fD0E8fD',
    amount: BigInt('5000000000000000000'), // 5 ETH
    purpose: 'Expanding my DeFi development startup to build new yield farming protocols',
    interestRate: 850, // 8.5% in basis points
    status: 2, // IN_VOTING
    votesFor: 12,
    votesAgainst: 3,
    creationTime: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
    votingStartTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    votingEndTime: Math.floor(Date.now() / 1000) + 86400 * 6, // 6 days from now
    isPrivate: false,
    documentHash: 'QmYwAPJzv5CZsnAzt8auVvzgWiVwiWp2cGVJqRDJXjdMJ',
    hasVoted: false,
  },
  {
    id: 2,
    borrower: '0x8ba1f109551bD432803012645Hac136c9.dABCE',
    amount: BigInt('2500000000000000000'), // 2.5 ETH
    purpose: 'Working capital for my NFT marketplace platform development',
    interestRate: 750, // 7.5% in basis points
    status: 1, // IN_EDITING
    votesFor: 0,
    votesAgainst: 0,
    creationTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    votingStartTime: 0,
    votingEndTime: 0,
    isPrivate: false,
    documentHash: '',
    hasVoted: false,
  },
  {
    id: 3,
    borrower: '0x123456789abcdef123456789abcdef123456789a',
    amount: BigInt('1000000000000000000'), // 1 ETH (placeholder for private)
    purpose: 'Confidential business expansion',
    interestRate: 950, // 9.5% in basis points
    status: 2, // IN_VOTING
    votesFor: 8,
    votesAgainst: 7,
    creationTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
    votingStartTime: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
    votingEndTime: Math.floor(Date.now() / 1000) + 86400 * 5, // 5 days from now
    isPrivate: true,
    documentHash: '',
    hasVoted: true,
  },
  {
    id: 4,
    borrower: '0xdef123456789abcdef123456789abcdef12345678',
    amount: BigInt('7500000000000000000'), // 7.5 ETH
    purpose: 'Purchasing mining equipment for sustainable crypto mining operation',
    interestRate: 900, // 9% in basis points
    status: 3, // APPROVED
    votesFor: 18,
    votesAgainst: 2,
    creationTime: Math.floor(Date.now() / 1000) - 86400 * 10, // 10 days ago
    votingStartTime: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
    votingEndTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    isPrivate: false,
    documentHash: 'QmXoYpZvQeFiUKBNGYZ8JZ8XoYpZvQeFiUKBNGYZ8JZ8',
    hasVoted: true,
  },
]

export default function LoansPage() {
  const userData = useUserData()
  const { voteOnProposal, isPending } = useVoting()
  
  const [proposals] = useState(mockLoanProposals)
  const [filteredProposals, setFilteredProposals] = useState(mockLoanProposals)
  const [filters, setFilters] = useState({
    status: 'all',
    privacy: 'all',
    search: '',
  })

  useEffect(() => {
    let filtered = proposals

    // Filter by status
    if (filters.status !== 'all') {
      const statusMap = {
        'editing': 1,
        'voting': 2,
        'approved': 3,
        'rejected': 4,
      }
      filtered = filtered.filter(p => p.status === statusMap[filters.status as keyof typeof statusMap])
    }

    // Filter by privacy
    if (filters.privacy !== 'all') {
      filtered = filtered.filter(p => {
        if (filters.privacy === 'public') return !p.isPrivate
        if (filters.privacy === 'private') return p.isPrivate
        return true
      })
    }

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(p => 
        p.purpose.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.borrower.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    setFilteredProposals(filtered)
  }, [filters, proposals])

  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await voteOnProposal(proposalId, support)
      toast.success(`Vote cast ${support ? 'in favor' : 'against'} proposal ${proposalId}`)
    } catch (error) {
      console.error('Voting failed:', error)
      toast.error('Failed to cast vote')
    }
  }

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: // IN_EDITING
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 2: // IN_VOTING
        return <Clock className="h-5 w-5 text-blue-500" />
      case 3: // APPROVED
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 4: // REJECTED
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 2: return 'text-blue-600 bg-blue-50 border-blue-200'
      case 3: return 'text-green-600 bg-green-50 border-green-200'
      case 4: return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const canVote = (proposal: typeof mockLoanProposals[0]) => {
    return userData.isMember && 
           proposal.status === 2 && 
           !proposal.hasVoted && 
           proposal.borrower !== userData.address &&
           proposal.votingEndTime > Math.floor(Date.now() / 1000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Loan Proposals
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Browse and vote on member loan requests
                </p>
              </div>
              {userData.isMember && !userData.hasActiveLoan && (
                <Link href="/loans/request">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    Request Loan
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <Card className="mb-12 border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg font-semibold">
              <Filter className="mr-2 h-5 w-5 text-gray-600" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Statuses</option>
                  <option value="editing">In Editing</option>
                  <option value="voting">In Voting</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Privacy</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  value={filters.privacy}
                  onChange={(e) => setFilters(prev => ({ ...prev, privacy: e.target.value }))}
                >
                  <option value="all">All Types</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by purpose or borrower address..."
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
            <p className="text-sm text-gray-600 mt-1">Current lending activity and proposal statistics</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mr-4">
                    <Banknote className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                    <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 mr-4">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Voting</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proposals.filter(p => p.status === 2).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 mr-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proposals.filter(p => p.status === 3).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 mr-4">
                    <EyeOff className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Private</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {proposals.filter(p => p.isPrivate).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-6">
          {filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
                <p className="text-gray-600">
                  {filters.status !== 'all' || filters.privacy !== 'all' || filters.search
                    ? 'Try adjusting your filters to see more proposals.'
                    : 'Be the first to request a loan!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getStatusIcon(proposal.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-lg">
                            Loan Proposal #{proposal.id}
                          </CardTitle>
                          {proposal.isPrivate && (
                            <EyeOff className="h-4 w-4 text-purple-600" title="Private Loan" />
                          )}
                          {proposal.documentHash && (
                            <FileText className="h-4 w-4 text-blue-600" title="Has Documents" />
                          )}
                        </div>
                        <CardDescription>
                          By {formatAddress(proposal.borrower)} • Created {formatDate(proposal.creationTime)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(proposal.status)}`}>
                      {PROPOSAL_STATUS_LABELS[proposal.status as keyof typeof PROPOSAL_STATUS_LABELS] || 'Unknown'}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount Requested</p>
                      <p className="font-semibold">
                        {proposal.isPrivate ? 'Private' : `${formatEther(proposal.amount)} ETH`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-semibold">{(proposal.interestRate / 100).toFixed(2)}% APR</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Votes For</p>
                      <p className="font-semibold text-green-600">{proposal.votesFor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Votes Against</p>
                      <p className="font-semibold text-red-600">{proposal.votesAgainst}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Purpose</p>
                    <p className="text-gray-900">
                      {proposal.isPrivate ? 'Details are private' : proposal.purpose}
                    </p>
                  </div>

                  {/* Voting Progress */}
                  {proposal.status === 2 && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Voting Progress</span>
                        <span>
                          {proposal.votesFor + proposal.votesAgainst} votes • 
                          {Math.ceil((proposal.votingEndTime - Math.floor(Date.now() / 1000)) / 86400)} days left
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${calculatePercentage(
                              proposal.votesFor,
                              proposal.votesFor + proposal.votesAgainst
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex space-x-2">
                      <Link href={`/loans/${proposal.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {proposal.documentHash && (
                        <Button variant="outline" size="sm" disabled>
                          <FileText className="h-4 w-4 mr-2" />
                          Documents
                        </Button>
                      )}
                    </div>

                    {canVote(proposal) && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(proposal.id, false)}
                          disabled={isPending}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Vote Against
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleVote(proposal.id, true)}
                          disabled={isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Vote For
                        </Button>
                      </div>
                    )}

                    {proposal.hasVoted && (
                      <div className="text-sm text-gray-600 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        You have voted
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
