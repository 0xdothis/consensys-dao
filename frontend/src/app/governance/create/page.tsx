'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  DocumentPlusIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { useUserData } from '@/hooks/useDAO'
import toast from 'react-hot-toast'

export default function CreateProposalPage() {
  const userData = useUserData()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'protocol',
    isPrivate: false,
    requiresExecution: false,
    executionDelay: 2, // days
    discussionUrl: '',
    tags: [] as string[],
    newTag: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const proposalTypes = [
    { value: 'protocol', label: 'Protocol', description: 'Changes to protocol functionality' },
    { value: 'treasury', label: 'Treasury', description: 'Treasury management and allocation' },
    { value: 'governance', label: 'Governance', description: 'DAO governance and voting rules' },
    { value: 'security', label: 'Security', description: 'Security measures and emergency actions' },
    { value: 'feature', label: 'Feature', description: 'New features and enhancements' }
  ]

  const suggestedTags = [
    'protocol', 'treasury', 'governance', 'security', 'feature',
    'interest-rates', 'defi', 'yield', 'diversification', 'accessibility',
    'privacy', 'loans', 'zk-proofs', 'membership', 'emergency'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userData.isMember) {
      toast.error('Only DAO members can create proposals')
      return
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required')
      return
    }

    if (formData.description.length < 100) {
      toast.error('Description must be at least 100 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      // Mock implementation - would interact with contract
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Proposal created successfully!')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'protocol',
        isPrivate: false,
        requiresExecution: false,
        executionDelay: 2,
        discussionUrl: '',
        tags: [],
        newTag: ''
      })
    } catch (error) {
      console.error('Proposal creation failed:', error)
      toast.error('Failed to create proposal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: ''
      })
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const addSuggestedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      })
    }
  }

  if (!userData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <DocumentPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">Please connect your wallet to create proposals.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userData.isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Member Only</h3>
            <p className="text-gray-600 mb-4">Only DAO members can create governance proposals.</p>
            <Link href="/register">
              <Button>Join the DAO</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/governance"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Governance
            </Link>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              <DocumentPlusIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Proposal</h1>
                <p className="text-sm text-gray-600">Submit a new governance proposal to the DAO</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Details</CardTitle>
                  <CardDescription>
                    Provide clear and comprehensive information about your proposal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter a clear, descriptive title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.title.length}/100 characters
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      placeholder="Provide a detailed explanation of your proposal, including rationale, implementation details, and expected outcomes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={8}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      minLength={100}
                      maxLength={2000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.description.length}/2000 characters (minimum 100)
                    </p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposal Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {proposalTypes.map((type) => (
                        <label
                          key={type.value}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.type === type.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={type.value}
                            checked={formData.type === type.value}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="sr-only"
                          />
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Add a custom tag"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={formData.newTag}
                          onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          Add
                        </Button>
                      </div>
                      
                      {/* Current Tags */}
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 h-4 w-4 text-primary-600 hover:text-primary-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Suggested Tags */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Suggested tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags
                            .filter(tag => !formData.tags.includes(tag))
                            .slice(0, 8)
                            .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addSuggestedTag(tag)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discussion URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Link (Optional)
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="url"
                        placeholder="https://forum.example.com/proposal-discussion"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.discussionUrl}
                        onChange={(e) => setFormData({ ...formData, discussionUrl: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Link to external discussion or documentation
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Configure proposal execution and privacy options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Privacy Setting */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <label htmlFor="isPrivate" className="flex items-center text-sm font-medium text-gray-700">
                        <EyeSlashIcon className="h-4 w-4 mr-2" />
                        Private Proposal
                      </label>
                      <p className="text-sm text-gray-600">
                        Hide proposal details during voting while maintaining vote transparency
                      </p>
                    </div>
                  </div>

                  {/* Execution Required */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="requiresExecution"
                      checked={formData.requiresExecution}
                      onChange={(e) => setFormData({ ...formData, requiresExecution: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <label htmlFor="requiresExecution" className="text-sm font-medium text-gray-700">
                        Requires On-chain Execution
                      </label>
                      <p className="text-sm text-gray-600">
                        This proposal will automatically execute on-chain code if passed
                      </p>
                    </div>
                  </div>

                  {/* Execution Delay */}
                  {formData.requiresExecution && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Execution Delay (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.executionDelay}
                        onChange={(e) => setFormData({ ...formData, executionDelay: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Time delay before execution after proposal passes (0-30 days)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/governance">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.description.trim() || formData.description.length < 100}
                >
                  {isSubmitting ? 'Creating Proposal...' : 'Create Proposal'}
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Member Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Voting Power</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {userData.votingWeight}
                  </div>
                  <div className="text-sm text-gray-600">votes</div>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <InformationCircleIcon className="h-4 w-4 mr-2" />
                  Proposal Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>
                    <p>Be clear and specific about what you&apos;re proposing</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>
                    <p>Provide detailed rationale and expected outcomes</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>
                    <p>Include links to external discussions when relevant</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>
                    <p>Consider implementation complexity and timeline</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>
                    <p>Engage with the community before submitting</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Process Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Proposal Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium">Submission</p>
                      <p className="text-xs text-gray-600">Proposal is created and pending review</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-medium text-yellow-600">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium">Voting Period</p>
                      <p className="text-xs text-gray-600">7 days for members to cast votes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium">Execution</p>
                      <p className="text-xs text-gray-600">Implementation if proposal passes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Important</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Once submitted, proposals cannot be edited. Please review carefully before creating.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
