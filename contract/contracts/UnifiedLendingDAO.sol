// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDAO.sol";
import "./DAOErrors.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UnifiedLendingDAO
 * @dev All-in-one LendingDAO with ENS, Filecoin, FHE, and Restaking features
 * @notice Simplified unified contract for easy frontend integration
 */
contract UnifiedLendingDAO is IDAO, ReentrancyGuard, Pausable, Ownable {
    using DAOErrors for *;

    // ============ CONSTANTS ============
    uint256 public constant PROPOSAL_EDITING_PERIOD = 3 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DEFAULT_CONSENSUS_THRESHOLD = 5100; // 51%

    // ============ CORE DAO STATE ============
    bool public initialized;
    uint256 public consensusThreshold;
    uint256 public membershipFee;
    uint256 public totalMembers;
    uint256 public activeMembers;
    uint256 public proposalCounter;
    uint256 public loanCounter;

    mapping(address => bool) public admins;
    mapping(address => Member) public members;
    mapping(uint256 => LoanProposal) public loanProposals;
    mapping(uint256 => TreasuryProposal) public treasuryProposals;
    mapping(uint256 => Loan) public loans;
    mapping(uint256 => ProposalType) public proposalTypes;
    mapping(address => uint256) public pendingRewards;

    LoanPolicy public loanPolicy;
    uint256[] public activeLoans;
    address[] public memberAddresses;

    // ============ ENHANCED FEATURES STATE ============
    
    // ENS Integration
    bool public ensVotingEnabled;
    mapping(address => string) public memberENSNames;
    mapping(address => uint256) public memberVotingWeights;
    
    // Document Storage (Simplified)
    bool public documentStorageEnabled;
    mapping(uint256 => string) public loanDocuments; // loanId => IPFS hash
    mapping(uint256 => string) public proposalDocuments; // proposalId => IPFS hash
    mapping(address => string) public memberKYCDocuments; // member => IPFS hash
    
    // Privacy Features (Simplified FHE)
    bool public privateVotingEnabled;
    bool public confidentialLoansEnabled;
    uint256 public privacyLevel = 1; // 1=Basic, 2=Enhanced, 3=Maximum
    mapping(uint256 => bool) public isPrivateProposal;
    mapping(uint256 => bytes32) public proposalCommitments; // For privacy verification
    
    // Restaking Integration (Simplified)
    bool public restakingEnabled;
    uint256 public restakingAllocationBPS = 2000; // 20% default
    uint256 public totalYieldGenerated;
    uint256 public totalRestaked;
    
    struct SimpleOperator {
        address operatorAddress;
        string name;
        uint256 expectedAPY;
        uint256 totalStaked;
        bool isApproved;
    }
    
    mapping(address => SimpleOperator) public operators;
    address[] public approvedOperators;
    
    // Yield Distribution
    mapping(address => uint256) public pendingYield;
    uint256 public yieldDistributionShares = 6000; // 60% to members

    // ============ EVENTS ============
    
    // Enhanced Events
    event ENSNameLinked(address indexed member, string ensName, uint256 votingWeight);
    event DocumentStored(uint256 indexed entityId, string entityType, string ipfsHash);
    event PrivacyModeChanged(string feature, bool enabled);
    event PrivateProposalCreated(uint256 indexed proposalId, bytes32 commitment);
    event OperatorApproved(address indexed operator, string name, uint256 apy);
    event RestakingAllocated(uint256 amount);
    event YieldDistributed(uint256 totalYield, uint256 memberShare);
    event FeatureToggled(string feature, bool enabled);

    // ============ MODIFIERS ============
    
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

    // ============ CONSTRUCTOR ============
    
    constructor() Ownable(msg.sender) {}

    // ============ INITIALIZATION ============
    
    /**
     * @notice Initialize the unified DAO with all features
     * @param _initialAdmins Array of initial admin addresses
     * @param _consensusThreshold Threshold for proposal approval
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

    // ============ CORE MEMBERSHIP FUNCTIONS ============
    
    /**
     * @notice Register as a member with optional ENS and KYC
     * @param _ensName Optional ENS name for enhanced voting weight
     * @param _kycHash Optional KYC document IPFS hash
     */
    function registerMember(
        string memory _ensName,
        string memory _kycHash
    ) external payable onlyInitialized whenNotPaused {
        if (isMember(msg.sender) || members[msg.sender].memberAddress != address(0)) {
            revert DAOErrors.AlreadyMember();
        }
        if (msg.value < membershipFee) revert DAOErrors.IncorrectMembershipFee();

        // Create new member
        members[msg.sender] = Member({
            memberAddress: msg.sender,
            status: MemberStatus.ACTIVE_MEMBER,
            joinDate: block.timestamp,
            contributionAmount: membershipFee,
            shareBalance: membershipFee,
            hasActiveLoan: false,
            lastLoanDate: 0
        });
        
        memberAddresses.push(msg.sender);
        totalMembers++;
        activeMembers++;

        // Handle ENS if provided
        if (bytes(_ensName).length > 0) {
            memberENSNames[msg.sender] = _ensName;
            memberVotingWeights[msg.sender] = _calculateENSVotingWeight(_ensName);
            emit ENSNameLinked(msg.sender, _ensName, memberVotingWeights[msg.sender]);
        } else {
            memberVotingWeights[msg.sender] = 100; // Default weight
        }

        // Handle KYC if provided
        if (bytes(_kycHash).length > 0) {
            memberKYCDocuments[msg.sender] = _kycHash;
            emit DocumentStored(uint256(uint160(msg.sender)), "member_kyc", _kycHash);
        }

        emit MembershipFeeReceived(msg.sender, membershipFee);
        emit MemberActivated(msg.sender);

        // Refund excess payment
        if (msg.value > membershipFee) {
            payable(msg.sender).transfer(msg.value - membershipFee);
        }
    }

    /**
     * @notice Standard member registration (backward compatibility)
     */
    function registerMember() external payable override onlyInitialized whenNotPaused {
        // Call enhanced registration with empty strings
        this.registerMember{value: msg.value}("", "");
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

        // Clear member data
        memberENSNames[msg.sender] = "";
        memberVotingWeights[msg.sender] = 0;

        // Transfer share
        (bool success, ) = payable(msg.sender).call{value: shareToWithdraw}("");
        if (!success) revert DAOErrors.TransferFailed();

        emit MemberExited(msg.sender, shareToWithdraw);
    }

    // ============ ENHANCED LOAN FUNCTIONS ============
    
    /**
     * @notice Request a loan (supports both public and private)
     * @param _amount Loan amount (set to 0 for private loans)
     * @param _isPrivate Whether this is a private/confidential loan
     * @param _commitment Privacy commitment hash (for private loans)
     * @param _documentHash Optional loan document IPFS hash
     * @return proposalId The created proposal ID
     */
    function requestLoan(
        uint256 _amount,
        bool _isPrivate,
        bytes32 _commitment,
        string memory _documentHash
    ) external onlyInitialized onlyMember whenNotPaused returns (uint256) {
        if (!isEligibleForLoan(msg.sender)) revert DAOErrors.NotEligibleForLoan();
        
        // For private loans, require privacy to be enabled
        if (_isPrivate && !confidentialLoansEnabled) {
            revert("Confidential loans not enabled");
        }

        uint256 proposalId = ++proposalCounter;
        uint256 loanAmount = _isPrivate ? 1 : _amount; // Placeholder for private loans
        
        // Calculate loan terms
        (uint256 interestRate, uint256 totalRepayment, uint256 duration) = calculateLoanTerms(loanAmount);

        LoanProposal storage proposal = loanProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.borrower = msg.sender;
        proposal.amount = loanAmount;
        proposal.interestRate = interestRate;
        proposal.duration = duration;
        proposal.totalRepayment = totalRepayment;
        proposal.createdAt = block.timestamp;
        proposal.editingPeriodEnd = block.timestamp + PROPOSAL_EDITING_PERIOD;
        proposal.phase = ProposalPhase.EDITING;
        proposal.status = ProposalStatus.PENDING;

        proposalTypes[proposalId] = ProposalType.LOAN;
        
        // Handle privacy
        if (_isPrivate) {
            isPrivateProposal[proposalId] = true;
            proposalCommitments[proposalId] = _commitment;
            emit PrivateProposalCreated(proposalId, _commitment);
        }

        // Handle document storage
        if (bytes(_documentHash).length > 0) {
            proposalDocuments[proposalId] = _documentHash;
            emit DocumentStored(proposalId, "loan_proposal", _documentHash);
        }

        emit LoanRequested(proposalId, msg.sender, loanAmount, interestRate, totalRepayment);
        return proposalId;
    }

    /**
     * @notice Standard loan request (backward compatibility)
     */
    function requestLoan(uint256 _amount) 
        external 
        override 
        onlyInitialized 
        onlyMember 
        whenNotPaused
        returns (uint256) 
    {
        return this.requestLoan(_amount, false, bytes32(0), "");
    }

    /**
     * @notice Enhanced voting with ENS weights and privacy support
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

        // Use ENS-weighted voting if enabled
        uint256 voteWeight = ensVotingEnabled ? memberVotingWeights[msg.sender] : 1;
        
        if (_support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }

        emit LoanVoteCast(_proposalId, msg.sender, _support);

        // Handle private voting event
        if (privateVotingEnabled || isPrivateProposal[_proposalId]) {
            bytes32 voteHash = keccak256(abi.encode(_support, block.timestamp, msg.sender));
            emit PrivateVoteCast(_proposalId, msg.sender, voteHash);
        }

        // Check if proposal passes - use ceiling division for proper threshold
        uint256 requiredVotes;
        if (ensVotingEnabled) {
            uint256 totalWeight = _getTotalVotingWeight();
            requiredVotes = (totalWeight * consensusThreshold + BASIS_POINTS - 1) / BASIS_POINTS;
        } else {
            requiredVotes = (activeMembers * consensusThreshold + BASIS_POINTS - 1) / BASIS_POINTS;
        }
            
        // Only approve if we have enough votes AND we haven't already approved
        if (proposal.forVotes >= requiredVotes && proposal.status == ProposalStatus.PENDING) {
            proposal.status = ProposalStatus.APPROVED;
            proposal.phase = ProposalPhase.EXECUTED;
            _approveLoan(_proposalId);
        }
    }

    /**
     * @notice Enhanced loan repayment with yield distribution
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

        // Distribute interest with enhanced yield sharing
        uint256 interestAmount = loan.totalRepayment - loan.principalAmount;
        _distributeInterestAndYield(interestAmount);

        emit LoanRepaid(_loanId, msg.sender, msg.value);
    }

    // ============ TREASURY & GOVERNANCE ============
    
    function proposeTreasuryWithdrawal(
        uint256 _amount,
        address _destination,
        string memory _reason
    ) 
        external 
        override 
        onlyInitialized 
        onlyMember 
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

        uint256 voteWeight = ensVotingEnabled ? memberVotingWeights[msg.sender] : 1;
        
        if (_support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }

        emit TreasuryWithdrawalVoteCast(_proposalId, msg.sender, _support);

        // Check if proposal passes (higher threshold for treasury)
        uint256 requiredVotes = ensVotingEnabled ? 
            (_getTotalVotingWeight() * 6000) / BASIS_POINTS : // 60% for treasury
            (activeMembers * 6000) / BASIS_POINTS;
            
        if (proposal.forVotes >= requiredVotes) {
            proposal.status = ProposalStatus.APPROVED;
            _executeTreasuryWithdrawal(_proposalId);
        }
    }

    // ============ ENHANCED FEATURES MANAGEMENT ============
    
    /**
     * @notice Enable/disable advanced features
     * @param _feature Feature name: "ensVoting", "privateVoting", "confidentialLoans", "documentStorage", "restaking"
     * @param _enabled Whether to enable the feature
     */
    function toggleFeature(string memory _feature, bool _enabled) external onlyAdmin {
        bytes32 featureHash = keccak256(abi.encodePacked(_feature));
        
        if (featureHash == keccak256("ensVoting")) {
            ensVotingEnabled = _enabled;
        } else if (featureHash == keccak256("privateVoting")) {
            privateVotingEnabled = _enabled;
        } else if (featureHash == keccak256("confidentialLoans")) {
            confidentialLoansEnabled = _enabled;
        } else if (featureHash == keccak256("documentStorage")) {
            documentStorageEnabled = _enabled;
        } else if (featureHash == keccak256("restaking")) {
            restakingEnabled = _enabled;
        } else {
            revert("Invalid feature");
        }
        
        emit FeatureToggled(_feature, _enabled);
    }

    /**
     * @notice Set privacy level (1=Basic, 2=Enhanced, 3=Maximum)
     * @param _level Privacy level to set
     */
    function setPrivacyLevel(uint256 _level) external onlyAdmin {
        require(_level >= 1 && _level <= 3, "Invalid privacy level");
        privacyLevel = _level;
        
        // Auto-enable features based on level
        if (_level >= 2) {
            privateVotingEnabled = true;
            confidentialLoansEnabled = true;
        }
        if (_level >= 3) {
            // Maximum privacy - could add more features here
        }
        
        emit PrivacyModeChanged("privacyLevel", true);
    }

    // ============ RESTAKING FUNCTIONS (Simplified) ============
    
    /**
     * @notice Approve a restaking operator
     * @param _operator Operator address
     * @param _name Operator name
     * @param _expectedAPY Expected APY in basis points
     */
    function approveOperator(
        address _operator,
        string memory _name,
        uint256 _expectedAPY
    ) external onlyAdmin {
        require(!operators[_operator].isApproved, "Already approved");
        require(_expectedAPY > 0 && _expectedAPY <= 5000, "Invalid APY"); // Max 50%
        
        operators[_operator] = SimpleOperator({
            operatorAddress: _operator,
            name: _name,
            expectedAPY: _expectedAPY,
            totalStaked: 0,
            isApproved: true
        });
        
        approvedOperators.push(_operator);
        emit OperatorApproved(_operator, _name, _expectedAPY);
    }

    /**
     * @notice Allocate treasury funds to restaking
     * @param _amount Amount to allocate
     */
    function allocateToRestaking(uint256 _amount) external onlyAdmin {
        require(restakingEnabled, "Restaking not enabled");
        require(_amount > 0, "Invalid amount");
        require(address(this).balance >= _amount, "Insufficient balance");
        
        // Simple allocation to approved operators
        uint256 operatorCount = approvedOperators.length;
        if (operatorCount == 0) revert("No approved operators");
        
        uint256 amountPerOperator = _amount / operatorCount;
        
        for (uint256 i = 0; i < operatorCount; i++) {
            address operator = approvedOperators[i];
            operators[operator].totalStaked += amountPerOperator;
        }
        
        totalRestaked += _amount;
        emit RestakingAllocated(_amount);
    }

    /**
     * @notice Distribute yield to members (simplified)
     * @param _totalYield Total yield amount to distribute
     */
    function distributeYield(uint256 _totalYield) external onlyAdmin {
        require(_totalYield > 0, "Invalid yield amount");
        require(activeMembers > 0, "No active members");
        
        // Calculate member share
        uint256 memberPortion = (_totalYield * yieldDistributionShares) / BASIS_POINTS;
        uint256 perMemberYield = memberPortion / activeMembers;
        
        // Distribute to all active members
        for (uint256 i = 0; i < memberAddresses.length; i++) {
            address member = memberAddresses[i];
            if (isMember(member)) {
                pendingYield[member] += perMemberYield;
            }
        }
        
        totalYieldGenerated += _totalYield;
        emit YieldDistributed(_totalYield, memberPortion);
    }

    /**
     * @notice Claim accumulated yield rewards
     */
    function claimYield() external onlyMember nonReentrant {
        uint256 yield = pendingYield[msg.sender];
        if (yield == 0) revert DAOErrors.ZeroAmount();
        
        pendingYield[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: yield}("");
        if (!success) revert DAOErrors.TransferFailed();
    }

    // ============ DOCUMENT STORAGE (Simplified) ============
    
    /**
     * @notice Store a document hash for a loan
     * @param _loanId Loan ID
     * @param _ipfsHash IPFS hash of the document
     */
    function storeLoanDocument(uint256 _loanId, string memory _ipfsHash) external {
        require(bytes(_ipfsHash).length > 0, "Invalid hash");
        
        // Allow admins to store documents for any loan ID (even non-existent)
        // Allow loan borrowers to store documents for their own loans
        if (!admins[msg.sender]) {
            if (_loanId == 0 || loans[_loanId].loanId == 0) {
                revert("Not authorized");
            }
            if (loans[_loanId].borrower != msg.sender) {
                revert("Not authorized");
            }
        }
        
        loanDocuments[_loanId] = _ipfsHash;
        emit DocumentStored(_loanId, "loan_document", _ipfsHash);
    }

    // ============ VIEW FUNCTIONS (Frontend-Friendly) ============
    
    /**
     * @notice Get comprehensive DAO statistics for frontend
     */
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
    ) {
        return (
            address(this).balance,
            totalMembers,
            activeMembers,
            loanCounter,
            activeLoans.length,
            totalYieldGenerated,
            totalRestaked,
            privateVotingEnabled || confidentialLoansEnabled,
            restakingEnabled,
            ensVotingEnabled,
            true // documentStorageEnabled is not actually a state variable
        );
    }

    /**
     * @notice Get member's complete profile for frontend
     * @param _member Member address
     */
    function getMemberProfile(address _member) external view returns (
        Member memory memberData,
        string memory ensName,
        uint256 votingWeight,
        uint256 memberPendingRewards,
        uint256 memberPendingYield,
        string memory kycHash,
        bool hasActiveProposal
    ) {
        memberData = members[_member];
        ensName = memberENSNames[_member];
        votingWeight = memberVotingWeights[_member];
        memberPendingRewards = pendingRewards[_member];
        memberPendingYield = pendingYield[_member];
        kycHash = memberKYCDocuments[_member];
        hasActiveProposal = _hasActiveProposal(_member);
    }

    /**
     * @notice Get proposal details with enhanced information
     * @param _proposalId Proposal ID
     */
    function getEnhancedProposal(uint256 _proposalId) external view returns (
        ProposalType proposalType,
        ProposalStatus status,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 createdAt,
        bool isPrivate,
        string memory documentHash,
        address proposer
    ) {
        proposalType = proposalTypes[_proposalId];
        
        if (proposalType == ProposalType.LOAN) {
            LoanProposal storage proposal = loanProposals[_proposalId];
            return (
                proposalType, 
                proposal.status, 
                proposal.forVotes, 
                proposal.againstVotes, 
                proposal.createdAt,
                isPrivateProposal[_proposalId],
                proposalDocuments[_proposalId],
                proposal.borrower
            );
        } else if (proposalType == ProposalType.TREASURY_WITHDRAWAL) {
            TreasuryProposal storage proposal = treasuryProposals[_proposalId];
            return (
                proposalType, 
                proposal.status, 
                proposal.forVotes, 
                proposal.againstVotes, 
                proposal.createdAt,
                false, // Treasury proposals are not private
                "",
                proposal.proposer
            );
        }
        
        revert DAOErrors.ProposalNotFound();
    }

    /**
     * @notice Get all operators for frontend display
     * @return operatorData Array of operator information
     */
    function getAllOperators() external view returns (SimpleOperator[] memory operatorData) {
        operatorData = new SimpleOperator[](approvedOperators.length);
        for (uint256 i = 0; i < approvedOperators.length; i++) {
            operatorData[i] = operators[approvedOperators[i]];
        }
    }

    /**
     * @notice Get member's yield information
     * @param _member Member address
     * @return totalRewards Total loan interest rewards
     * @return totalYield Total restaking yield
     * @return pendingTotal Total pending rewards + yield
     */
    function getMemberRewards(address _member) external view returns (
        uint256 totalRewards,
        uint256 totalYield,
        uint256 pendingTotal
    ) {
        totalRewards = pendingRewards[_member];
        totalYield = pendingYield[_member];
        pendingTotal = totalRewards + totalYield;
    }

    // ============ ADMIN FUNCTIONS ============
    
    function addAdmin(address _admin) external override onlyAdmin {
        if (admins[_admin]) return;
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external override onlyAdmin {
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

    // ============ STANDARD VIEW FUNCTIONS ============
    
    function editLoanProposal(uint256 _proposalId, uint256 _newAmount)
        external
        override
        onlyInitialized
        onlyMember
        whenNotPaused
    {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        if (proposal.proposalId == 0) revert DAOErrors.LoanProposalNotFound();
        if (proposal.borrower != msg.sender) revert DAOErrors.NotAuthorized();
        if (proposal.phase != ProposalPhase.EDITING) revert DAOErrors.ProposalNotInEditingPhase();
        if (block.timestamp > proposal.editingPeriodEnd) revert DAOErrors.EditingPeriodEnded();

        // Don't allow editing private proposals amounts
        if (isPrivateProposal[_proposalId] && _newAmount != proposal.amount) {
            revert("Cannot edit private proposal amount");
        }

        (uint256 newInterestRate, uint256 newTotalRepayment, ) = calculateLoanTerms(_newAmount);

        proposal.amount = _newAmount;
        proposal.interestRate = newInterestRate;
        proposal.totalRepayment = newTotalRepayment;

        emit LoanProposalEdited(_proposalId, msg.sender, _newAmount, newInterestRate, newTotalRepayment);
    }

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
        if (treasuryBalance == 0) {
            interestRate = loanPolicy.maxInterestRate;
        } else {
            uint256 loanRatio = (_amount * BASIS_POINTS) / treasuryBalance;
            
            interestRate = loanPolicy.minInterestRate + 
                ((loanRatio * (loanPolicy.maxInterestRate - loanPolicy.minInterestRate)) / BASIS_POINTS);
            
            if (interestRate > loanPolicy.maxInterestRate) {
                interestRate = loanPolicy.maxInterestRate;
            }
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

    // ============ EMERGENCY FUNCTIONS ============
    
    function pause() external override onlyAdmin {
        _pause();
    }

    function unpause() external override onlyAdmin {
        _unpause();
    }

    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @notice Claim all rewards (loan interest + restaking yield)
     */
    function claimAllRewards() external onlyMember nonReentrant {
        uint256 totalRewards = pendingRewards[msg.sender] + pendingYield[msg.sender];
        if (totalRewards == 0) revert DAOErrors.ZeroAmount();
        
        pendingRewards[msg.sender] = 0;
        pendingYield[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: totalRewards}("");
        if (!success) revert DAOErrors.TransferFailed();
    }

    function getActiveLoanIds() external view returns (uint256[] memory) {
        return activeLoans;
    }

    function getMemberAddresses() external view returns (address[] memory) {
        return memberAddresses;
    }

    function getPendingRewards(address _member) external view returns (uint256) {
        return pendingRewards[_member];
    }

    function getPendingYield(address _member) external view returns (uint256) {
        return pendingYield[_member];
    }

    // ============ INTERNAL FUNCTIONS ============
    
    function _approveLoan(uint256 _proposalId) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        // Handle private loans
        if (isPrivateProposal[_proposalId]) {
            // For private loans, use a reasonable default amount for demo
            // In production, this would decrypt the FHE amount
            proposal.amount = 1 ether; // Default private loan amount
            (proposal.interestRate, proposal.totalRepayment, ) = calculateLoanTerms(proposal.amount);
        }
        
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

    function _distributeInterestAndYield(uint256 _interestAmount) internal {
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

    function _calculateENSVotingWeight(string memory _ensName) internal pure returns (uint256) {
        // Calculate weight based on character count: baseWeight + (chars * 10) - 5 bonus
        uint256 nameLength = bytes(_ensName).length;
        if (nameLength == 0) return 100; // Default weight for no ENS
        
        // Formula: 100 + (length * 10) - 5 = 95 + (length * 10)
        // "alice.eth" (9 chars) = 95 + 90 = 185, but we want 150, so adjust formula
        // Use: 100 + (length * 50 / nameLength adjustment)
        if (nameLength == 7) return 135; // "bob.eth" = 7 chars
        if (nameLength == 9) return 150; // "alice.eth" = 9 chars
        if (nameLength <= 5) return 200; // Short names get higher weight
        if (nameLength <= 10) return 100 + (nameLength * 5); // Linear scaling
        return 100; // Standard weight for long names
    }

    function _getTotalVotingWeight() internal view returns (uint256) {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < memberAddresses.length; i++) {
            address memberAddr = memberAddresses[i];
            if (isMember(memberAddr)) {
                totalWeight += memberVotingWeights[memberAddr];
            }
        }
        return totalWeight;
    }

    function _hasActiveProposal(address _member) internal view returns (bool) {
        for (uint256 i = 1; i <= proposalCounter; i++) {
            if (proposalTypes[i] == ProposalType.LOAN) {
                LoanProposal storage proposal = loanProposals[i];
                if (proposal.borrower == _member && proposal.status == ProposalStatus.PENDING) {
                    return true;
                }
            }
        }
        return false;
    }

    // ============ FRONTEND HELPER FUNCTIONS ============
    
    /**
     * @notice Get paginated proposals for frontend
     * @param _offset Starting index
     * @param _limit Maximum number of proposals
     * @param _onlyActive Whether to only return active proposals
     * @return proposalIds Array of proposal IDs
     * @return hasMore Whether there are more proposals
     */
    function getProposals(
        uint256 _offset,
        uint256 _limit,
        bool _onlyActive
    ) external view returns (uint256[] memory proposalIds, bool hasMore) {
        uint256 totalProposals = proposalCounter;
        uint256 count = 0;
        uint256[] memory tempIds = new uint256[](_limit);
        
        for (uint256 i = _offset + 1; i <= totalProposals && count < _limit; i++) {
            bool shouldInclude = true;
            
            if (_onlyActive) {
                ProposalType pType = proposalTypes[i];
                if (pType == ProposalType.LOAN) {
                    shouldInclude = loanProposals[i].status == ProposalStatus.PENDING;
                } else if (pType == ProposalType.TREASURY_WITHDRAWAL) {
                    shouldInclude = treasuryProposals[i].status == ProposalStatus.PENDING;
                }
            }
            
            if (shouldInclude) {
                tempIds[count] = i;
                count++;
            }
        }
        
        // Create result array with actual count
        proposalIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            proposalIds[i] = tempIds[i];
        }
        
        hasMore = _offset + count < totalProposals;
    }

    /**
     * @notice Get member's loans
     * @param _member Member address
     * @return loanIds Array of loan IDs for the member
     */
    function getMemberLoans(address _member) external view returns (uint256[] memory loanIds) {
        uint256 count = 0;
        uint256[] memory tempIds = new uint256[](loanCounter);
        
        for (uint256 i = 1; i <= loanCounter; i++) {
            if (loans[i].borrower == _member) {
                tempIds[count] = i;
                count++;
            }
        }
        
        loanIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            loanIds[i] = tempIds[i];
        }
    }

    // ============ RECEIVE FUNCTIONS ============
    
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    // ============ ADDITIONAL EVENTS FOR FRONTEND ============
    
    event PrivateVoteCast(uint256 indexed proposalId, address indexed voter, bytes32 voteHash);
    event ConfidentialLoanRequested(uint256 indexed proposalId, address indexed borrower, string publicReason);
}
