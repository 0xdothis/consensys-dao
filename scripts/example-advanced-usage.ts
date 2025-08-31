import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Advanced LendingDAO Feature Demonstration");
  console.log("==============================================");
  
  // Deploy contracts if needed
  console.log("\n1. Setting up contracts...");
  
  // Deploy MockSymbioticCore
  const MockSymbioticCore = await ethers.getContractFactory("MockSymbioticCore");
  const symbioticCore = await MockSymbioticCore.deploy();
  await symbioticCore.waitForDeployment();
  
  // Deploy advanced DAO
  const LendingDAOWithRestaking = await ethers.getContractFactory("LendingDAOWithRestaking");
  const dao = await LendingDAOWithRestaking.deploy(await symbioticCore.getAddress());
  await dao.waitForDeployment();
  
  console.log("✅ Advanced DAO deployed to:", await dao.getAddress());
  
  // Get signers
  const [deployer, admin, member1, member2, operator1, operator2] = await ethers.getSigners();
  
  // Initialize DAO
  const membershipFee = ethers.parseEther("0.1");
  const loanPolicy = {
    minMembershipDuration: 7 * 24 * 60 * 60,
    membershipContribution: membershipFee,
    maxLoanDuration: 30 * 24 * 60 * 60,
    minInterestRate: 500,
    maxInterestRate: 2000,
    cooldownPeriod: 14 * 24 * 60 * 60,
    maxLoanToTreasuryRatio: 5000
  };
  
  await dao.initialize([admin.address], 5100, membershipFee, loanPolicy);
  
  // Fund treasury
  await deployer.sendTransaction({
    to: await dao.getAddress(),
    value: ethers.parseEther("50")
  });
  
  console.log("\n2. 🔒 Demonstrating Privacy Features...");
  
  // Enable privacy level 2 (Enhanced)
  await dao.connect(admin).setPrivacyLevel(2);
  console.log("✅ Privacy level set to Enhanced (Private voting + Confidential loans)");
  
  // Register members
  await dao.connect(member1).registerMember({ value: membershipFee });
  await dao.connect(member2).registerMember({ value: membershipFee });
  console.log("✅ Members registered");
  
  // Initialize credit profiles
  const defaultCreditScore = ethers.AbiCoder.defaultAbiCoder().encode(["uint32"], [650]);
  await dao.connect(admin).initializeMemberCreditProfile(member1.address, defaultCreditScore);
  console.log("✅ Credit profile initialized for member1");
  
  // Fast forward past membership duration
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  
  // Request confidential loan
  const encryptedAmount = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [ethers.parseEther("2")]);
  const proposalId = await dao.connect(member1).requestConfidentialLoan(
    encryptedAmount,
    "Private business expansion"
  );
  console.log("✅ Confidential loan requested - Proposal ID:", proposalId);
  
  console.log("\n3. 💰 Demonstrating Restaking Features...");
  
  // Get extension contracts
  const restakingManager = await ethers.getContractAt("RestakingManager", await dao.restakingManager());
  
  // Approve operators
  await dao.connect(admin).approveRestakingOperator(
    operator1.address,
    "High Yield Validator",
    ["ethereum"],
    1200, // 12% APY
    300   // 3% slashing risk
  );
  
  await dao.connect(admin).approveRestakingOperator(
    operator2.address,
    "Conservative Validator",
    ["ethereum"],
    800,  // 8% APY
    150   // 1.5% slashing risk
  );
  
  console.log("✅ Restaking operators approved");
  
  // Optimize treasury allocation
  await dao.connect(admin).optimizeTreasuryAllocation();
  console.log("✅ Treasury allocation optimized for restaking");
  
  // Check restaking overview
  const overview = await dao.getRestakingOverview();
  console.log("📊 Restaking Overview:");
  console.log("   - Total Restaked:", ethers.formatEther(overview.totalRestaked), "ETH");
  console.log("   - Active Operators:", overview.operatorCount.toString());
  console.log("   - Average APY:", overview.averageAPY / 100, "%");
  
  console.log("\n4. 📈 Demonstrating Yield Distribution...");
  
  const yieldDistribution = await ethers.getContractAt("YieldDistribution", await dao.yieldDistribution());
  
  // Simulate yield generation
  await deployer.sendTransaction({
    to: await yieldDistribution.getAddress(),
    value: ethers.parseEther("5")
  });
  
  // Distribute yield to members
  const members = [member1.address, member2.address];
  await yieldDistribution.connect(dao).distributeYield(ethers.parseEther("5"), members);
  
  console.log("✅ Yield distributed to members");
  
  // Check member yield
  const member1Yield = await yieldDistribution.getMemberYieldInfo(member1.address);
  console.log("📊 Member1 yield info:");
  console.log("   - Pending yield:", ethers.formatEther(member1Yield.pendingYield), "ETH");
  console.log("   - Total earned:", ethers.formatEther(member1Yield.totalEarned), "ETH");
  
  console.log("\n5. 🎯 Demonstrating Combined Features...");
  
  // Fast forward past editing period for the confidential loan
  await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
  
  // Vote on confidential loan (using private voting)
  await dao.connect(member2).voteOnLoanProposal(proposalId, true);
  console.log("✅ Private vote cast on confidential loan proposal");
  
  // Update operator performance
  await dao.connect(admin).updateOperatorPerformance(
    operator1.address,
    1100, // 11% actual APY
    0,    // No slashing
    98    // 98% uptime
  );
  console.log("✅ Operator performance updated");
  
  // Get comprehensive DAO stats
  const stats = await dao.getAdvancedDAOStats();
  console.log("\n📊 Final DAO Statistics:");
  console.log("==========================================");
  console.log("Treasury Value:", ethers.formatEther(stats.totalTreasuryValue), "ETH");
  console.log("Restaking Value:", ethers.formatEther(stats.totalRestakingValue), "ETH");
  console.log("Total Yield Generated:", ethers.formatEther(stats.totalYieldGenerated), "ETH");
  console.log("Average APY:", stats.averageAPY / 100, "%");
  console.log("Risk Score:", stats.riskScore);
  console.log("Privacy Enabled:", stats.privacyEnabled);
  console.log("Active Operators:", stats.activeOperators.toString());
  console.log("Total Members:", stats.totalMembers.toString());
  
  console.log("\n🎉 Advanced Features Demonstration Complete!");
  console.log("==============================================");
  
  console.log("\n🔧 Available Management Commands:");
  console.log("- Enable maximum privacy: dao.setPrivacyLevel(3)");
  console.log("- Adjust restaking allocation: dao.setRestakingAllocation(4000)");
  console.log("- Emergency exit restaking: dao.emergencyExitRestaking('reason')");
  console.log("- Collect yield: dao.collectAndDistributeYield()");
  console.log("- Member claim yield: yieldDistribution.claimYield(memberAddress)");
  
  console.log("\n📈 Monitoring Commands:");
  console.log("- Check privacy status: dao.getPrivacyStatus()");
  console.log("- View restaking overview: dao.getRestakingOverview()");
  console.log("- Get performance metrics: dao.getPerformanceMetrics(30)");
  console.log("- Check operator stats: restakingManager.getOperatorStatistics(operator)");
  
  return {
    daoAddress: await dao.getAddress(),
    symbioticCoreAddress: await symbioticCore.getAddress(),
    restakingManagerAddress: await dao.restakingManager(),
    yieldDistributionAddress: await dao.yieldDistribution(),
    fheGovernanceAddress: await dao.fheGovernance(),
    memberAddresses: [member1.address, member2.address],
    operatorAddresses: [operator1.address, operator2.address]
  };
}

main()
  .then((result) => {
    console.log("\n📋 Deployment Summary:");
    console.log("======================");
    Object.entries(result).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        console.log(`${key}: [${value.join(", ")}]`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
