// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LendingDAOWithFHE.sol";
import "./extensions/RestakingManager.sol";
import "./extensions/YieldDistribution.sol";
import "./interfaces/ISymbioticIntegration.sol";
import "./mocks/MockSymbioticCore.sol";

interface ISymbioticVault {
    function delegate() external payable;
    function undelegate(uint256 _amount) external;
    function getStakerBalance(address _staker) external view returns (uint256);
}

contract LendingDAOWithRestaking is LendingDAOWithFHE, ISymbioticIntegration {
    // Restaking extensions
    RestakingManager public restakingManager;
    YieldDistribution public yieldDistribution;
    MockSymbioticCore public symbioticCore;
    
    // Treasury allocation for restaking
    uint256 public restakingAllocationBPS = 3000; // 30% default
    uint256 public maxRestakingAllocationBPS = 5000; // 50% maximum
    uint256 public emergencyReserveBPS = 1000; // 10% minimum reserve
    
    // Active restaking positions
    mapping(address => RestakingPosition) public restakingPositions;
    mapping(address => OperatorMetrics) public operatorMetrics;
    address[] public activeOperators;
    
    // Risk management
    uint256 public maxSlashingRisk = 500; // 5% maximum
    uint256 public diversificationThreshold = 3; // Minimum 3 operators
    
    // Yield tracking
    uint256 public totalYieldGenerated;
    uint256 public totalSlashingLosses;
    uint256 public lastYieldDistribution;
    
    // Automation settings
    bool public autoOptimizationEnabled;
    uint256 public optimizationInterval = 7 days;
    uint256 public lastOptimization;
    
    constructor(address _symbioticCore) {
        symbioticCore = MockSymbioticCore(_symbioticCore);
        
        // Deploy restaking extensions
        restakingManager = new RestakingManager();
        yieldDistribution = new YieldDistribution();
        
        // Transfer ownership to DAO
        restakingManager.transferOwnership(address(this));
        yieldDistribution.transferOwnership(address(this));
        
        // Configure yield distribution addresses
        yieldDistribution.setTreasuryAddress(address(this));
        yieldDistribution.setOperationalAddress(address(this));
    }
    
    /**
     * @notice Enhanced treasury management with restaking optimization
     */
    function optimizeTreasuryAllocation() external override onlyAdmin {
        uint256 totalTreasury = address(this).balance;
        uint256 availableForRestaking = getAvailableForRestaking();
        uint256 currentRestaked = getTotalRestakingAmount();
        
        // Calculate optimal allocation
        uint256 targetRestaking = (totalTreasury * restakingAllocationBPS) / BASIS_POINTS;
        
        if (currentRestaked < targetRestaking && availableForRestaking > 0) {
            uint256 additionalStaking = targetRestaking - currentRestaked;
            if (additionalStaking > availableForRestaking) {
                additionalStaking = availableForRestaking;
            }
            
            _allocateToTopPerformers(additionalStaking);
        }
        
        lastOptimization = block.timestamp;
        emit TreasuryOptimized(totalTreasury, targetRestaking, currentRestaked);
    }
    
    /**
     * @notice Automated yield collection and distribution
     */
    function collectAndDistributeYield() external override {
        uint256 totalCollected = _collectAllRestakingRewards();
        
        if (totalCollected > 0) {
            totalYieldGenerated += totalCollected;
            
            // Get active member addresses for distribution
            address[] memory members = _getActiveMemberAddresses();
            
            // Distribute yield through YieldDistribution contract
            yieldDistribution.distributeYield{value: totalCollected}(totalCollected, members);
            lastYieldDistribution = block.timestamp;
            
            emit YieldCollectedAndDistributed(totalCollected, block.timestamp);
        }
    }
    
    /**
     * @notice Emergency exit from all restaking positions
     * @param _reason Reason for emergency exit
     */
    function emergencyExitRestaking(string memory _reason) external override onlyAdmin {
        require(bytes(_reason).length > 0, "Reason required");
        
        for (uint256 i = 0; i < activeOperators.length; i++) {
            address operator = activeOperators[i];
            uint256 stakedAmount = restakingPositions[operator].amount;
            
            if (stakedAmount > 0) {
                restakingManager.emergencyUnstake(operator, stakedAmount, _reason);
                _unstakeFromOperator(operator, stakedAmount);
            }
        }
        
        emit EmergencyRestakingExit(_reason, block.timestamp);
    }
    
    /**
     * @notice Get comprehensive restaking overview
     * @return totalRestaked Total amount currently restaked
     * @return totalYield Total yield generated to date
     * @return averageAPY Average APY across all positions
     * @return riskScore Overall risk score
     * @return operatorCount Number of active operators
     */
    function getRestakingOverview() external view override returns (
        uint256 totalRestaked,
        uint256 totalYield,
        uint256 averageAPY,
        uint256 riskScore,
        uint256 operatorCount
    ) {
        totalRestaked = getTotalRestakingAmount();
        totalYield = totalYieldGenerated;
        averageAPY = _calculateAverageAPY();
        riskScore = _calculateOverallRiskScore();
        operatorCount = activeOperators.length;
    }
    
    /**
     * @notice Set restaking allocation percentage
     * @param _allocationBPS New allocation in basis points
     */
    function setRestakingAllocation(uint256 _allocationBPS) external onlyAdmin {
        require(_allocationBPS <= maxRestakingAllocationBPS, "Allocation too high");
        require(_allocationBPS >= emergencyReserveBPS, "Must maintain emergency reserve");
        
        restakingAllocationBPS = _allocationBPS;
        emit RestakingAllocationUpdated(_allocationBPS);
    }
    
    /**
     * @notice Enable or disable automatic optimization
     * @param _enabled Whether to enable auto optimization
     */
    function setAutoOptimizationEnabled(bool _enabled) external onlyAdmin {
        autoOptimizationEnabled = _enabled;
        emit AutoOptimizationToggled(_enabled);
    }
    
    /**
     * @notice Approve new restaking operator
     * @param _operator Operator address
     * @param _name Operator name
     * @param _networks Supported networks
     * @param _expectedAPY Expected APY (basis points)
     * @param _slashingRisk Slashing risk (basis points)
     */
    function approveRestakingOperator(
        address _operator,
        string memory _name,
        string[] memory _networks,
        uint256 _expectedAPY,
        uint256 _slashingRisk
    ) external onlyAdmin {
        require(_slashingRisk <= maxSlashingRisk, "Risk exceeds maximum");
        
        restakingManager.approveOperator(_operator, _name, _networks, _expectedAPY, _slashingRisk);
        
        emit OperatorApproved(_operator, _name, _expectedAPY);
    }
    
    /**
     * @notice Delegate funds to specific operator
     * @param _operator Operator address
     * @param _amount Amount to delegate
     */
    function delegateToOperator(address _operator, uint256 _amount) external onlyAdmin {
        require(_amount > 0, "Invalid amount");
        require(address(this).balance >= _amount, "Insufficient balance");
        
        _delegateToOperator(_operator, _amount);
    }
    
    /**
     * @notice Update operator performance and rebalance if needed
     * @param _operator Operator address
     * @param _actualAPY Actual APY achieved
     * @param _slashingEvents Number of slashing events
     * @param _uptime Uptime percentage
     */
    function updateOperatorPerformance(
        address _operator,
        uint256 _actualAPY,
        uint256 _slashingEvents,
        uint256 _uptime
    ) external onlyAdmin {
        restakingManager.updateOperatorPerformance(_operator, _actualAPY, _slashingEvents, _uptime);
        
        // Update local metrics
        operatorMetrics[_operator] = OperatorMetrics({
            totalStaked: restakingPositions[_operator].amount,
            apy: _actualAPY,
            slashingEvents: _slashingEvents,
            performanceScore: restakingManager.getOperatorInfo(_operator).performanceScore,
            lastUpdated: block.timestamp
        });
        
        // Auto-rebalance if significant performance change
        if (autoOptimizationEnabled && _shouldRebalance(_operator)) {
            optimizeTreasuryAllocation();
        }
    }
    
    /**
     * @notice Get available amount for restaking
     * @return Available amount considering emergency reserve
     */
    function getAvailableForRestaking() public view returns (uint256) {
        uint256 totalBalance = address(this).balance;
        uint256 emergencyReserve = (totalBalance * emergencyReserveBPS) / BASIS_POINTS;
        uint256 currentRestaked = getTotalRestakingAmount();
        
        if (totalBalance <= emergencyReserve + currentRestaked) {
            return 0;
        }
        
        return totalBalance - emergencyReserve - currentRestaked;
    }
    
    /**
     * @notice Get total amount currently restaked
     * @return Total restaked amount
     */
    function getTotalRestakingAmount() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < activeOperators.length; i++) {
            total += restakingPositions[activeOperators[i]].amount;
        }
        return total;
    }
    
    // Internal functions
    function _allocateToTopPerformers(uint256 _amount) internal {
        address[] memory topOperators = restakingManager.getTopPerformers(diversificationThreshold);
        uint256[] memory allocations = restakingManager.calculateOptimalAllocation(topOperators);
        
        address[] memory operatorList = new address[](topOperators.length);
        uint256[] memory allocationList = new uint256[](topOperators.length);
        
        for (uint256 i = 0; i < topOperators.length; i++) {
            uint256 allocation = (_amount * allocations[i]) / BASIS_POINTS;
            _delegateToOperator(topOperators[i], allocation);
            
            operatorList[i] = topOperators[i];
            allocationList[i] = allocation;
        }
        
        emit RestakingAllocated(_amount, operatorList, allocationList);
    }
    
    function _delegateToOperator(address _operator, uint256 _amount) internal {
        // Get operator's vault from Symbiotic (mock)
        address vault = symbioticCore.getOperatorVault(_operator);
        
        if (vault == address(0)) {
            // Create mock vault for testing
            MockSymbioticVault newVault = new MockSymbioticVault(_operator);
            vault = address(newVault);
            symbioticCore.registerOperator(_operator, vault, 800); // 8% default APY
        }
        
        // Delegate funds to vault
        ISymbioticVault(vault).delegate{value: _amount}();
        
        // Update tracking
        if (restakingPositions[_operator].amount == 0) {
            activeOperators.push(_operator);
        }
        
        restakingPositions[_operator].operator = _operator;
        restakingPositions[_operator].amount += _amount;
        restakingPositions[_operator].delegatedAt = block.timestamp;
        restakingPositions[_operator].isActive = true;
        
        emit RestakingDelegated(_operator, _amount);
    }
    
    function _unstakeFromOperator(address _operator, uint256 _amount) internal {
        address vault = symbioticCore.getOperatorVault(_operator);
        require(vault != address(0), "Vault not found");
        
        ISymbioticVault(vault).undelegate(_amount);
        
        // Update tracking
        if (restakingPositions[_operator].amount >= _amount) {
            restakingPositions[_operator].amount -= _amount;
        } else {
            restakingPositions[_operator].amount = 0;
        }
        
        if (restakingPositions[_operator].amount == 0) {
            restakingPositions[_operator].isActive = false;
            _removeFromActiveOperators(_operator);
        }
    }
    
    function _collectAllRestakingRewards() internal returns (uint256) {
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < activeOperators.length; i++) {
            address operator = activeOperators[i];
            address vault = symbioticCore.getOperatorVault(operator);
            
            if (vault != address(0)) {
                uint256 rewards = symbioticCore.getVaultRewards(vault);
                if (rewards > 0) {
                    uint256 claimed = symbioticCore.claimVaultRewards(vault);
                    totalRewards += claimed;
                    
                    // Update position tracking
                    restakingPositions[operator].lastReward = claimed;
                    restakingPositions[operator].totalRewards += claimed;
                    
                    // Update manager tracking
                    restakingManager.recordOperatorReward(operator, claimed);
                }
            }
        }
        
        return totalRewards;
    }
    
    function _calculateAverageAPY() internal view returns (uint256) {
        if (activeOperators.length == 0) return 0;
        
        uint256 totalAPY = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < activeOperators.length; i++) {
            address operator = activeOperators[i];
            uint256 amount = restakingPositions[operator].amount;
            uint256 apy = operatorMetrics[operator].apy;
            
            totalAPY += (apy * amount);
            totalWeight += amount;
        }
        
        return totalWeight > 0 ? totalAPY / totalWeight : 0;
    }
    
    function _calculateOverallRiskScore() internal view returns (uint256) {
        if (activeOperators.length == 0) return 0;
        
        uint256 totalRisk = 0;
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < activeOperators.length; i++) {
            address operator = activeOperators[i];
            uint256 amount = restakingPositions[operator].amount;
            uint256 slashingEvents = operatorMetrics[operator].slashingEvents;
            
            // Simple risk calculation based on slashing history
            uint256 operatorRisk = slashingEvents * 100; // 1% risk per slashing event
            totalRisk += (operatorRisk * amount);
            totalAmount += amount;
        }
        
        return totalAmount > 0 ? totalRisk / totalAmount : 0;
    }
    
    function _shouldRebalance(address _operator) internal view returns (bool) {
        RestakingManager.OperatorInfo memory info = restakingManager.getOperatorInfo(_operator);
        
        // Rebalance if performance score drops significantly
        return info.performanceScore < 300; // Below 30% performance
    }
    
    function _removeFromActiveOperators(address _operator) internal {
        for (uint256 i = 0; i < activeOperators.length; i++) {
            if (activeOperators[i] == _operator) {
                activeOperators[i] = activeOperators[activeOperators.length - 1];
                activeOperators.pop();
                break;
            }
        }
    }
    
    function _getActiveMemberAddresses() internal view returns (address[] memory) {
        address[] memory allMembers = getMemberAddresses();
        address[] memory activeMembers = new address[](getActiveMembers());
        uint256 activeIndex = 0;
        
        for (uint256 i = 0; i < allMembers.length; i++) {
            if (isMember(allMembers[i])) {
                activeMembers[activeIndex] = allMembers[i];
                activeIndex++;
            }
        }
        
        return activeMembers;
    }
    
    /**
     * @notice Enhanced interest distribution including restaking yield
     * @param _interestAmount Interest amount from loans
     */
    function _distributeInterest(uint256 _interestAmount) internal override {
        // Call parent distribution for loan interest
        super._distributeInterest(_interestAmount);
        
        // Check if we should collect and distribute restaking yield
        if (yieldDistribution.isDistributionDue()) {
            uint256 yieldCollected = _collectAllRestakingRewards();
            if (yieldCollected > 0) {
                totalYieldGenerated += yieldCollected;
                
                address[] memory members = _getActiveMemberAddresses();
                yieldDistribution.distributeYield{value: yieldCollected}(yieldCollected, members);
                
                emit YieldDistributed(
                    yieldCollected * yieldDistribution.distributionShares().memberShare / BASIS_POINTS,
                    yieldCollected * yieldDistribution.distributionShares().treasuryShare / BASIS_POINTS,
                    yieldCollected * yieldDistribution.distributionShares().operationalShare / BASIS_POINTS
                );
            }
        }
    }
    
    /**
     * @notice Get restaking performance metrics
     * @param _days Number of days to analyze
     * @return totalReturn Total return over period
     * @return volatility Volatility measure
     * @return sharpeRatio Risk-adjusted return
     * @return maxDrawdown Maximum drawdown
     * @return successRate Operator success rate
     */
    function getPerformanceMetrics(uint256 _days) external view returns (
        uint256 totalReturn,
        uint256 volatility,
        uint256 sharpeRatio,
        uint256 maxDrawdown,
        uint256 successRate
    ) {
        uint256 periodStart = block.timestamp - (_days * 1 days);
        
        // Calculate metrics for specified period
        (totalReturn, volatility) = _calculateReturnAndVolatility(periodStart);
        sharpeRatio = _calculateSharpeRatio(totalReturn, volatility);
        maxDrawdown = _calculateMaxDrawdown(periodStart);
        successRate = _calculateOperatorSuccessRate(periodStart);
    }
    
    /**
     * @notice Create restaking strategy through governance
     * @param _name Strategy name
     * @param _operators Operator addresses
     * @param _allocations Allocation percentages
     * @param _targetAPY Target APY
     * @return strategyId Created strategy ID
     */
    function createRestakingStrategy(
        string memory _name,
        address[] memory _operators,
        uint256[] memory _allocations,
        uint256 _targetAPY
    ) external onlyAdmin returns (bytes32) {
        return restakingManager.createStrategy(_name, _operators, _allocations, _targetAPY);
    }
    
    /**
     * @notice Claim restaking yield for member
     * @param _member Member address
     * @return claimedAmount Amount claimed
     */
    function claimRestakingYield(address _member) external returns (uint256) {
        require(_member == msg.sender || admins[msg.sender], "Unauthorized");
        return yieldDistribution.claimYield(_member);
    }
    
    /**
     * @notice Get member's total yield information
     * @param _member Member address
     * @return pendingLoanRewards Pending rewards from loan interest
     * @return pendingRestakingYield Pending yield from restaking
     * @return lifetimeRewards Total lifetime rewards
     */
    function getMemberTotalYields(address _member) external view returns (
        uint256 pendingLoanRewards,
        uint256 pendingRestakingYield,
        uint256 lifetimeRewards
    ) {
        pendingLoanRewards = getPendingRewards(_member);
        (,pendingRestakingYield,,lifetimeRewards) = yieldDistribution.getMemberYieldInfo(_member);
    }
    
    // Performance calculation helpers (simplified for demo)
    function _calculateReturnAndVolatility(uint256 _periodStart) internal view returns (uint256, uint256) {
        // Simplified calculation - in production would track historical data
        uint256 totalReturn = totalYieldGenerated > 0 ? (totalYieldGenerated * 10000) / getTotalRestakingAmount() : 0;
        uint256 volatility = 500; // 5% assumed volatility
        return (totalReturn, volatility);
    }
    
    function _calculateSharpeRatio(uint256 _return, uint256 _volatility) internal pure returns (uint256) {
        if (_volatility == 0) return 0;
        return (_return * 100) / _volatility; // Simplified Sharpe ratio
    }
    
    function _calculateMaxDrawdown(uint256 _periodStart) internal view returns (uint256) {
        // Simplified - would track historical peak-to-trough decline
        return totalSlashingLosses > 0 ? (totalSlashingLosses * 10000) / getTotalRestakingAmount() : 0;
    }
    
    function _calculateOperatorSuccessRate(uint256 _periodStart) internal view returns (uint256) {
        if (activeOperators.length == 0) return 0;
        
        uint256 successfulOperators = 0;
        for (uint256 i = 0; i < activeOperators.length; i++) {
            if (operatorMetrics[activeOperators[i]].slashingEvents == 0) {
                successfulOperators++;
            }
        }
        
        return (successfulOperators * 100) / activeOperators.length;
    }
    
    /**
     * @notice Enhanced member registration with restaking yield initialization
     */
    function registerMember() external payable override onlyInitialized whenNotPaused {
        // Call parent registration
        super.registerMember();
        
        // Initialize yield tracking
        // yieldDistribution automatically handles new members
    }
    
    /**
     * @notice Enhanced DAO statistics including restaking metrics
     * @return totalTreasuryValue Total treasury value
     * @return totalRestakingValue Total value in restaking
     * @return totalYieldGenerated Total yield generated
     * @return averageAPY Average APY from restaking
     * @return riskScore Overall risk score
     * @return privacyEnabled Whether privacy features are enabled
     * @return activeOperators Number of active operators
     * @return totalMembers Total number of members
     */
    function getAdvancedDAOStats() external view override returns (
        uint256 totalTreasuryValue,
        uint256 totalRestakingValue,
        uint256 totalYieldGenerated,
        uint256 averageAPY,
        uint256 riskScore,
        bool privacyEnabled,
        uint256 activeOperators,
        uint256 totalMembers
    ) {
        totalTreasuryValue = address(this).balance;
        totalRestakingValue = getTotalRestakingAmount();
        totalYieldGenerated = totalYieldGenerated;
        averageAPY = _calculateAverageAPY();
        riskScore = _calculateOverallRiskScore();
        privacyEnabled = privateVotingEnabled || confidentialLoansEnabled;
        activeOperators = activeOperators.length;
        totalMembers = totalMembers;
    }
    
    // Events
    event RestakingAllocationUpdated(uint256 newAllocation);
    event AutoOptimizationToggled(bool enabled);
}
