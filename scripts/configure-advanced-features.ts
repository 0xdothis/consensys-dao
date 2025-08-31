import { ethers } from "hardhat";

// Update this with your deployed DAO address
const DAO_ADDRESS = process.env.DAO_ADDRESS || "";

async function configureAdvancedFeatures(daoAddress: string) {
  if (!daoAddress) {
    console.error("❌ DAO_ADDRESS environment variable not set");
    console.log("Usage: DAO_ADDRESS=0x... npx hardhat run scripts/configure-advanced-features.ts");
    process.exit(1);
  }
  
  const [deployer, operator1, operator2, operator3] = await ethers.getSigners();
  
  console.log("Configuring advanced features for DAO at:", daoAddress);
  console.log("Using account:", deployer.address);
  
  // Get DAO contract
  const dao = await ethers.getContractAt("LendingDAOWithRestaking", daoAddress);
  const restakingManager = await ethers.getContractAt("RestakingManager", await dao.restakingManager());
  const yieldDistribution = await ethers.getContractAt("YieldDistribution", await dao.yieldDistribution());
  
  console.log("\n1. Setting up mock operators for testing...");
  
  try {
    await restakingManager.connect(dao).approveOperator(
      operator1.address,
      "Ethereum Validator Alpha",
      ["ethereum"],
      800,  // 8% APY
      200   // 2% slashing risk
    );
    console.log("✅ Operator 1 (Alpha) approved");
  } catch (error) {
    console.log("⚠️  Operator 1 might already be approved");
  }
  
  try {
    await restakingManager.connect(dao).approveOperator(
      operator2.address,
      "Multi-Chain Validator Beta",
      ["ethereum", "polygon", "avalanche"],
      1000, // 10% APY
      400   // 4% slashing risk
    );
    console.log("✅ Operator 2 (Beta) approved");
  } catch (error) {
    console.log("⚠️  Operator 2 might already be approved");
  }
  
  try {
    await restakingManager.connect(dao).approveOperator(
      operator3.address,
      "Conservative Validator Gamma",
      ["ethereum"],
      600,  // 6% APY
      100   // 1% slashing risk
    );
    console.log("✅ Operator 3 (Gamma) approved");
  } catch (error) {
    console.log("⚠️  Operator 3 might already be approved");
  }
  
  console.log("\n2. Creating initial restaking strategy...");
  
  try {
    const strategyId = await restakingManager.connect(dao).createStrategy.staticCall(
      "Balanced Strategy",
      [operator1.address, operator2.address, operator3.address],
      [4000, 3000, 3000], // 40%, 30%, 30%
      800 // 8% target APY
    );
    
    await restakingManager.connect(dao).createStrategy(
      "Balanced Strategy",
      [operator1.address, operator2.address, operator3.address],
      [4000, 3000, 3000],
      800
    );
    
    console.log("✅ Balanced strategy created with ID:", strategyId);
  } catch (error) {
    console.log("⚠️  Strategy creation failed:", error.message);
  }
  
  console.log("\n3. Configuring yield distribution...");
  
  try {
    await yieldDistribution.connect(dao).setTreasuryAddress(daoAddress);
    await yieldDistribution.connect(dao).setOperationalAddress(deployer.address);
    await yieldDistribution.connect(dao).setAutoDistributionEnabled(true);
    
    console.log("✅ Yield distribution configured");
    console.log("   - Treasury address:", daoAddress);
    console.log("   - Operational address:", deployer.address);
    console.log("   - Auto distribution: enabled");
  } catch (error) {
    console.log("⚠️  Yield distribution configuration failed:", error.message);
  }
  
  console.log("\n4. Setting up privacy features...");
  
  // Privacy features ready for gradual activation
  const privacyStatus = await dao.getPrivacyStatus();
  console.log("📊 Current Privacy Settings:");
  console.log("   - Private Voting:", privacyStatus.privateVoting);
  console.log("   - Confidential Loans:", privacyStatus.confidentialLoans);
  console.log("   - Encrypted Balances:", privacyStatus.encryptedBalances);
  console.log("   - Privacy Level:", privacyStatus.currentPrivacyLevel);
  
  console.log("\n5. Initial optimization...");
  
  try {
    await dao.optimizeTreasuryAllocation();
    console.log("✅ Treasury allocation optimized");
    
    const overview = await dao.getRestakingOverview();
    console.log("📊 Restaking Overview:");
    console.log("   - Total Restaked:", ethers.formatEther(overview.totalRestaked), "ETH");
    console.log("   - Total Yield:", ethers.formatEther(overview.totalYield), "ETH");
    console.log("   - Average APY:", overview.averageAPY / 100, "%");
    console.log("   - Risk Score:", overview.riskScore);
    console.log("   - Active Operators:", overview.operatorCount.toString());
  } catch (error) {
    console.log("⚠️  Initial optimization failed:", error.message);
  }
  
  console.log("\n✅ Configuration completed!");
  
  return {
    operatorsApproved: 3,
    strategiesCreated: 1,
    yieldDistributionConfigured: true,
    privacyFeaturesReady: true
  };
}

async function enablePrivacyFeatures(daoAddress: string, level: number = 2) {
  console.log(`\n🔒 Enabling Privacy Level ${level}...`);
  
  const dao = await ethers.getContractAt("LendingDAOWithRestaking", daoAddress);
  
  try {
    await dao.setPrivacyLevel(level);
    console.log(`✅ Privacy level set to ${level}`);
    
    const status = await dao.getPrivacyStatus();
    console.log("📊 Updated Privacy Settings:");
    console.log("   - Private Voting:", status.privateVoting);
    console.log("   - Confidential Loans:", status.confidentialLoans);
    console.log("   - Encrypted Balances:", status.encryptedBalances);
  } catch (error) {
    console.log("⚠️  Privacy configuration failed:", error.message);
  }
}

async function main() {
  console.log("🚀 Advanced LendingDAO Configuration");
  console.log("====================================");
  
  if (!DAO_ADDRESS) {
    console.log("No DAO address provided, running full deployment...");
    // Import and run deployment
    const { main: deployMain } = await import("./deploy-advanced-dao");
    const addresses = await deployMain();
    
    // Configure the newly deployed DAO
    await configureAdvancedFeatures(addresses.dao);
    
    console.log("\n🎯 Quick Start Commands:");
    console.log("====================================");
    console.log(`export DAO_ADDRESS=${addresses.dao}`);
    console.log("npm run test -- --grep \"Advanced\"");
    console.log("npx hardhat run scripts/example-usage.ts");
    
  } else {
    // Configure existing DAO
    await configureAdvancedFeatures(DAO_ADDRESS);
    
    // Optionally enable privacy features
    if (process.env.ENABLE_PRIVACY === "true") {
      const privacyLevel = parseInt(process.env.PRIVACY_LEVEL || "2");
      await enablePrivacyFeatures(DAO_ADDRESS, privacyLevel);
    }
  }
}

// Export for use in other scripts
export { configureAdvancedFeatures, enablePrivacyFeatures };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 Configuration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Configuration failed:");
      console.error(error);
      process.exit(1);
    });
}
