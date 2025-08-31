// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISymbioticIntegration {
    struct RestakingPosition {
        address operator;
        uint256 amount;
        uint256 delegatedAt;
        uint256 lastReward;
        uint256 totalRewards;
        bool isActive;
    }
    
    struct OperatorMetrics {
        uint256 totalStaked;
        uint256 apy;
        uint256 slashingEvents;
        uint256 performanceScore;
        uint256 lastUpdated;
    }
    
    // Events
    event RestakingAllocated(uint256 amount, address[] operators, uint256[] allocations);
    event YieldDistributed(uint256 memberShare, uint256 treasuryShare, uint256 operationalShare);
    event OperatorApproved(address indexed operator, string name, uint256 expectedAPY);
    event EmergencyUnstaking(address indexed operator, uint256 amount, string reason);
    event RestakingDelegated(address indexed operator, uint256 amount);
    event TreasuryOptimized(uint256 totalTreasury, uint256 targetRestaking, uint256 currentRestaked);
    event YieldCollectedAndDistributed(uint256 totalCollected, uint256 timestamp);
    event EmergencyRestakingExit(string reason, uint256 timestamp);
    
    // Function signatures for restaking features
    function optimizeTreasuryAllocation() external;
    function collectAndDistributeYield() external;
    function emergencyExitRestaking(string memory _reason) external;
    function getRestakingOverview() external view returns (
        uint256 totalRestaked,
        uint256 totalYield,
        uint256 averageAPY,
        uint256 riskScore,
        uint256 operatorCount
    );
}
