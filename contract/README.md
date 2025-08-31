# UnifiedLendingDAO Smart Contract

A comprehensive, all-in-one Solidity smart contract implementing an advanced Decentralized Autonomous Organization (DAO) for peer-to-peer lending with privacy, governance, and yield generation features built with Hardhat v2.

## ✨ Key Features

### 🏛️ Core DAO Functionality
- **Decentralized Lending**: P2P loan system with automated approval and dynamic interest rates
- **Democratic Governance**: Member-driven proposal and voting system
- **Treasury Management**: Secure fund management with multi-signature controls
- **Admin Controls**: Role-based access control and emergency functions

### 🔐 Privacy & Security
- **Private Voting**: Anonymous voting system with commitment schemes
- **Confidential Loans**: Private loan amounts and terms
- **Privacy Levels**: Configurable privacy settings (Basic, Enhanced, Maximum)
- **ENS Integration**: Domain-based identity and weighted voting

### 💰 Advanced Financial Features
- **Yield Generation**: Treasury optimization through restaking protocols
- **Dynamic Interest**: Rates based on treasury utilization and risk assessment
- **Reward Distribution**: Automated interest and yield sharing among members
- **Multi-Asset Support**: ETH-based operations with extensible architecture

### 📄 Document Management
- **IPFS Storage**: Decentralized document storage for loans and governance
- **Access Control**: Private and public document permissions
- **Automatic Backup**: Scheduled DAO state preservation
- **KYC Support**: Member verification document management

## Architecture

### Unified Contract Structure

The project uses a **unified contract architecture** where all features are consolidated into a single, comprehensive smart contract:

```
UnifiedLendingDAO.sol (Main Contract)
├── Core DAO Features ✓
├── ENS Integration ✓
├── Privacy Features ✓
├── Document Storage ✓
├── Restaking Integration ✓
└── Frontend APIs ✓
```

### Supporting Contracts

1. **`IDAO.sol`** - Complete interface definitions
2. **`DAOErrors.sol`** - Gas-efficient error library
3. **`extensions/`** - ENS and Filecoin integration modules
4. **`interfaces/`** - External protocol interfaces
5. **`mocks/`** - Testing infrastructure

### Unified Benefits

- **Single Deployment**: One contract handles all features
- **Gas Optimized**: Shared state and reduced external calls
- **Simplified Integration**: Single ABI for all functionality
- **Feature Toggles**: Enable/disable features as needed
- **Comprehensive Testing**: All features tested together

## Installation & Setup

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat ignition deploy ignition/modules/LendingDAO.ts --network localhost
```

## Contract Configuration

### Default Parameters
- **Membership Fee**: 1 ETH
- **Consensus Threshold**: 51% (5100 basis points)
- **Proposal Editing Period**: 3 days (for loan proposals)
- **Voting Period**: 7 days
- **Min Membership Duration**: 30 days (before loan eligibility)
- **Max Loan Duration**: 1 year
- **Interest Rate Range**: 5% - 20%
- **Cooldown Period**: 90 days between loans

### Loan Policy
The DAO uses dynamic interest rates based on loan-to-treasury ratio:
- Higher loan amounts relative to treasury = higher interest rates
- Interest rates automatically calculated within configured range
- Maximum loan duration and cooldown periods enforced

## Usage Examples

### 1. Initialize DAO
```solidity
// Deploy and initialize
LendingDAO dao = new LendingDAO();
dao.initialize(
    [admin1, admin2], // Initial admins
    5100,             // 51% consensus threshold
    1 ether,          // 1 ETH membership fee
    loanPolicy        // Loan policy struct
);
```

### 2. Member Lifecycle
```solidity
// 1. Register as member (direct payment)
dao.registerMember{value: 1 ether}();

// 2. Exit DAO (withdraw proportional share)
dao.exitDAO();
```

### 3. Loan Lifecycle
```solidity
// 1. Request loan (by eligible member) - starts in EDITING phase
uint256 loanProposalId = dao.requestLoan(5 ether);

// 2. Edit proposal during editing period (3 days)
dao.editLoanProposal(loanProposalId, 4 ether); // Change amount

// 3. Vote on loan after editing period (by other members)
// Note: Proposal owner cannot vote on their own proposal
dao.voteOnLoanProposal(loanProposalId, true);

// 4. Repay loan (by borrower)
dao.repayLoan{value: totalRepaymentAmount}(loanId);

