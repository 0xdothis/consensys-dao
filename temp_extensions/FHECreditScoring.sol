// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zama-ai/fhevm/contracts/TFHE.sol";

contract FHECreditScoring is Ownable {
    using TFHE for euint32;
    using TFHE for euint64;
    using TFHE for ebool;
    
    struct EncryptedCreditProfile {
        euint32 creditScore;
        euint64 totalBorrowed;
        euint64 totalRepaid;
        euint32 loanCount;
        euint32 defaultCount;
        uint256 lastUpdated;
        bool isActive;
    }
    
    // Member credit data (encrypted)
    mapping(address => EncryptedCreditProfile) private memberCreditProfiles;
    mapping(address => euint32) private encryptedIncomeVerification;
    mapping(address => euint64) private encryptedCollateralValue;
    
    // Credit scoring parameters
    uint32 public constant MIN_CREDIT_SCORE = 300;
    uint32 public constant MAX_CREDIT_SCORE = 850;
    uint32 public constant DEFAULT_CREDIT_SCORE = 500;
    
    // Risk assessment weights
    uint256 public constant REPAYMENT_HISTORY_WEIGHT = 35; // 35%
    uint256 public constant LOAN_UTILIZATION_WEIGHT = 30; // 30%
    uint256 public constant INCOME_STABILITY_WEIGHT = 20; // 20%
    uint256 public constant COLLATERAL_WEIGHT = 15; // 15%
    
    event CreditProfileCreated(address indexed member, uint256 timestamp);
    event CreditScoreUpdated(address indexed member, uint256 timestamp);
    event IncomeVerified(address indexed member, uint256 timestamp);
    event CollateralAssessed(address indexed member, uint256 timestamp);
    event CreditAssessmentCompleted(address indexed member, bool approved, uint256 timestamp);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Initialize encrypted credit profile for a member
     * @param _member The member address
     * @param _encryptedInitialScore Encrypted initial credit score
     */
    function initializeCreditProfile(
        address _member,
        bytes calldata _encryptedInitialScore
    ) external onlyOwner {
        require(_member != address(0), "Invalid member address");
        require(!memberCreditProfiles[_member].isActive, "Profile already exists");
        
        memberCreditProfiles[_member] = EncryptedCreditProfile({
            creditScore: TFHE.asEuint32(_encryptedInitialScore),
            totalBorrowed: TFHE.asEuint64(0),
            totalRepaid: TFHE.asEuint64(0),
            loanCount: TFHE.asEuint32(0),
            defaultCount: TFHE.asEuint32(0),
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        emit CreditProfileCreated(_member, block.timestamp);
    }
    
    /**
     * @notice Update member's credit score after loan activity
     * @param _member The member address
     * @param _loanAmount The loan amount (encrypted)
     * @param _wasRepaidOnTime Whether the loan was repaid on time
     */
    function updateCreditScore(
        address _member,
        bytes calldata _loanAmount,
        bool _wasRepaidOnTime
    ) external onlyOwner {
        require(memberCreditProfiles[_member].isActive, "Credit profile not found");
        
        EncryptedCreditProfile storage profile = memberCreditProfiles[_member];
        euint64 loanAmount = TFHE.asEuint64(_loanAmount);
        
        // Update loan statistics
        profile.loanCount = profile.loanCount.add(TFHE.asEuint32(1));
        profile.totalBorrowed = profile.totalBorrowed.add(loanAmount);
        
        if (_wasRepaidOnTime) {
            profile.totalRepaid = profile.totalRepaid.add(loanAmount);
            // Improve credit score for on-time payment
            profile.creditScore = profile.creditScore.add(TFHE.asEuint32(5));
        } else {
            // Decrease credit score for late/default payment
            profile.defaultCount = profile.defaultCount.add(TFHE.asEuint32(1));
            profile.creditScore = profile.creditScore.sub(TFHE.asEuint32(20));
        }
        
        profile.lastUpdated = block.timestamp;
        
        emit CreditScoreUpdated(_member, block.timestamp);
    }
    
    /**
     * @notice Verify member's income (encrypted)
     * @param _member The member address
     * @param _encryptedIncome Encrypted income amount
     */
    function verifyIncome(
        address _member,
        bytes calldata _encryptedIncome
    ) external onlyOwner {
        require(memberCreditProfiles[_member].isActive, "Credit profile not found");
        
        encryptedIncomeVerification[_member] = TFHE.asEuint32(_encryptedIncome);
        
        emit IncomeVerified(_member, block.timestamp);
    }
    
    /**
     * @notice Assess member's collateral value (encrypted)
     * @param _member The member address
     * @param _encryptedCollateralValue Encrypted collateral value
     */
    function assessCollateral(
        address _member,
        bytes calldata _encryptedCollateralValue
    ) external onlyOwner {
        require(memberCreditProfiles[_member].isActive, "Credit profile not found");
        
        encryptedCollateralValue[_member] = TFHE.asEuint64(_encryptedCollateralValue);
        
        emit CollateralAssessed(_member, block.timestamp);
    }
    
    /**
     * @notice Perform comprehensive credit assessment
     * @param _member The member address
     * @param _requestedAmount The requested loan amount (encrypted)
     * @return isApproved Whether the loan is approved (decrypted for business logic)
     */
    function assessCreditworthiness(
        address _member,
        bytes calldata _requestedAmount
    ) external view onlyOwner returns (bool isApproved) {
        require(memberCreditProfiles[_member].isActive, "Credit profile not found");
        
        EncryptedCreditProfile storage profile = memberCreditProfiles[_member];
        euint64 requestedAmount = TFHE.asEuint64(_requestedAmount);
        
        // Check minimum credit score requirement
        euint32 minScore = TFHE.asEuint32(MIN_CREDIT_SCORE);
        ebool hasMinScore = profile.creditScore.gte(minScore);
        
        // Check income vs loan amount ratio (simplified)
        euint32 income = encryptedIncomeVerification[_member];
        euint32 requestedAmountLow = TFHE.asEuint32(uint32(uint256(_getRequestedAmountForComparison(_requestedAmount))));
        ebool hasSufficientIncome = income.gte(requestedAmountLow.mul(TFHE.asEuint32(2))); // Income should be 2x loan amount
        
        // Check collateral coverage
        euint64 collateral = encryptedCollateralValue[_member];
        ebool hasSufficientCollateral = collateral.gte(requestedAmount);
        
        // Combined approval logic
        ebool meetsScoreRequirement = hasMinScore;
        ebool meetsIncomeRequirement = hasSufficientIncome;
        ebool meetsCollateralRequirement = hasSufficientCollateral;
        
        // Approve if meets score AND (income OR collateral)
        ebool approved = meetsScoreRequirement.and(meetsIncomeRequirement.or(meetsCollateralRequirement));
        
        return TFHE.decrypt(approved);
    }
    
    /**
     * @notice Get member's decrypted credit score (only for DAO internal use)
     * @param _member The member address
     * @return creditScore The decrypted credit score
     */
    function getMemberCreditScore(address _member) external view onlyOwner returns (uint32 creditScore) {
        require(memberCreditProfiles[_member].isActive, "Credit profile not found");
        return TFHE.decrypt(memberCreditProfiles[_member].creditScore);
    }
    
    /**
     * @notice Check if member has an active credit profile
     * @param _member The member address
     * @return Whether the member has an active profile
     */
    function hasCreditProfile(address _member) external view returns (bool) {
        return memberCreditProfiles[_member].isActive;
    }
    
    /**
     * @notice Get member's credit profile metadata (non-sensitive data)
     * @param _member The member address
     * @return lastUpdated Last update timestamp
     * @return isActive Whether the profile is active
     */
    function getCreditProfileMetadata(address _member) external view returns (
        uint256 lastUpdated,
        bool isActive
    ) {
        EncryptedCreditProfile storage profile = memberCreditProfiles[_member];
        return (profile.lastUpdated, profile.isActive);
    }
    
    /**
     * @notice Deactivate a member's credit profile
     * @param _member The member address
     */
    function deactivateCreditProfile(address _member) external onlyOwner {
        require(memberCreditProfiles[_member].isActive, "Profile not active");
        memberCreditProfiles[_member].isActive = false;
    }
    
    // Helper function to extract amount for comparison (simplified)
    function _getRequestedAmountForComparison(bytes calldata _encryptedAmount) internal pure returns (uint256) {
        // In a real implementation, this would involve more sophisticated FHE operations
        // For now, we'll use a simplified approach
        return uint256(keccak256(_encryptedAmount)) % 1000000; // Simplified for demo
    }
}
