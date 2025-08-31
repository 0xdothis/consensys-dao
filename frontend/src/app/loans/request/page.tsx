'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  BanknotesIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeSlashIcon,
  LockClosedIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { useDAOStats, useUserData, useLoanRequest } from '@/hooks/useDAO'
import { formatEther, parseEther, generateCommitment } from '@/lib/utils'
import { DAO_CONSTANTS } from '@/constants'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with IPFS
const DocumentUpload = dynamic(() => import('@/components/DocumentUpload'), { ssr: false })

// Type definition for DocumentMetadata
interface DocumentMetadata {
  name: string
  type: string
  size: number
  uploadedAt: Date
  encrypted: boolean
  hash: string
  tags?: string[]
  permissions?: {
    public: boolean
    allowedUsers?: string[]
    allowedRoles?: string[]
  }
}
import toast from 'react-hot-toast'

export default function RequestLoanPage() {
  const router = useRouter()
  const stats = useDAOStats()
  const userData = useUserData()
  const { requestLoan, isPending, error, isSuccess } = useLoanRequest()
  
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    isPrivate: false,
    documentHash: '',
    privacySecret: '',
    encryptDocuments: false,
    shareWithAdmins: true,
    hideAmount: false,
    hidePurpose: false
  })
  
  const [step, setStep] = useState(1)
  const maxSteps = 4 // Added document upload step
  const [estimatedInterest, setEstimatedInterest] = useState(0)
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentMetadata[]>([])
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)

  useEffect(() => {
    if (!userData.isConnected) {
      router.push('/')
    } else if (!userData.isMember) {
      router.push('/register')
    }
  }, [userData.isConnected, userData.isMember, router])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Loan request submitted successfully!')
      setTimeout(() => router.push('/loans'), 2000)
    }
  }, [isSuccess, router])

  useEffect(() => {
    if (error) {
      toast.error('Failed to submit loan request. Please try again.')
    }
  }, [error])

  // Calculate estimated interest based on amount
  useEffect(() => {
    if (formData.amount) {
      const amount = parseFloat(formData.amount)
      // Simple interest calculation - in real app this would come from contract
      const baseRate = 8 // 8% base rate
      const riskMultiplier = amount > 10 ? 1.2 : 1.0 // Higher amounts = higher risk
      setEstimatedInterest(baseRate * riskMultiplier)
    }
  }, [formData.amount])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userData.isConnected || !userData.isMember) {
      toast.error('You must be a DAO member to request loans')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid loan amount')
      return
    }

    if (!formData.purpose.trim()) {
      toast.error('Please provide a purpose for the loan')
      return
    }

    if (userData.hasActiveLoan) {
      toast.error('You already have an active loan')
      return
    }

    try {
      const amount = parseEther(formData.amount)
      let commitment = ''
      
      if (formData.isPrivate && formData.privacySecret) {
        commitment = generateCommitment(formData.privacySecret, formData.purpose)
      }

      await requestLoan(
        amount,
        formData.isPrivate,
        commitment,
        formData.documentHash
      )
    } catch (err) {
      console.error('Loan request error:', err)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BanknotesIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loan Details</h2>
              <p className="text-gray-600">
                Specify the amount and purpose of your loan request.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Amount (ETH) *
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  max={formatEther(BigInt(DAO_CONSTANTS.MAX_LOAN_AMOUNT) * BigInt(10**18))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum loan amount: {DAO_CONSTANTS.MAX_LOAN_AMOUNT} ETH
                </p>
              </div>

              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Purpose *
                </label>
                <textarea
                  id="purpose"
                  rows={4}
                  placeholder="Describe how you plan to use the loan funds..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.purpose.length}/500 characters
                </p>
              </div>

              {formData.amount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Estimated Loan Terms</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Loan Amount:</span>
                      <span>{formData.amount} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Interest Rate:</span>
                      <span>{estimatedInterest.toFixed(2)}% APR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Total Repayment:</span>
                      <span>{(parseFloat(formData.amount) * (1 + estimatedInterest / 100)).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Term:</span>
                      <span>1 Year</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <ShieldCheckIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
              <p className="text-gray-600">
                Configure privacy and confidentiality settings for your loan proposal.
              </p>
            </div>

            <div className="space-y-6">
              {/* Main Privacy Toggle */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.isPrivate}
                    onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                    disabled={!stats.features.confidentialLoans}
                  />
                  <div className="flex-1">
                    <label htmlFor="isPrivate" className="text-sm font-medium text-gray-900">
                      Enable Privacy Mode
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.features.confidentialLoans 
                        ? 'Activate advanced privacy controls to protect sensitive loan information'
                        : 'Private loans are currently disabled by DAO governance.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Granular Privacy Controls */}
              {formData.isPrivate && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center">
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    Privacy Controls
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="hideAmount"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.hideAmount}
                        onChange={(e) => handleInputChange('hideAmount', e.target.checked)}
                      />
                      <div className="flex-1">
                        <label htmlFor="hideAmount" className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Hide loan amount from public view
                        </label>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Only show that a loan is requested without revealing the amount
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="hidePurpose"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.hidePurpose}
                        onChange={(e) => handleInputChange('hidePurpose', e.target.checked)}
                      />
                      <div className="flex-1">
                        <label htmlFor="hidePurpose" className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Hide loan purpose details
                        </label>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Show only a generic purpose category instead of detailed description
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="shareWithAdmins"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.shareWithAdmins}
                        onChange={(e) => handleInputChange('shareWithAdmins', e.target.checked)}
                      />
                      <div className="flex-1">
                        <label htmlFor="shareWithAdmins" className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Share full details with DAO admins
                        </label>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Allow DAO administrators to view complete loan information for governance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Secret */}
              {formData.isPrivate && (
                <div>
                  <label htmlFor="privacySecret" className="block text-sm font-medium text-gray-700 mb-1">
                    Privacy Secret *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="privacySecret"
                      placeholder="Enter a secret phrase for privacy verification"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.privacySecret}
                      onChange={(e) => handleInputChange('privacySecret', e.target.value)}
                    />
                    <LockClosedIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This secret generates a cryptographic commitment for your private loan. Keep it secure.
                  </p>
                </div>
              )}

              {/* Privacy Notice */}
              <div className={`${formData.isPrivate ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} rounded-lg p-4`}>
                <div className="flex items-start">
                  {formData.isPrivate ? (
                    <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  ) : (
                    <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  )}
                  <div className={`text-sm ${formData.isPrivate ? 'text-green-800' : 'text-yellow-800'}`}>
                    <p className="font-medium">
                      {formData.isPrivate ? 'Privacy Mode Active' : 'Public Loan Request'}
                    </p>
                    <p>
                      {formData.isPrivate 
                        ? 'Your loan details will be protected using cryptographic commitments and selective disclosure.'
                        : 'Your loan request will be publicly visible to all DAO members for transparent governance.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DocumentIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Supporting Documents</h2>
              <p className="text-gray-600">
                Upload optional supporting documents to strengthen your loan proposal.
              </p>
            </div>

            {stats.features.documentStorage ? (
              <div className="space-y-6">
                {/* Document Upload Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showDocumentUpload"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={showDocumentUpload}
                    onChange={(e) => setShowDocumentUpload(e.target.checked)}
                  />
                  <label htmlFor="showDocumentUpload" className="text-sm font-medium text-gray-900">
                    Add supporting documents
                  </label>
                </div>

                {/* Document Upload Component */}
                {showDocumentUpload && (
                  <DocumentUpload
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    maxSize={5}
                    allowEncryption={formData.isPrivate}
                    requireEncryption={false}
                    showPermissions={formData.isPrivate}
                    onUpload={(documents) => {
                      setUploadedDocuments(documents)
                      // Update document hash with first document's hash
                      if (documents.length > 0) {
                        handleInputChange('documentHash', documents[0].hash)
                      }
                    }}
                    onError={(error) => toast.error(error)}
                    className="border border-gray-200 rounded-lg p-4"
                  />
                )}

                {/* Uploaded Documents List */}
                {uploadedDocuments.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Uploaded Documents ({uploadedDocuments.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <DocumentIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-900">{doc.name}</span>
                            {doc.encrypted && (
                              <LockClosedIcon className="h-3 w-3 text-blue-500" title="Encrypted" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {(doc.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual IPFS Hash Input */}
                <div>
                  <label htmlFor="documentHash" className="block text-sm font-medium text-gray-700 mb-1">
                    Or enter IPFS hash manually
                  </label>
                  <input
                    type="text"
                    id="documentHash"
                    placeholder="QmXxXxXx... (IPFS hash of supporting documents)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={formData.documentHash}
                    onChange={(e) => handleInputChange('documentHash', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If you&apos;ve already uploaded documents to IPFS, enter the hash here
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Document storage is currently disabled</p>
                <p className="text-sm text-gray-500">
                  DAO governance has disabled document storage features. You can proceed without documents.
                </p>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-gray-600">
                Review your loan request details before submission.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Loan Request Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested Amount:</span>
                  <span className="font-medium">
                    {formData.isPrivate && formData.hideAmount ? '[PRIVATE]' : `${formData.amount} ETH`}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Interest:</span>
                  <span className="font-medium">{estimatedInterest.toFixed(2)}% APR</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Privacy Mode:</span>
                  <span className="font-medium flex items-center">
                    {formData.isPrivate ? (
                      <><LockClosedIcon className="h-3 w-3 mr-1" />Private</>
                    ) : (
                      'Public'
                    )}
                  </span>
                </div>
                
                {formData.isPrivate && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hide Amount:</span>
                      <span className="font-medium">{formData.hideAmount ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hide Purpose:</span>
                      <span className="font-medium">{formData.hidePurpose ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Share with Admins:</span>
                      <span className="font-medium">{formData.shareWithAdmins ? 'Yes' : 'No'}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Supporting Docs:</span>
                  <span className="font-medium">
                    {uploadedDocuments.length > 0 ? `${uploadedDocuments.length} files` : 
                     formData.documentHash ? 'IPFS hash provided' : 'None'}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="text-gray-600 mb-2">Purpose:</div>
                  <div className="text-sm bg-gray-50 p-3 rounded italic">
                    {formData.isPrivate && formData.hidePurpose ? (
                      '[Purpose will be hidden from public view]'
                    ) : (
                      `"${formData.purpose}"`
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Your loan proposal will be created and enter a 3-day editing phase</li>
                <li>After editing, members will have 7 days to vote on your proposal</li>
                <li>If approved by majority consensus, the loan will be automatically disbursed</li>
                <li>You&apos;ll have up to 1 year to repay the loan with accrued interest</li>
              </ol>
            </div>

            {userData.hasActiveLoan && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Active Loan Detected</p>
                    <p>You already have an active loan. Please repay your current loan before requesting a new one.</p>
                  </div>
                </div>
              </div>
            )}
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

  if (!userData.isConnected || !userData.isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You must be a DAO member to request loans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={userData.isConnected ? "/register" : "/"}>
              <Button className="w-full" size="lg">
                {userData.isConnected ? "Become a Member" : "Go Home"}
              </Button>
            </Link>
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
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 text-center">Request a Loan</h1>
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
                    disabled={step === 1 && (!formData.amount || !formData.purpose)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={userData.hasActiveLoan || !formData.amount || !formData.purpose}
                    className="min-w-[120px]"
                  >
                    {isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {isSuccess && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Loan request submitted successfully! Redirecting to loans page...
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
