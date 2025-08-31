'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import {
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import { useDAOStats, useUserData, useRewards, useDAOEvents } from '@/hooks/useDAO'
import { formatEther, formatDate, formatAddress } from '@/lib/utils'
import { MEMBER_STATUS_LABELS } from '@/constants'
import toast from 'react-hot-toast'
import NotificationCenter from '@/components/NotificationCenter'
import { useIsMobile, useResponsiveCardLayout } from '@/lib/responsive'

export default function DashboardPage() {
  const router = useRouter()
  const stats = useDAOStats()
  const userData = useUserData()
  const { claimRewards, claimYield, isPending, isSuccess } = useRewards()
  const { events } = useDAOEvents()
  const isMobile = useIsMobile()
  const { getCardGridClass } = useResponsiveCardLayout()

  useEffect(() => {
    if (userData.isConnected && !userData.isMember) {
      router.push('/register')
    }
  }, [userData.isConnected, userData.isMember, router])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Rewards claimed successfully!')
    }
  }, [isSuccess])

  const handleClaimRewards = async () => {
    try {
      await claimRewards()
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      toast.error('Failed to claim rewards')
    }
  }

  const handleClaimYield = async () => {
    try {
      await claimYield()
    } catch (error) {
      console.error('Failed to claim yield:', error)
      toast.error('Failed to claim yield')
    }
  }

  if (!userData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Dashboard</CardTitle>
            <CardDescription>
              Connect your wallet to access the member dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button onClick={openConnectModal} className="w-full" size="lg">
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userData.isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Not a Member</CardTitle>
            <CardDescription>
              You need to be a DAO member to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/register" className="w-full">
              <Button className="w-full" size="lg">
                Join the DAO
              </Button>
            </Link>
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Request Loan',
      description: 'Submit a new loan proposal',
      icon: BanknotesIcon,
      href: '/loans/request',
      color: 'text-green-600',
    },
    {
      title: 'View Loans',
      description: 'Browse and vote on loan proposals',
      icon: UsersIcon,
      href: '/loans',
      color: 'text-blue-600',
    },
    {
      title: 'Governance',
      description: 'Vote on proposals and participate in DAO decisions',
      icon: ChartBarIcon,
      href: '/governance',
      color: 'text-indigo-600',
    },
    {
      title: 'Treasury',
      description: 'View treasury status and restaking',
      icon: ChartBarIcon,
      href: '/treasury',
      color: 'text-purple-600',
    },
    {
      title: 'Privacy Settings',
      description: 'Manage privacy preferences',
      icon: ShieldCheckIcon,
      href: '/privacy',
      color: 'text-yellow-600',
    },
    ...(userData.member?.status === 3 ? [{
      title: 'Admin Panel',
      description: 'Manage DAO operations and configuration',
      icon: ShieldCheckIcon,
      href: '/admin',
      color: 'text-red-600',
    }] : [])
  ]

  const memberStatusColor = userData.member?.status === 1 ? 'text-green-600' : 'text-gray-600'
  const memberStatusBg = userData.member?.status === 1 ? 'bg-green-50' : 'bg-gray-50'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="responsive-container py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Member Dashboard</h1>
              <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>Welcome back to UnifiedLendingDAO</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationCenter />
              {!isMobile && <ConnectButton />}
            </div>
          </div>
          {isMobile && (
            <div className="mt-4">
              <ConnectButton />
            </div>
          )}
        </div>
      </header>

      <div className="responsive-container py-4 sm:py-8">
        {/* Member Status */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${memberStatusBg}`}>
                    <CheckCircleIcon className={`h-8 w-8 ${memberStatusColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatAddress(userData.address || '')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Status: {MEMBER_STATUS_LABELS[userData.member?.status || 0]}
                    </p>
                    <p className="text-sm text-gray-500">
                      Member since: {formatDate(userData.member?.joinDate || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Voting Weight</div>
                  <div className="text-2xl font-bold text-gray-900">{userData.votingWeight}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-3 gap-8'}`}>
          {/* Main Content */}
          <div className={`${isMobile ? 'space-y-4' : 'lg:col-span-2 space-y-8'}`}>
            {/* Stats Cards */}
            <div className={`grid ${getCardGridClass(4)} gap-3 sm:gap-6`}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-50 mr-4">
                      <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Share Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatEther(userData.member?.shareBalance || BigInt(0))} ETH
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-50 mr-4">
                      <TrophyIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Rewards</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatEther(userData.pendingRewards)} ETH
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-50 mr-4">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Yield Available</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatEther(userData.pendingYield)} ETH
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-50 mr-4">
                      <BanknotesIcon className={`h-8 w-8 ${userData.hasActiveLoan ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Loan</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userData.hasActiveLoan ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rewards Section */}
            {(userData.pendingRewards > BigInt(0) || userData.pendingYield > BigInt(0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrophyIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    Available Rewards
                  </CardTitle>
                  <CardDescription>
                    You have rewards available to claim
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Governance Rewards</p>
                      <p className="text-sm text-green-700">{formatEther(userData.pendingRewards)} ETH</p>
                    </div>
                    <Button 
                      onClick={handleClaimRewards} 
                      disabled={userData.pendingRewards === BigInt(0) || isPending}
                      size="sm"
                    >
                      {isPending ? 'Claiming...' : 'Claim'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-900">Restaking Yield</p>
                      <p className="text-sm text-purple-700">{formatEther(userData.pendingYield)} ETH</p>
                    </div>
                    <Button 
                      onClick={handleClaimYield} 
                      disabled={userData.pendingYield === BigInt(0) || isPending}
                      variant="outline"
                      size="sm"
                    >
                      {isPending ? 'Claiming...' : 'Claim'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and features you can access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link key={action.title} href={action.href}>
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <Icon className={`h-6 w-6 ${action.color} mt-1`} />
                            <div>
                              <h3 className="font-medium text-gray-900">{action.title}</h3>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                            <ArrowUpRightIcon className="h-4 w-4 text-gray-400 ml-auto" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className={`${isMobile ? 'space-y-4' : 'space-y-8'}`}>
            {/* DAO Overview */}
            <Card>
              <CardHeader>
                <CardTitle>DAO Overview</CardTitle>
                <CardDescription>Current DAO statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <span className="font-medium">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Members</span>
                  <span className="font-medium">{stats.activeMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Treasury Balance</span>
                  <span className="font-medium">{formatEther(stats.treasuryBalance)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Yield</span>
                  <span className="font-medium">{formatEther(stats.totalYieldGenerated)} ETH</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature Status */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Status</CardTitle>
                <CardDescription>Available DAO features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ENS Voting</span>
                  <div className={`w-2 h-2 rounded-full ${stats.features.ensVoting ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Document Storage</span>
                  <div className={`w-2 h-2 rounded-full ${stats.features.documentStorage ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Private Voting</span>
                  <div className={`w-2 h-2 rounded-full ${stats.features.privateVoting ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidential Loans</span>
                  <div className={`w-2 h-2 rounded-full ${stats.features.confidentialLoans ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Restaking</span>
                  <div className={`w-2 h-2 rounded-full ${stats.features.restaking ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest DAO events</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.slice(0, 5).map((event, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-gray-600">
                          {String(event?.type || 'Unknown')} event occurred
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
