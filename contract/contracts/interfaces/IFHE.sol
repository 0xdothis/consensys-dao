// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFHE {
    // Core FHE types
    struct EncryptedVote {
        bytes32 voteHash;
        uint256 timestamp;
        address voter;
    }
    
    struct EncryptedAmount {
        bytes encryptedValue;
        bytes32 commitment;
    }
    
    // Events
    event PrivateVoteCast(uint256 indexed proposalId, address indexed voter, bytes32 voteHash);
    event ConfidentialLoanRequested(uint256 indexed proposalId, address indexed borrower, string publicReason);
    event EncryptedDataUpdated(address indexed member, bytes32 dataHash, uint256 timestamp);
    event PrivacySettingChanged(string setting, bool enabled);
    
    // Function signatures for privacy features
    function enablePrivateVoting(bool _enabled) external;
    function enableConfidentialLoans(bool _enabled) external;
    function requestConfidentialLoan(bytes calldata _encryptedAmount, string memory _publicReason) external returns (uint256);
}
