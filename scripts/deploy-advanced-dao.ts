import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Advanced LendingDAO with FHE and Restaking...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  
  // Deploy mock Symbiotic core for testing
  console.log("\n1. Deploying MockSymbioticCore...");
  const MockSymbioticCore = await ethers.getContractFactory("MockSymbioticCore");
  const symbioticCore = await MockSymbioticCore.deploy();
  await symbioticCore.waitForDeployment();
  
  console.log("MockSymbioticCore deployed to:", await symbioticCore.getAddress());
  
  // Deploy advanced DAO
  console.log("\n2. Deploying LendingDAOWithRestaking...");
  const LendingDAOWithRestaking = await ethers.getContractFactory("LendingDAOWithRestaking");
  const dao = await LendingDAOWithRestaking.deploy(await symbioticCore.getAddress());
  await dao.waitForDeployment();
  
  console.log("LendingDAOWithRestaking deployed to:", await dao.getAddress());
  
  // Initialize DAO
  console.log("\n3. Initializing DAO...");
  const membershipFee = ethers.parseEther("0.1");
  const consensusThreshold = 5100; // 51%
  
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
    [deployer.address], // Initial admin
    consensusThreshold,
    membershipFee,
    loanPolicy
  );
  
  console.log("DAO initialized successfully");
  
  // Configure advanced features
  console.log("\n4. Configuring advanced features...");
  await dao.enablePrivateVoting(false); // Start with public voting
  await dao.enableConfidentialLoans(false); // Start with public loans
  
  // Set conservative restaking allocation
  await dao.setRestakingAllocation(2000); // 20% of treasury
  console.log("Restaking allocation set to 20%");
  
  // Configure yield distribution
  const yieldDistributionAddress = await dao.yieldDistribution();
  const yieldDistribution = await ethers.getContractAt("YieldDistribution", yieldDistributionAddress);
  
  await yieldDistribution.connect(dao).setDistributionShares(
    6000, // 60% to members
    2000, // 20% to treasury  
    2000  // 20% to operations
  );
  console.log("Yield distribution configured: 60% members, 20% treasury, 20% operations");
  
  console.log("\n5. Funding treasury...");
  // Fund treasury for testing
  await deployer.sendTransaction({
    to: await dao.getAddress(),
    value: ethers.parseEther("100") // 100 ETH treasury
  });
  
  console.log("Treasury funded with 100 ETH");
  
  // Get extension contract addresses
  const restakingManagerAddress = await dao.restakingManager();
  const fheGovernanceAddress = await dao.fheGovernance();
  const fheCreditScoringAddress = await dao.fheCreditScoring();
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("==========================================");
  console.log("LendingDAOWithRestaking:", await dao.getAddress());
  console.log("MockSymbioticCore:", await symbioticCore.getAddress());
  console.log("RestakingManager:", restakingManagerAddress);
  console.log("FHEGovernance:", fheGovernanceAddress);
  console.log("FHECreditScoring:", fheCreditScoringAddress);
  console.log("YieldDistribution:", yieldDistributionAddress);
  
  console.log("\n📊 Initial Configuration:");
  console.log("==========================================");
  console.log("Membership Fee:", ethers.formatEther(membershipFee), "ETH");
  console.log("Consensus Threshold:", consensusThreshold / 100, "%");
  console.log("Treasury Balance:", ethers.formatEther(await ethers.provider.getBalance(dao.getAddress())), "ETH");
  console.log("Privacy Level:", await dao.privacyLevel());
  console.log("Restaking Allocation:", await dao.restakingAllocationBPS() / 100, "%");
  
  console.log("\n🔧 Next Steps:");
  console.log("==========================================");
  console.log("1. Run: npm run configure-advanced-features");
  console.log("2. Register test operators");
  console.log("3. Enable privacy features as needed");
  console.log("4. Start treasury optimization");
  
  return {
    dao: await dao.getAddress(),
    symbioticCore: await symbioticCore.getAddress(),
    restakingManager: restakingManagerAddress,
    fheGovernance: fheGovernanceAddress,
    fheCreditScoring: fheCreditScoringAddress,
    yieldDistribution: yieldDistributionAddress
  };
}

main()
  .then((addresses) => {
    console.log("\n🎉 Deployment artifacts saved!");
    console.log("Addresses:", JSON.stringify(addresses, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
