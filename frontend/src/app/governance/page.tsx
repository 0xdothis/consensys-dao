'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import {
  ScaleIcon,
  HandRaisedIcon,
  ChartBarIcon,
  DocumentPlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeSlashIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  FireIcon,
  ArrowUpRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { useUserData, useVoting } from '@/hooks/useDAO'
import { formatDate, calculatePercentage, formatAddress } from '@/lib/utils'
import toast from 'react-hot-toast'

// Mock governance data - in real app this would come from contract
const mockGovernanceData = {
  stats: {
    totalProposals: 47,
    activeProposals: 8,
    passedProposals: 32,
    failedProposals: 7,
    totalVotes: 1847,
    participationRate: 73.2,
    quorumThreshold: 25,
    averageVotingPower: 42.5,
  },
  proposals: [
    {
      id: 1,
      title: 'Upgrade Interest Rate Model',
      description: 'Implement a new dynamic interest rate model that adjusts rates based on utilization and market conditions. This will help optimize lending efficiency and member returns.',
      type: 'protocol',
      proposer: '0x742d35Cc7e5e9E8A8c9A8E8fD0E8fD0E8fD0E8fD',
      status: 'active', // active, passed, failed, pending, cancelled
      votesFor: 156,
      votesAgainst: 23,
      totalVotingPower: 400,
      quorum: 25,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 3,
      startTime: Math.floor(Date.now() / 1000) - 86400 * 2,
      endTime: Math.floor(Date.now() / 1000) + 86400 * 4,
      isPrivate: false,
      requiresExecution: true,
      executionDelay: 86400 * 2, // 2 days
      tags: ['protocol', 'interest-rates', 'defi'],
      discussionUrl: 'https://forum.dao.com/proposal-1',
      hasVoted: false,
      userVote: null,
    },
    {
      id: 2,
      title: 'Treasury Rebalancing Strategy',
      description: 'Reallocate 30% of treasury funds to diversified DeFi protocols including Aave, Compound, and Uniswap V3 LP positions to maximize yield generation.',
      type: 'treasury',
      proposer: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      status: 'active',
      votesFor: 89,
      votesAgainst: 67,
      totalVotingPower: 400,
      quorum: 25,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 5,
      startTime: Math.floor(Date.now() / 1000) - 86400 * 4,
      endTime: Math.floor(Date.now() / 1000) + 86400 * 2,
      isPrivate: false,
      requiresExecution: true,
      executionDelay: 86400 * 7, // 7 days
      tags: ['treasury', 'yield', 'diversification'],
      discussionUrl: 'https://forum.dao.com/proposal-2',
      hasVoted: true,
      userVote: true,
    },
    {
      id: 3,
      title: 'Private Loan Enhancement',
      description: 'Enable private loan functionality with zk-SNARK proofs for borrower privacy while maintaining transparent voting.',
      type: 'feature',
      proposer: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      status: 'pending',
      votesFor: 0,
      votesAgainst: 0,
      totalVotingPower: 400,
      quorum: 25,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 1,
      startTime: Math.floor(Date.now() / 1000) + 86400 * 1,
      endTime: Math.floor(Date.now() / 1000) + 86400 * 8,
      isPrivate: true,
      requiresExecution: false,
      executionDelay: 0,
      tags: ['privacy', 'loans', 'zk-proofs'],
      discussionUrl: 'https://forum.dao.com/proposal-3',
      hasVoted: false,
      userVote: null,
    },
    {
      id: 4,
      title: 'Membership Fee Adjustment',
      description: 'Reduce membership fee from 1 ETH to 0.5 ETH to increase accessibility while maintaining quality standards.',
      type: 'governance',
      proposer: '0x8ba1f109551bD432803012645Hac136c98F74b83',
      status: 'passed',
      votesFor: 245,
      votesAgainst: 45,
      totalVotingPower: 350,
      quorum: 25,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 14,
      startTime: Math.floor(Date.now() / 1000) - 86400 * 13,
      endTime: Math.floor(Date.now() / 1000) - 86400 * 6,
      isPrivate: false,
      requiresExecution: true,
      executionDelay: 86400 * 3,
      tags: ['governance', 'membership', 'accessibility'],
      discussionUrl: 'https://forum.dao.com/proposal-4',
      hasVoted: true,
      userVote: true,
    },
    {
      id: 5,
      title: 'Emergency Fund Allocation',
      description: 'Establish a 50 ETH emergency fund for protocol security and unexpected situations.',
      type: 'security',
      proposer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      status: 'failed',
      votesFor: 67,
      votesAgainst: 178,
      totalVotingPower: 300,
      quorum: 25,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 21,
      startTime: Math.floor(Date.now() / 1000) - 86400 * 20,
      endTime: Math.floor(Date.now() / 1000) - 86400 * 13,
      isPrivate: false,
      requiresExecution: true,
      executionDelay: 86400 * 1,
      tags: ['security', 'emergency', 'treasury'],
      discussionUrl: 'https://forum.dao.com/proposal-5',
      hasVoted: false,
      userVote: null,
    }
  ],
  recentVotes: [
    {
      id: 1,
      proposalId: 2,
      proposalTitle: 'Treasury Rebalancing Strategy',
      voter: '0x742d35Cc7e5e9E8A8c9A8E8fD0E8fD0E8fD0E8fD',
      support: true,
      votingPower: 45,
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 1,
      reason: 'This strategy will help diversify our risk and improve yields'
    },
    {
      id: 2,
      proposalId: 1,
      proposalTitle: 'Upgrade Interest Rate Model',
      voter: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      support: true,
      votingPower: 38,
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
      reason: null
    },
    {
      id: 3,
      proposalId: 1,
      proposalTitle: 'Upgrade Interest Rate Model',
      voter: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      support: false,
      votingPower: 23,
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
      reason: 'Need more analysis on the economic impact'
    }
  ]
}

