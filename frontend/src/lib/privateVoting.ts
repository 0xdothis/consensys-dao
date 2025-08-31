import { encryptData, decryptData } from './ipfs'

// Types for private voting
export interface PrivateBallot {
  id: string
  proposalId: string
  voterHash: string // Hashed voter address for privacy
  encryptedVote: string
  commitment: string // Commitment for zero-knowledge proof
  timestamp: Date
  nullifier: string // Prevents double voting
}

export interface VoteChoice {
  option: 'for' | 'against' | 'abstain'
  weight?: number
  reason?: string
}

export interface ZKProof {
  proof: string
  publicSignals: string[]
  nullifier: string
  commitment: string
}

// Generate a commitment for zero-knowledge voting
export async function generateVoteCommitment(
  vote: VoteChoice,
  voterAddress: string,
  secret: string
): Promise<{ commitment: string; nullifier: string }> {
  const encoder = new TextEncoder()
  
  // Create commitment data
  const commitmentData = JSON.stringify({
    vote: vote.option,
    weight: vote.weight || 1,
    voter: voterAddress.toLowerCase(),
    secret,
    timestamp: Date.now()
  })
  
  // Hash for commitment
  const commitmentHash = await crypto.subtle.digest('SHA-256', encoder.encode(commitmentData))
  const commitment = Array.from(new Uint8Array(commitmentHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  // Generate nullifier to prevent double voting
  const nullifierData = `${voterAddress.toLowerCase()}-${secret}`
  const nullifierHash = await crypto.subtle.digest('SHA-256', encoder.encode(nullifierData))
  const nullifier = Array.from(new Uint8Array(nullifierHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return { commitment, nullifier }
}

// Create encrypted private ballot
export async function createPrivateBallot(
  proposalId: string,
  voterAddress: string,
  vote: VoteChoice,
  password: string,
  secret?: string
): Promise<PrivateBallot> {
  const ballotSecret = secret || crypto.getRandomValues(new Uint32Array(1))[0].toString()
  
  // Generate commitment and nullifier
  const { commitment, nullifier } = await generateVoteCommitment(vote, voterAddress, ballotSecret)
  
  // Encrypt the actual vote
  const voteData = JSON.stringify({
    ...vote,
    secret: ballotSecret,
    voterAddress: voterAddress.toLowerCase()
  })
  
  const encryptedVote = await encryptData(voteData, password)
  
  // Hash voter address for privacy
  const encoder = new TextEncoder()
  const voterHashArray = await crypto.subtle.digest('SHA-256', encoder.encode(voterAddress.toLowerCase()))
  const voterHash = Array.from(new Uint8Array(voterHashArray))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return {
    id: `ballot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    proposalId,
    voterHash,
    encryptedVote,
    commitment,
    timestamp: new Date(),
    nullifier
  }
}

// Decrypt and verify private ballot
export async function decryptPrivateBallot(
  ballot: PrivateBallot,
  password: string
): Promise<VoteChoice & { voterAddress: string; secret: string }> {
  try {
    const decryptedData = await decryptData(ballot.encryptedVote, password)
    const voteData = JSON.parse(decryptedData)
    
    // Verify commitment
    const { commitment } = await generateVoteCommitment(
      {
        option: voteData.option,
        weight: voteData.weight,
        reason: voteData.reason
      },
      voteData.voterAddress,
      voteData.secret
    )
    
    if (commitment !== ballot.commitment) {
      throw new Error('Ballot verification failed - commitment mismatch')
    }
    
    return voteData
  } catch (error) {
    throw new Error('Failed to decrypt or verify ballot')
  }
}

// Verify nullifier hasn't been used (prevents double voting)
export function verifyNullifier(
  nullifier: string,
  usedNullifiers: string[]
): boolean {
  return !usedNullifiers.includes(nullifier)
}

// Aggregate encrypted votes (for tallying)
export interface VoteTally {
  for: number
  against: number
  abstain: number
  totalVotes: number
  totalWeight: number
  ballots: PrivateBallot[]
}

export async function tallyPrivateVotes(
  ballots: PrivateBallot[],
  password: string,
  usedNullifiers: string[] = []
): Promise<VoteTally> {
  const tally: VoteTally = {
    for: 0,
    against: 0,
    abstain: 0,
    totalVotes: 0,
    totalWeight: 0,
    ballots: []
  }
  
  const validBallots: PrivateBallot[] = []
  const seenNullifiers = new Set<string>()
  
  for (const ballot of ballots) {
    try {
      // Check for double voting
      if (usedNullifiers.includes(ballot.nullifier) || seenNullifiers.has(ballot.nullifier)) {
        console.warn(`Duplicate vote detected: ${ballot.nullifier}`)
        continue
      }
      
      const voteData = await decryptPrivateBallot(ballot, password)
      const weight = voteData.weight || 1
      
      seenNullifiers.add(ballot.nullifier)
      validBallots.push(ballot)
      
      switch (voteData.option) {
        case 'for':
          tally.for += weight
          break
        case 'against':
          tally.against += weight
          break
        case 'abstain':
          tally.abstain += weight
          break
      }
      
      tally.totalVotes += 1
      tally.totalWeight += weight
    } catch (error) {
      console.warn(`Failed to decrypt ballot ${ballot.id}:`, error)
    }
  }
  
  tally.ballots = validBallots
  return tally
}

// Generate zero-knowledge proof for vote verification
export async function generateZKProof(
  vote: VoteChoice,
  voterAddress: string,
  secret: string,
  proposalId: string
): Promise<ZKProof> {
  // This is a simplified ZK proof generation
  // In a real implementation, you'd use a library like snarkjs
  const encoder = new TextEncoder()
  
  const { commitment, nullifier } = await generateVoteCommitment(vote, voterAddress, secret)
  
  // Mock proof generation (in reality this would use circuit compilation)
  const proofData = {
    vote: vote.option,
    weight: vote.weight || 1,
    proposalId,
    timestamp: Date.now()
  }
  
  const proofHash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(proofData)))
  const proof = Array.from(new Uint8Array(proofHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return {
    proof,
    publicSignals: [proposalId, commitment],
    nullifier,
    commitment
  }
}

// Verify zero-knowledge proof
export async function verifyZKProof(
  proof: ZKProof,
  proposalId: string,
  usedNullifiers: string[] = []
): Promise<boolean> {
  try {
    // Check nullifier hasn't been used
    if (usedNullifiers.includes(proof.nullifier)) {
      return false
    }
    
    // Verify public signals match
    if (proof.publicSignals[0] !== proposalId) {
      return false
    }
    
    // In a real implementation, this would verify the cryptographic proof
    // For now, we just check basic structure
    return proof.proof.length === 64 && // SHA-256 hash length
           proof.commitment.length === 64 &&
           proof.nullifier.length === 64
  } catch (error) {
    return false
  }
}

// Privacy preserving vote aggregation
export interface PrivateVoteStats {
  totalParticipants: number
  voteDistribution: {
    for: { count: number; percentage: number }
    against: { count: number; percentage: number }
    abstain: { count: number; percentage: number }
  }
  weightDistribution: {
    for: { weight: number; percentage: number }
    against: { weight: number; percentage: number }
    abstain: { weight: number; percentage: number }
  }
  participationRate?: number
  anonymitySet: number // Number of possible voters
}

export function generatePrivateVoteStats(
  tally: VoteTally,
  totalEligibleVoters?: number
): PrivateVoteStats {
  const totalVotes = tally.totalVotes
  const totalWeight = tally.totalWeight
  
  return {
    totalParticipants: totalVotes,
    voteDistribution: {
      for: {
        count: tally.for,
        percentage: totalWeight > 0 ? (tally.for / totalWeight) * 100 : 0
      },
      against: {
        count: tally.against,
        percentage: totalWeight > 0 ? (tally.against / totalWeight) * 100 : 0
      },
      abstain: {
        count: tally.abstain,
        percentage: totalWeight > 0 ? (tally.abstain / totalWeight) * 100 : 0
      }
    },
    weightDistribution: {
      for: {
        weight: tally.for,
        percentage: totalWeight > 0 ? (tally.for / totalWeight) * 100 : 0
      },
      against: {
        weight: tally.against,
        percentage: totalWeight > 0 ? (tally.against / totalWeight) * 100 : 0
      },
      abstain: {
        weight: tally.abstain,
        percentage: totalWeight > 0 ? (tally.abstain / totalWeight) * 100 : 0
      }
    },
    participationRate: totalEligibleVoters ? (totalVotes / totalEligibleVoters) * 100 : undefined,
    anonymitySet: totalEligibleVoters || totalVotes
  }
}

// Mixnet for additional privacy (simplified implementation)
export async function mixBallots(ballots: PrivateBallot[]): Promise<PrivateBallot[]> {
  // Shuffle ballots to remove timing correlations
  const mixed = [...ballots]
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[mixed[i], mixed[j]] = [mixed[j], mixed[i]]
  }
  
  // Add random delay simulation for each ballot
  return mixed.map(ballot => ({
    ...ballot,
    timestamp: new Date(ballot.timestamp.getTime() + Math.random() * 300000) // 0-5 min random delay
  }))
}

// Batch verification for efficiency
export async function batchVerifyProofs(
  proofs: ZKProof[],
  proposalId: string,
  usedNullifiers: string[] = []
): Promise<{ valid: boolean; validProofs: ZKProof[]; invalidProofs: ZKProof[] }> {
  const validProofs: ZKProof[] = []
  const invalidProofs: ZKProof[] = []
  const tempNullifiers = new Set(usedNullifiers)
  
  for (const proof of proofs) {
    if (tempNullifiers.has(proof.nullifier)) {
      invalidProofs.push(proof)
      continue
    }
    
    const isValid = await verifyZKProof(proof, proposalId, Array.from(tempNullifiers))
    if (isValid) {
      validProofs.push(proof)
      tempNullifiers.add(proof.nullifier)
    } else {
      invalidProofs.push(proof)
    }
  }
  
  return {
    valid: invalidProofs.length === 0,
    validProofs,
    invalidProofs
  }
}
