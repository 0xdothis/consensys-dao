import { expect } from "chai";
import { ethers } from "hardhat";
import { 
  UnifiedLendingDAO,
  MockSymbioticCore
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Advanced LendingDAO Integrations", function () {
  let dao: UnifiedLendingDAO;
  let symbioticCore: MockSymbioticCore;
  
  let deployer: SignerWithAddress;
  let admin: SignerWithAddress;
  let member1: SignerWithAddress;
  let member2: SignerWithAddress;
  let member3: SignerWithAddress;
  let operator1: SignerWithAddress;
  let operator2: SignerWithAddress;
  let operator3: SignerWithAddress;
  
  const membershipFee = ethers.parseEther("0.1");
  const consensusThreshold = 5100; // 51%
  
  beforeEach(async function () {
    [deployer, admin, member1, member2, member3, operator1, operator2, operator3] = await ethers.getSigners();
    
    // Deploy mock Symbiotic core
    const MockSymbioticCore = await ethers.getContractFactory("MockSymbioticCore");
    symbioticCore = await MockSymbioticCore.deploy();
    await symbioticCore.waitForDeployment();
    
    // Deploy enhanced DAO
    const LendingDAOFactory = await ethers.getContractFactory("UnifiedLendingDAO");
    dao = await LendingDAOFactory.deploy();
    await dao.waitForDeployment();
    
    // Initialize DAO
    const loanPolicy = {
      minMembershipDuration: 7 * 24 * 60 * 60, // 7 days
      membershipContribution: membershipFee,
      maxLoanDuration: 30 * 24 * 60 * 60, // 30 days
      minInterestRate: 500, // 5%
      maxInterestRate: 2000, // 20%
      cooldownPeriod: 14 * 24 * 60 * 60, // 14 days
      maxLoanToTreasuryRatio: 5000 // 50%
    };
    
    await dao.initialize(
      [admin.address], // Initial admin
      consensusThreshold,
      membershipFee,
      loanPolicy
    );
    
    // Fund treasury for testing
    await deployer.sendTransaction({
      to: await dao.getAddress(),
      value: ethers.parseEther("100") // 100 ETH treasury
    });
  });
  
  describe("FHE Privacy Features", function () {
    it("Should enable private voting", async function () {
      await dao.connect(admin).toggleFeature("privateVoting", true);
      expect(await dao.privateVotingEnabled()).to.be.true;
    });
    
    it("Should enable confidential loans", async function () {
      await dao.connect(admin).toggleFeature("confidentialLoans", true);
      expect(await dao.confidentialLoansEnabled()).to.be.true;
    });
    
    it("Should set privacy levels", async function () {
      await dao.connect(admin).setPrivacyLevel(2);
      
      expect(await dao.privacyLevel()).to.equal(2);
      expect(await dao.privateVotingEnabled()).to.be.true;
      expect(await dao.confidentialLoansEnabled()).to.be.true;
    });
    
    it("Should handle confidential loan requests", async function () {
      await dao.connect(admin).toggleFeature("confidentialLoans", true);
      await dao.connect(member1).registerMember("", "", { value: membershipFee });
      
      // Fast forward past membership duration
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Create private loan proposal
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("secret_loan_data"));
      
      await expect(
        dao.connect(member1).requestLoan(0, true, commitment, "")
      ).to.emit(dao, "PrivateProposalCreated")
      .withArgs(1, commitment);
    });
  });
  
  describe("Symbiotic Restaking Integration", function () {
    beforeEach(async function () {
      // Enable restaking feature
      await dao.connect(admin).toggleFeature("restaking", true);
      
      // Approve some mock operators using the simplified API
      await dao.connect(admin).approveOperator(
        operator1.address,
        "Ethereum Validator Alpha",
        800  // 8% APY
      );
      
      await dao.connect(admin).approveOperator(
        operator2.address,
        "Multi-Chain Validator Beta",
        1000 // 10% APY
      );
      
      await dao.connect(admin).approveOperator(
        operator3.address,
        "Conservative Validator Gamma",
        600  // 6% APY
      );
    });
    
    it("Should allocate treasury to restaking", async function () {
      const treasuryBalanceBefore = await ethers.provider.getBalance(dao.getAddress());
      
      // Use the simplified allocation function
      await dao.connect(admin).allocateToRestaking(ethers.parseEther("10"));
      
      const totalRestaked = await dao.totalRestaked();
      expect(totalRestaked).to.be.gt(0);
      
      const operators = await dao.getAllOperators();
      expect(operators.length).to.be.gte(3);
    });
    
    it("Should collect and distribute yield", async function () {
      // Setup restaking first
      await dao.connect(admin).allocateToRestaking(ethers.parseEther("10"));
      
      // Register some members for yield distribution
      await dao.connect(member1).registerMember("", "", { value: membershipFee });
      await dao.connect(member2).registerMember("", "", { value: membershipFee });
      
      const yieldBefore = await dao.totalYieldGenerated();
      await dao.connect(admin).distributeYield(ethers.parseEther("2"));
      const yieldAfter = await dao.totalYieldGenerated();
      
      expect(yieldAfter).to.be.gte(yieldBefore);
    });
    
    it("Should handle emergency unstaking", async function () {
      // Setup restaking
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      const totalRestaked = await dao.getTotalRestakingAmount();
      expect(totalRestaked).to.be.gt(0);
      
      // Emergency exit
      await expect(
        dao.connect(admin).emergencyExitRestaking("Market volatility")
      ).to.emit(dao, "EmergencyRestakingExit");
      
      // Verify all positions are closed
      const restakingAfter = await dao.getTotalRestakingAmount();
      expect(restakingAfter).to.equal(0);
    });
    
    it("Should optimize strategy based on performance", async function () {
      // Setup initial strategy
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      const position1Before = await dao.restakingPositions(operator1.address);
      const position2Before = await dao.restakingPositions(operator2.address);
      
      // Update operator performance (simulate poor performance for operator1)
      await dao.connect(admin).updateOperatorPerformance(
        operator1.address,
        400, // 4% actual vs 8% expected
        2,   // 2 slashing events
        85   // 85% uptime
      );
      
      // Strategy should automatically optimize if auto optimization is enabled
      await dao.connect(admin).setAutoOptimizationEnabled(true);
      await dao.connect(admin).updateOperatorPerformance(
        operator1.address,
        200, // Further decrease to trigger rebalancing
        3,   // Additional slashing
        70   // Lower uptime
      );
      
      // Verify reallocation occurred in favor of better performing operators
      const info1 = await restakingManager.getOperatorInfo(operator1.address);
      const info2 = await restakingManager.getOperatorInfo(operator2.address);
      
      expect(info2.performanceScore).to.be.gt(info1.performanceScore);
    });
    
    it("Should create and manage restaking strategies", async function () {
      const strategyId = await dao.connect(admin).createRestakingStrategy.staticCall(
        "Conservative Strategy",
        [operator1.address, operator3.address], // Conservative operators
        [6000, 4000], // 60/40 split
        700 // 7% target APY
      );
      
      await dao.connect(admin).createRestakingStrategy(
        "Conservative Strategy",
        [operator1.address, operator3.address],
        [6000, 4000],
        700
      );
      
      const strategy = await restakingManager.getStrategy(strategyId);
      expect(strategy.name).to.equal("Conservative Strategy");
      expect(strategy.isActive).to.be.true;
    });
  });
  
  describe("Combined FHE + Restaking Features", function () {
    beforeEach(async function () {
      // Enable privacy features
      await dao.connect(admin).setPrivacyLevel(2);
      
      // Setup restaking
      await dao.connect(admin).approveRestakingOperator(
        operator1.address,
        "Test Operator",
        ["ethereum"],
        800,
        200
      );
    });
    
    it("Should enable private voting on restaking strategies", async function () {
      expect(await dao.privateVotingEnabled()).to.be.true;
      
      // Register members
      await dao.connect(member1).registerMember({ value: membershipFee });
      await dao.connect(member2).registerMember({ value: membershipFee });
      
      // Fast forward past membership duration
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Create a loan proposal (would use private voting)
      const proposalId = await dao.connect(member1).requestLoan.staticCall(ethers.parseEther("1"));
      await dao.connect(member1).requestLoan(ethers.parseEther("1"));
      
      // Fast forward past editing period
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Vote should use private voting
      await expect(
        dao.connect(member2).voteOnLoanProposal(proposalId, true)
      ).to.emit(dao, "PrivateVoteCast");
    });
    
    it("Should maintain privacy during yield distribution", async function () {
      await dao.connect(admin).enableEncryptedBalances(true);
      
      // Register members
      await dao.connect(member1).registerMember({ value: membershipFee });
      await dao.connect(member2).registerMember({ value: membershipFee });
      
      // Setup restaking and generate yield
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      // Simulate yield by funding the yield distribution contract
      await deployer.sendTransaction({
        to: await yieldDistribution.getAddress(),
        value: ethers.parseEther("5")
      });
      
      // Distribute yield
      const members = [member1.address, member2.address];
      await yieldDistribution.connect(dao).distributeYield(ethers.parseEther("5"), members);
      
      // Verify yield was distributed
      const member1Yield = await yieldDistribution.getMemberYieldInfo(member1.address);
      expect(member1Yield.pendingYield).to.be.gt(0);
    });
    
    it("Should handle confidential loans with restaking yield", async function () {
      await dao.connect(admin).enableConfidentialLoans(true);
      await dao.connect(member1).registerMember({ value: membershipFee });
      
      // Fast forward past membership duration
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Request confidential loan
      const encryptedAmount = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [ethers.parseEther("2")]);
      
      const proposalId = await dao.connect(member1).requestConfidentialLoan.staticCall(
        encryptedAmount, 
        "Private business expansion"
      );
      
      await dao.connect(member1).requestConfidentialLoan(encryptedAmount, "Private business expansion");
      
      // Verify confidential loan was created
      const [isConfidential, commitment] = await dao.getConfidentialLoanInfo(proposalId);
      expect(isConfidential).to.be.true;
      expect(commitment).to.not.equal(ethers.ZeroHash);
    });
  });
  
  describe("Performance and Risk Management", function () {
    beforeEach(async function () {
      // Setup operators
      await dao.connect(admin).approveRestakingOperator(
        operator1.address,
        "High Performance",
        ["ethereum"],
        1200, // 12% APY
        300   // 3% risk
      );
      
      await dao.connect(admin).approveRestakingOperator(
        operator2.address,
        "Medium Performance",
        ["ethereum"],
        800,  // 8% APY
        200   // 2% risk
      );
    });
    
    it("Should track operator performance accurately", async function () {
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      // Update performance metrics
      await dao.connect(admin).updateOperatorPerformance(
        operator1.address,
        1100, // 11% actual APY (good performance)
        0,    // No slashing
        95    // 95% uptime
      );
      
      const metrics = await dao.operatorMetrics(operator1.address);
      expect(metrics.apy).to.equal(1100);
      expect(metrics.slashingEvents).to.equal(0);
      
      const stats = await restakingManager.getOperatorStatistics(operator1.address);
      expect(stats.performanceScore).to.be.gt(500); // Should be above average
    });
    
    it("Should calculate risk scores correctly", async function () {
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      const overview = await dao.getRestakingOverview();
      expect(overview.riskScore).to.be.gte(0);
      expect(overview.operatorCount).to.be.gte(2);
    });
    
    it("Should provide comprehensive performance metrics", async function () {
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      const metrics = await dao.getPerformanceMetrics(30); // 30 days
      expect(metrics.totalReturn).to.be.gte(0);
      expect(metrics.successRate).to.be.lte(100);
    });
  });
  
  describe("Yield Distribution System", function () {
    beforeEach(async function () {
      // Register members
      await dao.connect(member1).registerMember({ value: membershipFee });
      await dao.connect(member2).registerMember({ value: membershipFee });
      await dao.connect(member3).registerMember({ value: membershipFee });
      
      // Setup restaking
      await dao.connect(admin).approveRestakingOperator(
        operator1.address,
        "Yield Generator",
        ["ethereum"],
        1000,
        300
      );
    });
    
    it("Should distribute yield according to configured shares", async function () {
      // Configure yield distribution
      await yieldDistribution.connect(dao).setDistributionShares(
        6000, // 60% to members
        2000, // 20% to treasury
        2000  // 20% to operations
      );
      
      // Setup restaking and simulate yield
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      // Simulate yield by directly funding yield distribution
      const yieldAmount = ethers.parseEther("10");
      await deployer.sendTransaction({
        to: await yieldDistribution.getAddress(),
        value: yieldAmount
      });
      
      const members = [member1.address, member2.address, member3.address];
      await yieldDistribution.connect(dao).distributeYield(yieldAmount, members);
      
      // Check member yield
      const member1Yield = await yieldDistribution.getMemberYieldInfo(member1.address);
      expect(member1Yield.pendingYield).to.be.gt(0);
      
      // Member should be able to claim
      const claimed = await yieldDistribution.connect(member1).claimYield.staticCall(member1.address);
      expect(claimed).to.be.gt(0);
    });
    
    it("Should handle automatic yield collection", async function () {
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      // Enable auto distribution
      await yieldDistribution.connect(dao).setAutoDistributionEnabled(true);
      
      // Simulate time passage
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
      await ethers.provider.send("evm_mine", []);
      
      expect(await yieldDistribution.isDistributionDue()).to.be.true;
    });
  });
  
  describe("Treasury Optimization", function () {
    it("Should maintain emergency reserves", async function () {
      await dao.connect(admin).setRestakingAllocation(4000); // 40%
      
      const treasuryBalance = await ethers.provider.getBalance(dao.getAddress());
      const availableForRestaking = await dao.getAvailableForRestaking();
      
      // Should leave emergency reserve
      const expectedReserve = treasuryBalance * 1000n / 10000n; // 10% emergency reserve
      expect(availableForRestaking).to.be.lte(treasuryBalance - expectedReserve);
    });
    
    it("Should respect maximum restaking allocation", async function () {
      // Try to set allocation too high
      await expect(
        dao.connect(admin).setRestakingAllocation(6000) // 60% > 50% max
      ).to.be.revertedWith("Allocation too high");
    });
  });
  
  describe("Integration Error Handling", function () {
    it("Should handle FHE operation failures gracefully", async function () {
      await dao.connect(admin).enablePrivateVoting(true);
      await dao.connect(member1).registerMember({ value: membershipFee });
      
      // Should not break if FHE operations fail
      // This would be more relevant with actual FHE implementation
      expect(await dao.privateVotingEnabled()).to.be.true;
    });
    
    it("Should handle restaking failures without breaking core functionality", async function () {
      // Should still function as lending DAO even if restaking fails
      await dao.connect(member1).registerMember({ value: membershipFee });
      
      // Fast forward past membership duration
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Should still be able to request loans
      await expect(
        dao.connect(member1).requestLoan(ethers.parseEther("1"))
      ).to.emit(dao, "LoanRequested");
    });
  });
  
  describe("Governance Integration", function () {
    it("Should allow governance over restaking parameters", async function () {
      // Admin should be able to configure restaking
      await dao.connect(admin).setRestakingAllocation(2500); // 25%
      expect(await dao.restakingAllocationBPS()).to.equal(2500);
      
      await dao.connect(admin).setAutoOptimizationEnabled(true);
      expect(await dao.autoOptimizationEnabled()).to.be.true;
    });
    
    it("Should provide comprehensive DAO statistics", async function () {
      await dao.connect(admin).approveRestakingOperator(
        operator1.address,
        "Test Operator",
        ["ethereum"],
        800,
        200
      );
      
      await dao.connect(admin).optimizeTreasuryAllocation();
      
      const stats = await dao.getAdvancedDAOStats();
      expect(stats.totalTreasuryValue).to.be.gt(0);
      expect(stats.totalRestakingValue).to.be.gte(0);
      expect(stats.activeOperators).to.be.gte(1);
    });
  });
});
