'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import {
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useDAOStats, useUserData, useMemberRegistration } from '@/hooks/useDAO'
import { formatEther } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const stats = useDAOStats()
  const userData = useUserData()
  const { registerMember, isPending, error, isSuccess } = useMemberRegistration()
  
  const [formData, setFormData] = useState({
    ensName: '',
    kycHash: '',
    acceptTerms: false,
  })
  
  const [step, setStep] = useState(1)
  const maxSteps = 3

  useEffect(() => {
    if (userData.isConnected && userData.isMember) {
      router.push('/dashboard')
    }
  }, [userData.isConnected, userData.isMember, router])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Registration successful! Welcome to the DAO!')
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }, [isSuccess, router])

  useEffect(() => {
    if (error) {
      toast.error('Registration failed. Please try again.')
    }
  }, [error])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userData.isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    try {
      await registerMember(
        formData.ensName || undefined,
        formData.kycHash || undefined,
        stats.membershipFee
      )
    } catch (err) {
      console.error('Registration error:', err)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UserIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to UnifiedLendingDAO</h2>
              <p className="text-gray-600">
                Join our community of {stats.activeMembers} active members and access advanced DeFi lending features.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Membership Benefits</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Request loans with competitive interest rates</li>
                <li>• Vote on proposals and governance decisions</li>
                <li>• Earn yield from treasury optimization</li>
                <li>• Access privacy features and confidential transactions</li>
                <li>• Participate in restaking rewards distribution</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Membership Fee:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatEther(stats.membershipFee)} ETH
                </span>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DocumentTextIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Optional Enhancements</h2>
              <p className="text-gray-600">
                Enhance your membership with ENS integration and document verification.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="ensName" className="block text-sm font-medium text-gray-700 mb-1">
                  ENS Name (Optional)
                </label>
                <input
                  type="text"
                  id="ensName"
                  placeholder="yourname.eth"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.ensName}
                  onChange={(e) => handleInputChange('ensName', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link your ENS name for enhanced voting weight and professional identity
                </p>
              </div>

              <div>
                <label htmlFor="kycHash" className="block text-sm font-medium text-gray-700 mb-1">
                  KYC Document Hash (Optional)
                </label>
                <input
                  type="text"
                  id="kycHash"
                  placeholder="QmXxXxXx... (IPFS hash)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.kycHash}
                  onChange={(e) => handleInputChange('kycHash', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload KYC documents to IPFS and provide the hash for enhanced member status
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Privacy Notice</p>
                  <p>All personal information is stored on IPFS and linked via hash only. Your data remains under your control.</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CurrencyDollarIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Registration</h2>
              <p className="text-gray-600">
                Review your information and complete the membership registration.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Registration Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet Address:</span>
                  <span className="font-mono">{userData.address}</span>
                </div>
                
                {formData.ensName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ENS Name:</span>
                    <span>{formData.ensName}</span>
                  </div>
                )}
                
                {formData.kycHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">KYC Document:</span>
                    <span className="font-mono text-xs">{formData.kycHash.slice(0, 20)}...</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-gray-900">Membership Fee:</span>
                  <span className="font-bold">{formatEther(stats.membershipFee)} ETH</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                />
                <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                  I accept the{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-500">
                    Terms and Conditions
                  </a>{' '}
                  and understand that this payment will register me as a DAO member
                </label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {Array.from({ length: maxSteps }, (_, i) => {
          const stepNumber = i + 1
          const isCompleted = stepNumber < step
          const isCurrent = stepNumber === step
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {isCompleted ? <CheckCircleIcon className="h-6 w-6" /> : stepNumber}
              </div>
              {stepNumber < maxSteps && (
                <div
                  className={`w-8 h-0.5 ${
                    stepNumber < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (!userData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to register for DAO membership
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 text-center">Join the DAO</h1>
        </div>

        <Card>
          <CardContent className="p-8">
            {renderStepIndicator()}
            
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
              
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                >
                  Previous
                </Button>
                
                {step < maxSteps ? (
                  <Button
                    type="button"
                    onClick={() => setStep(Math.min(maxSteps, step + 1))}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={!formData.acceptTerms || !userData.isConnected}
                    className="min-w-[120px]"
                  >
                    {isPending ? 'Registering...' : 'Register Now'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Registration Status */}
        {isSuccess && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Registration successful! Redirecting to dashboard...
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
