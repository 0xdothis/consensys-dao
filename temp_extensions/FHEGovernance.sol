// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zama-ai/fhevm/contracts/TFHE.sol";

contract FHEGovernance is Ownable {
    using TFHE for euint32;
    using TFHE for euint64;
    using TFHE for ebool;
    
    struct EncryptedProposal {
        uint256 proposalId;
        euint64 encryptedAmount;
        ebool isActive;
        address proposer;
        uint256 createdAt;
        bytes32 encryptedMetadataHash;
    }
    
    // Encrypted voting tallies
    mapping(uint256 => euint32) private encryptedForVotes;
    mapping(uint256 => euint32) private encryptedAgainstVotes;
    mapping(uint256 => EncryptedProposal) private encryptedProposals;
    mapping(uint256 => mapping(address => ebool)) private hasVotedEncrypted;
    
    // Privacy settings
    bool public encryptedVotingEnabled;
    bool public encryptedProposalsEnabled;
    
    event EncryptedProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event EncryptedVoteRecorded(uint256 indexed proposalId, address indexed voter);
    event PrivacyModeChanged(string feature, bool enabled);
    
    constructor() Ownable(msg.sender) {
        encryptedVotingEnabled = false;
        encryptedProposalsEnabled = false;
    }
    
    /**
     * @notice Enable or disable encrypted voting
     * @param _enabled Whether to enable encrypted voting
     */
    function setEncryptedVotingEnabled(bool _enabled) external onlyOwner {
        encryptedVotingEnabled = _enabled;
        emit PrivacyModeChanged("encryptedVoting", _enabled);
    }
    
    /**
     * @notice Enable or disable encrypted proposals
     * @param _enabled Whether to enable encrypted proposals
     */
    function setEncryptedProposalsEnabled(bool _enabled) external onlyOwner {
        encryptedProposalsEnabled = _enabled;
        emit PrivacyModeChanged("encryptedProposals", _enabled);
    }
    
    /**
     * @notice Create an encrypted proposal
     * @param _proposalId The proposal ID
     * @param _encryptedAmount Encrypted amount for the proposal
     * @param _encryptedMetadata Encrypted metadata
     */
    function createEncryptedProposal(
        uint256 _proposalId,
        bytes calldata _encryptedAmount,
        bytes calldata _encryptedMetadata
    ) external onlyOwner {
        require(encryptedProposalsEnabled, "Encrypted proposals not enabled");
        
        EncryptedProposal storage proposal = encryptedProposals[_proposalId];
        proposal.proposalId = _proposalId;
        proposal.encryptedAmount = TFHE.asEuint64(_encryptedAmount);
        proposal.isActive = TFHE.asEbool(true);
        proposal.proposer = tx.origin;
        proposal.createdAt = block.timestamp;
        proposal.encryptedMetadataHash = keccak256(_encryptedMetadata);
        
        emit EncryptedProposalCreated(_proposalId, tx.origin);
    }
    
    /**
     * @notice Record an encrypted vote
     * @param _proposalId The proposal ID
     * @param _voter The voter address
     * @param _vote Encrypted vote (true/false)
     */
    function recordEncryptedVote(
        uint256 _proposalId,
        address _voter,
        ebool _vote
    ) external onlyOwner {
        require(encryptedVotingEnabled, "Encrypted voting not enabled");
        require(!TFHE.decrypt(hasVotedEncrypted[_proposalId][_voter]), "Already voted");
        
        // Mark as voted
        hasVotedEncrypted[_proposalId][_voter] = TFHE.asEbool(true);
        
        // Weight could be based on member stake or reputation
        euint32 voteWeight = TFHE.asEuint32(1); // Simple 1-vote per member for now
        
        // Add to appropriate tally using conditional selection
        euint32 forVoteIncrease = TFHE.cmux(_vote, voteWeight, TFHE.asEuint32(0));
        euint32 againstVoteIncrease = TFHE.cmux(_vote, TFHE.asEuint32(0), voteWeight);
        
        encryptedForVotes[_proposalId] = encryptedForVotes[_proposalId].add(forVoteIncrease);
        encryptedAgainstVotes[_proposalId] = encryptedAgainstVotes[_proposalId].add(againstVoteIncrease);
        
        emit EncryptedVoteRecorded(_proposalId, _voter);
    }
    
    /**
     * @notice Check if a proposal has enough encrypted votes for approval
     * @param _proposalId The proposal ID
     * @param _requiredVotes Required number of votes for approval
     * @return Whether the proposal is approved
     */
    function checkProposalApproval(
        uint256 _proposalId,
        uint256 _requiredVotes
    ) external view returns (bool) {
        euint32 required = TFHE.asEuint32(_requiredVotes);
        ebool approved = encryptedForVotes[_proposalId].gte(required);
        return TFHE.decrypt(approved);
    }
    
    /**
     * @notice Get encrypted proposal data (only owner can decrypt)
     * @param _proposalId The proposal ID
     * @return proposer The proposal creator
     * @return createdAt Creation timestamp
     * @return metadataHash Encrypted metadata hash
     */
    function getEncryptedProposal(uint256 _proposalId) external view onlyOwner returns (
        address proposer,
        uint256 createdAt,
        bytes32 metadataHash
    ) {
        EncryptedProposal storage proposal = encryptedProposals[_proposalId];
        return (proposal.proposer, proposal.createdAt, proposal.encryptedMetadataHash);
    }
    
    /**
     * @notice Check if an address has voted on an encrypted proposal
     * @param _proposalId The proposal ID
     * @param _voter The voter address
     * @return Whether the voter has voted
     */
    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return TFHE.decrypt(hasVotedEncrypted[_proposalId][_voter]);
    }
    
    /**
     * @notice Get encrypted vote tallies (only accessible to owner)
     * @param _proposalId The proposal ID
     * @return forVotes Decrypted for votes count
     * @return againstVotes Decrypted against votes count
     */
    function getEncryptedVoteTallies(uint256 _proposalId) external view onlyOwner returns (
        uint256 forVotes,
        uint256 againstVotes
    ) {
        return (
            TFHE.decrypt(encryptedForVotes[_proposalId]),
            TFHE.decrypt(encryptedAgainstVotes[_proposalId])
        );
    }
    
    /**
     * @notice Reset proposal voting state (for testing or resets)
     * @param _proposalId The proposal ID
     */
    function resetProposalVoting(uint256 _proposalId) external onlyOwner {
        encryptedForVotes[_proposalId] = TFHE.asEuint32(0);
        encryptedAgainstVotes[_proposalId] = TFHE.asEuint32(0);
    }
}
