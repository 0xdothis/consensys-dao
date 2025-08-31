// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DAOErrors Library
 * @dev Custom error definitions for the DAO contract
 */
library DAOErrors {
    // Access Control Errors
    error NotAdmin();
    error NotMember();
    error NotAuthorized();

    // Initialization Errors
    error AlreadyInitialized();
    error InvalidInitialConfiguration();
    error InvalidConsensusThreshold();
    error EmptyAdminsList();

    // Membership Errors
    error AlreadyMember();
    error IncorrectMembershipFee();
    error CannotExitWithActiveLoan();
    error InsufficientTreasuryForExit();

    // Loan Errors
    error NotEligibleForLoan();
    error LoanAmountTooHigh();
    error LoanAmountTooLow();
    error HasActiveLoan();
    error InCooldownPeriod();
    error LoanProposalNotFound();
    error LoanProposalNotPending();
    error LoanNotFound();
    error LoanNotActive();
    error LoanAlreadyRepaid();
    error IncorrectRepaymentAmount();
    error LoanOverdue();
    error InsufficientTreasuryForLoan();

    // Treasury Errors
    error TreasuryProposalNotFound();
    error TreasuryProposalNotPending();
    error InsufficientTreasuryBalance();
    error InvalidWithdrawalAmount();
    error InvalidDestinationAddress();

    // Proposal Errors
    error ProposalNotFound();
    error ProposalExpired();
    error ProposalAlreadyExecuted();
    error InvalidProposalType();

    // Voting Errors
    error VotingPeriodEnded();
    error VotingPeriodNotEnded();
    error InsufficientVotes();
    error QuorumNotReached();
    error AlreadyVoted();
    error CannotVoteOnOwnProposal();
    error ProposalInEditingPhase();
    error ProposalNotInEditingPhase();
    error EditingPeriodEnded();
    error VotingNotStarted();

    // General Errors
    error ZeroAddress();
    error ZeroAmount();
    error InvalidAmount();
    error InvalidDuration();
    error InvalidRate();
    error ContractPaused();
    error TransferFailed();
    error InvalidArrayLength();

    // Policy Errors
    error InvalidMembershipDuration();
    error InvalidContributionAmount();
    error InvalidLoanDuration();
    error InvalidInterestRate();
    error InvalidCooldownPeriod();
    error InvalidLoanToTreasuryRatio();
}
