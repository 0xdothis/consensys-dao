// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockSymbioticCore {
    struct MockVault {
        address vault;
        address operator;
        uint256 totalStaked;
        uint256 apy;
        bool isActive;
    }
    
    mapping(address => MockVault) public operatorVaults;
    mapping(address => uint256) public vaultRewards;
    
    address[] public registeredOperators;
    uint256 public totalValueLocked;
    
    event OperatorRegistered(address indexed operator, address indexed vault);
    event StakeDeposited(address indexed vault, uint256 amount);
    event RewardsDistributed(address indexed vault, uint256 amount);
    
    /**
     * @notice Register a mock operator with vault
     * @param _operator Operator address
     * @param _vault Vault address
     * @param _apy Expected APY (basis points)
     */
    function registerOperator(address _operator, address _vault, uint256 _apy) external {
        require(_operator != address(0) && _vault != address(0), "Invalid addresses");
        require(!operatorVaults[_operator].isActive, "Already registered");
        
        operatorVaults[_operator] = MockVault({
            vault: _vault,
            operator: _operator,
            totalStaked: 0,
            apy: _apy,
            isActive: true
        });
        
        registeredOperators.push(_operator);
        emit OperatorRegistered(_operator, _vault);
    }
    
    /**
     * @notice Get operator's vault address
     * @param _operator Operator address
     * @return Vault address
     */
    function getOperatorVault(address _operator) external view returns (address) {
        return operatorVaults[_operator].vault;
    }
    
    /**
     * @notice Simulate staking to operator vault
     * @param _operator Operator address
     */
    function stake(address _operator) external payable {
        require(operatorVaults[_operator].isActive, "Operator not active");
        require(msg.value > 0, "Invalid amount");
        
        operatorVaults[_operator].totalStaked += msg.value;
        totalValueLocked += msg.value;
        
        emit StakeDeposited(operatorVaults[_operator].vault, msg.value);
    }
    
    /**
     * @notice Simulate unstaking from operator vault
     * @param _operator Operator address
     * @param _amount Amount to unstake
     */
    function unstake(address _operator, uint256 _amount) external {
        require(operatorVaults[_operator].isActive, "Operator not active");
        require(operatorVaults[_operator].totalStaked >= _amount, "Insufficient stake");
        
        operatorVaults[_operator].totalStaked -= _amount;
        totalValueLocked -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @notice Simulate rewards distribution
     * @param _operator Operator address
     * @param _rewardAmount Reward amount
     */
    function distributeRewards(address _operator, uint256 _rewardAmount) external payable {
        require(operatorVaults[_operator].isActive, "Operator not active");
        require(msg.value >= _rewardAmount, "Insufficient payment");
        
        vaultRewards[operatorVaults[_operator].vault] += _rewardAmount;
        emit RewardsDistributed(operatorVaults[_operator].vault, _rewardAmount);
    }
    
    /**
     * @notice Get vault rewards
     * @param _vault Vault address
     * @return Accumulated rewards
     */
    function getVaultRewards(address _vault) external view returns (uint256) {
        return vaultRewards[_vault];
    }
    
    /**
     * @notice Claim vault rewards
     * @param _vault Vault address
     * @return Claimed amount
     */
    function claimVaultRewards(address _vault) external returns (uint256) {
        uint256 rewards = vaultRewards[_vault];
        require(rewards > 0, "No rewards available");
        
        vaultRewards[_vault] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: rewards}("");
        require(success, "Transfer failed");
        
        return rewards;
    }
    
    /**
     * @notice Get total value locked
     * @return Total staked amount across all operators
     */
    function getTotalValueLocked() external view returns (uint256) {
        return totalValueLocked;
    }
    
    /**
     * @notice Get all registered operators
     * @return Array of operator addresses
     */
    function getRegisteredOperators() external view returns (address[] memory) {
        return registeredOperators;
    }
    
    receive() external payable {
        // Accept ETH for rewards distribution
    }
}

/**
 * @title MockSymbioticVault
 * @dev Mock vault contract for testing
 */
contract MockSymbioticVault {
    address public operator;
    uint256 public totalStaked;
    mapping(address => uint256) public stakerBalances;
    
    event Delegated(address indexed staker, uint256 amount);
    event Undelegated(address indexed staker, uint256 amount);
    
    constructor(address _operator) {
        operator = _operator;
    }
    
    function delegate() external payable {
        require(msg.value > 0, "Invalid amount");
        
        stakerBalances[msg.sender] += msg.value;
        totalStaked += msg.value;
        
        emit Delegated(msg.sender, msg.value);
    }
    
    function undelegate(uint256 _amount) external {
        require(stakerBalances[msg.sender] >= _amount, "Insufficient balance");
        
        stakerBalances[msg.sender] -= _amount;
        totalStaked -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Undelegated(msg.sender, _amount);
    }
    
    function getStakerBalance(address _staker) external view returns (uint256) {
        return stakerBalances[_staker];
    }
}
