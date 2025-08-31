// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IDAO.sol";
import "./DAOErrors.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LendingDAO
 * @dev A decentralized autonomous organization for peer-to-peer lending
 * @notice This contract implements a lending cooperative with membership management,
 *         loan management, and treasury governance
 */
contract LendingDAO is IDAO, ReentrancyGuard, Pausable, Ownable {
    using DAOErrors for *;

    // Constants
    uint256 public constant PROPOSAL_EDITING_PERIOD = 3 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant PROPOSAL_EXECUTION_DELAY = 1 days;
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant DEFAULT_CONSENSUS_THRESHOLD = 5100; // 51%
    uint256 public constant TREASURY_WITHDRAWAL_THRESHOLD = 5100; // 51%

    // State Variables
    bool public initialized;
    uint256 public consensusThreshold;
    uint256 public membershipFee;
    uint256 public totalMembers;
    uint256 public activeMembers;
    uint256 public proposalCounter;
    uint256 public loanCounter;

    // Mappings
    mapping(address => bool) public admins;
    mapping(address => Member) public members;
    mapping(uint256 => LoanProposal) public loanProposals;
    mapping(uint256 => TreasuryProposal) public treasuryProposals;
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => ProposalType) public proposalTypes;
    mapping(address => uint256) public membershipContributions;
    mapping(address => uint256) public pendingRewards;

    // Loan Policy
    LoanPolicy public loanPolicy;

    // Arrays to track active loans and members
    uint256[] public activeLoans;
    address[] public memberAddresses;

    // Modifiers
    modifier onlyAdmin() {
        if (!admins[msg.sender]) revert DAOErrors.NotAdmin();
        _;
    }

    modifier onlyMember() {
        if (!isMember(msg.sender)) revert DAOErrors.NotMember();
        _;
    }

    modifier onlyInitialized() {
        if (!initialized) revert DAOErrors.AlreadyInitialized();
        _;
    }

    modifier notInitialized() {
        if (initialized) revert DAOErrors.AlreadyInitialized();
        _;
    }

    modifier validAddress(address _address) {
        if (_address == address(0)) revert DAOErrors.ZeroAddress();
        _;
    }

    modifier validAmount(uint256 _amount) {
        if (_amount == 0) revert DAOErrors.ZeroAmount();
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Initialize the DAO with initial admins and configuration
     * @param _initialAdmins Array of initial admin addresses
     * @param _consensusThreshold Threshold for proposal approval (in basis points)
     * @param _membershipFee Fee required to join the DAO
     * @param _loanPolicy Initial loan policy configuration
     */
    function initialize(
        address[] memory _initialAdmins,
        uint256 _consensusThreshold,
        uint256 _membershipFee,
        LoanPolicy memory _loanPolicy
    ) external override onlyOwner notInitialized {
        if (_initialAdmins.length == 0) revert DAOErrors.EmptyAdminsList();
        if (_consensusThreshold == 0 || _consensusThreshold > BASIS_POINTS) {
            revert DAOErrors.InvalidConsensusThreshold();
        }
        if (_membershipFee == 0) revert DAOErrors.InvalidAmount();

        // Set initial admins
        for (uint256 i = 0; i < _initialAdmins.length; i++) {
            if (_initialAdmins[i] == address(0)) revert DAOErrors.ZeroAddress();
            admins[_initialAdmins[i]] = true;
            emit AdminAdded(_initialAdmins[i]);
        }

        consensusThreshold = _consensusThreshold;
        membershipFee = _membershipFee;
        loanPolicy = _loanPolicy;
        initialized = true;

        emit DAOInitialized(_initialAdmins, _consensusThreshold, _membershipFee);
    }

    /**
     * @notice Register as a member by paying the membership fee
     */
    function registerMember() external payable override onlyInitialized whenNotPaused {
        if (isMember(msg.sender) || members[msg.sender].memberAddress != address(0)) {
            revert DAOErrors.AlreadyMember();
        }
        if (msg.value != membershipFee) revert DAOErrors.IncorrectMembershipFee();

        // Create new member directly
        members[msg.sender] = Member({
            memberAddress: msg.sender,
            status: MemberStatus.ACTIVE_MEMBER,
            joinDate: block.timestamp,
            contributionAmount: msg.value,
            shareBalance: msg.value,
            hasActiveLoan: false,
            lastLoanDate: 0
        });
        
        memberAddresses.push(msg.sender);
        totalMembers++;
        activeMembers++;

        emit MembershipFeeReceived(msg.sender, msg.value);
        emit MemberActivated(msg.sender);
    }

    /**
     * @notice Exit the DAO and withdraw proportional share
     */
    function exitDAO() external override onlyInitialized onlyMember nonReentrant whenNotPaused {
        Member storage member = members[msg.sender];
        
        if (member.hasActiveLoan) revert DAOErrors.CannotExitWithActiveLoan();

        uint256 shareToWithdraw = calculateExitShare(msg.sender);
        
        if (address(this).balance < shareToWithdraw) {
            revert DAOErrors.InsufficientTreasuryForExit();
        }

        // Update member status
        member.status = MemberStatus.INACTIVE;
        activeMembers--;

        // Transfer share
        (bool success, ) = payable(msg.sender).call{value: shareToWithdraw}("");
        if (!success) revert DAOErrors.TransferFailed();

        emit MemberExited(msg.sender, shareToWithdraw);
    }

    /**
     * @notice Request a loan from the DAO treasury
     * @param _amount Amount to borrow
     * @return proposalId The ID of the created loan proposal
     */
    function requestLoan(uint256 _amount) 
        external 
        override 
        onlyInitialized 
        onlyMember 
        validAmount(_amount)
        whenNotPaused
        returns (uint256) 
    {
        if (!isEligibleForLoan(msg.sender)) revert DAOErrors.NotEligibleForLoan();

        // Calculate loan terms
        (uint256 interestRate, uint256 totalRepayment, uint256 duration) = calculateLoanTerms(_amount);

        uint256 proposalId = ++proposalCounter;
        
        LoanProposal storage proposal = loanProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.borrower = msg.sender;
        proposal.amount = _amount;
        proposal.interestRate = interestRate;
        proposal.duration = duration;
        proposal.totalRepayment = totalRepayment;
        proposal.createdAt = block.timestamp;
        proposal.editingPeriodEnd = block.timestamp + PROPOSAL_EDITING_PERIOD;
        proposal.phase = ProposalPhase.EDITING;
        proposal.status = ProposalStatus.PENDING;

        proposalTypes[proposalId] = ProposalType.LOAN;

        emit LoanRequested(proposalId, msg.sender, _amount, interestRate, totalRepayment);
        return proposalId;
    }

    /**
     * @notice Edit a loan proposal during the editing period
     * @param _proposalId ID of the proposal to edit
     * @param _newAmount New loan amount
     */
    function editLoanProposal(uint256 _proposalId, uint256 _newAmount)
        external
        override
        onlyInitialized
        onlyMember
        validAmount(_newAmount)
        whenNotPaused
    {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        if (proposal.proposalId == 0) revert DAOErrors.LoanProposalNotFound();
        if (proposal.borrower != msg.sender) revert DAOErrors.NotAuthorized();
        if (proposal.phase != ProposalPhase.EDITING) revert DAOErrors.ProposalNotInEditingPhase();
        if (block.timestamp > proposal.editingPeriodEnd) revert DAOErrors.EditingPeriodEnded();

        // Recalculate loan terms with new amount
        (uint256 newInterestRate, uint256 newTotalRepayment, ) = calculateLoanTerms(_newAmount);

        proposal.amount = _newAmount;
        proposal.interestRate = newInterestRate;
        proposal.totalRepayment = newTotalRepayment;

        emit LoanProposalEdited(_proposalId, msg.sender, _newAmount, newInterestRate, newTotalRepayment);
    }

    /**
     * @notice Vote on a loan proposal
     * @param _proposalId ID of the loan proposal
     * @param _support True for support, false for opposition
     */
    function voteOnLoanProposal(uint256 _proposalId, bool _support) 
        external 
        override 
        onlyInitialized 
        onlyMember 
        whenNotPaused 
    {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        if (proposal.proposalId == 0) revert DAOErrors.LoanProposalNotFound();
        if (proposal.status != ProposalStatus.PENDING) revert DAOErrors.LoanProposalNotPending();
        if (proposal.borrower == msg.sender) revert DAOErrors.CannotVoteOnOwnProposal();
        if (proposal.hasVoted[msg.sender]) revert DAOErrors.AlreadyVoted();
        
        // Update proposal phase if editing period has ended
        _updateProposalPhase(_proposalId);
        
        if (proposal.phase == ProposalPhase.EDITING) revert DAOErrors.ProposalInEditingPhase();
        if (proposal.phase != ProposalPhase.VOTING) revert DAOErrors.VotingNotStarted();
        
        // Check if voting period has ended
        uint256 votingStartTime = proposal.editingPeriodEnd;
        if (block.timestamp > votingStartTime + VOTING_PERIOD) revert DAOErrors.VotingPeriodEnded();

        proposal.hasVoted[msg.sender] = true;

        if (_support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }

        emit LoanVoteCast(_proposalId, msg.sender, _support);

        // Check if proposal passes
        uint256 requiredVotes = (activeMembers * consensusThreshold) / BASIS_POINTS;
        if (proposal.forVotes >= requiredVotes) {
            proposal.status = ProposalStatus.APPROVED;
            proposal.phase = ProposalPhase.EXECUTED;
            _approveLoan(_proposalId);
        }
    }

    /**
     * @notice Repay an active loan
     * @param _loanId ID of the loan to repay
     */
    function repayLoan(uint256 _loanId) 
        external 
        payable 
        override 
        onlyInitialized 
        nonReentrant 
        whenNotPaused 
    {
        Loan storage loan = loans[_loanId];
        
        if (loan.loanId == 0) revert DAOErrors.LoanNotFound();
        if (loan.borrower != msg.sender) revert DAOErrors.NotAuthorized();
        if (loan.status != LoanStatus.ACTIVE) revert DAOErrors.LoanNotActive();
        if (msg.value != loan.totalRepayment) revert DAOErrors.IncorrectRepaymentAmount();

        loan.status = LoanStatus.REPAID;
        loan.amountRepaid = msg.value;

        // Update borrower status
        Member storage borrower = members[msg.sender];
        borrower.hasActiveLoan = false;

        // Remove from active loans
        _removeActiveLoan(_loanId);

        // Distribute interest
        uint256 interestAmount = loan.totalRepayment - loan.principalAmount;
        _distributeInterest(interestAmount);

        emit LoanRepaid(_loanId, msg.sender, msg.value);
    }

    /**
     * @notice Propose a treasury withdrawal
     * @param _amount Amount to withdraw
     * @param _destination Destination address
     * @param _reason Reason for the withdrawal
     * @return proposalId The ID of the created proposal
     */
    function proposeTreasuryWithdrawal(
        uint256 _amount,
        address _destination,
        string memory _reason
    ) 
        external 
        override 
        onlyInitialized 
        onlyMember 
        validAmount(_amount)
        validAddress(_destination)
        whenNotPaused
        returns (uint256) 
    {
        if (address(this).balance < _amount) revert DAOErrors.InsufficientTreasuryBalance();

        uint256 proposalId = ++proposalCounter;
        
        TreasuryProposal storage proposal = treasuryProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.amount = _amount;
        proposal.destination = _destination;
        proposal.reason = _reason;
        proposal.createdAt = block.timestamp;
        proposal.status = ProposalStatus.PENDING;

        proposalTypes[proposalId] = ProposalType.TREASURY_WITHDRAWAL;

        emit TreasuryWithdrawalProposed(proposalId, msg.sender, _amount, _destination);
        return proposalId;
    }

    /**
     * @notice Vote on a treasury withdrawal proposal
     * @param _proposalId ID of the proposal
     * @param _support True for support, false for opposition
     */
    function voteOnTreasuryProposal(uint256 _proposalId, bool _support) 
        external 
        override 
        onlyInitialized 
        onlyMember 
        whenNotPaused 
    {
        TreasuryProposal storage proposal = treasuryProposals[_proposalId];
        
        if (proposal.proposalId == 0) revert DAOErrors.TreasuryProposalNotFound();
        if (proposal.status != ProposalStatus.PENDING) revert DAOErrors.TreasuryProposalNotPending();
        if (proposal.hasVoted[msg.sender]) revert DAOErrors.AlreadyVoted();
        if (block.timestamp > proposal.createdAt + VOTING_PERIOD) revert DAOErrors.VotingPeriodEnded();

        proposal.hasVoted[msg.sender] = true;

        if (_support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }

        emit TreasuryWithdrawalVoteCast(_proposalId, msg.sender, _support);

        // Check if proposal passes (requires higher threshold)
        uint256 requiredVotes = (activeMembers * TREASURY_WITHDRAWAL_THRESHOLD) / BASIS_POINTS;
        if (proposal.forVotes >= requiredVotes) {
            proposal.status = ProposalStatus.APPROVED;
            _executeTreasuryWithdrawal(_proposalId);
        }
    }

    // Admin Functions
    function addAdmin(address _admin) external override onlyAdmin validAddress(_admin) {
        if (admins[_admin]) return; // Already admin
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external override onlyAdmin validAddress(_admin) {
        if (!admins[_admin]) return; // Not admin
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    function setConsensusThreshold(uint256 _threshold) external override onlyAdmin {
        if (_threshold == 0 || _threshold > BASIS_POINTS) {
            revert DAOErrors.InvalidConsensusThreshold();
        }
        consensusThreshold = _threshold;
        emit ConsensusThresholdUpdated(_threshold);
    }

    // Loan Policy Management
    function setMinMembershipDuration(uint256 _duration) external override onlyAdmin {
        if (_duration == 0) revert DAOErrors.InvalidMembershipDuration();
        loanPolicy.minMembershipDuration = _duration;
        _emitLoanPolicyUpdated();
    }

    function setMembershipContribution(uint256 _amount) external override onlyAdmin {
        if (_amount == 0) revert DAOErrors.InvalidContributionAmount();
        loanPolicy.membershipContribution = _amount;
        _emitLoanPolicyUpdated();
    }

    function setMaxLoanDuration(uint256 _duration) external override onlyAdmin {
        if (_duration == 0) revert DAOErrors.InvalidLoanDuration();
        loanPolicy.maxLoanDuration = _duration;
        _emitLoanPolicyUpdated();
    }

    function setInterestRateRange(uint256 _minRate, uint256 _maxRate) external override onlyAdmin {
        if (_minRate == 0 || _maxRate == 0 || _minRate >= _maxRate) {
            revert DAOErrors.InvalidInterestRate();
        }
        loanPolicy.minInterestRate = _minRate;
        loanPolicy.maxInterestRate = _maxRate;
        _emitLoanPolicyUpdated();
    }

    function setCooldownPeriod(uint256 _period) external override onlyAdmin {
        if (_period == 0) revert DAOErrors.InvalidCooldownPeriod();
        loanPolicy.cooldownPeriod = _period;
        _emitLoanPolicyUpdated();
    }

    // Emergency Functions
    function pause() external override onlyAdmin {
        _pause();
    }

    function unpause() external override onlyAdmin {
        _unpause();
    }

    // View Functions
    function getProposal(uint256 _proposalId) 
        external 
        view 
        override 
        returns (
            ProposalType proposalType,
            ProposalStatus status,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 createdAt
        ) 
    {
        proposalType = proposalTypes[_proposalId];
        
        if (proposalType == ProposalType.LOAN) {
            LoanProposal storage proposal = loanProposals[_proposalId];
            return (proposalType, proposal.status, proposal.forVotes, proposal.againstVotes, proposal.createdAt);
        } else if (proposalType == ProposalType.TREASURY_WITHDRAWAL) {
            TreasuryProposal storage proposal = treasuryProposals[_proposalId];
            return (proposalType, proposal.status, proposal.forVotes, proposal.againstVotes, proposal.createdAt);
        }
        
        revert DAOErrors.ProposalNotFound();
    }

    function getMember(address _memberAddress) external view override returns (Member memory) {
        return members[_memberAddress];
    }

    function getLoan(uint256 _loanId) external view override returns (Loan memory) {
        return loans[_loanId];
    }

    function getLoanPolicy() external view override returns (LoanPolicy memory) {
        return loanPolicy;
    }

    function isAdmin(address _address) external view override returns (bool) {
        return admins[_address];
    }

    function isMember(address _address) public view override returns (bool) {
        return members[_address].status == MemberStatus.ACTIVE_MEMBER;
    }

    function isEligibleForLoan(address _member) public view override returns (bool) {
        Member memory member = members[_member];
        
        if (!isMember(_member)) return false;
        if (member.hasActiveLoan) return false;
        
        // Check minimum membership duration
        if (block.timestamp < member.joinDate + loanPolicy.minMembershipDuration) {
            return false;
        }
        
        // Check cooldown period
        if (member.lastLoanDate > 0 && 
            block.timestamp < member.lastLoanDate + loanPolicy.cooldownPeriod) {
            return false;
        }
        
        return true;
    }

    function getTreasuryBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    function getTotalMembers() external view override returns (uint256) {
        return totalMembers;
    }

    function getActiveMembers() external view override returns (uint256) {
        return activeMembers;
    }

    function calculateLoanTerms(uint256 _amount) 
        public 
        view 
        override 
        returns (uint256 interestRate, uint256 totalRepayment, uint256 duration) 
    {
        // Calculate interest rate based on loan amount and treasury ratio
        uint256 treasuryBalance = address(this).balance;
        uint256 loanRatio = (_amount * BASIS_POINTS) / treasuryBalance;
        
        // Higher ratio = higher interest rate
        interestRate = loanPolicy.minInterestRate + 
            ((loanRatio * (loanPolicy.maxInterestRate - loanPolicy.minInterestRate)) / BASIS_POINTS);
        
        // Ensure within bounds
        if (interestRate > loanPolicy.maxInterestRate) {
            interestRate = loanPolicy.maxInterestRate;
        }
        
        duration = loanPolicy.maxLoanDuration;
        totalRepayment = _amount + ((_amount * interestRate) / BASIS_POINTS);
    }

    function calculateExitShare(address _member) public view override returns (uint256) {
        Member memory member = members[_member];
        if (member.status != MemberStatus.ACTIVE_MEMBER) return 0;
        
        // Calculate proportional share of treasury
        uint256 totalContributions = membershipFee * totalMembers;
        if (totalContributions == 0) return 0;
        
        return (address(this).balance * member.contributionAmount) / totalContributions;
    }

    // Internal Functions
    function _approveLoan(uint256 _proposalId) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        // Check treasury has sufficient funds
        if (address(this).balance < proposal.amount) {
            revert DAOErrors.InsufficientTreasuryForLoan();
        }

        uint256 loanId = ++loanCounter;
        
        // Create loan
        loans[loanId] = Loan({
            loanId: loanId,
            borrower: proposal.borrower,
            principalAmount: proposal.amount,
            interestRate: proposal.interestRate,
            totalRepayment: proposal.totalRepayment,
            startDate: block.timestamp,
            dueDate: block.timestamp + proposal.duration,
            status: LoanStatus.ACTIVE,
            amountRepaid: 0
        });

        // Update borrower status
        Member storage borrower = members[proposal.borrower];
        borrower.hasActiveLoan = true;
        borrower.lastLoanDate = block.timestamp;

        // Track active loan
        activeLoans.push(loanId);

        // Disburse funds
        (bool success, ) = payable(proposal.borrower).call{value: proposal.amount}("");
        if (!success) revert DAOErrors.TransferFailed();

        emit LoanApproved(loanId, proposal.borrower, proposal.amount);
        emit LoanDisbursed(loanId, proposal.borrower, proposal.amount);
    }

    function _distributeInterest(uint256 _interestAmount) internal {
        if (_interestAmount == 0 || activeMembers == 0) return;

        uint256 sharePerMember = _interestAmount / activeMembers;
        
        for (uint256 i = 0; i < memberAddresses.length; i++) {
            address memberAddr = memberAddresses[i];
            if (isMember(memberAddr)) {
                pendingRewards[memberAddr] += sharePerMember;
            }
        }

        emit InterestDistributed(_interestAmount, activeMembers);
    }

    function _executeTreasuryWithdrawal(uint256 _proposalId) internal {
        TreasuryProposal storage proposal = treasuryProposals[_proposalId];
        
        if (address(this).balance < proposal.amount) {
            revert DAOErrors.InsufficientTreasuryBalance();
        }

        proposal.status = ProposalStatus.EXECUTED;

        (bool success, ) = payable(proposal.destination).call{value: proposal.amount}("");
        if (!success) revert DAOErrors.TransferFailed();

        emit TreasuryWithdrawalExecuted(_proposalId, proposal.amount, proposal.destination);
    }

    function _removeActiveLoan(uint256 _loanId) internal {
        for (uint256 i = 0; i < activeLoans.length; i++) {
            if (activeLoans[i] == _loanId) {
                activeLoans[i] = activeLoans[activeLoans.length - 1];
                activeLoans.pop();
                break;
            }
        }
    }

    function _updateProposalPhase(uint256 _proposalId) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        if (proposal.phase == ProposalPhase.EDITING && block.timestamp > proposal.editingPeriodEnd) {
            proposal.phase = ProposalPhase.VOTING;
        }
    }

    function _emitLoanPolicyUpdated() internal {
        emit LoanPolicyUpdated(
            loanPolicy.minMembershipDuration,
            loanPolicy.membershipContribution,
            loanPolicy.maxLoanDuration,
            loanPolicy.minInterestRate,
            loanPolicy.maxInterestRate,
            loanPolicy.cooldownPeriod
        );
    }

    // Receive function to accept ETH
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    // Additional utility functions for members to claim rewards
    function claimRewards() external onlyMember nonReentrant {
        uint256 reward = pendingRewards[msg.sender];
        if (reward == 0) revert DAOErrors.ZeroAmount();
        
        pendingRewards[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        if (!success) revert DAOErrors.TransferFailed();
    }

    function getPendingRewards(address _member) external view returns (uint256) {
        return pendingRewards[_member];
    }

    function getActiveLoanIds() external view returns (uint256[] memory) {
        return activeLoans;
    }

    function getMemberAddresses() external view returns (address[] memory) {
        return memberAddresses;
    }
}
