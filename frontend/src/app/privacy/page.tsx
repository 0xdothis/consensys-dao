'use client'

import { useState } from 'react'
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
  DocumentIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useUserData } from '@/hooks/useDAO'

interface PrivacySettings {
  encryptDocumentsByDefault: boolean
  allowPublicProfile: boolean
  shareVotingHistory: boolean
  enablePrivateMessaging: boolean
  defaultDocumentPermissions: 'public' | 'private' | 'members'
  autoEncryptLoans: boolean
  enableZKProofs: boolean
  notificationPreferences: {
    voteResults: boolean
    loanUpdates: boolean
    governanceAlerts: boolean
  }
}

interface EncryptionKey {
  id: string
  name: string
  type: 'document' | 'voting' | 'messaging'
  createdAt: Date
  lastUsed?: Date
  strength: 'weak' | 'medium' | 'strong'
}

export default function PrivacyPage() {
  const userData = useUserData()
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'keys' | 'data'>('overview')
  const [settings, setSettings] = useState<PrivacySettings>({
    encryptDocumentsByDefault: true,
    allowPublicProfile: false,
    shareVotingHistory: false,
    enablePrivateMessaging: true,
    defaultDocumentPermissions: 'private',
    autoEncryptLoans: true,
    enableZKProofs: true,
    notificationPreferences: {
      voteResults: true,
      loanUpdates: true,
      governanceAlerts: true
    }
  })
  
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([
    {
      id: 'key-1',
      name: 'Primary Document Key',
      type: 'document',
      createdAt: new Date('2024-01-15'),
      lastUsed: new Date('2024-08-30'),
      strength: 'strong'
    },
    {
      id: 'key-2', 
      name: 'Voting Encryption',
      type: 'voting',
      createdAt: new Date('2024-02-01'),
      lastUsed: new Date('2024-08-29'),
      strength: 'strong'
    },
    {
      id: 'key-3',
      name: 'Messaging Key',
      type: 'messaging',
      createdAt: new Date('2024-03-10'),
      strength: 'medium'
    }
  ])
  
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyType, setNewKeyType] = useState<'document' | 'voting' | 'messaging'>('document')
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  
  // Mock privacy stats
  const privacyStats = {
    encryptedDocuments: 15,
    privateVotes: 8,
    hiddenLoans: 3,
    publicDataPoints: 5,
    privacyScore: 85,
    lastPrivacyAudit: new Date('2024-08-25')
  }

  const updateSetting = (key: keyof PrivacySettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateNotificationPreference = (key: keyof PrivacySettings['notificationPreferences'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }))
  }

  const generateNewKey = () => {
    if (!newKeyName.trim()) return
    
    const newKey: EncryptionKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      type: newKeyType,
      createdAt: new Date(),
      strength: 'strong'
    }
    
    setEncryptionKeys(prev => [...prev, newKey])
    setNewKeyName('')
    setShowNewKeyForm(false)
  }

  const deleteKey = (keyId: string) => {
    setEncryptionKeys(prev => prev.filter(key => key.id !== keyId))
    if (selectedKeyId === keyId) {
      setSelectedKeyId(null)
    }
  }

  const getKeyIcon = (type: string) => {
    switch (type) {
      case 'document': return <DocumentIcon className="h-4 w-4" />
      case 'voting': return <ShieldCheckIcon className="h-4 w-4" />
      case 'messaging': return <UserIcon className="h-4 w-4" />
      default: return <KeyIcon className="h-4 w-4" />
    }
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'weak': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPrivacyScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Privacy Score */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Privacy Score</h3>
            <p className="text-blue-100">Your overall privacy protection level</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{privacyStats.privacyScore}%</div>
            <div className="text-sm text-blue-100">Excellent</div>
          </div>
        </div>
      </div>

      {/* Privacy Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <LockClosedIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Encrypted Docs</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {privacyStats.encryptedDocuments}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <EyeSlashIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Private Votes</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {privacyStats.privateVotes}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Hidden Loans</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {privacyStats.hiddenLoans}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Public Data</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {privacyStats.publicDataPoints}
          </div>
        </div>
      </div>

      {/* Recent Privacy Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Privacy Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <LockClosedIcon className="h-4 w-4 text-green-600" />
            <span className="text-gray-600 dark:text-gray-400">Document &quot;Financial Statement.pdf&quot; encrypted</span>
            <span className="text-gray-400 dark:text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <EyeSlashIcon className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Private vote cast on Proposal #42</span>
            <span className="text-gray-400 dark:text-gray-500">1 day ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <ShieldCheckIcon className="h-4 w-4 text-purple-600" />
            <span className="text-gray-600 dark:text-gray-400">Confidential loan proposal created</span>
            <span className="text-gray-400 dark:text-gray-500">3 days ago</span>
          </div>
        </div>
      </div>

      {/* Privacy Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Privacy Recommendations
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">Great!</span> You&apos;re using encrypted document storage
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Consider enabling automatic loan encryption for maximum privacy
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              Review your key rotation schedule - consider updating older keys
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* General Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Allow public profile
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Show basic profile information to other DAO members
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowPublicProfile}
              onChange={(e) => updateSetting('allowPublicProfile', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Share voting history
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow others to see your voting participation (not vote choices)
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.shareVotingHistory}
              onChange={(e) => updateSetting('shareVotingHistory', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable private messaging
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow encrypted direct messages from other members
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enablePrivateMessaging}
              onChange={(e) => updateSetting('enablePrivateMessaging', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Document Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Document Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Encrypt documents by default
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically encrypt all uploaded documents
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.encryptDocumentsByDefault}
              onChange={(e) => updateSetting('encryptDocumentsByDefault', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Default document permissions
            </label>
            <select
              value={settings.defaultDocumentPermissions}
              onChange={(e) => updateSetting('defaultDocumentPermissions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="public">Public - Visible to everyone</option>
              <option value="members">Members Only - Visible to DAO members</option>
              <option value="private">Private - Only you and granted users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loan Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Auto-encrypt loan proposals
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically enable privacy mode for new loan requests
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoEncryptLoans}
              onChange={(e) => updateSetting('autoEncryptLoans', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Voting Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voting Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable zero-knowledge proofs
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use cryptographic proofs for vote verification without revealing vote content
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableZKProofs}
              onChange={(e) => updateSetting('enableZKProofs', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Vote result notifications
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get notified when votes you participated in are tallied
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationPreferences.voteResults}
              onChange={(e) => updateNotificationPreference('voteResults', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Loan update notifications
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get notified about changes to your loan proposals
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationPreferences.loanUpdates}
              onChange={(e) => updateNotificationPreference('loanUpdates', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Governance alerts
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get notified about important governance events
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationPreferences.governanceAlerts}
              onChange={(e) => updateNotificationPreference('governanceAlerts', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Save Privacy Settings
      </button>
    </div>
  )

  const renderKeysTab = () => (
    <div className="space-y-6">
      {/* Key Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Encryption Keys</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your encryption keys for secure document and vote storage
          </p>
        </div>
        <button
          onClick={() => setShowNewKeyForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Generate New Key
        </button>
      </div>

      {/* New Key Form */}
      {showNewKeyForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Generate New Encryption Key</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Key Name
              </label>
              <input
                type="text"
                placeholder="e.g., Loan Documents 2024"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Key Type
              </label>
              <select
                value={newKeyType}
                onChange={(e) => setNewKeyType(e.target.value as typeof newKeyType)}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-800 dark:text-white"
              >
                <option value="document">Document Encryption</option>
                <option value="voting">Private Voting</option>
                <option value="messaging">Secure Messaging</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={generateNewKey}
                disabled={!newKeyName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Key
              </button>
              <button
                onClick={() => setShowNewKeyForm(false)}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Keys List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white">Your Encryption Keys</h4>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {encryptionKeys.map((key) => (
            <div key={key.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600 dark:text-gray-400">
                    {getKeyIcon(key.type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {key.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                      <span>Type: {key.type}</span>
                      <span>•</span>
                      <span>Created: {key.createdAt.toLocaleDateString()}</span>
                      {key.lastUsed && (
                        <>
                          <span>•</span>
                          <span>Last used: {key.lastUsed.toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-medium ${getStrengthColor(key.strength)}`}>
                    {key.strength.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setSelectedKeyId(key.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDataTab = () => (
    <div className="space-y-6">
      {/* Data Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Private Data</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Encrypted Documents</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{privacyStats.encryptedDocuments}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Private Votes</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{privacyStats.privateVotes}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Hidden Loans</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{privacyStats.hiddenLoans}</div>
          </div>
        </div>
      </div>

      {/* Data Export/Backup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Export encrypted data</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Download all your encrypted documents and votes for backup
              </p>
            </div>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              Export
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Backup encryption keys</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Securely backup your encryption keys (encrypted with master password)
              </p>
            </div>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              Backup
            </button>
          </div>
        </div>
      </div>

      {/* Data Deletion */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-700">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">Data Deletion</h3>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          Permanently delete your private data. This action cannot be undone.
        </p>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40">
            Delete All Private Documents
          </button>
          <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40">
            Delete Private Voting History
          </button>
          <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40">
            Delete All Encryption Keys
          </button>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <ShieldCheckIcon className="h-4 w-4" /> },
    { id: 'settings', name: 'Settings', icon: <CogIcon className="h-4 w-4" /> },
    { id: 'keys', name: 'Encryption Keys', icon: <KeyIcon className="h-4 w-4" /> },
    { id: 'data', name: 'Data Management', icon: <DocumentIcon className="h-4 w-4" /> }
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
            Please connect your wallet to access privacy settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy & Security</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your privacy settings, encryption keys, and secure data storage preferences.
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
            {activeTab === 'settings' && renderSettingsTab()}
            {activeTab === 'keys' && renderKeysTab()}
            {activeTab === 'data' && renderDataTab()}
          </div>
        </div>
      </div>
    </div>
  )
}
