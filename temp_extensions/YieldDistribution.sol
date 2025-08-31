// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract YieldDistribution is Ownable, ReentrancyGuard {
    struct DistributionShares {
        uint256 memberShare; // Percentage to members (basis points)
        uint256 treasuryShare; // Percentage to treasury (basis points)
        uint256 operationalShare; // Percentage to operations (basis points)
    }
    
    struct YieldDistributionRecord {
        uint256 totalYield;
        uint256 memberShare;
        uint256 treasuryShare;
        uint256 operationalShare;
        uint256 distributedAt;
        uint256 membersCount;
        bool isCompleted;
    }
    
    struct MemberYieldData {
        uint256 totalEarned;
        uint256 lastClaimTime;
        uint256 pendingYield;
        uint256 lifetimeRewards;
    }
    
    // State variables
    DistributionShares public distributionShares;
    mapping(uint256 => YieldDistributionRecord) public distributionRecords;
    mapping(address => MemberYieldData) public memberYields;
    
    uint256 public distributionCounter;
    uint256 public totalYieldDistributed;
    uint256 public totalMemberRewards;
    uint256 public totalTreasuryAccumulation;
    uint256 public totalOperationalFees;
    
    // Yield management
    address public treasuryAddress;
    address public operationalAddress;
    bool public autoDistributionEnabled;
    uint256 public minimumDistributionAmount;
    uint256 public distributionInterval; // Minimum time between distributions
    uint256 public lastDistributionTime;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DEFAULT_MEMBER_SHARE = 6000; // 60%
    uint256 public constant DEFAULT_TREASURY_SHARE = 2000; // 20%
    uint256 public constant DEFAULT_OPERATIONAL_SHARE = 2000; // 20%
    uint256 public constant MIN_DISTRIBUTION_AMOUNT = 0.01 ether;
    uint256 public constant MIN_DISTRIBUTION_INTERVAL = 1 days;
    
    event YieldDistributed(
        uint256 indexed distributionId,
        uint256 totalAmount,
        uint256 memberShare,
        uint256 treasuryShare,
        uint256 operationalShare,
        uint256 membersCount
    );
    event MemberYieldClaimed(address indexed member, uint256 amount);
    event DistributionSharesUpdated(uint256 memberShare, uint256 treasuryShare, uint256 operationalShare);
    event AutoDistributionToggled(bool enabled);
    event TreasuryAddressUpdated(address indexed newTreasury);
    event OperationalAddressUpdated(address indexed newOperational);
    
    constructor() Ownable(msg.sender) {
        // Set default distribution shares
        distributionShares = DistributionShares({
            memberShare: DEFAULT_MEMBER_SHARE,
            treasuryShare: DEFAULT_TREASURY_SHARE,
            operationalShare: DEFAULT_OPERATIONAL_SHARE
        });
        
        minimumDistributionAmount = MIN_DISTRIBUTION_AMOUNT;
        distributionInterval = MIN_DISTRIBUTION_INTERVAL;
        autoDistributionEnabled = false;
    }
    
    /**
     * @notice Set the distribution shares for yield
     * @param _memberShare Percentage for members (basis points)
     * @param _treasuryShare Percentage for treasury (basis points)
     * @param _operationalShare Percentage for operations (basis points)
     */
    function setDistributionShares(
        uint256 _memberShare,
        uint256 _treasuryShare,
        uint256 _operationalShare
    ) external onlyOwner {
        require(_memberShare + _treasuryShare + _operationalShare == BASIS_POINTS, "Shares must sum to 100%");
        require(_memberShare >= 4000, "Member share too low"); // Minimum 40%
        require(_treasuryShare <= 3000, "Treasury share too high"); // Maximum 30%
        require(_operationalShare <= 3000, "Operational share too high"); // Maximum 30%
        
        distributionShares.memberShare = _memberShare;
        distributionShares.treasuryShare = _treasuryShare;
        distributionShares.operationalShare = _operationalShare;
        
        emit DistributionSharesUpdated(_memberShare, _treasuryShare, _operationalShare);
    }
    
    /**
     * @notice Set treasury address for yield distribution
     * @param _treasury The treasury address
     */
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasuryAddress = _treasury;
        emit TreasuryAddressUpdated(_treasury);
    }
    
    /**
     * @notice Set operational address for yield distribution
     * @param _operational The operational address
     */
    function setOperationalAddress(address _operational) external onlyOwner {
        require(_operational != address(0), "Invalid operational address");
        operationalAddress = _operational;
        emit OperationalAddressUpdated(_operational);
    }
    
    /**
     * @notice Enable or disable automatic yield distribution
     * @param _enabled Whether to enable automatic distribution
     */
    function setAutoDistributionEnabled(bool _enabled) external onlyOwner {
        autoDistributionEnabled = _enabled;
        emit AutoDistributionToggled(_enabled);
    }
    
    /**
     * @notice Set minimum amount for yield distribution
     * @param _amount Minimum amount in wei
     */
    function setMinimumDistributionAmount(uint256 _amount) external onlyOwner {
        require(_amount >= 0.001 ether, "Amount too low");
        minimumDistributionAmount = _amount;
    }
    
    /**
     * @notice Distribute yield to members, treasury, and operations
     * @param _totalYield Total yield amount to distribute
     * @param _memberAddresses Array of member addresses
     * @return distributionId The distribution record ID
     */
    function distributeYield(
        uint256 _totalYield,
        address[] memory _memberAddresses
    ) external onlyOwner nonReentrant returns (uint256) {
        require(_totalYield >= minimumDistributionAmount, "Amount below minimum");
        require(_memberAddresses.length > 0, "No members to distribute to");
        require(
            !autoDistributionEnabled || 
            block.timestamp >= lastDistributionTime + distributionInterval,
            "Distribution interval not met"
        );
        
        uint256 distributionId = ++distributionCounter;
        
        // Calculate distribution amounts
        uint256 memberPortion = (_totalYield * distributionShares.memberShare) / BASIS_POINTS;
        uint256 treasuryPortion = (_totalYield * distributionShares.treasuryShare) / BASIS_POINTS;
        uint256 operationalPortion = (_totalYield * distributionShares.operationalShare) / BASIS_POINTS;
        
        // Individual member share
        uint256 individualMemberShare = memberPortion / _memberAddresses.length;
        
        // Distribute to members
        for (uint256 i = 0; i < _memberAddresses.length; i++) {
            address member = _memberAddresses[i];
            memberYields[member].pendingYield += individualMemberShare;
            memberYields[member].totalEarned += individualMemberShare;
            memberYields[member].lifetimeRewards += individualMemberShare;
        }
        
        // Send to treasury and operational addresses
        if (treasuryPortion > 0 && treasuryAddress != address(0)) {
            (bool treasurySuccess, ) = payable(treasuryAddress).call{value: treasuryPortion}("");
            require(treasurySuccess, "Treasury transfer failed");
            totalTreasuryAccumulation += treasuryPortion;
        }
        
        if (operationalPortion > 0 && operationalAddress != address(0)) {
            (bool operationalSuccess, ) = payable(operationalAddress).call{value: operationalPortion}("");
            require(operationalSuccess, "Operational transfer failed");
            totalOperationalFees += operationalPortion;
        }
        
        // Record distribution
        distributionRecords[distributionId] = YieldDistributionRecord({
            totalYield: _totalYield,
            memberShare: memberPortion,
            treasuryShare: treasuryPortion,
            operationalShare: operationalPortion,
            distributedAt: block.timestamp,
            membersCount: _memberAddresses.length,
            isCompleted: true
        });
        
        // Update totals
        totalYieldDistributed += _totalYield;
        totalMemberRewards += memberPortion;
        lastDistributionTime = block.timestamp;
        
        emit YieldDistributed(
            distributionId,
            _totalYield,
            memberPortion,
            treasuryPortion,
            operationalPortion,
            _memberAddresses.length
        );
        
        return distributionId;
    }
    
    /**
     * @notice Simplified distribute yield function (auto-detects active members)
     * @param _totalYield Total yield amount to distribute
     */
    function distributeYield(uint256 _totalYield) external onlyOwner {
        // This would typically get member addresses from the main DAO contract
        // For now, we'll emit an event to indicate yield is ready for distribution
        require(_totalYield >= minimumDistributionAmount, "Amount below minimum");
        
        // Note: This function would need to be called by the main DAO contract
        // which has access to member addresses
        revert("Use distributeYield with member addresses");
    }
    
    /**
     * @notice Claim pending yield rewards
     * @param _member The member address claiming rewards
     * @return claimedAmount Amount claimed
     */
    function claimYield(address _member) external nonReentrant returns (uint256) {
        require(_member == msg.sender || msg.sender == owner(), "Unauthorized");
        
        uint256 pending = memberYields[_member].pendingYield;
        require(pending > 0, "No pending yield");
        
        memberYields[_member].pendingYield = 0;
        memberYields[_member].lastClaimTime = block.timestamp;
        
        (bool success, ) = payable(_member).call{value: pending}("");
        require(success, "Transfer failed");
        
        emit MemberYieldClaimed(_member, pending);
        return pending;
    }
    
    /**
     * @notice Get member's yield information
     * @param _member The member address
     * @return totalEarned Total yield earned
     * @return pendingYield Pending yield to claim
     * @return lastClaimTime Last claim timestamp
     * @return lifetimeRewards Lifetime rewards
     */
    function getMemberYieldInfo(address _member) external view returns (
        uint256 totalEarned,
        uint256 pendingYield,
        uint256 lastClaimTime,
        uint256 lifetimeRewards
    ) {
        MemberYieldData storage data = memberYields[_member];
        return (data.totalEarned, data.pendingYield, data.lastClaimTime, data.lifetimeRewards);
    }
    
    /**
     * @notice Get distribution record
     * @param _distributionId The distribution ID
     * @return record The distribution record
     */
    function getDistributionRecord(uint256 _distributionId) external view returns (YieldDistributionRecord memory) {
        return distributionRecords[_distributionId];
    }
    
    /**
     * @notice Get yield distribution statistics
     * @return totalDistributions Total number of distributions
     * @return totalYield Total yield distributed
     * @return totalMemberRewards Total rewards to members
     * @return totalTreasuryFees Total treasury accumulation
     * @return totalOperationalFees Total operational fees
     */
    function getYieldStatistics() external view returns (
        uint256 totalDistributions,
        uint256 totalYield,
        uint256 totalMemberRewards,
        uint256 totalTreasuryFees,
        uint256 totalOperationalFees
    ) {
        return (
            distributionCounter,
            totalYieldDistributed,
            totalMemberRewards,
            totalTreasuryAccumulation,
            totalOperationalFees
        );
    }
    
    /**
     * @notice Check if yield distribution is due
     * @return Whether distribution should occur
     */
    function isDistributionDue() external view returns (bool) {
        if (!autoDistributionEnabled) return false;
        return block.timestamp >= lastDistributionTime + distributionInterval;
    }
    
    /**
     * @notice Calculate yield distribution amounts
     * @param _totalYield Total yield to distribute
     * @return memberPortion Amount for members
     * @return treasuryPortion Amount for treasury
     * @return operationalPortion Amount for operations
     */
    function calculateDistribution(uint256 _totalYield) external view returns (
        uint256 memberPortion,
        uint256 treasuryPortion,
        uint256 operationalPortion
    ) {
        memberPortion = (_totalYield * distributionShares.memberShare) / BASIS_POINTS;
        treasuryPortion = (_totalYield * distributionShares.treasuryShare) / BASIS_POINTS;
        operationalPortion = (_totalYield * distributionShares.operationalShare) / BASIS_POINTS;
    }
    
    /**
     * @notice Get total pending yield for all members
     * @param _members Array of member addresses
     * @return totalPending Total pending yield across all members
     */
    function getTotalPendingYield(address[] memory _members) external view returns (uint256) {
        uint256 totalPending = 0;
        for (uint256 i = 0; i < _members.length; i++) {
            totalPending += memberYields[_members[i]].pendingYield;
        }
        return totalPending;
    }
    
    /**
     * @notice Emergency withdraw function for stuck funds
     * @param _amount Amount to withdraw
     * @param _recipient Recipient address
     */
    function emergencyWithdraw(uint256 _amount, address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(_recipient).call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Set distribution interval
     * @param _interval New interval in seconds
     */
    function setDistributionInterval(uint256 _interval) external onlyOwner {
        require(_interval >= MIN_DISTRIBUTION_INTERVAL, "Interval too short");
        distributionInterval = _interval;
    }
    
    /**
     * @notice Batch claim yield for multiple members (admin function)
     * @param _members Array of member addresses
     * @return totalClaimed Total amount claimed
     */
    function batchClaimYield(address[] memory _members) external onlyOwner nonReentrant returns (uint256) {
        uint256 totalClaimed = 0;
        
        for (uint256 i = 0; i < _members.length; i++) {
            address member = _members[i];
            uint256 pending = memberYields[member].pendingYield;
            
            if (pending > 0) {
                memberYields[member].pendingYield = 0;
                memberYields[member].lastClaimTime = block.timestamp;
                
                (bool success, ) = payable(member).call{value: pending}("");
                if (success) {
                    totalClaimed += pending;
                    emit MemberYieldClaimed(member, pending);
                } else {
                    // If transfer fails, restore pending yield
                    memberYields[member].pendingYield = pending;
                }
            }
        }
        
        return totalClaimed;
    }
    
    /**
     * @notice Get yield distribution overview
     * @return currentBalance Current contract balance
     * @return totalDistributions Total number of distributions
     * @return averageDistribution Average distribution amount
     * @return lastDistribution Last distribution timestamp
     * @return nextDistribution Next distribution timestamp (if auto enabled)
     */
    function getDistributionOverview() external view returns (
        uint256 currentBalance,
        uint256 totalDistributions,
        uint256 averageDistribution,
        uint256 lastDistribution,
        uint256 nextDistribution
    ) {
        currentBalance = address(this).balance;
        totalDistributions = distributionCounter;
        averageDistribution = totalDistributions > 0 ? totalYieldDistributed / totalDistributions : 0;
        lastDistribution = lastDistributionTime;
        nextDistribution = autoDistributionEnabled ? lastDistributionTime + distributionInterval : 0;
    }
    
    // Receive function to accept yield payments
    receive() external payable {
        // Yield received - can be distributed later
    }
    
    fallback() external payable {
        // Handle any other payments
    }
}
