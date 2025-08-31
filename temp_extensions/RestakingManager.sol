// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RestakingManager is Ownable, ReentrancyGuard {
    struct RestakingStrategy {
        string name;
        address[] operators;
        uint256[] allocations;
        uint256 targetAPY;
        uint256 maxSlashingRisk;
        bool isActive;
        uint256 createdAt;
    }
    
    struct OperatorInfo {
        address operatorAddress;
        string name;
        uint256 totalStaked;
        uint256 slashingHistory;
        uint256 performanceScore;
        string[] supportedNetworks;
        bool isApproved;
        uint256 approvedAt;
        uint256 expectedAPY;
        uint256 actualAPY;
        uint256 slashingRisk;
        uint256 uptime;
    }
    
    // State variables
    mapping(bytes32 => RestakingStrategy) public strategies;
    mapping(address => OperatorInfo) public operators;
    address[] public approvedOperators;
    
    // Performance tracking
    mapping(address => uint256) public operatorRewards;
    mapping(address => uint256) public operatorSlashings;
    mapping(address => uint256) public operatorLastUpdate;
    
    // Strategy management
    bytes32[] public activeStrategies;
    bytes32 public currentStrategy;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_SLASHING_RISK = 1000; // 10%
    uint256 public constant MIN_PERFORMANCE_SCORE = 100;
    uint256 public constant MAX_PERFORMANCE_SCORE = 1000;
    
    event OperatorApproved(address indexed operator, string name, uint256 expectedAPY);
    event OperatorRemoved(address indexed operator, string reason);
    event StrategyCreated(bytes32 indexed strategyId, string name);
    event StrategyActivated(bytes32 indexed strategyId);
    event OperatorPerformanceUpdated(address indexed operator, uint256 score, uint256 apy);
    event EmergencyUnstake(address indexed operator, uint256 amount, string reason);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Approve a new operator for restaking
     * @param _operator The operator address
     * @param _name Operator name
     * @param _networks Supported networks
     * @param _expectedAPY Expected annual percentage yield (in basis points)
     * @param _slashingRisk Slashing risk assessment (in basis points)
     */
    function approveOperator(
        address _operator,
        string memory _name,
        string[] memory _networks,
        uint256 _expectedAPY,
        uint256 _slashingRisk
    ) external onlyOwner {
        require(!operators[_operator].isApproved, "Already approved");
        require(_slashingRisk <= MAX_SLASHING_RISK, "Risk too high"); // Max 10%
        require(_expectedAPY > 0 && _expectedAPY <= 5000, "Invalid APY"); // Max 50%
        require(bytes(_name).length > 0, "Name required");
        
        operators[_operator] = OperatorInfo({
            operatorAddress: _operator,
            name: _name,
            totalStaked: 0,
            slashingHistory: 0,
            performanceScore: 500, // Start with neutral score
            supportedNetworks: _networks,
            isApproved: true,
            approvedAt: block.timestamp,
            expectedAPY: _expectedAPY,
            actualAPY: 0,
            slashingRisk: _slashingRisk,
            uptime: 100 // Start with perfect uptime
        });
        
        approvedOperators.push(_operator);
        operatorLastUpdate[_operator] = block.timestamp;
        
        emit OperatorApproved(_operator, _name, _expectedAPY);
    }
    
    /**
     * @notice Remove an operator from approved list
     * @param _operator The operator address
     * @param _reason Reason for removal
     */
    function removeOperator(address _operator, string memory _reason) external onlyOwner {
        require(operators[_operator].isApproved, "Operator not approved");
        
        operators[_operator].isApproved = false;
        
        // Remove from approved operators array
        for (uint256 i = 0; i < approvedOperators.length; i++) {
            if (approvedOperators[i] == _operator) {
                approvedOperators[i] = approvedOperators[approvedOperators.length - 1];
                approvedOperators.pop();
                break;
            }
        }
        
        emit OperatorRemoved(_operator, _reason);
    }
    
    /**
     * @notice Create a new restaking strategy
     * @param _name Strategy name
     * @param _operators Array of operator addresses
     * @param _allocations Array of allocation percentages (in basis points)
     * @param _targetAPY Target APY for the strategy
     * @return strategyId The created strategy ID
     */
    function createStrategy(
        string memory _name,
        address[] memory _operators,
        uint256[] memory _allocations,
        uint256 _targetAPY
    ) external onlyOwner returns (bytes32) {
        require(_operators.length == _allocations.length, "Mismatched arrays");
        require(_operators.length >= 2, "Need at least 2 operators");
        require(bytes(_name).length > 0, "Name required");
        
        // Validate total allocation sums to 100%
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < _allocations.length; i++) {
            require(operators[_operators[i]].isApproved, "Operator not approved");
            totalAllocation += _allocations[i];
        }
        require(totalAllocation == BASIS_POINTS, "Allocations must sum to 100%");
        
        bytes32 strategyId = keccak256(abi.encodePacked(_name, block.timestamp));
        
        strategies[strategyId] = RestakingStrategy({
            name: _name,
            operators: _operators,
            allocations: _allocations,
            targetAPY: _targetAPY,
            maxSlashingRisk: _calculateMaxRisk(_operators),
            isActive: true,
            createdAt: block.timestamp
        });
        
        activeStrategies.push(strategyId);
        
        emit StrategyCreated(strategyId, _name);
        return strategyId;
    }
    
    /**
     * @notice Update operator performance metrics
     * @param _operator The operator address
     * @param _actualAPY Actual APY achieved
     * @param _slashingEvents Number of slashing events
     * @param _uptime Uptime percentage
     */
    function updateOperatorPerformance(
        address _operator,
        uint256 _actualAPY,
        uint256 _slashingEvents,
        uint256 _uptime
    ) external onlyOwner {
        require(operators[_operator].isApproved, "Operator not approved");
        require(_uptime <= 100, "Invalid uptime");
        
        OperatorInfo storage op = operators[_operator];
        op.actualAPY = _actualAPY;
        op.slashingHistory += _slashingEvents;
        op.uptime = _uptime;
        
        // Calculate performance score based on multiple factors
        uint256 newScore = _calculatePerformanceScore(_operator, _actualAPY, _slashingEvents, _uptime);
        op.performanceScore = newScore;
        operatorLastUpdate[_operator] = block.timestamp;
        
        emit OperatorPerformanceUpdated(_operator, newScore, _actualAPY);
    }
    
    /**
     * @notice Get top performing operators
     * @param _count Number of top performers to return
     * @return topOperators Array of top performer addresses
     */
    function getTopPerformers(uint256 _count) external view returns (address[] memory) {
        // Sort operators by performance score
        address[] memory sortedOperators = new address[](approvedOperators.length);
        uint256[] memory scores = new uint256[](approvedOperators.length);
        
        for (uint256 i = 0; i < approvedOperators.length; i++) {
            sortedOperators[i] = approvedOperators[i];
            scores[i] = operators[approvedOperators[i]].performanceScore;
        }
        
        // Simple bubble sort (for small arrays)
        for (uint256 i = 0; i < sortedOperators.length - 1; i++) {
            for (uint256 j = 0; j < sortedOperators.length - i - 1; j++) {
                if (scores[j] < scores[j + 1]) {
                    // Swap
                    (sortedOperators[j], sortedOperators[j + 1]) = (sortedOperators[j + 1], sortedOperators[j]);
                    (scores[j], scores[j + 1]) = (scores[j + 1], scores[j]);
                }
            }
        }
        
        // Return top performers
        uint256 returnCount = _count > sortedOperators.length ? sortedOperators.length : _count;
        address[] memory topPerformers = new address[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            topPerformers[i] = sortedOperators[i];
        }
        
        return topPerformers;
    }
    
    /**
     * @notice Calculate optimal allocation for given operators
     * @param _operators Array of operator addresses
     * @return allocations Array of optimal allocation percentages
     */
    function calculateOptimalAllocation(address[] memory _operators) external view returns (uint256[] memory) {
        require(_operators.length > 0, "No operators provided");
        
        uint256[] memory allocations = new uint256[](_operators.length);
        uint256 totalScore = 0;
        
        // Calculate total performance score
        for (uint256 i = 0; i < _operators.length; i++) {
            require(operators[_operators[i]].isApproved, "Operator not approved");
            totalScore += operators[_operators[i]].performanceScore;
        }
        
        // Allocate based on performance scores
        for (uint256 i = 0; i < _operators.length; i++) {
            allocations[i] = (operators[_operators[i]].performanceScore * BASIS_POINTS) / totalScore;
        }
        
        return allocations;
    }
    
    /**
     * @notice Emergency unstake from an operator
     * @param _operator The operator address
     * @param _amount Amount to unstake
     * @param _reason Reason for emergency unstaking
     */
    function emergencyUnstake(
        address _operator,
        uint256 _amount,
        string memory _reason
    ) external onlyOwner {
        require(operators[_operator].isApproved, "Operator not approved");
        require(_amount > 0, "Invalid amount");
        require(bytes(_reason).length > 0, "Reason required");
        
        // Update operator's staked amount
        if (operators[_operator].totalStaked >= _amount) {
            operators[_operator].totalStaked -= _amount;
        } else {
            operators[_operator].totalStaked = 0;
        }
        
        emit EmergencyUnstake(_operator, _amount, _reason);
    }
    
    /**
     * @notice Get operator information
     * @param _operator The operator address
     * @return info Complete operator information
     */
    function getOperatorInfo(address _operator) external view returns (OperatorInfo memory) {
        return operators[_operator];
    }
    
    /**
     * @notice Get all approved operators
     * @return Array of approved operator addresses
     */
    function getApprovedOperators() external view returns (address[] memory) {
        return approvedOperators;
    }
    
    /**
     * @notice Get strategy information
     * @param _strategyId The strategy ID
     * @return strategy The strategy information
     */
    function getStrategy(bytes32 _strategyId) external view returns (RestakingStrategy memory) {
        return strategies[_strategyId];
    }
    
    /**
     * @notice Get all active strategies
     * @return Array of active strategy IDs
     */
    function getActiveStrategies() external view returns (bytes32[] memory) {
        return activeStrategies;
    }
    
    /**
     * @notice Set the current active strategy
     * @param _strategyId The strategy ID to activate
     */
    function setCurrentStrategy(bytes32 _strategyId) external onlyOwner {
        require(strategies[_strategyId].isActive, "Strategy not active");
        currentStrategy = _strategyId;
        emit StrategyActivated(_strategyId);
    }
    
    // Internal helper functions
    function _calculateMaxRisk(address[] memory _operators) internal view returns (uint256) {
        uint256 maxRisk = 0;
        for (uint256 i = 0; i < _operators.length; i++) {
            if (operators[_operators[i]].slashingRisk > maxRisk) {
                maxRisk = operators[_operators[i]].slashingRisk;
            }
        }
        return maxRisk;
    }
    
    function _calculatePerformanceScore(
        address _operator,
        uint256 _actualAPY,
        uint256 _slashingEvents,
        uint256 _uptime
    ) internal view returns (uint256) {
        OperatorInfo storage op = operators[_operator];
        
        // Base score from uptime (0-400 points)
        uint256 uptimeScore = (_uptime * 400) / 100;
        
        // APY performance score (0-300 points)
        uint256 apyScore = 0;
        if (op.expectedAPY > 0) {
            uint256 apyRatio = (_actualAPY * 100) / op.expectedAPY;
            if (apyRatio >= 100) {
                apyScore = 300; // Perfect or over-performance
            } else {
                apyScore = (apyRatio * 300) / 100;
            }
        }
        
        // Slashing penalty (0-300 points, reduced by slashing events)
        uint256 slashingScore = 300;
        if (_slashingEvents > 0) {
            slashingScore = slashingScore > (_slashingEvents * 50) ? slashingScore - (_slashingEvents * 50) : 0;
        }
        
        uint256 totalScore = uptimeScore + apyScore + slashingScore;
        
        // Ensure score is within bounds
        if (totalScore > MAX_PERFORMANCE_SCORE) {
            totalScore = MAX_PERFORMANCE_SCORE;
        }
        if (totalScore < MIN_PERFORMANCE_SCORE) {
            totalScore = MIN_PERFORMANCE_SCORE;
        }
        
        return totalScore;
    }
    
    /**
     * @notice Record operator reward
     * @param _operator The operator address
     * @param _amount Reward amount
     */
    function recordOperatorReward(address _operator, uint256 _amount) external onlyOwner {
        require(operators[_operator].isApproved, "Operator not approved");
        operatorRewards[_operator] += _amount;
        operators[_operator].totalStaked += _amount; // Compound rewards
    }
    
    /**
     * @notice Record operator slashing
     * @param _operator The operator address
     * @param _amount Slashed amount
     */
    function recordOperatorSlashing(address _operator, uint256 _amount) external onlyOwner {
        require(operators[_operator].isApproved, "Operator not approved");
        operatorSlashings[_operator] += _amount;
        
        if (operators[_operator].totalStaked >= _amount) {
            operators[_operator].totalStaked -= _amount;
        } else {
            operators[_operator].totalStaked = 0;
        }
        
        // Reduce performance score for slashing
        if (operators[_operator].performanceScore >= 100) {
            operators[_operator].performanceScore -= 100;
        } else {
            operators[_operator].performanceScore = MIN_PERFORMANCE_SCORE;
        }
    }
    
    /**
     * @notice Get operator statistics
     * @param _operator The operator address
     * @return totalRewards Total rewards earned
     * @return totalSlashings Total amount slashed
     * @return currentStake Current staked amount
     * @return performanceScore Current performance score
     */
    function getOperatorStatistics(address _operator) external view returns (
        uint256 totalRewards,
        uint256 totalSlashings,
        uint256 currentStake,
        uint256 performanceScore
    ) {
        require(operators[_operator].isApproved, "Operator not approved");
        
        return (
            operatorRewards[_operator],
            operatorSlashings[_operator],
            operators[_operator].totalStaked,
            operators[_operator].performanceScore
        );
    }
    
    /**
     * @notice Get diversification metrics
     * @return operatorCount Number of approved operators
     * @return averagePerformance Average performance score
     * @return riskDistribution Distribution of risk across operators
     */
    function getDiversificationMetrics() external view returns (
        uint256 operatorCount,
        uint256 averagePerformance,
        uint256 riskDistribution
    ) {
        operatorCount = approvedOperators.length;
        
        if (operatorCount == 0) {
            return (0, 0, 0);
        }
        
        uint256 totalPerformance = 0;
        uint256 totalRisk = 0;
        
        for (uint256 i = 0; i < approvedOperators.length; i++) {
            address operator = approvedOperators[i];
            totalPerformance += operators[operator].performanceScore;
            totalRisk += operators[operator].slashingRisk;
        }
        
        averagePerformance = totalPerformance / operatorCount;
        riskDistribution = totalRisk / operatorCount;
    }
}
