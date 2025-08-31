# UnifiedLendingDAO Contract Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Contract Functions](#contract-functions)
5. [Usage Examples](#usage-examples)
6. [Integration Guide](#integration-guide)
7. [Security Considerations](#security-considerations)

## Overview

The **UnifiedLendingDAO** is a comprehensive smart contract that consolidates all advanced lending DAO features into a single, unified implementation. It combines traditional peer-to-peer lending functionality with modern DeFi features including privacy, decentralized storage, ENS integration, and yield generation through restaking.

### Key Capabilities
- **Decentralized Lending**: P2P loan system with automated approval
- **Privacy Features**: Private voting and confidential transactions
- **ENS Integration**: Domain-based governance and weighted voting
- **Document Storage**: IPFS-based document management
- **Yield Generation**: Treasury optimization through restaking
- **Governance**: Democratic proposal and voting system

## Architecture

### Contract Structure
```
UnifiedLendingDAO.sol (Main Contract)
├── IDAO.sol (Interface)
├── DAOErrors.sol (Error Library)
├── Extensions/
│   ├── ENSGovernance.sol
│   └── FilecoinStorage.sol
├── Interfaces/
│   ├── IENS.sol
│   ├── IFilecoin.sol
│   ├── IFHE.sol
│   └── ISymbioticIntegration.sol
└── Mocks/
    └── MockSymbioticCore.sol
```

### State Variables Overview

#### Core DAO State
```solidity
bool public initialized;                    // Initialization status
uint256 public consensusThreshold;         // Voting threshold (basis points)
uint256 public membershipFee;              // Fee to join DAO
uint256 public totalMembers;               // Total registered members
uint256 public activeMembers;              // Currently active members
uint256 public proposalCounter;            // Proposal ID counter
uint256 public loanCounter;                // Loan ID counter
```

#### Enhanced Features
```solidity
// ENS Integration
bool public ensVotingEnabled;
mapping(address => string) public memberENSNames;
mapping(address => uint256) public memberVotingWeights;

// Privacy Features
bool public privateVotingEnabled;
bool public confidentialLoansEnabled;
uint256 public privacyLevel;               // 1=Basic, 2=Enhanced, 3=Maximum

// Document Storage
bool public documentStorageEnabled;
mapping(uint256 => string) public loanDocuments;
mapping(uint256 => string) public proposalDocuments;

// Restaking Integration
bool public restakingEnabled;
uint256 public restakingAllocationBPS;     // Default 20%
uint256 public totalYieldGenerated;
uint256 public totalRestaked;
```

## Core Features

### 1. Member Management

#### Registration
Members can register using two methods:

**Standard Registration:**
```solidity
function registerMember() external payable
```

**Enhanced Registration (with ENS and KYC):**
```solidity
function registerMember(
    string memory _ensName,
    string memory _kycHash
) external payable
```

#### Member Lifecycle
- **Join**: Pay membership fee to become active member
- **Participate**: Vote on proposals and request loans
- **Exit**: Withdraw proportional treasury share

### 2. Loan System

#### Loan Request Process
```solidity
function requestLoan(
    uint256 _amount,
    bool _isPrivate,
    bytes32 _commitment,
    string memory _documentHash
) external returns (uint256 proposalId)
```

#### Loan Lifecycle
1. **Request**: Member submits loan proposal
2. **Edit**: 3-day editing period for modifications
3. **Vote**: Members vote on proposal
4. **Approval**: Automatic approval when threshold met
5. **Disbursement**: Funds transferred to borrower
6. **Repayment**: Borrower repays with interest

#### Interest Calculation
Interest rates are dynamically calculated based on:
- Treasury balance ratio
- Configured min/max rates
- Risk assessment

### 3. Privacy Features

#### Privacy Levels
- **Level 1 (Basic)**: Standard operations
- **Level 2 (Enhanced)**: Private voting + confidential loans
- **Level 3 (Maximum)**: Full privacy suite

#### Private Operations
- **Private Voting**: Vote outcomes hidden until reveal
- **Confidential Loans**: Loan amounts kept private
- **Anonymous Participation**: Identity protection

### 4. ENS Integration

#### ENS-Based Governance
- Link ENS names for identity
- Weighted voting based on name characteristics
- Professional member profiles

#### Voting Weight Calculation
```solidity
function _calculateENSVotingWeight(string memory _ensName) internal pure returns (uint256)
```
- Short names (≤5 chars): Higher weight (200)
- Standard names: Variable weight (100-150)
- Long names: Standard weight (100)

### 5. Restaking & Yield Generation

#### Operator Management
```solidity
function approveOperator(
    address _operator,
    string memory _name,
    uint256 _expectedAPY
) external onlyAdmin
```

#### Treasury Allocation
```solidity
function allocateToRestaking(uint256 _amount) external onlyAdmin
```

#### Yield Distribution
```solidity
function distributeYield(uint256 _totalYield) external onlyAdmin
function claimYield() external onlyMember
function claimAllRewards() external onlyMember
```

## Contract Functions

### Core DAO Functions

#### Initialization
```solidity
function initialize(
    address[] memory _initialAdmins,
    uint256 _consensusThreshold,
    uint256 _membershipFee,
    LoanPolicy memory _loanPolicy
) external onlyOwner
```

#### Admin Management
```solidity
function addAdmin(address _admin) external onlyAdmin
function removeAdmin(address _admin) external onlyAdmin
function setConsensusThreshold(uint256 _threshold) external onlyAdmin
```

#### Membership
```solidity
function registerMember() external payable
function exitDAO() external
function isMember(address _address) public view returns (bool)
function isEligibleForLoan(address _member) public view returns (bool)
```

#### Loan Management
```solidity
function requestLoan(uint256 _amount) external returns (uint256)
function editLoanProposal(uint256 _proposalId, uint256 _newAmount) external
function voteOnLoanProposal(uint256 _proposalId, bool _support) external
function repayLoan(uint256 _loanId) external payable
```

#### Treasury Management
```solidity
function proposeTreasuryWithdrawal(
    uint256 _amount,
    address _destination,
    string memory _reason
) external returns (uint256)

function voteOnTreasuryProposal(uint256 _proposalId, bool _support) external
```

### Enhanced Feature Functions

#### Feature Management
```solidity
function toggleFeature(string memory _feature, bool _enabled) external onlyAdmin
function setPrivacyLevel(uint256 _level) external onlyAdmin
```

Available features:
- `"ensVoting"`: ENS-based weighted voting
- `"privateVoting"`: Private voting system
- `"confidentialLoans"`: Confidential loan amounts
- `"documentStorage"`: Document storage system
- `"restaking"`: Treasury restaking

#### Document Storage
```solidity
function storeLoanDocument(uint256 _loanId, string memory _ipfsHash) external
```

#### Restaking Operations
```solidity
function approveOperator(address _operator, string memory _name, uint256 _expectedAPY) external onlyAdmin
function allocateToRestaking(uint256 _amount) external onlyAdmin
function distributeYield(uint256 _totalYield) external onlyAdmin
function claimYield() external onlyMember
```

### View Functions (Frontend-Friendly)

#### DAO Statistics
```solidity
function getDAOStats() external view returns (
    uint256 treasuryBalance,
    uint256 totalMembersCount,
    uint256 activeMembersCount,
    uint256 totalLoans,
    uint256 activeLoansCount,
    uint256 totalYield,
    uint256 totalRestaking,
    bool privacyEnabled,
    bool restakingActive,
    bool ensEnabled,
    bool documentsEnabled
)
```

#### Member Information
```solidity
function getMemberProfile(address _member) external view returns (
    Member memory memberData,
    string memory ensName,
    uint256 votingWeight,
    uint256 memberPendingRewards,
    uint256 memberPendingYield,
    string memory kycHash,
    bool hasActiveProposal
)
```

#### Proposal Information
```solidity
function getEnhancedProposal(uint256 _proposalId) external view returns (
    ProposalType proposalType,
    ProposalStatus status,
    uint256 forVotes,
    uint256 againstVotes,
    uint256 createdAt,
    bool isPrivate,
    string memory documentHash,
    address proposer
)
```

## Usage Examples

### 1. Basic DAO Setup

```solidity
// Deploy contract
UnifiedLendingDAO dao = new UnifiedLendingDAO();

// Initialize with basic configuration
address[] memory admins = [admin1, admin2];
LoanPolicy memory policy = LoanPolicy({
    minMembershipDuration: 30 days,
    membershipContribution: 1 ether,
    maxLoanDuration: 90 days,
    minInterestRate: 500,  // 5%
    maxInterestRate: 2000, // 20%
    cooldownPeriod: 7 days,
    maxLoanToTreasuryRatio: 5000 // 50%
});

dao.initialize(admins, 5100, 1 ether, policy);
```

### 2. Enhanced Member Registration

```solidity
// Register with ENS name and KYC
dao.registerMember{value: 1 ether}("alice.eth", "QmKYCHash123");

// Check member profile
(Member memory member, string memory ensName, uint256 weight,,,) = 
    dao.getMemberProfile(memberAddress);
```

### 3. Privacy-Enabled Loan

```solidity
// Enable privacy features
dao.setPrivacyLevel(2); // Enhanced privacy

// Request confidential loan
bytes32 commitment = keccak256(abi.encodePacked("secret_amount", block.timestamp));
uint256 proposalId = dao.requestLoan(0, true, commitment, "");

// Vote privately (emits PrivateVoteCast event)
dao.voteOnLoanProposal(proposalId, true);
```

### 4. Restaking Setup

```solidity
// Enable restaking
dao.toggleFeature("restaking", true);

// Approve operators
dao.approveOperator(operator1, "Validator Alpha", 800); // 8% APY
dao.approveOperator(operator2, "Validator Beta", 1000); // 10% APY

// Allocate treasury to restaking
dao.allocateToRestaking(5 ether);

// Distribute yield to members
dao.distributeYield(1 ether);
```

### 5. Document Storage

```solidity
// Store loan document
dao.storeLoanDocument(loanId, "QmDocumentHash");

// Enable document storage for all operations
dao.toggleFeature("documentStorage", true);
```

## Integration Guide

### Frontend Integration

#### 1. Contract Connection
```javascript
const contract = new ethers.Contract(contractAddress, abi, signer);
```

#### 2. DAO Statistics Dashboard
```javascript
const stats = await contract.getDAOStats();
console.log(`Treasury: ${ethers.formatEther(stats.treasuryBalance)} ETH`);
console.log(`Members: ${stats.activeMembersCount}/${stats.totalMembersCount}`);
console.log(`Privacy: ${stats.privacyEnabled ? 'Enabled' : 'Disabled'}`);
```

#### 3. Member Registration
```javascript
// Standard registration
await contract.registerMember({ value: membershipFee });

// Enhanced registration with ENS
await contract["registerMember(string,string)"](
    "alice.eth", 
    "QmKYCHash", 
    { value: membershipFee }
);
```

#### 4. Loan Management
```javascript
// Request loan
const tx = await contract.requestLoan(
    ethers.parseEther("5"), // Amount
    false,                  // Not private
    ethers.ZeroHash,       // No commitment
    ""                     // No document
);
const receipt = await tx.wait();
const proposalId = receipt.logs[0].args[0];

// Vote on loan
await contract.voteOnLoanProposal(proposalId, true);
```

#### 5. Yield Management
```javascript
// Check pending rewards
const rewards = await contract.getMemberRewards(memberAddress);
console.log(`Pending yield: ${ethers.formatEther(rewards.totalYield)}`);

// Claim all rewards
await contract.claimAllRewards();
```

### Backend Integration

#### 1. Event Monitoring
```javascript
// Listen for loan events
contract.on("LoanRequested", (proposalId, borrower, amount) => {
    console.log(`New loan request: ${proposalId} for ${ethers.formatEther(amount)} ETH`);
});

// Listen for privacy events
contract.on("PrivateProposalCreated", (proposalId, commitment) => {
    console.log(`Private proposal created: ${proposalId}`);
});
```

#### 2. Data Indexing
```javascript
// Get all proposals with pagination
const [proposalIds, hasMore] = await contract.getProposals(0, 50, true);

// Get detailed proposal info
for (const id of proposalIds) {
    const proposal = await contract.getEnhancedProposal(id);
    // Store in database
}
```

## Security Considerations

### Access Controls
- **Admin Functions**: Protected by `onlyAdmin` modifier
- **Member Functions**: Protected by `onlyMember` modifier
- **Financial Operations**: Protected by `nonReentrant` modifier

### Financial Security
- **Reentrancy Protection**: All financial functions use ReentrancyGuard
- **Amount Validation**: All monetary inputs validated
- **Balance Checks**: Sufficient balance verification before transfers

### Privacy Protection
- **Commitment Schemes**: Private proposals use cryptographic commitments
- **Vote Hiding**: Private votes hidden until reveal phase
- **Data Encryption**: Sensitive data encrypted before storage

### Emergency Controls
- **Pause Mechanism**: Admin can pause all operations
- **Emergency Exit**: Members can exit even during emergencies
- **Upgrade Safety**: Initialization can only happen once

### Best Practices
1. Always check `initialized` status before operations
2. Validate all inputs in frontend before submission
3. Handle failed transactions gracefully
4. Monitor events for state changes
5. Implement proper error handling for all edge cases

### Audit Recommendations
Before production deployment:
1. Conduct comprehensive security audit
2. Test all edge cases thoroughly
3. Verify gas optimization
4. Test pause/unpause mechanisms
5. Validate all mathematical calculations
6. Test privacy features extensively
7. Verify restaking integration security

## Conclusion

The UnifiedLendingDAO contract provides a comprehensive, feature-rich platform for decentralized lending with advanced privacy, governance, and yield generation capabilities. Its modular design and extensive API make it suitable for both simple peer-to-peer lending and sophisticated DeFi applications.

For additional support or questions, please refer to the test files for detailed usage examples and edge cases.