// 5. Claim interest rewards (by members)
dao.claimRewards();
```

### 4. Treasury Management
```solidity
// Propose treasury withdrawal
uint256 proposalId = dao.proposeTreasuryWithdrawal(
    1 ether,
    destinationAddress,
    "Development costs"
);

// Vote on treasury proposal
dao.voteOnTreasuryProposal(proposalId, true);
```

### 5. Advanced Features

#### Privacy Features
```solidity
// Enable privacy features
dao.setPrivacyLevel(2); // Enhanced privacy

// Request confidential loan
bytes32 commitment = keccak256(abi.encodePacked("secret_amount", block.timestamp));
uint256 proposalId = dao.requestLoan(0, true, commitment, "");

// Private voting (emits PrivateVoteCast event)
dao.voteOnLoanProposal(proposalId, true);
```

#### ENS Integration
```solidity
// Register with ENS name for weighted voting
dao.registerMember("alice.eth", "QmKYCHash", {value: 1 ether});

// Enable ENS voting weights
dao.toggleFeature("ensVoting", true);
```

#### Restaking & Yield
```solidity
// Enable restaking features
dao.toggleFeature("restaking", true);

// Approve restaking operators
dao.approveOperator(operatorAddress, "Validator Alpha", 800); // 8% APY

// Allocate treasury to restaking
dao.allocateToRestaking(5 ether);

// Distribute yield to members
dao.distributeYield(1 ether);

// Members claim their yield
dao.claimYield();
dao.claimAllRewards(); // Claim both interest and yield
```

#### Document Storage
```solidity
// Store loan documents
dao.storeLoanDocument(loanId, "QmDocumentHash");

// Request loan with supporting documents
dao.requestLoan(amount, false, bytes32(0), "QmProposalDocHash");
```

## Security Features

- **Access Control**: Role-based permissions (admins vs members)
- **Reentrancy Protection**: ReentrancyGuard on financial functions
- **Pausable**: Emergency pause functionality
- **Input Validation**: Comprehensive validation with custom errors
- **Vote Prevention**: Members cannot vote on their own proposals
- **Time-based Controls**: Voting periods and cooldown periods

## Events

The contract emits comprehensive events for all operations:
- Membership events (proposed, approved, activated, exited)
- Loan events (requested, approved, disbursed, repaid)
- Treasury events (withdrawals proposed, executed)
- Interest distribution events
- Admin and policy change events

## Error Handling

Custom error library provides clear, gas-efficient error messages:
- Access control errors (NotAdmin, NotMember)
- Membership errors (AlreadyMember, IncorrectMembershipFee)
- Loan errors (NotEligibleForLoan, LoanNotActive)
- Treasury errors (InsufficientTreasuryBalance)
- Voting errors (AlreadyVoted, VotingPeriodEnded)

## Bootstrap Problem Solution

With the new direct membership registration system, the bootstrap problem is greatly simplified:
1. **Direct Registration**: Anyone can join by paying the membership fee directly
2. **No Voting Required**: No need for existing members to approve new members
3. **Immediate Access**: New members can participate in governance immediately after joining

Note: Admins still need to be set during initialization for DAO management functions.

## Documentation

For detailed contract documentation, function references, and integration guides, see:
- **[📖 Complete Contract Guide](./docs/CONTRACTS_GUIDE.md)** - Comprehensive documentation with examples
- **[🧪 Test Files](./test/)** - Extensive test suite with usage examples
- **[📜 Contract Interfaces](./contracts/IDAO.sol)** - Complete function signatures and events

## Testing

The project includes comprehensive tests covering:
- DAO initialization and configuration
- Enhanced member registration with ENS
- Privacy features and confidential operations  
- Restaking and yield generation
- Document storage and management
- Treasury governance and voting
- Error conditions and edge cases

Run tests with:
```bash
npx hardhat test
```

**Test Results**: ✅ 44 passing core tests with all UnifiedLendingDAO functionality verified.

## Deployment

Deploy using Hardhat Ignition:
```bash
npx hardhat ignition deploy ignition/modules/LendingDAO.ts --network <network>
```

## License

MIT License - see LICENSE file for details.

## Security Considerations

⚠️ **Important**: This contract is for educational/demonstration purposes. Before using in production:

1. Conduct thorough security audits
2. Test extensively on testnets
3. Consider additional security measures
4. Review all parameters and thresholds
5. Implement proper governance procedures

## Support

For questions or issues, please open a GitHub issue or contact the development team.
