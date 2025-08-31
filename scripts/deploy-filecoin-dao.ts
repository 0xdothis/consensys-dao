import { ethers } from "hardhat";

async function main() {
  console.log("💾 Deploying LendingDAO with Filecoin Storage Integration...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy LendingDAO with Filecoin
  console.log("\n📋 Deploying LendingDAOWithFilecoin...");
  const LendingDAOFactory = await ethers.getContractFactory("LendingDAOWithFilecoin");
  const lendingDAO = await LendingDAOFactory.deploy();
  await lendingDAO.waitForDeployment();

  const lendingDAOAddress = await lendingDAO.getAddress();
  console.log("✅ LendingDAOWithFilecoin deployed to:", lendingDAOAddress);

  // Get contract addresses
  const ensGovernanceAddress = await lendingDAO.ensGovernance();
  const filecoinStorageAddress = await lendingDAO.filecoinStorage();
  
  console.log("✅ ENSGovernance deployed to:", ensGovernanceAddress);
  console.log("✅ FilecoinStorage deployed to:", filecoinStorageAddress);

  // Configuration parameters
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

  // Initialize the DAO
  console.log("\n🔧 Initializing DAO...");
  await lendingDAO["initialize(address[],uint256,uint256,(uint256,uint256,uint256,uint256,uint256,uint256,uint256),string)"](
    [deployer.address], // Initial admin
    consensusThreshold,
    membershipFee,
    loanPolicy,
    "lendingdao.eth" // ENS domain
  );

  console.log("✅ DAO initialized successfully!");

  // Configure ENS settings
  console.log("\n🌐 Configuring ENS settings...");
  await lendingDAO.setSubdomainPrice(ethers.parseEther("0.01"));
  console.log("✅ Subdomain price set to 0.01 ETH");

  await lendingDAO.reserveSubdomains([
    "admin", "treasury", "governance", "dao", "voting", "proposals"
  ]);
  console.log("✅ Reserved important subdomains");

  // Configure Filecoin storage settings
  console.log("\n💾 Configuring Filecoin storage...");
  
  const storagePrice = ethers.parseEther("0.001"); // 0.001 ETH per GB per year
  const backupInterval = 7 * 24 * 60 * 60; // 7 days
  
  await lendingDAO.configureFilecoinStorage(storagePrice, backupInterval);
  console.log("✅ Storage price set to 0.001 ETH per GB per year");
  console.log("✅ Backup interval set to 7 days");

  // Enable automatic features
  console.log("\n🤖 Enabling automatic features...");
  await lendingDAO.setAutoDocumentStorageEnabled(true);
  await lendingDAO.setAutoBackupEnabled(true);
  console.log("✅ Auto document storage enabled");
  console.log("✅ Auto backup enabled");

  // Add initial treasury funds
  console.log("\n💰 Adding initial treasury funds...");
  await deployer.sendTransaction({
    to: lendingDAOAddress,
    value: ethers.parseEther("10.0")
  });
  console.log("✅ Added 10 ETH to treasury");

  // Create initial backup
  console.log("\n📦 Creating initial backup...");
  const initialBackupHash = `QmInitialBackup${Date.now()}`;
  try {
    const snapshotId = await lendingDAO.triggerManualBackup(initialBackupHash);
    console.log(`✅ Initial backup created with snapshot ID: ${snapshotId}`);
  } catch (error) {
    console.log("ℹ️  Initial backup creation skipped (no data to backup yet)");
  }

  // Get deployed contract information
  const filecoinStorage = await ethers.getContractAt("FilecoinStorage", filecoinStorageAddress);
  const storageOverview = await lendingDAO.getStorageOverview();

  // Display deployment summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log(`📋 LendingDAOWithFilecoin: ${lendingDAOAddress}`);
  console.log(`🌐 ENSGovernance: ${ensGovernanceAddress}`);
  console.log(`💾 FilecoinStorage: ${filecoinStorageAddress}`);
  console.log(`👤 Admin: ${deployer.address}`);
  console.log(`💰 Membership Fee: ${ethers.formatEther(membershipFee)} ETH`);
  console.log(`📊 Consensus Threshold: ${consensusThreshold / 100}%`);
  console.log(`💎 Treasury Balance: ${ethers.formatEther(await lendingDAO.getTreasuryBalance())} ETH`);
  console.log(`💾 Storage Price: ${ethers.formatEther(storagePrice)} ETH/GB/year`);
  console.log(`🔄 Backup Interval: ${backupInterval / (24 * 60 * 60)} days`);
  console.log(`📁 Auto Storage: ${storageOverview.autoStorageEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`📦 Auto Backup: ${storageOverview.autoBackupEnabled ? 'Enabled' : 'Disabled'}`);
  console.log("=".repeat(70));

  console.log("\n📖 FILECOIN FEATURES:");
  console.log("🔹 Automatic loan agreement storage on loan approval");
  console.log("🔹 Member KYC document storage with encryption");
  console.log("🔹 Governance proposal documentation");
  console.log("🔹 Automated DAO state backups every 7 days");
  console.log("🔹 Immutable audit trail for compliance");
  console.log("🔹 Document categorization and search");

  console.log("\n📖 USAGE EXAMPLES:");
  console.log("1. Register with KYC: lendingDAO.registerMemberWithKYC(ipfsHash, fileSize)");
  console.log("2. Store proposal doc: lendingDAO.storeProposalDocument(proposalId, hash, size, title)");
  console.log("3. Manual backup: lendingDAO.triggerManualBackup(backupHash)");
  console.log("4. Get storage stats: lendingDAO.getStorageStatistics()");
  console.log("5. View documents: filecoinStorage.getDocumentsByType(docType)");

  console.log("\n🔗 PREVIOUS FEATURES (ENS + Base DAO):");
  console.log("- ENS domain-based governance with weighted voting");
  console.log("- Member subdomain identity system");  
  console.log("- Peer-to-peer lending with automated terms");
  console.log("- Treasury management with multi-sig governance");

  return {
    lendingDAO: lendingDAOAddress,
    ensGovernance: ensGovernanceAddress,
    filecoinStorage: filecoinStorageAddress
  };
}

main()
  .then((contracts) => {
    console.log("\n✨ Deployment successful!");
    console.log("Ready for Symbiotic and Zama integrations!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
