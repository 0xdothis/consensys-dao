// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IDAO Interface
 * @dev Interface for the DAO contract with all structs, events, and function signatures
 */
interface IDAO {
    // Enums
    enum ProposalStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXECUTED
    }

    enum MemberStatus {
        PENDING_PAYMENT,
        ACTIVE_MEMBER,
        INACTIVE
    }

    enum LoanStatus {
        PENDING,
        APPROVED,
        ACTIVE,
        REPAID,
        DEFAULTED
    }

    enum ProposalType {
        LOAN,
        TREASURY_WITHDRAWAL
    }

    enum ProposalPhase {
        EDITING,
        VOTING,
        EXECUTED,
        EXPIRED
    }

    // Structs
    struct Member {
        address memberAddress;
        MemberStatus status;
        uint256 joinDate;
        uint256 contributionAmount;
        uint256 shareBalance;
        bool hasActiveLoan;
        uint256 lastLoanDate;
    }

    struct LoanProposal {
        uint256 proposalId;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        uint256 totalRepayment;
        uint256 createdAt;
        uint256 editingPeriodEnd;
        ProposalPhase phase;
        ProposalStatus status;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }

    struct Loan {
        uint256 loanId;
        address borrower;
        uint256 principalAmount;
        uint256 interestRate;
        uint256 totalRepayment;
        uint256 startDate;
        uint256 dueDate;
        LoanStatus status;
        uint256 amountRepaid;
    }

    struct TreasuryProposal {
        uint256 proposalId;
        address proposer;
        uint256 amount;
        address destination;
        string reason;
        uint256 createdAt;
        ProposalStatus status;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }

    struct LoanPolicy {
        uint256 minMembershipDuration;
        uint256 membershipContribution;
        uint256 maxLoanDuration;
        uint256 minInterestRate;
        uint256 maxInterestRate;
        uint256 cooldownPeriod;
        uint256 maxLoanToTreasuryRatio;
    }

    // Events - DAO Initialization & Configuration
    event DAOInitialized(
        address[] initialAdmins,
        uint256 consensusThreshold,
        uint256 membershipFee
    );

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event ConsensusThresholdUpdated(uint256 newThreshold);

    // Events - Membership Management
    event MembershipFeeReceived(
        address indexed member,
        uint256 amount
    );

    event MemberActivated(address indexed member);

    event MemberExited(
        address indexed member,
        uint256 shareWithdrawn
    );

    // Events - Loan Management
    event LoanPolicyUpdated(
        uint256 minMembershipDuration,
        uint256 membershipContribution,
        uint256 maxLoanDuration,
        uint256 minInterestRate,
        uint256 maxInterestRate,
        uint256 cooldownPeriod
    );

    event LoanRequested(
        uint256 indexed proposalId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 totalRepayment
    );

    event LoanProposalEdited(
        uint256 indexed proposalId,
        address indexed borrower,
        uint256 newAmount,
        uint256 newInterestRate,
        uint256 newTotalRepayment
    );

    event ProposalPhaseChanged(
        uint256 indexed proposalId,
        ProposalPhase newPhase
    );

    event LoanVoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );

    event LoanApproved(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );

    event LoanDisbursed(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );

    event InterestDistributed(
        uint256 totalInterest,
        uint256 membersCount
    );

    // Events - Treasury & Advanced Governance
    event TreasuryWithdrawalProposed(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount,
        address destination
    );

    event TreasuryWithdrawalVoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );

    event TreasuryWithdrawalExecuted(
        uint256 indexed proposalId,
        uint256 amount,
        address destination
    );

    event FundsReceived(address indexed sender, uint256 amount);

    // Functions - DAO Initialization & Configuration
    function initialize(
        address[] memory _initialAdmins,
        uint256 _consensusThreshold,
        uint256 _membershipFee,
        LoanPolicy memory _loanPolicy
    ) external;

    function addAdmin(address _admin) external;
    function removeAdmin(address _admin) external;
    function setConsensusThreshold(uint256 _threshold) external;

    // Functions - Membership Management
    function registerMember() external payable;
    function exitDAO() external;

    // Functions - Loan Management Lifecycle
    function setMinMembershipDuration(uint256 _duration) external;
    function setMembershipContribution(uint256 _amount) external;
    function setMaxLoanDuration(uint256 _duration) external;
    function setInterestRateRange(uint256 _minRate, uint256 _maxRate) external;
    function setCooldownPeriod(uint256 _period) external;

    function requestLoan(uint256 _amount) external returns (uint256);
    function editLoanProposal(uint256 _proposalId, uint256 _newAmount) external;
    function voteOnLoanProposal(uint256 _proposalId, bool _support) external;
    function repayLoan(uint256 _loanId) external payable;

    // Functions - Treasury & Advanced Governance
    function proposeTreasuryWithdrawal(
        uint256 _amount,
        address _destination,
        string memory _reason
    ) external returns (uint256);

    function voteOnTreasuryProposal(uint256 _proposalId, bool _support) external;

    // View Functions
    function getProposal(uint256 _proposalId) external view returns (
        ProposalType proposalType,
        ProposalStatus status,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 createdAt
    );

    function getMember(address _memberAddress) external view returns (Member memory);
    function getLoan(uint256 _loanId) external view returns (Loan memory);
    function getLoanPolicy() external view returns (LoanPolicy memory);
    
    function isAdmin(address _address) external view returns (bool);
    function isMember(address _address) external view returns (bool);
    function isEligibleForLoan(address _member) external view returns (bool);
    
    function getTreasuryBalance() external view returns (uint256);
    function getTotalMembers() external view returns (uint256);
    function getActiveMembers() external view returns (uint256);
    
    function calculateLoanTerms(uint256 _amount) external view returns (
        uint256 interestRate,
        uint256 totalRepayment,
        uint256 duration
    );
    
    function calculateExitShare(address _member) external view returns (uint256);
    
    // Emergency Functions
    function pause() external;
    function unpause() external;
}
