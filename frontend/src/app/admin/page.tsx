'use client'

import { useState, useEffect } from 'react'
import {
  CogIcon,
  ShieldCheckIcon,
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon,
  LockClosedIcon,
  ServerIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { useUserData, useDAOStats } from '@/hooks/useDAO'
import { formatEther, formatAddress } from '@/lib/utils'

interface AdminStats {
  totalMembers: number
  activeLoans: number
  totalTreasuryValue: bigint
  pendingProposals: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastUpdate: Date
}

interface FeatureToggle {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'lending' | 'governance' | 'privacy' | 'system'
  requiresRestart?: boolean
}

interface PendingAction {
  id: string
  type: 'member_approval' | 'operator_approval' | 'emergency_action' | 'upgrade'
  title: string
  description: string
  submittedAt: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  data?: Record<string, unknown>
}

interface SystemMetric {
  name: string
  value: string | number
  status: 'good' | 'warning' | 'error'
  description: string
}

export default function AdminPage() {
  const userData = useUserData()
  const stats = useDAOStats()
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'members' | 'system' | 'security'>('overview')
  const [loading, setLoading] = useState(false)

  // Mock admin data
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalMembers: 1247,
    activeLoans: 23,
    totalTreasuryValue: BigInt('450000000000000000000'), // 450 ETH
    pendingProposals: 5,
    systemHealth: 'healthy',
    lastUpdate: new Date()
  })

  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>([
    {
      id: 'confidential-loans',
      name: 'Confidential Loans',
      description: 'Allow members to create private loan proposals',
      enabled: true,
      category: 'privacy'
    },
    {
      id: 'document-storage',
      name: 'Document Storage',
      description: 'Enable IPFS document upload and storage',
      enabled: true,
      category: 'system'
    },
    {
      id: 'private-voting',
      name: 'Private Voting',
      description: 'Allow encrypted voting with zero-knowledge proofs',
      enabled: true,
      category: 'privacy'
    },
    {
      id: 'restaking',
      name: 'Restaking Operations',
      description: 'Enable treasury restaking and yield generation',
      enabled: true,
      category: 'lending'
    },
    {
      id: 'emergency-pause',
      name: 'Emergency Pause',
      description: 'Allow emergency pause of all operations',
      enabled: false,
      category: 'system',
      requiresRestart: true
    },
    {
      id: 'auto-liquidation',
      name: 'Auto Liquidation',
      description: 'Automatically liquidate defaulted loans',
      enabled: false,
      category: 'lending'
    }
  ])

  const [pendingActions, setPendingActions] = useState<PendingAction[]>([
    {
      id: 'action-1',
      type: 'member_approval',
      title: 'New Member Application',
      description: 'John Doe (0x1234...5678) applied for membership',
      submittedAt: new Date('2024-08-30'),
      priority: 'medium'
    },
    {
      id: 'action-2',
      type: 'operator_approval',
      title: 'Restaking Operator Approval',
      description: 'Lido submitted request to become restaking operator',
      submittedAt: new Date('2024-08-29'),
      priority: 'high'
    },
    {
      id: 'action-3',
      type: 'emergency_action',
      title: 'Security Alert',
      description: 'Unusual voting pattern detected on Proposal #45',
      submittedAt: new Date('2024-08-31'),
      priority: 'critical'
    }
  ])

  const systemMetrics: SystemMetric[] = [
    {
      name: 'Contract Balance',
      value: formatEther(adminStats.totalTreasuryValue),
      status: 'good',
      description: 'Total ETH in treasury contract'
    },
    {
      name: 'Active Members',
      value: adminStats.totalMembers,
      status: 'good',
      description: 'Total verified DAO members'
    },
    {
      name: 'Loan Default Rate',
      value: '2.3%',
      status: 'good',
      description: 'Percentage of defaulted loans'
    },
    {
      name: 'Gas Usage',
      value: '12.5M',
      status: 'warning',
      description: 'Total gas used this month'
    },
    {
      name: 'IPFS Storage',
      value: '1.2TB',
      status: 'good',
      description: 'Total document storage used'
    },
    {
      name: 'Network Health',
      value: '99.8%',
      status: 'good',
      description: 'Uptime percentage'
    }
  ]

  // Check if user is admin
  const isAdmin = userData.member?.status === 3 // Assuming 3 is admin status
  
  useEffect(() => {
    if (!userData.isConnected || !isAdmin) {
      // Redirect non-admins
    }
  }, [userData.isConnected, isAdmin])

  const toggleFeature = (featureId: string) => {
    setFeatureToggles(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    )
  }

  const handlePendingAction = (actionId: string, action: 'approve' | 'reject') => {
    setPendingActions(prev => prev.filter(item => item.id !== actionId))
    // In real implementation, this would make contract calls
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* System Health */}
      <div className={`rounded-lg p-6 ${
        adminStats.systemHealth === 'healthy' ? 'bg-green-50 border-green-200' :
        adminStats.systemHealth === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      } border`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            adminStats.systemHealth === 'healthy' ? 'bg-green-100' :
            adminStats.systemHealth === 'warning' ? 'bg-yellow-100' :
            'bg-red-100'
          }`}>
            <ServerIcon className={`h-6 w-6 ${
              adminStats.systemHealth === 'healthy' ? 'text-green-600' :
              adminStats.systemHealth === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${
              adminStats.systemHealth === 'healthy' ? 'text-green-900' :
              adminStats.systemHealth === 'warning' ? 'text-yellow-900' :
              'text-red-900'
            }`}>
              System Status: {adminStats.systemHealth.charAt(0).toUpperCase() + adminStats.systemHealth.slice(1)}
            </h3>
            <p className={`text-sm ${
              adminStats.systemHealth === 'healthy' ? 'text-green-700' :
              adminStats.systemHealth === 'warning' ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              Last updated: {adminStats.lastUpdate.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemMetrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{metric.name}</h4>
              <div className={`w-3 h-3 rounded-full ${
                metric.status === 'good' ? 'bg-green-500' :
                metric.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
            </div>
            <div className={`text-2xl font-bold mt-2 ${getStatusColor(metric.status)}`}>
              {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Pending Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Admin Actions ({pendingActions.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {pendingActions.map((action) => (
            <div key={action.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(action.priority)}`}>
                      {action.priority.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Submitted: {action.submittedAt.toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePendingAction(action.id, 'approve')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handlePendingAction(action.id, 'reject')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pendingActions.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No pending actions requiring admin approval
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderFeaturesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enable or disable system features for all DAO members
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Apply Changes
        </button>
      </div>

      {/* Feature Categories */}
      {['lending', 'governance', 'privacy', 'system'].map(category => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
              {category} Features
            </h4>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {featureToggles.filter(feature => feature.category === category).map((feature) => (
              <div key={feature.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {feature.name}
                      </h5>
                      {feature.requiresRestart && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                          Requires Restart
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${
                      feature.enabled ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {feature.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        feature.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          feature.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* Member Management Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Total Members</h4>
          <div className="text-2xl font-bold text-blue-600">{adminStats.totalMembers}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pending Applications</h4>
          <div className="text-2xl font-bold text-orange-600">
            {pendingActions.filter(a => a.type === 'member_approval').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Active This Month</h4>
          <div className="text-2xl font-bold text-green-600">892</div>
        </div>
      </div>

      {/* Member Search and Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Member Management</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search members..."
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>
        </div>
        
        {/* Member List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatAddress(`0x${(i + 1).toString(16).padStart(40, '0')}`)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Joined: {new Date(2024, 0, i + 1).toLocaleDateString()} • 
                      Voting Weight: {10 + i * 5} • 
                      Status: Active
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                  <button className="text-orange-600 hover:text-orange-800 text-sm">Suspend</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSystemTab = () => (
    <div className="space-y-6">
      {/* System Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Controls</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50">
              <ClockIcon className="h-4 w-4" />
              <span>Pause All Operations</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50">
              <CogIcon className="h-4 w-4" />
              <span>Force Contract Sync</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-green-300 text-green-700 rounded-md hover:bg-green-50">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Run Health Check</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Emergency Shutdown</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contract Addresses</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Main DAO Contract:</span>
              <span className="font-mono text-gray-900 dark:text-white">0x1234...5678</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Treasury Contract:</span>
              <span className="font-mono text-gray-900 dark:text-white">0x2345...6789</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Governance Contract:</span>
              <span className="font-mono text-gray-900 dark:text-white">0x3456...7890</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Restaking Manager:</span>
              <span className="font-mono text-gray-900 dark:text-white">0x4567...8901</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Loan Amount (ETH)
              </label>
              <input
                type="number"
                defaultValue="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voting Period (days)
              </label>
              <input
                type="number"
                defaultValue="7"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Quorum (%)
              </label>
              <input
                type="number"
                defaultValue="20"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue="8.5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Security Incidents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1,234</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Encrypted Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">567</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Private Votes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Security Events</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[
            { event: 'Failed login attempt', severity: 'warning', time: '2 hours ago' },
            { event: 'New admin key generated', severity: 'info', time: '1 day ago' },
            { event: 'Emergency pause disabled', severity: 'info', time: '2 days ago' },
            { event: 'Unusual voting pattern detected', severity: 'warning', time: '3 days ago' },
            { event: 'Contract upgrade completed', severity: 'info', time: '1 week ago' }
          ].map((log, index) => (
            <div key={index} className="px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.severity === 'warning' ? 'bg-yellow-500' :
                    log.severity === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}></div>
                  <span className="text-sm text-gray-900 dark:text-white">{log.event}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Actions</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Run Security Audit</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <EyeIcon className="h-4 w-4" />
              <span>View Access Logs</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-green-300 text-green-700 rounded-md hover:bg-green-50">
              <LockClosedIcon className="h-4 w-4" />
              <span>Generate New Keys</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Emergency Lockdown</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <ChartBarIcon className="h-4 w-4" /> },
    { id: 'features', name: 'Features', icon: <CogIcon className="h-4 w-4" /> },
    { id: 'members', name: 'Members', icon: <UsersIcon className="h-4 w-4" /> },
    { id: 'system', name: 'System', icon: <ServerIcon className="h-4 w-4" /> },
    { id: 'security', name: 'Security', icon: <ShieldCheckIcon className="h-4 w-4" /> }
  ]

  if (!userData.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to access the admin panel.
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this panel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage DAO operations, members, and system configuration.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'features' && renderFeaturesTab()}
            {activeTab === 'members' && renderMembersTab()}
            {activeTab === 'system' && renderSystemTab()}
            {activeTab === 'security' && renderSecurityTab()}
          </div>
        </div>
      </div>
    </div>
  )
}
