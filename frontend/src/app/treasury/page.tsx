'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BanknotesIcon,
  ChartBarIcon,
  CubeTransparentIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  EyeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { useUserData, useRewards } from '@/hooks/useDAO'
import { formatEther, formatDate, calculatePercentage } from '@/lib/utils'
import toast from 'react-hot-toast'

// Mock treasury data - in real app this would come from contract
const mockTreasuryData = {
  totalBalance: BigInt('125000000000000000000'), // 125 ETH
  availableBalance: BigInt('85000000000000000000'), // 85 ETH
  totalStaked: BigInt('40000000000000000000'), // 40 ETH
  totalYieldGenerated: BigInt('8500000000000000000'), // 8.5 ETH
  averageYield: 6.8, // 6.8% APY
  operators: [
    {
      id: 1,
      name: 'Lido Finance',
      address: '0x388C818CA8B9251b393131C08a736A67ccB19297',
      stakedAmount: BigInt('25000000000000000000'), // 25 ETH
      yield: 7.2,
      status: 'active',
      lastReward: BigInt('180000000000000000'), // 0.18 ETH
      validatorCount: 1,
      slashingRisk: 'low',
      commission: 10, // 10%
      joinedDate: Math.floor(Date.now() / 1000) - 86400 * 90,
    },
    {
      id: 2,
      name: 'Rocket Pool',
      address: '0xDD3f50F8A6CafbE9b31a427582963f465E745AF8',
      stakedAmount: BigInt('15000000000000000000'), // 15 ETH
      yield: 6.4,
      status: 'active',
      lastReward: BigInt('96000000000000000'), // 0.096 ETH
      validatorCount: 0,
      slashingRisk: 'medium',
      commission: 15, // 15%
      joinedDate: Math.floor(Date.now() / 1000) - 86400 * 60,
    },
    {
      id: 3,
      name: 'Stakewise V3',
      address: '0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2',
      stakedAmount: BigInt('0'), // 0 ETH
      yield: 6.9,
      status: 'pending',
      lastReward: BigInt('0'),
      validatorCount: 0,
      slashingRisk: 'low',
      commission: 8, // 8%
      joinedDate: Math.floor(Date.now() / 1000) - 86400 * 7,
    }
  ],
  recentTransactions: [
    {
      id: 1,
      type: 'stake',
      amount: BigInt('5000000000000000000'), // 5 ETH
      operator: 'Lido Finance',
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
      status: 'completed',
      txHash: '0x1234567890abcdef1234567890abcdef12345678'
    },
    {
      id: 2,
      type: 'reward',
      amount: BigInt('280000000000000000'), // 0.28 ETH
      operator: 'Multiple',
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
      status: 'completed',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef12'
    },
    {
      id: 3,
      type: 'unstake',
      amount: BigInt('3000000000000000000'), // 3 ETH
      operator: 'Rocket Pool',
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 7,
      status: 'pending',
      txHash: '0xfedcba0987654321fedcba0987654321fedcba09'
    }
  ],
  yieldDistribution: [
    { period: 'Jan 2024', yield: BigInt('1200000000000000000'), distributed: BigInt('1200000000000000000') },
    { period: 'Feb 2024', yield: BigInt('1450000000000000000'), distributed: BigInt('1450000000000000000') },
    { period: 'Mar 2024', yield: BigInt('1380000000000000000'), distributed: BigInt('1380000000000000000') },
    { period: 'Apr 2024', yield: BigInt('1520000000000000000'), distributed: BigInt('1520000000000000000') },
    { period: 'May 2024', yield: BigInt('1680000000000000000'), distributed: BigInt('1280000000000000000') },
    { period: 'Jun 2024', yield: BigInt('1750000000000000000'), distributed: BigInt('0') },
  ]
}

