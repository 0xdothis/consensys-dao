'use client'

import { useState } from 'react'
import {
  ShieldCheckIcon,
  EyeSlashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { 
  createPrivateBallot, 
  generateZKProof, 
  VoteChoice, 
  PrivateBallot,
  ZKProof 
} from '@/lib/privateVoting'

interface PrivateVotingProps {
  proposalId: string
  proposalTitle: string
  voterAddress: string
  onVoteSubmitted?: (ballot: PrivateBallot, proof: ZKProof) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export default function PrivateVoting({
  proposalId,
  proposalTitle,
  voterAddress,
  onVoteSubmitted,
  onError,
  disabled = false,
  className = ''
}: PrivateVotingProps) {
  const [selectedOption, setSelectedOption] = useState<'for' | 'against' | 'abstain' | null>(null)
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [weight, setWeight] = useState(1)
  const [useZKProof, setUseZKProof] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState<'vote' | 'encrypt' | 'proof' | 'submit'>('vote')

  const handleVoteSubmission = async () => {
    if (!selectedOption || !password.trim()) {
      onError?.('Please select a vote option and enter an encryption password')
      return
    }

    setSubmitting(true)

    try {
      setStep('encrypt')
      
      // Create vote choice
      const vote: VoteChoice = {
        option: selectedOption,
        weight,
        reason: reason.trim() || undefined
      }

      // Create encrypted private ballot
      const ballot = await createPrivateBallot(
        proposalId,
        voterAddress,
        vote,
        password
      )

      setStep('proof')
      
      // Generate zero-knowledge proof if requested
      let proof: ZKProof | undefined
      if (useZKProof) {
        proof = await generateZKProof(vote, voterAddress, 'random-secret', proposalId)
      }

      setStep('submit')
      
      // Submit the vote
      onVoteSubmitted?.(ballot, proof!)
      
      setSubmitted(true)
      setStep('vote')
      
      // Reset form
      setSelectedOption(null)
      setReason('')
      setPassword('')
      setWeight(1)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to submit private vote')
      setStep('vote')
    } finally {
      setSubmitting(false)
    }
  }

  const resetVote = () => {
    setSubmitted(false)
    setSelectedOption(null)
    setReason('')
    setPassword('')
    setWeight(1)
    setStep('vote')
  }

  if (submitted) {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Private Vote Submitted Successfully
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Your encrypted vote has been recorded with full privacy protection.
            </p>
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <button
            onClick={resetVote}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Vote on Another Proposal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Private Voting
          </h3>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Cast your vote privately using encryption and zero-knowledge proofs
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Proposal Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Proposal: {proposalTitle}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ID: {proposalId}
          </p>
        </div>

        {/* Privacy Features Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900 dark:text-blue-100">
                Privacy Protection
              </h5>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Your vote is encrypted before submission</li>
                <li>• Your identity is protected with cryptographic hashes</li>
                <li>• Zero-knowledge proofs prevent vote manipulation</li>
                <li>• Double voting is prevented with nullifiers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vote Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Your Vote *
          </label>
          <div className="space-y-2">
            {(['for', 'against', 'abstain'] as const).map((option) => (
              <label
                key={option}
                className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedOption === option
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="vote"
                  value={option}
                  checked={selectedOption === option}
                  onChange={(e) => setSelectedOption(e.target.value as typeof option)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  disabled={disabled || submitting}
                />
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {option === 'for' ? 'For' : option === 'against' ? 'Against' : 'Abstain'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {option === 'for' && '- Support this proposal'}
                  {option === 'against' && '- Oppose this proposal'}  
                  {option === 'abstain' && '- Neither support nor oppose'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Vote Weight */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Vote Weight
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={weight}
            onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={disabled || submitting}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Weight determines the influence of your vote (1-100)
          </p>
        </div>

        {/* Vote Reason */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain your reasoning for this vote..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
            disabled={disabled || submitting}
          />
        </div>

        {/* Encryption Settings */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <LockClosedIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h5 className="font-medium text-gray-900 dark:text-white">
              Vote Encryption
            </h5>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter encryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                disabled={disabled || submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={disabled || submitting}
              >
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This password encrypts your vote. Keep it secure - you&apos;ll need it to verify your vote later.
            </p>
          </div>
        </div>

        {/* Zero-Knowledge Proof Option */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="useZKProof"
            checked={useZKProof}
            onChange={(e) => setUseZKProof(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={disabled || submitting}
          />
          <label htmlFor="useZKProof" className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Generate Zero-Knowledge Proof
            </span>
          </label>
        </div>
        {useZKProof && (
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
            Provides cryptographic proof of your vote validity without revealing the vote content.
          </p>
        )}

        {/* Progress Indicator */}
        {submitting && (
          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {step === 'encrypt' && 'Encrypting your vote...'}
                {step === 'proof' && 'Generating zero-knowledge proof...'}
                {step === 'submit' && 'Submitting private ballot...'}
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: step === 'encrypt' ? '33%' : step === 'proof' ? '66%' : '100%'
                }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleVoteSubmission}
          disabled={!selectedOption || !password.trim() || disabled || submitting}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing Private Vote...</span>
            </>
          ) : (
            <>
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Submit Private Vote</span>
            </>
          )}
        </button>

        {/* Warnings */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h5 className="font-medium text-yellow-900 dark:text-yellow-100">
                Important Notes
              </h5>
              <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Keep your encryption password safe - it cannot be recovered</li>
                <li>• Your vote cannot be changed after submission</li>
                <li>• Vote aggregation may take time to maintain privacy</li>
                <li>• Only vote once per proposal to avoid nullifier conflicts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
