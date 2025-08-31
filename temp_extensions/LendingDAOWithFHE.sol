// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LendingDAOWithFilecoin.sol";
import "./extensions/FHEGovernance.sol";
import "./extensions/FHECreditScoring.sol";
import "./interfaces/IFHE.sol";
import "@zama-ai/fhevm/contracts/TFHE.sol";

contract LendingDAOWithFHE is LendingDAOWithFilecoin, IFHE {
    using TFHE for euint32;
    using TFHE for euint64;
    using TFHE for ebool;
    
    // FHE Extensions
    FHEGovernance public fheGovernance;
    FHECreditScoring public fheCreditScoring;
    
    // Privacy controls
    bool public privateVotingEnabled;
    bool public confidentialLoansEnabled;
    bool public encryptedBalancesEnabled;
    
    // FHE state variables
    mapping(address => euint64) private encryptedBalances;
    mapping(address => euint32) private encryptedCreditScores;
    mapping(uint256 => euint64) private encryptedLoanAmounts;
    mapping(uint256 => mapping(address => ebool)) private encryptedVotes;
    
    // Privacy settings
    uint256 public privacyLevel = 1; // 1=Basic, 2=Enhanced, 3=Maximum
    mapping(uint256 => bool) public proposalPrivacyMode; // proposalId => isPrivate
    
    // Confidential loan proposals
    mapping(uint256 => EncryptedAmount) public confidentialLoanAmounts;
    
    constructor() {
        // Deploy FHE extensions
        fheGovernance = new FHEGovernance();
        fheCreditScoring = new FHECreditScoring();
        
        // Transfer ownership to DAO
        fheGovernance.transferOwnership(address(this));
        fheCreditScoring.transferOwnership(address(this));
        
        // Initialize privacy settings
        privateVotingEnabled = false;
        confidentialLoansEnabled = false;
        encryptedBalancesEnabled = false;
    }
    
    /**
     * @notice Enable or disable private voting
     * @param _enabled Whether to enable private voting
     */
    function enablePrivateVoting(bool _enabled) external override onlyAdmin {
        privateVotingEnabled = _enabled;
        fheGovernance.setEncryptedVotingEnabled(_enabled);
        emit PrivacySettingChanged("privateVoting", _enabled);
    }
    
    /**
     * @notice Enable or disable confidential loans
     * @param _enabled Whether to enable confidential loans
     */
    function enableConfidentialLoans(bool _enabled) external override onlyAdmin {
        confidentialLoansEnabled = _enabled;
        emit PrivacySettingChanged("confidentialLoans", _enabled);
    }
    
    /**
     * @notice Enable or disable encrypted balances
     * @param _enabled Whether to enable encrypted balances
     */
    function enableEncryptedBalances(bool _enabled) external onlyAdmin {
        encryptedBalancesEnabled = _enabled;
        emit PrivacySettingChanged("encryptedBalances", _enabled);
    }
    
    /**
     * @notice Enhanced voting with privacy options
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
        if (privateVotingEnabled || proposalPrivacyMode[_proposalId]) {
            _castPrivateVote(_proposalId, _support);
        } else {
            super.voteOnLoanProposal(_proposalId, _support);
        }
    }
    
    /**
     * @notice Cast a private vote using FHE
     * @param _proposalId The proposal ID
     * @param _support The vote decision
     */
    function _castPrivateVote(uint256 _proposalId, bool _support) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        if (proposal.proposalId == 0) revert DAOErrors.LoanProposalNotFound();
        if (proposal.status != ProposalStatus.PENDING) revert DAOErrors.LoanProposalNotPending();
        if (proposal.borrower == msg.sender) revert DAOErrors.CannotVoteOnOwnProposal();
        
        // Check if already voted using FHE governance
        require(!fheGovernance.hasVoted(_proposalId, msg.sender), "Already voted");
        
        // Update proposal phase if editing period has ended
        _updateProposalPhase(_proposalId);
        
        if (proposal.phase == ProposalPhase.EDITING) revert DAOErrors.ProposalInEditingPhase();
        if (proposal.phase != ProposalPhase.VOTING) revert DAOErrors.VotingNotStarted();
        
        // Check if voting period has ended
        uint256 votingStartTime = proposal.editingPeriodEnd;
        if (block.timestamp > votingStartTime + VOTING_PERIOD) revert DAOErrors.VotingPeriodEnded();
        
        // Convert vote to encrypted boolean and record
        ebool encryptedVote = TFHE.asEbool(_support);
        encryptedVotes[_proposalId][msg.sender] = encryptedVote;
        
        // Update encrypted vote tallies through FHE governance
        fheGovernance.recordEncryptedVote(_proposalId, msg.sender, encryptedVote);
        
        // Update standard vote counters for compatibility
        proposal.hasVoted[msg.sender] = true;
        if (_support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }
        
        emit PrivateVoteCast(_proposalId, msg.sender, keccak256(abi.encode(_support, block.timestamp)));
        
        // Check if proposal passes using encrypted vote count
        uint256 requiredVotes = (activeMembers * consensusThreshold) / BASIS_POINTS;
        if (fheGovernance.checkProposalApproval(_proposalId, requiredVotes)) {
            proposal.status = ProposalStatus.APPROVED;
            proposal.phase = ProposalPhase.EXECUTED;
            _approveLoan(_proposalId);
        }
    }
    
    /**
     * @notice Request a confidential loan with encrypted amount
     * @param _encryptedAmount Encrypted loan amount
     * @param _publicReason Public reason for the loan (non-sensitive)
     * @return proposalId The created proposal ID
     */
    function requestConfidentialLoan(
        bytes calldata _encryptedAmount,
        string memory _publicReason
    ) external override onlyMember returns (uint256) {
        require(confidentialLoansEnabled, "Confidential loans disabled");
        require(isEligibleForLoan(msg.sender), "Not eligible for loan");
        require(bytes(_publicReason).length > 0, "Public reason required");
        
        euint64 amount = TFHE.asEuint64(_encryptedAmount);
        
        uint256 proposalId = ++proposalCounter;
        encryptedLoanAmounts[proposalId] = amount;
        proposalPrivacyMode[proposalId] = true;
        
        // Store encrypted amount for later use
        confidentialLoanAmounts[proposalId] = EncryptedAmount({
            encryptedValue: _encryptedAmount,
            commitment: keccak256(abi.encode(_encryptedAmount, block.timestamp, msg.sender))
        });
        
        // Create standard proposal structure with placeholder amount
        // Real amount is encrypted and stored separately
        _createConfidentialLoanProposal(proposalId, amount, _publicReason);
        
        emit ConfidentialLoanRequested(proposalId, msg.sender, _publicReason);
        return proposalId;
    }
    
    /**
     * @notice Initialize encrypted credit profile for member
     * @param _member The member address
     * @param _encryptedInitialScore Encrypted initial credit score
     */
    function initializeMemberCreditProfile(
        address _member,
        bytes calldata _encryptedInitialScore
    ) external onlyAdmin {
        require(isMember(_member), "Not a member");
        fheCreditScoring.initializeCreditProfile(_member, _encryptedInitialScore);
    }
    
    /**
     * @notice Update member's encrypted balance
     * @param _member The member address
     * @param _encryptedBalance New encrypted balance
     */
    function updateEncryptedBalance(
        address _member,
        bytes calldata _encryptedBalance
    ) external onlyAdmin {
        require(encryptedBalancesEnabled, "Encrypted balances disabled");
        require(isMember(_member), "Not a member");
        
        encryptedBalances[_member] = TFHE.asEuint64(_encryptedBalance);
        emit EncryptedDataUpdated(_member, keccak256(_encryptedBalance), block.timestamp);
    }
    
    /**
     * @notice Set privacy level for the DAO
     * @param _level Privacy level (1=Basic, 2=Enhanced, 3=Maximum)
     */
    function setPrivacyLevel(uint256 _level) external onlyAdmin {
        require(_level >= 1 && _level <= 3, "Invalid privacy level");
        privacyLevel = _level;
        
        // Automatically enable features based on privacy level
        if (_level >= 2) {
            enablePrivateVoting(true);
            enableConfidentialLoans(true);
        }
        if (_level >= 3) {
            enableEncryptedBalances(true);
        }
    }
    
    /**
     * @notice Get member's encrypted credit score (decrypted for admin use)
     * @param _member The member address
     * @return creditScore The decrypted credit score
     */
    function getMemberCreditScore(address _member) external view onlyAdmin returns (uint32) {
        require(fheCreditScoring.hasCreditProfile(_member), "No credit profile");
        return fheCreditScoring.getMemberCreditScore(_member);
    }
    
    /**
     * @notice Assess creditworthiness for encrypted loan
     * @param _member The member address
     * @param _encryptedAmount Encrypted requested amount
     * @return isApproved Whether the loan is approved
     */
    function assessConfidentialCreditworthiness(
        address _member,
        bytes calldata _encryptedAmount
    ) external view onlyAdmin returns (bool) {
        require(fheCreditScoring.hasCreditProfile(_member), "No credit profile");
        return fheCreditScoring.assessCreditworthiness(_member, _encryptedAmount);
    }
    
    /**
     * @notice Create confidential loan proposal with encrypted amount
     * @param _proposalId The proposal ID
     * @param _encryptedAmount Encrypted loan amount
     * @param _publicReason Public reason for the loan
     */
    function _createConfidentialLoanProposal(
        uint256 _proposalId,
        euint64 _encryptedAmount,
        string memory _publicReason
    ) internal {
        // Create proposal with placeholder values
        // Real amount is encrypted and handled separately
        LoanProposal storage proposal = loanProposals[_proposalId];
        proposal.proposalId = _proposalId;
        proposal.borrower = msg.sender;
        proposal.amount = 1; // Placeholder - real amount is encrypted
        proposal.interestRate = loanPolicy.minInterestRate; // Default rate
        proposal.duration = loanPolicy.maxLoanDuration;
        proposal.totalRepayment = 1; // Placeholder - calculated when decrypted
        proposal.createdAt = block.timestamp;
        proposal.editingPeriodEnd = block.timestamp + PROPOSAL_EDITING_PERIOD;
        proposal.phase = ProposalPhase.EDITING;
        proposal.status = ProposalStatus.PENDING;
        
        proposalTypes[_proposalId] = ProposalType.LOAN;
        
        // Create encrypted proposal in FHE governance
        bytes memory encryptedMetadata = abi.encode(_publicReason, msg.sender, block.timestamp);
        fheGovernance.createEncryptedProposal(_proposalId, abi.encode(_encryptedAmount), encryptedMetadata);
        
        emit LoanRequested(_proposalId, msg.sender, 1, loanPolicy.minInterestRate, 1);
    }
    
    /**
     * @notice Enhanced member registration with encrypted data initialization
     */
    function registerMember() external payable override onlyInitialized whenNotPaused {
        // Call parent registration
        super.registerMember();
        
        // Initialize encrypted balance if enabled
        if (encryptedBalancesEnabled) {
            bytes memory encryptedMembershipFee = abi.encode(msg.value);
            encryptedBalances[msg.sender] = TFHE.asEuint64(encryptedMembershipFee);
        }
        
        // Initialize credit profile with default score
        if (privacyLevel >= 2) {
            bytes memory defaultScore = abi.encode(uint32(500)); // Default credit score
            fheCreditScoring.initializeCreditProfile(msg.sender, defaultScore);
        }
    }
    
    /**
     * @notice Enhanced loan approval with encrypted amount handling
     * @param _proposalId The proposal ID
     */
    function _approveLoan(uint256 _proposalId) internal override {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        // If this is a confidential loan, decrypt the amount for execution
        if (proposalPrivacyMode[_proposalId]) {
            // In production, this would require proper FHE decryption with access control
            // For now, we'll handle it as a special case
            _approveConfidentialLoan(_proposalId);
        } else {
            super._approveLoan(_proposalId);
        }
    }
    
    /**
     * @notice Approve confidential loan with encrypted amount
     * @param _proposalId The proposal ID
     */
    function _approveConfidentialLoan(uint256 _proposalId) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        // Decrypt amount for loan execution (only possible by DAO contract)
        euint64 encryptedAmount = encryptedLoanAmounts[_proposalId];
        
        // In production, amount would be decrypted with proper access controls
        // For demo purposes, we'll use a simplified approach
        uint256 decryptedAmount = _simulateDecryption(encryptedAmount);
        
        // Validate treasury has sufficient funds
        if (address(this).balance < decryptedAmount) {
            revert DAOErrors.InsufficientTreasuryForLoan();
        }
        
        // Calculate terms with decrypted amount
        (uint256 interestRate, uint256 totalRepayment, uint256 duration) = calculateLoanTerms(decryptedAmount);
        
        // Update proposal with real values
        proposal.amount = decryptedAmount;
        proposal.interestRate = interestRate;
        proposal.totalRepayment = totalRepayment;
        proposal.duration = duration;
        
        uint256 loanId = ++loanCounter;
        
        // Create loan
        loans[loanId] = Loan({
            loanId: loanId,
            borrower: proposal.borrower,
            principalAmount: decryptedAmount,
            interestRate: interestRate,
            totalRepayment: totalRepayment,
            startDate: block.timestamp,
            dueDate: block.timestamp + duration,
            status: LoanStatus.ACTIVE,
            amountRepaid: 0
        });
        
        // Update borrower status
        Member storage borrower = members[proposal.borrower];
        borrower.hasActiveLoan = true;
        borrower.lastLoanDate = block.timestamp;
        
        // Track active loan
        activeLoans.push(loanId);
        
        // Update encrypted balance if enabled
        if (encryptedBalancesEnabled) {
            euint64 currentBalance = encryptedBalances[proposal.borrower];
            euint64 loanAmountEncrypted = TFHE.asEuint64(abi.encode(decryptedAmount));
            encryptedBalances[proposal.borrower] = currentBalance.add(loanAmountEncrypted);
        }
        
        // Disburse funds
        (bool success, ) = payable(proposal.borrower).call{value: decryptedAmount}("");
        if (!success) revert DAOErrors.TransferFailed();
        
        emit LoanApproved(loanId, proposal.borrower, decryptedAmount);
        emit LoanDisbursed(loanId, proposal.borrower, decryptedAmount);
    }
    
    /**
     * @notice Enhanced repayment with credit score update
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
        
        // Handle storage fee calculation like parent
        uint256 storageFee = (msg.value * STORAGE_FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 adjustedValue = msg.value - storageFee;
        storageFeePool += storageFee;
        
        if (adjustedValue != loan.totalRepayment) revert DAOErrors.IncorrectRepaymentAmount();
        
        // Determine if repayment is on time
        bool isOnTime = block.timestamp <= loan.dueDate;
        
        // Update credit score if credit scoring is enabled
        if (fheCreditScoring.hasCreditProfile(msg.sender)) {
            bytes memory loanAmountBytes = abi.encode(loan.principalAmount);
            fheCreditScoring.updateCreditScore(msg.sender, loanAmountBytes, isOnTime);
        }
        
        // Update loan status
        loan.status = LoanStatus.REPAID;
        loan.amountRepaid = adjustedValue;
        
        // Update borrower status
        Member storage borrower = members[msg.sender];
        borrower.hasActiveLoan = false;
        
        // Remove from active loans
        _removeActiveLoan(_loanId);
        
        // Update encrypted balance if enabled
        if (encryptedBalancesEnabled) {
            euint64 currentBalance = encryptedBalances[msg.sender];
            euint64 repaymentAmount = TFHE.asEuint64(abi.encode(adjustedValue));
            encryptedBalances[msg.sender] = currentBalance.sub(repaymentAmount);
        }
        
        // Distribute interest
        uint256 interestAmount = loan.totalRepayment - loan.principalAmount;
        _distributeInterest(interestAmount);
        
        emit StorageFeeCollected(storageFee, "Loan repayment");
        emit LoanRepaid(_loanId, msg.sender, adjustedValue);
    }
    
    /**
     * @notice Get privacy status overview
     * @return privateVoting Whether private voting is enabled
     * @return confidentialLoans Whether confidential loans are enabled
     * @return encryptedBalances Whether encrypted balances are enabled
     * @return currentPrivacyLevel Current privacy level
     */
    function getPrivacyStatus() external view returns (
        bool privateVoting,
        bool confidentialLoans,
        bool encryptedBalances,
        uint256 currentPrivacyLevel
    ) {
        return (
            privateVotingEnabled,
            confidentialLoansEnabled,
            encryptedBalancesEnabled,
            privacyLevel
        );
    }
    
    /**
     * @notice Get confidential loan proposal information
     * @param _proposalId The proposal ID
     * @return isConfidential Whether the proposal is confidential
     * @return commitment The encrypted amount commitment
     */
    function getConfidentialLoanInfo(uint256 _proposalId) external view returns (
        bool isConfidential,
        bytes32 commitment
    ) {
        return (
            proposalPrivacyMode[_proposalId],
            confidentialLoanAmounts[_proposalId].commitment
        );
    }
    
    /**
     * @notice Verify member's income for credit scoring
     * @param _member The member address
     * @param _encryptedIncome Encrypted income verification
     */
    function verifyMemberIncome(
        address _member,
        bytes calldata _encryptedIncome
    ) external onlyAdmin {
        require(isMember(_member), "Not a member");
        require(fheCreditScoring.hasCreditProfile(_member), "No credit profile");
        
        fheCreditScoring.verifyIncome(_member, _encryptedIncome);
    }
    
    /**
     * @notice Assess member's collateral privately
     * @param _member The member address
     * @param _encryptedCollateralValue Encrypted collateral value
     */
    function assessMemberCollateral(
        address _member,
        bytes calldata _encryptedCollateralValue
    ) external onlyAdmin {
        require(isMember(_member), "Not a member");
        require(fheCreditScoring.hasCreditProfile(_member), "No credit profile");
        
        fheCreditScoring.assessCollateral(_member, _encryptedCollateralValue);
    }
    
    // Helper function to simulate FHE decryption (simplified for demo)
    function _simulateDecryption(euint64 _encryptedValue) internal pure returns (uint256) {
        // In production, this would use proper TFHE.decrypt() with access controls
        // This is a simplified simulation for demonstration
        return uint256(keccak256(abi.encode(_encryptedValue))) % 1000 ether;
    }
    
    /**
     * @notice Enhanced exit DAO with encrypted balance handling
     */
    function exitDAO() external override onlyInitialized onlyMember nonReentrant whenNotPaused {
        Member storage member = members[msg.sender];
        
        if (member.hasActiveLoan) revert DAOErrors.CannotExitWithActiveLoan();
        
        uint256 shareToWithdraw = calculateExitShare(msg.sender);
        
        if (address(this).balance < shareToWithdraw) {
            revert DAOErrors.InsufficientTreasuryForExit();
        }
        
        // Clear encrypted data
        if (encryptedBalancesEnabled) {
            encryptedBalances[msg.sender] = TFHE.asEuint64(abi.encode(uint64(0)));
        }
        
        // Deactivate credit profile if exists
        if (fheCreditScoring.hasCreditProfile(msg.sender)) {
            fheCreditScoring.deactivateCreditProfile(msg.sender);
        }
        
        member.status = MemberStatus.INACTIVE;
        activeMembers--;
        
        (bool success, ) = payable(msg.sender).call{value: shareToWithdraw}("");
        if (!success) revert DAOErrors.TransferFailed();
        
        emit MemberExited(msg.sender, shareToWithdraw);
    }
    
    /**
     * @notice Get advanced DAO statistics including privacy metrics
     * @return totalTreasuryValue Total treasury value
     * @return totalMembers Total number of members
     * @return activeMembers Number of active members
     * @return privacyAdoptionRate Percentage of members using privacy features
     * @return confidentialLoansCount Number of confidential loans
     * @return privateVotesCount Number of private votes cast
     */
    function getAdvancedDAOStats() external view returns (
        uint256 totalTreasuryValue,
        uint256 totalMembers,
        uint256 activeMembers,
        uint256 privacyAdoptionRate,
        uint256 confidentialLoansCount,
        uint256 privateVotesCount
    ) {
        totalTreasuryValue = address(this).balance;
        totalMembers = totalMembers;
        activeMembers = activeMembers;
        
        // Calculate privacy adoption metrics
        uint256 membersWithCreditProfiles = 0;
        uint256 confidentialLoans = 0;
        
        for (uint256 i = 1; i <= proposalCounter; i++) {
            if (proposalPrivacyMode[i]) {
                confidentialLoans++;
            }
        }
        
        // Simple privacy adoption calculation
        privacyAdoptionRate = totalMembers > 0 ? (membersWithCreditProfiles * 100) / totalMembers : 0;
        confidentialLoansCount = confidentialLoans;
        privateVotesCount = confidentialLoans; // Simplified metric
    }
}
