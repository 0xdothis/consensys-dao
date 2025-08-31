// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IDAO.sol";
import "./DAOErrors.sol";
import "./extensions/ENSGovernance.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LendingDAOWithENS
 * @dev Enhanced LendingDAO with ENS-based governance and identity features
 * @notice This contract implements a lending cooperative with ENS domain-based governance,
 *         weighted voting, and professional member identity system
 */
contract LendingDAOWithENS is IDAO, ReentrancyGuard, Pausable, Ownable {
    using DAOErrors for *;

    // Constants
    uint256 public constant PROPOSAL_EDITING_PERIOD = 3 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant PROPOSAL_EXECUTION_DELAY = 1 days;
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant DEFAULT_CONSENSUS_THRESHOLD = 5100; // 51%
    uint256 public constant TREASURY_WITHDRAWAL_THRESHOLD = 5100; // 51%

    // ENS Integration
    ENSGovernance public ensGovernance;
    bool public ensVotingEnabled; // Whether ENS-weighted voting is active
    
    // Enhanced voting tracking with weights
    struct WeightedVote {
        address voter;
        bool support;
        uint256 weight;
        string ensName; // For transparency in governance
        uint256 timestamp;
    }
    
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
    
    // Enhanced governance with ENS
    mapping(uint256 => WeightedVote[]) public proposalVotes; // proposalId => weighted votes
    mapping(uint256 => uint256) public proposalTotalWeight; // proposalId => total voting weight
    mapping(uint256 => uint256) public proposalWeightedForVotes; // proposalId => weighted for votes
    mapping(uint256 => uint256) public proposalWeightedAgainstVotes; // proposalId => weighted against votes

    // Loan Policy
    LoanPolicy public loanPolicy;

    // Arrays to track active loans and members
    uint256[] public activeLoans;
    address[] public memberAddresses;

    // ENS-specific events
    event ENSVotingEnabled(bool enabled);
    event WeightedVoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight,
        string ensName
    );
    event MemberENSDomainLinked(address indexed member, string ensName, uint256 votingWeight);

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

    constructor() Ownable(msg.sender) {
        // Deploy ENS governance contract and transfer ownership to this contract
        ensGovernance = new ENSGovernance();
        ensGovernance.transferOwnership(address(this));
        ensVotingEnabled = false;
    }

    /**
     * @notice Initialize the DAO with initial admins, configuration, and ENS setup
     * @param _initialAdmins Array of initial admin addresses
     * @param _consensusThreshold Threshold for proposal approval (in basis points)
     * @param _membershipFee Fee required to join the DAO
     * @param _loanPolicy Initial loan policy configuration
     * @param _daoEnsName ENS domain for the DAO (optional, can be set later)
     */
    function initialize(
        address[] memory _initialAdmins,
        uint256 _consensusThreshold,
        uint256 _membershipFee,
        LoanPolicy memory _loanPolicy,
        string memory _daoEnsName
    ) external onlyOwner notInitialized {
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

        // Configure ENS if domain name provided
        if (bytes(_daoEnsName).length > 0) {
            // Note: In production, you'd need to set the resolver address appropriately
            // ensGovernance.configureDaoENS(_daoEnsName, resolverAddress);
        }

        emit DAOInitialized(_initialAdmins, _consensusThreshold, _membershipFee);
    }

    // Original IDAO interface function (for compatibility)
    function initialize(
        address[] memory _initialAdmins,
        uint256 _consensusThreshold,
        uint256 _membershipFee,
        LoanPolicy memory _loanPolicy
    ) external override onlyOwner notInitialized {
        // Perform initialization directly to avoid recursive call
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
     * @notice Enable or disable ENS-weighted voting
     * @param _enabled Whether to enable ENS voting weights
     */
    function setENSVotingEnabled(bool _enabled) external onlyAdmin {
        ensVotingEnabled = _enabled;
        emit ENSVotingEnabled(_enabled);
    }

    /**
     * @notice Link member's ENS domain for enhanced governance participation
     * @param _ensName The ENS name to verify and link
     */
    function linkMemberENS(string memory _ensName) external onlyMember {
        // Verify and register member's ENS
        ensGovernance.verifyMemberENS(_ensName, msg.sender);
        
        // Get the voting weight
        uint256 votingWeight = ensGovernance.getMemberVotingWeight(msg.sender);
        
        emit MemberENSDomainLinked(msg.sender, _ensName, votingWeight);
    }

    /**
     * @notice Purchase a subdomain under the DAO's ENS domain
     * @param _subdomain The desired subdomain name
     */
    function purchaseSubdomain(string memory _subdomain) external payable onlyMember {
        ensGovernance.mintMemberSubdomain{value: msg.value}(_subdomain, msg.sender);
        
        uint256 votingWeight = ensGovernance.getMemberVotingWeight(msg.sender);
        emit MemberENSDomainLinked(msg.sender, string(abi.encodePacked(_subdomain, ".", ensGovernance.daoEnsName())), votingWeight);
    }

    /**
     * @notice Enhanced vote on loan proposal with ENS weighting
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

        // Get voting weight (ENS-enhanced if enabled)
        uint256 votingWeight = ensVotingEnabled ? ensGovernance.getMemberVotingWeight(msg.sender) : 100;
        string memory voterENS = ensVotingEnabled ? ensGovernance.getMemberENSData(msg.sender).ensName : "";

        // Record weighted vote
        proposalVotes[_proposalId].push(WeightedVote({
            voter: msg.sender,
            support: _support,
            weight: votingWeight,
            ensName: voterENS,
            timestamp: block.timestamp
        }));

        // Update vote counters
        proposalTotalWeight[_proposalId] += votingWeight;
        
        if (_support) {
            proposal.forVotes++;
            proposalWeightedForVotes[_proposalId] += votingWeight;
        } else {
            proposal.againstVotes++;
            proposalWeightedAgainstVotes[_proposalId] += votingWeight;
        }

        emit LoanVoteCast(_proposalId, msg.sender, _support);
        emit WeightedVoteCast(_proposalId, msg.sender, _support, votingWeight, voterENS);

        // Check if proposal passes (using weighted voting if enabled)
        if (ensVotingEnabled) {
            _checkWeightedProposalApproval(_proposalId);
        } else {
            _checkStandardProposalApproval(_proposalId);
        }
    }

    /**
     * @notice Enhanced vote on treasury proposal with ENS weighting
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

        // Get voting weight (ENS-enhanced if enabled)
        uint256 votingWeight = ensVotingEnabled ? ensGovernance.getMemberVotingWeight(msg.sender) : 100;
        string memory voterENS = ensVotingEnabled ? ensGovernance.getMemberENSData(msg.sender).ensName : "";

        // Record weighted vote
        proposalVotes[_proposalId].push(WeightedVote({
            voter: msg.sender,
            support: _support,
            weight: votingWeight,
            ensName: voterENS,
            timestamp: block.timestamp
        }));

        // Update vote counters
        proposalTotalWeight[_proposalId] += votingWeight;

        if (_support) {
            proposal.forVotes++;
            proposalWeightedForVotes[_proposalId] += votingWeight;
        } else {
            proposal.againstVotes++;
            proposalWeightedAgainstVotes[_proposalId] += votingWeight;
        }

        emit TreasuryWithdrawalVoteCast(_proposalId, msg.sender, _support);
        emit WeightedVoteCast(_proposalId, msg.sender, _support, votingWeight, voterENS);

        // Check if proposal passes (using weighted voting if enabled)
        if (ensVotingEnabled) {
            _checkWeightedTreasuryApproval(_proposalId);
        } else {
            _checkStandardTreasuryApproval(_proposalId);
        }
    }

    /**
     * @notice Get detailed voting information for a proposal
     * @param _proposalId The proposal ID
     * @return votes Array of weighted votes
     * @return totalWeight Total voting weight
     * @return weightedForVotes Weighted votes in favor
     * @return weightedAgainstVotes Weighted votes against
     */
    function getProposalVotingDetails(uint256 _proposalId) external view returns (
        WeightedVote[] memory votes,
        uint256 totalWeight,
        uint256 weightedForVotes,
        uint256 weightedAgainstVotes
    ) {
        return (
            proposalVotes[_proposalId],
            proposalTotalWeight[_proposalId],
            proposalWeightedForVotes[_proposalId],
            proposalWeightedAgainstVotes[_proposalId]
        );
    }

    /**
     * @notice Get member's governance profile including ENS data
     * @param _member The member address
     * @return member The member data
     * @return ensData The member's ENS data
     * @return votingWeight The member's current voting weight
     */
    function getMemberGovernanceProfile(address _member) external view returns (
        Member memory member,
        ENSGovernance.ENSMemberData memory ensData,
        uint256 votingWeight
    ) {
        member = members[_member];
        ensData = ensGovernance.getMemberENSData(_member);
        votingWeight = ensVotingEnabled ? ensGovernance.getMemberVotingWeight(_member) : 100;
    }

    // Internal functions for weighted voting logic
    function _checkWeightedProposalApproval(uint256 _proposalId) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        // Calculate required weighted votes (percentage of total possible weight)
        uint256 totalPossibleWeight = _calculateTotalPossibleVotingWeight();
        uint256 requiredWeight = (totalPossibleWeight * consensusThreshold) / BASIS_POINTS;
        
        if (proposalWeightedForVotes[_proposalId] >= requiredWeight) {
            proposal.status = ProposalStatus.APPROVED;
            proposal.phase = ProposalPhase.EXECUTED;
            _approveLoan(_proposalId);
        }
    }

    function _checkWeightedTreasuryApproval(uint256 _proposalId) internal {
        TreasuryProposal storage proposal = treasuryProposals[_proposalId];
        
        // Calculate required weighted votes (higher threshold for treasury)
        uint256 totalPossibleWeight = _calculateTotalPossibleVotingWeight();
        uint256 requiredWeight = (totalPossibleWeight * TREASURY_WITHDRAWAL_THRESHOLD) / BASIS_POINTS;
        
        if (proposalWeightedForVotes[_proposalId] >= requiredWeight) {
            proposal.status = ProposalStatus.APPROVED;
            _executeTreasuryWithdrawal(_proposalId);
        }
    }

    function _checkStandardProposalApproval(uint256 _proposalId) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        uint256 requiredVotes = (activeMembers * consensusThreshold) / BASIS_POINTS;
        if (proposal.forVotes >= requiredVotes) {
            proposal.status = ProposalStatus.APPROVED;
            proposal.phase = ProposalPhase.EXECUTED;
            _approveLoan(_proposalId);
        }
    }

    function _checkStandardTreasuryApproval(uint256 _proposalId) internal {
        TreasuryProposal storage proposal = treasuryProposals[_proposalId];
        
        uint256 requiredVotes = (activeMembers * TREASURY_WITHDRAWAL_THRESHOLD) / BASIS_POINTS;
        if (proposal.forVotes >= requiredVotes) {
            proposal.status = ProposalStatus.APPROVED;
            _executeTreasuryWithdrawal(_proposalId);
        }
    }

    function _calculateTotalPossibleVotingWeight() internal view returns (uint256) {
        if (!ensVotingEnabled) {
            return activeMembers * 100; // Standard weight
        }
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < memberAddresses.length; i++) {
            address memberAddr = memberAddresses[i];
            if (isMember(memberAddr)) {
                totalWeight += ensGovernance.getMemberVotingWeight(memberAddr);
            }
        }
        return totalWeight;
    }

    // ENS Governance Functions
    function configureDAOENS(string memory _daoEnsName, address _ensResolver) external onlyAdmin {
        ensGovernance.configureDaoENS(_daoEnsName, _ensResolver);
    }

    function setSubdomainPrice(uint256 _price) external onlyAdmin {
        ensGovernance.setSubdomainPrice(_price);
    }

    function reserveSubdomains(string[] memory _subdomains) external onlyAdmin {
        ensGovernance.reserveSubdomains(_subdomains);
    }

    function withdrawENSFees() external onlyAdmin {
        ensGovernance.withdrawSubdomainFees();
    }

    // All original LendingDAO functions remain the same
    function registerMember() external payable virtual override onlyInitialized whenNotPaused {
        if (isMember(msg.sender) || members[msg.sender].memberAddress != address(0)) {
            revert DAOErrors.AlreadyMember();
        }
        if (msg.value != membershipFee) revert DAOErrors.IncorrectMembershipFee();

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

    function exitDAO() external override onlyInitialized onlyMember nonReentrant whenNotPaused {
        Member storage member = members[msg.sender];
        
        if (member.hasActiveLoan) revert DAOErrors.CannotExitWithActiveLoan();

        uint256 shareToWithdraw = calculateExitShare(msg.sender);
        
        if (address(this).balance < shareToWithdraw) {
            revert DAOErrors.InsufficientTreasuryForExit();
        }

        member.status = MemberStatus.INACTIVE;
        activeMembers--;

        (bool success, ) = payable(msg.sender).call{value: shareToWithdraw}("");
        if (!success) revert DAOErrors.TransferFailed();

        emit MemberExited(msg.sender, shareToWithdraw);
    }

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

        (uint256 newInterestRate, uint256 newTotalRepayment, ) = calculateLoanTerms(_newAmount);

        proposal.amount = _newAmount;
        proposal.interestRate = newInterestRate;
        proposal.totalRepayment = newTotalRepayment;

        emit LoanProposalEdited(_proposalId, msg.sender, _newAmount, newInterestRate, newTotalRepayment);
    }

    function repayLoan(uint256 _loanId) 
        external 
        payable 
        virtual
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

        Member storage borrower = members[msg.sender];
        borrower.hasActiveLoan = false;

        _removeActiveLoan(_loanId);

        uint256 interestAmount = loan.totalRepayment - loan.principalAmount;
        _distributeInterest(interestAmount);

        emit LoanRepaid(_loanId, msg.sender, msg.value);
    }

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

    // All other functions remain identical to original LendingDAO...
    // (Including admin functions, view functions, internal functions, etc.)

    // Admin Functions
    function addAdmin(address _admin) external override onlyAdmin validAddress(_admin) {
        if (admins[_admin]) return;
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external override onlyAdmin validAddress(_admin) {
        if (!admins[_admin]) return;
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
        
        if (block.timestamp < member.joinDate + loanPolicy.minMembershipDuration) {
            return false;
        }
        
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
        uint256 treasuryBalance = address(this).balance;
        uint256 loanRatio = (_amount * BASIS_POINTS) / treasuryBalance;
        
        interestRate = loanPolicy.minInterestRate + 
            ((loanRatio * (loanPolicy.maxInterestRate - loanPolicy.minInterestRate)) / BASIS_POINTS);
        
        if (interestRate > loanPolicy.maxInterestRate) {
            interestRate = loanPolicy.maxInterestRate;
        }
        
        duration = loanPolicy.maxLoanDuration;
        totalRepayment = _amount + ((_amount * interestRate) / BASIS_POINTS);
    }

    function calculateExitShare(address _member) public view override returns (uint256) {
        Member memory member = members[_member];
        if (member.status != MemberStatus.ACTIVE_MEMBER) return 0;
        
        uint256 totalContributions = membershipFee * totalMembers;
        if (totalContributions == 0) return 0;
        
        return (address(this).balance * member.contributionAmount) / totalContributions;
    }

    // Internal Functions (same as original)
    function _approveLoan(uint256 _proposalId) internal virtual {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        if (address(this).balance < proposal.amount) {
            revert DAOErrors.InsufficientTreasuryForLoan();
        }

        uint256 loanId = ++loanCounter;
        
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

        Member storage borrower = members[proposal.borrower];
        borrower.hasActiveLoan = true;
        borrower.lastLoanDate = block.timestamp;

        activeLoans.push(loanId);

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

    // Utility functions
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

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