export default function GovernancePage() {
  const userData = useUserData()
  const { voteOnProposal, isPending: isVoting } = useVoting()
  
  const [activeTab, setActiveTab] = useState('proposals')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [voteSupport, setVoteSupport] = useState<boolean | null>(null)
  const [voteReason, setVoteReason] = useState('')

  const governance = mockGovernanceData

  const filteredProposals = useMemo(() => {
    return governance.proposals.filter(proposal => {
      if (statusFilter !== 'all' && proposal.status !== statusFilter) return false
      if (typeFilter !== 'all' && proposal.type !== typeFilter) return false
      return true
    })
  }, [governance.proposals, statusFilter, typeFilter])

  const handleVote = async (proposalId: number, support: boolean, reason?: string) => {
    try {
      await voteOnProposal(proposalId, support)
      toast.success(`Vote cast ${support ? 'in favor of' : 'against'} the proposal`)
      setShowVoteModal(false)
      setSelectedProposal(null)
      setVoteReason('')
    } catch (error) {
      console.error('Voting failed:', error)
      toast.error('Failed to cast vote')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'passed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed': return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-gray-500" />
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'passed': return 'text-green-600 bg-green-50 border-green-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'protocol': return <FireIcon className="h-4 w-4 text-orange-500" />
      case 'treasury': return <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
      case 'governance': return <ScaleIcon className="h-4 w-4 text-blue-500" />
      case 'security': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case 'feature': return <DocumentPlusIcon className="h-4 w-4 text-purple-500" />
      default: return <TagIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const canVote = (proposal: typeof governance.proposals[0]) => {
    return userData.isMember && 
           proposal.status === 'active' && 
           !proposal.hasVoted &&
           proposal.endTime > Math.floor(Date.now() / 1000)
  }

  if (!userData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ScaleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">Please connect your wallet to access governance.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ScaleIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
                <p className="text-sm text-gray-600">Participate in DAO decision making</p>
              </div>
            </div>
            
            {userData.isMember && (
              <Link href="/governance/create">
                <Button size="sm">
                  <DocumentPlusIcon className="h-4 w-4 mr-2" />
                  Create Proposal
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="mt-6 space-y-6">
            {/* Governance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                  <DocumentPlusIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{governance.stats.totalProposals}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{governance.stats.activeProposals}</div>
                  <p className="text-xs text-muted-foreground">Currently voting</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participation</CardTitle>
                  <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{governance.stats.participationRate}%</div>
                  <p className="text-xs text-muted-foreground">Average turnout</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((governance.stats.passedProposals / (governance.stats.passedProposals + governance.stats.failedProposals)) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Proposals passed</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="protocol">Protocol</option>
                  <option value="treasury">Treasury</option>
                  <option value="governance">Governance</option>
                  <option value="security">Security</option>
                  <option value="feature">Feature</option>
                </select>
              </div>
            </div>

            {/* Proposals List */}
            <div className="space-y-4">
              {filteredProposals.map((proposal) => {
                const votingProgress = proposal.votesFor + proposal.votesAgainst > 0 ?
                  calculatePercentage(proposal.votesFor, proposal.votesFor + proposal.votesAgainst) : 0
                const quorumProgress = calculatePercentage(
                  proposal.votesFor + proposal.votesAgainst,
                  (proposal.totalVotingPower * proposal.quorum) / 100
                )
                const timeLeft = proposal.endTime - Math.floor(Date.now() / 1000)
                
                return (
                  <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getTypeIcon(proposal.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <CardTitle className="text-lg">{proposal.title}</CardTitle>
                              {proposal.isPrivate && (
                                <EyeSlashIcon className="h-5 w-5 text-purple-600" title="Private Proposal" />
                              )}
                            </div>
                            <CardDescription className="text-sm">
                              {proposal.description}
                            </CardDescription>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                by {formatAddress(proposal.proposer)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(proposal.createdAt)}
                              </span>
                              <div className="flex space-x-1">
                                {proposal.tags.map((tag) => (
                                  <span key={tag} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(proposal.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(proposal.status)}
                            <span className="capitalize">{proposal.status}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Voting Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">For</p>
                          <p className="text-xl font-bold text-green-600">{proposal.votesFor}</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">Against</p>
                          <p className="text-xl font-bold text-red-600">{proposal.votesAgainst}</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Quorum</p>
                          <p className="text-xl font-bold text-blue-600">{Math.min(quorumProgress, 100)}%</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">Time Left</p>
                          <p className="text-xl font-bold text-purple-600">
                            {timeLeft > 0 ? `${Math.ceil(timeLeft / 86400)}d` : 'Ended'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      {proposal.status === 'active' && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Approval ({votingProgress}% in favor)</span>
                              <span>{proposal.votesFor + proposal.votesAgainst} votes</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                                style={{ width: `${votingProgress}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Quorum ({quorumProgress}% reached)</span>
                              <span>{proposal.quorum}% required</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(quorumProgress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <ArrowUpRightIcon className="h-4 w-4 mr-2" />
                            Discussion
                          </Button>
                          <Link href={`/governance/${proposal.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>

                        {canVote(proposal) && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => {
                                setSelectedProposal(proposal.id)
                                setVoteSupport(true)
                                setShowVoteModal(true)
                              }}
                              disabled={isVoting}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <HandThumbUpIcon className="h-4 w-4 mr-2" />
                              Vote For
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedProposal(proposal.id)
                                setVoteSupport(false)
                                setShowVoteModal(true)
                              }}
                              disabled={isVoting}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <HandThumbDownIcon className="h-4 w-4 mr-2" />
                              Vote Against
                            </Button>
                          </div>
                        )}

                        {proposal.hasVoted && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span>You voted {proposal.userVote ? 'For' : 'Against'}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 space-y-6">
            <div className="grid gap-6">
              {/* Governance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Governance Analytics</CardTitle>
                  <CardDescription>Key metrics and trends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <HandRaisedIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Total Votes Cast</p>
                      <p className="text-2xl font-bold text-green-600">{governance.stats.totalVotes}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Avg Voting Power</p>
                      <p className="text-2xl font-bold text-blue-600">{governance.stats.averageVotingPower}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <ScaleIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Quorum Threshold</p>
                      <p className="text-2xl font-bold text-purple-600">{governance.stats.quorumThreshold}%</p>
                    </div>
                  </div>

                  {/* Proposal Distribution */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{governance.stats.activeProposals}</p>
                      <p className="text-xs text-gray-600">Active</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-green-600">{governance.stats.passedProposals}</p>
                      <p className="text-xs text-gray-600">Passed</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-red-600">{governance.stats.failedProposals}</p>
                      <p className="text-xs text-gray-600">Failed</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">
                        {governance.stats.totalProposals - governance.stats.activeProposals - governance.stats.passedProposals - governance.stats.failedProposals}
                      </p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-gray-600">{governance.stats.totalProposals}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proposal Types Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Types</CardTitle>
                    <CardDescription>Distribution by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['protocol', 'treasury', 'governance', 'security', 'feature'].map((type) => {
                        const count = governance.proposals.filter(p => p.type === type).length
                        const percentage = Math.round((count / governance.proposals.length) * 100)
                        
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(type)}
                              <span className="text-sm font-medium capitalize">{type}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary-500 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-8">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Voting Patterns</CardTitle>
                    <CardDescription>Member engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Participation</span>
                        <span className="text-lg font-bold">{governance.stats.participationRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${governance.stats.participationRate}%` }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">Active Members</p>
                          <p className="text-lg font-bold">
                            {Math.round((governance.stats.totalVotes / governance.stats.totalProposals))}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">Avg Votes/Proposal</p>
                          <p className="text-lg font-bold">
                            {Math.round(governance.stats.totalVotes / governance.stats.totalProposals)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Voting Activity</CardTitle>
                <CardDescription>Latest votes cast by DAO members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {governance.recentVotes.map((vote) => (
                    <div key={vote.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          vote.support ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          {vote.support ? (
                            <HandThumbUpIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <HandThumbDownIcon className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatAddress(vote.voter)} voted {vote.support ? 'For' : 'Against'}
                          </p>
                          <p className="text-sm text-gray-600">{vote.proposalTitle}</p>
                          {vote.reason && (
                            <p className="text-sm text-gray-500 italic mt-1">&quot;{vote.reason}&quot;</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{vote.votingPower} votes</p>
                        <p className="text-sm text-gray-500">{formatDate(vote.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vote Modal */}
      {showVoteModal && selectedProposal && voteSupport !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
              <CardDescription>
                Voting {voteSupport ? 'For' : 'Against'} proposal #{selectedProposal}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  placeholder="Explain your vote..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  value={voteReason}
                  onChange={(e) => setVoteReason(e.target.value)}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  Your voting power: {userData.votingWeight} votes
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleVote(selectedProposal, voteSupport, voteReason)}
                  disabled={isVoting}
                  className="flex-1"
                >
                  {isVoting ? 'Casting Vote...' : `Vote ${voteSupport ? 'For' : 'Against'}`}
                </Button>
                <Button
                  onClick={() => {
                    setShowVoteModal(false)
                    setSelectedProposal(null)
                    setVoteSupport(null)
                    setVoteReason('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