export default function TreasuryPage() {
  const userData = useUserData()
  const { claimRewards, claimYield, isPending: isClaimPending } = useRewards()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showUnstakeModal, setShowUnstakeModal] = useState(false)

  const treasury = mockTreasuryData

  const totalPendingYield = useMemo(() => {
    return treasury.yieldDistribution
      .filter(period => period.distributed < period.yield)
      .reduce((sum, period) => sum + (period.yield - period.distributed), BigInt(0))
  }, [treasury.yieldDistribution])

  const handleStake = async (operatorId: number, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      // Mock implementation - would interact with restaking contract
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Staked ${amount} ETH successfully`)
      setShowStakeModal(false)
      setStakeAmount('')
    } catch (error) {
      console.error('Staking failed:', error)
      toast.error('Failed to stake tokens')
    }
  }

  const handleUnstake = async (operatorId: number, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      // Mock implementation - would interact with restaking contract
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Unstaking ${amount} ETH initiated`)
      setShowUnstakeModal(false)
      setUnstakeAmount('')
    } catch (error) {
      console.error('Unstaking failed:', error)
      toast.error('Failed to unstake tokens')
    }
  }

  const handleClaimRewards = async () => {
    try {
      await claimRewards()
      toast.success('Rewards claimed successfully!')
    } catch (error) {
      console.error('Failed to claim rewards:', error)
    }
  }

  const handleClaimYield = async () => {
    try {
      await claimYield()
      toast.success('Yield claimed successfully!')
    } catch (error) {
      console.error('Failed to claim yield:', error)
    }
  }

  const getOperatorStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'inactive': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (!userData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">Please connect your wallet to access the treasury.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userData.isMember && !userData.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">Only DAO members can access treasury information.</p>
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
              <BanknotesIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Treasury & Restaking</h1>
                <p className="text-sm text-gray-600">Manage DAO treasury and restaking operations</p>
              </div>
            </div>
            
            {(userData.isMember || userData.isAdmin) && (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleClaimRewards}
                  disabled={isClaimPending || userData.pendingRewards === BigInt(0)}
                  variant="outline"
                  size="sm"
                >
                  <GiftIcon className="h-4 w-4 mr-2" />
                  Claim Rewards
                </Button>
                <Button
                  onClick={handleClaimYield}
                  disabled={isClaimPending || totalPendingYield === BigInt(0)}
                  size="sm"
                >
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  Claim Yield
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="operators">Operators</TabsTrigger>
            <TabsTrigger value="yield">Yield</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Treasury Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <BanknotesIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatEther(treasury.totalBalance)} ETH</div>
                  <p className="text-xs text-muted-foreground">Treasury holdings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                  <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatEther(treasury.availableBalance)} ETH</div>
                  <p className="text-xs text-muted-foreground">Ready for loans</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Staked</CardTitle>
                  <CubeTransparentIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatEther(treasury.totalStaked)} ETH</div>
                  <p className="text-xs text-muted-foreground">
                    {calculatePercentage(Number(treasury.totalStaked), Number(treasury.totalBalance))}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Yield</CardTitle>
                  <ArrowTrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{treasury.averageYield}%</div>
                  <p className="text-xs text-muted-foreground">Annual yield</p>
                </CardContent>
              </Card>
            </div>

            {/* Yield Distribution Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Yield Distribution</CardTitle>
                <CardDescription>Monthly yield generation and distribution status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {treasury.yieldDistribution.slice(-6).map((period, index) => {
                    const pendingAmount = period.yield - period.distributed
                    const isFullyDistributed = pendingAmount === BigInt(0)
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{period.period}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Generated: {formatEther(period.yield)} ETH</p>
                            <p className="text-sm text-gray-600">Distributed: {formatEther(period.distributed)} ETH</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {pendingAmount > 0 && (
                            <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                              <span className="text-xs font-medium text-yellow-800">
                                {formatEther(pendingAmount)} ETH pending
                              </span>
                            </div>
                          )}
                          {isFullyDistributed ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <ClockIcon className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operators" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Restaking Operators</h3>
                <p className="text-sm text-gray-600">Manage staking across different operators</p>
              </div>
              {userData.isAdmin && (
                <Button size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Operator
                </Button>
              )}
            </div>

            <div className="grid gap-6">
              {treasury.operators.map((operator) => (
                <Card key={operator.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {operator.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{operator.name}</span>
                            {getOperatorStatusIcon(operator.status)}
                          </CardTitle>
                          <CardDescription>{operator.address}</CardDescription>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getRiskColor(operator.slashingRisk)}`}>
                        {operator.slashingRisk} risk
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Staked</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatEther(operator.stakedAmount)} ETH
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Yield</p>
                        <p className="text-xl font-bold text-green-600">{operator.yield}%</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Commission</p>
                        <p className="text-xl font-bold text-purple-600">{operator.commission}%</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Last Reward</p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatEther(operator.lastReward)} ETH
                        </p>
                      </div>
                    </div>

                    {operator.status === 'active' && (userData.isAdmin || userData.isMember) && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedOperator(operator.id)
                            setShowStakeModal(true)
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Stake More
                        </Button>
                        {operator.stakedAmount > 0 && (
                          <Button
                            onClick={() => {
                              setSelectedOperator(operator.id)
                              setShowUnstakeModal(true)
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <MinusIcon className="h-4 w-4 mr-2" />
                            Unstake
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Joined {formatDate(operator.joinedDate)} • {operator.validatorCount} validators
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="yield" className="mt-6 space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Yield Overview</CardTitle>
                  <CardDescription>Track yield generation and distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <ArrowTrendingUpIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Total Yield Generated</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatEther(treasury.totalYieldGenerated)} ETH
                      </p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <ClockIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Pending Distribution</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatEther(totalPendingYield)} ETH
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Average Monthly</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatEther(treasury.totalYieldGenerated / BigInt(treasury.yieldDistribution.length))} ETH
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution History</CardTitle>
                  <CardDescription>Monthly yield distribution details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {treasury.yieldDistribution.map((period, index) => {
                      const pendingAmount = period.yield - period.distributed
                      const distributionRate = period.yield > 0 ? 
                        calculatePercentage(Number(period.distributed), Number(period.yield)) : 0
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{period.period}</p>
                              <p className="text-sm text-gray-600">
                                Generated: {formatEther(period.yield)} ETH
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {formatEther(period.distributed)} ETH
                              </p>
                              <p className="text-sm text-gray-600">{distributionRate}% distributed</p>
                            </div>
                            <div className="w-16">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${distributionRate}%` }}
                                />
                              </div>
                            </div>
                            {pendingAmount > 0 && (
                              <div className="px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-medium text-yellow-800">
                                Pending
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Treasury and restaking transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {treasury.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          tx.type === 'stake' ? 'bg-green-50' :
                          tx.type === 'unstake' ? 'bg-red-50' : 'bg-blue-50'
                        }`}>
                          {tx.type === 'stake' ? (
                            <ArrowTrendingUpIcon className={`h-5 w-5 ${
                              tx.type === 'stake' ? 'text-green-600' : ''
                            }`} />
                          ) : tx.type === 'unstake' ? (
                            <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                          ) : (
                            <GiftIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {tx.type} {tx.type !== 'reward' && `to ${tx.operator}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(tx.timestamp)} • {formatEther(tx.amount)} ETH
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'completed' 
                            ? 'text-green-600 bg-green-50 border-green-200' 
                            : 'text-yellow-600 bg-yellow-50 border-yellow-200'
                        } border`}>
                          {tx.status}
                        </div>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stake Modal */}
      {showStakeModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Stake ETH</CardTitle>
              <CardDescription>
                Stake ETH with {treasury.operators.find(op => op.id === selectedOperator)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleStake(selectedOperator, stakeAmount)}
                  className="flex-1"
                >
                  Confirm Stake
                </Button>
                <Button
                  onClick={() => {
                    setShowStakeModal(false)
                    setSelectedOperator(null)
                    setStakeAmount('')
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

      {/* Unstake Modal */}
      {showUnstakeModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Unstake ETH</CardTitle>
              <CardDescription>
                Unstake ETH from {treasury.operators.find(op => op.id === selectedOperator)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Unstaking may take 7-14 days to process depending on the operator.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleUnstake(selectedOperator, unstakeAmount)}
                  className="flex-1"
                >
                  Confirm Unstake
                </Button>
                <Button
                  onClick={() => {
                    setShowUnstakeModal(false)
                    setSelectedOperator(null)
                    setUnstakeAmount('')
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
