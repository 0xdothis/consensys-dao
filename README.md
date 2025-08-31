# Lending DAO Smart Contract

A comprehensive Solidity smart contract implementing a Decentralized Autonomous Organization (DAO) for peer-to-peer lending built with Hardhat v2.

## Features

### 🏛️ DAO Initialization & Configuration
- Deploy DAO with initial admins and configuration parameters
- Set consensus thresholds and membership fees
- Admin management (add/remove admins)

### 👥 Membership Management
- **Direct Registration**: Anyone can join instantly by paying the membership fee
- **Exit DAO**: Members can exit and withdraw their proportional treasury share

### 💰 Loan Management Lifecycle
- **Configure Loan Policy**: Admins set loan parameters (duration, interest rates, cooldown periods)
- **Request Loans**: Eligible members can request loans with automatic term calculation
- **Edit Proposals**: Borrowers can edit their loan proposals during a 3-day editing period
- **Vote on Loans**: Members vote to approve/reject loan requests after editing period (51% threshold)
- **Self-Vote Prevention**: Proposal owners cannot vote on their own proposals
- **Repay Loans**: Borrowers repay loans with principal + interest
- **Interest Distribution**: Interest automatically distributed equally among active members

### 🏦 Treasury & Advanced Governance
- **Treasury Withdrawals**: Members can propose treasury withdrawals for DAO expenses
- **Enhanced Voting**: Treasury withdrawals require 51% approval threshold
- **Automatic Execution**: Approved proposals are automatically executed

## Architecture

### Core Contracts

1. **`IDAO.sol`** - Interface defining all structs, events, and function signatures
2. **`DAOErrors.sol`** - Library containing custom error definitions
3. **`LendingDAO.sol`** - Main DAO contract implementing all functionality

### Key Features

- **Gas Optimized**: Uses libraries for errors and interfaces for type definitions
- **Security**: Implements ReentrancyGuard, Pausable, and access controls
- **Modular**: Clean separation of concerns with interfaces and libraries
- **Comprehensive Events**: Full event coverage for all operations
- **Emergency Controls**: Pause/unpause functionality for emergency situations

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

## Testing

The project includes comprehensive tests covering:
- DAO initialization
- Admin functionality
- Membership management
- Treasury operations
- Error conditions

Run tests with:
```bash
npx hardhat test
```

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
