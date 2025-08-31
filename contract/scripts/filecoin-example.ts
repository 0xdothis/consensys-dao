import { ethers } from "hardhat";

async function main() {
  console.log("💾 Filecoin Storage Integration Demo");
  console.log("=".repeat(60));

  // Get signers
  const [deployer, admin, member1, member2, member3] = await ethers.getSigners();
  
  console.log("👥 Demo Participants:");
  console.log(`   Admin: ${admin.address}`);
  console.log(`   Member 1: ${member1.address}`);
  console.log(`   Member 2: ${member2.address}`);
  console.log(`   Member 3: ${member3.address}`);

  // Deploy contracts
  console.log("\n🚀 Deploying contracts...");
  const LendingDAOFactory = await ethers.getContractFactory("LendingDAOWithFilecoin");
  const lendingDAO = await LendingDAOFactory.deploy();
  await lendingDAO.waitForDeployment();

  const lendingDAOAddress = await lendingDAO.getAddress();
  const filecoinStorageAddress = await lendingDAO.filecoinStorage();
  const filecoinStorage = await ethers.getContractAt("FilecoinStorage", filecoinStorageAddress);

  console.log(`✅ LendingDAO deployed: ${lendingDAOAddress}`);
  console.log(`✅ FilecoinStorage deployed: ${filecoinStorageAddress}`);

  // Initialize DAO
  const membershipFee = ethers.parseEther("0.1");
  const consensusThreshold = 5100;
  const loanPolicy = {
    minMembershipDuration: 7 * 24 * 60 * 60,
    membershipContribution: membershipFee,
    maxLoanDuration: 30 * 24 * 60 * 60,
    minInterestRate: 500,
    maxInterestRate: 2000,
    cooldownPeriod: 14 * 24 * 60 * 60,
    maxLoanToTreasuryRatio: 5000
  };

  await lendingDAO["initialize(address[],uint256,uint256,(uint256,uint256,uint256,uint256,uint256,uint256,uint256),string)"](
    [deployer.address],
    consensusThreshold,
    membershipFee,
    loanPolicy,
    "lendingdao.eth"
  );

  // Add treasury funds
  await deployer.sendTransaction({
    to: lendingDAOAddress,
    value: ethers.parseEther("10")
  });

  console.log("✅ DAO initialized with 10 ETH treasury");

  // DEMO: Document Storage Features
  console.log("\n📁 DEMO 1: Document Storage Features");
  console.log("-".repeat(40));

  // Configure storage
  await lendingDAO.configureFilecoinStorage(ethers.parseEther("0.001"), 7 * 24 * 60 * 60);
  await lendingDAO.setAutoDocumentStorageEnabled(true);
  console.log("✅ Configured storage: 0.001 ETH/GB/year, 7-day backups");

  // Member registration with KYC
  console.log("\n👤 Registering member with KYC document...");
  const kycHash = "QmKYCDocument1a2b3c4d5e6f7g8h9i0j";
  const kycSize = 2048; // 2KB
  const storageCost = await filecoinStorage.calculateStorageCost(kycSize, await filecoinStorage.DEFAULT_STORAGE_DURATION());
  const totalCost = membershipFee + storageCost;

  console.log(`   KYC IPFS Hash: ${kycHash}`);
  console.log(`   File Size: ${kycSize} bytes`);
  console.log(`   Storage Cost: ${ethers.formatEther(storageCost)} ETH`);
  console.log(`   Total Cost: ${ethers.formatEther(totalCost)} ETH`);

  await lendingDAO.connect(member1).registerMemberWithKYC(kycHash, kycSize, { value: totalCost });
  console.log("✅ Member 1 registered with KYC document stored on Filecoin");

  // Verify KYC storage
  const [kycDocId, kycIPFS] = await lendingDAO.connect(member1).getMemberKYCDocument(member1.address);
  console.log(`   📄 KYC Document ID: ${kycDocId}`);
  console.log(`   🔗 IPFS Hash: ${kycIPFS}`);

  // Register additional members
  await lendingDAO.connect(member2).registerMember({ value: membershipFee });
  await lendingDAO.connect(member3).registerMember({ value: membershipFee });
  console.log("✅ Additional members registered");

  // DEMO: Governance Document Storage
  console.log("\n🏛️  DEMO 2: Governance Document Storage");
  console.log("-".repeat(40));

  const proposalHash = "QmGovernanceProposal9z8y7x6w5v4u3t2s1r";
  const proposalSize = 4096; // 4KB
  const proposalStorageCost = await filecoinStorage.calculateStorageCost(proposalSize, await filecoinStorage.DEFAULT_STORAGE_DURATION());

  console.log(`   Proposal IPFS Hash: ${proposalHash}`);
  console.log(`   File Size: ${proposalSize} bytes`);
  console.log(`   Storage Cost: ${ethers.formatEther(proposalStorageCost)} ETH`);

  const proposalDocId = await lendingDAO.connect(member1).storeGovernanceDocument(
    "Loan Policy Amendment",
    "Proposal to adjust interest rate ranges for better market competitiveness",
    proposalHash,
    proposalSize,
    true, // Public to all members
    { value: proposalStorageCost }
  );

  console.log("✅ Governance document stored on Filecoin");
  console.log(`   📄 Document ID: ${proposalDocId}`);

  // DEMO: Loan Process with Document Storage
  console.log("\n💰 DEMO 3: Loan Process with Automatic Document Storage");
  console.log("-".repeat(40));

  // Fast forward past membership duration
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);

  // Request loan
  const loanAmount = ethers.parseEther("2.0");
  console.log(`💸 Member 1 requesting loan: ${ethers.formatEther(loanAmount)} ETH`);

  const loanTx = await lendingDAO.connect(member1).requestLoan(loanAmount);
  const loanReceipt = await loanTx.wait();

  // Extract proposal ID
  const loanEvent = loanReceipt?.logs.find(log => {
    try {
      const parsed = lendingDAO.interface.parseLog(log);
      return parsed?.name === "LoanRequested";
    } catch {
      return false;
    }
  });

  let proposalId: bigint = 0n;
  if (loanEvent) {
    const parsed = lendingDAO.interface.parseLog(loanEvent);
    proposalId = parsed?.args[0];
    console.log(`✅ Loan proposal created: ID ${proposalId}`);
  }

  // Store proposal documentation
  const loanProposalHash = "QmLoanProposalDoc1a2b3c4d5e6f7g8h9i";
  const loanDocSize = 3072; // 3KB
  const loanDocCost = await filecoinStorage.calculateStorageCost(loanDocSize, await filecoinStorage.DEFAULT_STORAGE_DURATION());

  await lendingDAO.connect(member1).storeProposalDocument(
    proposalId,
    loanProposalHash,
    loanDocSize,
    "Loan Proposal Supporting Documents",
    { value: loanDocCost }
  );

  console.log("✅ Loan proposal documentation stored");
  console.log(`   📄 IPFS Hash: ${loanProposalHash}`);

  // Vote on proposal
  await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]); // Past editing period
  await ethers.provider.send("evm_mine", []);

  console.log("\n🗳️  Voting on loan proposal...");
  await lendingDAO.connect(member2).voteOnLoanProposal(proposalId, true);
  await lendingDAO.connect(member3).voteOnLoanProposal(proposalId, true);
  console.log("✅ Votes cast - loan should be approved");

  // Check if loan agreement was automatically stored
  try {
    const [loanDocId, loanDocHash] = await lendingDAO.getLoanDocument(1); // Loan ID 1
    if (loanDocId > 0) {
      console.log("✅ Loan agreement automatically stored on Filecoin");
      console.log(`   📄 Document ID: ${loanDocId}`);
      console.log(`   🔗 IPFS Hash: ${loanDocHash}`);
    }
  } catch {
    console.log("ℹ️  Auto loan document storage pending (insufficient storage pool)");
  }

  // DEMO: Backup System
  console.log("\n📦 DEMO 4: Automated Backup System");
  console.log("-".repeat(40));

  const manualBackupHash = `QmDAOBackup${Date.now()}`;
  console.log(`📸 Creating manual backup: ${manualBackupHash}`);

  const snapshotId = await lendingDAO.triggerManualBackup(manualBackupHash);
  console.log(`✅ Backup created with snapshot ID: ${snapshotId}`);

  // Get backup details
  const snapshot = await filecoinStorage.getBackupSnapshot(snapshotId);
  console.log("📊 Backup Details:");
  console.log(`   🧱 Block Number: ${snapshot.blockNumber}`);
  console.log(`   ⏰ Timestamp: ${new Date(Number(snapshot.timestamp) * 1000).toLocaleString()}`);
  console.log(`   👥 Members: ${snapshot.memberCount}`);
  console.log(`   📋 Proposals: ${snapshot.proposalCount}`);
  console.log(`   💰 Loans: ${snapshot.loanCount}`);
  console.log(`   💎 Treasury: ${ethers.formatEther(snapshot.treasuryBalance)} ETH`);

  // DEMO: Storage Statistics and Management
  console.log("\n📊 DEMO 5: Storage Statistics and Management");
  console.log("-".repeat(40));

  const storageStats = await lendingDAO.getStorageStatistics();
  const storageOverview = await lendingDAO.getStorageOverview();

  console.log("📈 Storage Statistics:");
  console.log(`   📄 Total Documents: ${storageStats.totalDocuments}`);
  console.log(`   🤝 Storage Deals: ${storageStats.totalDeals}`);
  console.log(`   📦 Backup Snapshots: ${storageStats.totalSnapshots}`);
  console.log(`   💰 Storage Fees: ${ethers.formatEther(storageStats.storageFees)} ETH`);

  console.log("\n⚙️  Storage Configuration:");
  console.log(`   🤖 Auto Storage: ${storageOverview.autoStorageEnabled}`);
  console.log(`   📦 Auto Backup: ${storageOverview.autoBackupEnabled}`);
  console.log(`   ⏰ Last Backup: ${storageOverview.lastBackupTime > 0 ? new Date(Number(storageOverview.lastBackupTime) * 1000).toLocaleString() : 'Never'}`);
  console.log(`   🔔 Needs Backup: ${storageOverview.needsBackup}`);

  // DEMO: Document Retrieval by Category
  console.log("\n📂 DEMO 6: Document Retrieval by Category");
  console.log("-".repeat(40));

  const documentTypes = [
    { type: 0, name: "LOAN_AGREEMENT" },
    { type: 1, name: "MEMBER_KYC" },
    { type: 2, name: "GOVERNANCE_PROPOSAL" },
    { type: 3, name: "TREASURY_RECORD" },
    { type: 4, name: "AUDIT_LOG" }
  ];

  for (const docType of documentTypes) {
    const docs = await filecoinStorage.getDocumentsByType(docType.type);
    console.log(`📁 ${docType.name}: ${docs.length} documents`);
    
    if (docs.length > 0) {
      // Show details of first document
      try {
        const [doc, ipfsHash] = await filecoinStorage.getDocument(docs[0]);
        console.log(`   └─ Latest: "${doc.title}" (${ipfsHash.substring(0, 20)}...)`);
      } catch {
        console.log(`   └─ Document access restricted`);
      }
    }
  }

  // DEMO: Member Document Management
  console.log("\n👤 DEMO 7: Member Document Management");
  console.log("-".repeat(40));

  const member1Docs = await filecoinStorage.getMemberDocuments(member1.address);
  console.log(`📋 Member 1 has ${member1Docs.length} stored documents:`);

  for (let i = 0; i < member1Docs.length; i++) {
    try {
      const [doc, ipfsHash] = await filecoinStorage.connect(member1).getDocument(member1Docs[i]);
      console.log(`   ${i + 1}. ${doc.title}`);
      console.log(`      └─ Type: ${["LOAN_AGREEMENT", "MEMBER_KYC", "GOVERNANCE_PROPOSAL", "TREASURY_RECORD", "AUDIT_LOG", "MEMBER_BACKUP"][doc.docType]}`);
      console.log(`      └─ Size: ${doc.fileSize} bytes`);
      console.log(`      └─ IPFS: ${ipfsHash.substring(0, 30)}...`);
      console.log(`      └─ Encrypted: ${doc.isEncrypted}`);
      console.log(`      └─ Public: ${doc.isPublic}`);
    } catch {
      console.log(`   ${i + 1}. [Access Restricted]`);
    }
  }

  // DEMO: Cost Analysis
  console.log("\n💰 DEMO 8: Storage Cost Analysis");
  console.log("-".repeat(40));

  const fileSizes = [1024, 10240, 102400, 1048576]; // 1KB, 10KB, 100KB, 1MB
  const durations = [30, 90, 365]; // 30 days, 90 days, 1 year

  console.log("📊 Storage Cost Matrix:");
  console.log("Size\\Duration\t30 days\t\t90 days\t\t1 year");
  
  for (const size of fileSizes) {
    let row = `${size >= 1048576 ? (size/1048576).toFixed(1) + 'MB' : 
                 size >= 1024 ? (size/1024).toFixed(0) + 'KB' : 
                 size + 'B'}\t\t`;
    
    for (const duration of durations) {
      const cost = await filecoinStorage.calculateStorageCost(size, duration * 24 * 60 * 60);
      row += `${ethers.formatEther(cost).substring(0, 8)} ETH\t`;
    }
    console.log(row);
  }

  // DEMO: Backup History
  console.log("\n📚 DEMO 9: Backup History");
  console.log("-".repeat(40));

  // Create a few more backups to demonstrate history
  await lendingDAO.triggerManualBackup(`QmBackup1_${Date.now()}`);
  await lendingDAO.triggerManualBackup(`QmBackup2_${Date.now()}`);
  await lendingDAO.triggerManualBackup(`QmBackup3_${Date.now()}`);

  const recentBackups = await filecoinStorage.getRecentBackups(5);
  console.log(`📦 Recent Backups (${recentBackups.length} total):`);

  for (let i = 0; i < recentBackups.length; i++) {
    const backup = recentBackups[i];
    console.log(`   ${i + 1}. Snapshot #${backup.snapshotId}`);
    console.log(`      └─ Time: ${new Date(Number(backup.timestamp) * 1000).toLocaleString()}`);
    console.log(`      └─ Block: ${backup.blockNumber}`);
    console.log(`      └─ Hash: ${backup.snapshotHash.substring(0, 25)}...`);
    console.log(`      └─ Data: ${backup.memberCount} members, ${backup.proposalCount} proposals, ${backup.loanCount} loans`);
  }

  // DEMO: Integration Benefits
  console.log("\n🎯 DEMO 10: Integration Benefits Summary");
  console.log("-".repeat(40));

  const finalStats = await lendingDAO.getStorageStatistics();
  const finalOverview = await lendingDAO.getStorageOverview();

  console.log("🔹 **Data Permanence**: All loan agreements stored immutably on Filecoin");
  console.log("🔹 **Compliance Ready**: Automatic audit trails for regulatory requirements");
  console.log("🔹 **Member Privacy**: KYC documents encrypted and access-controlled");
  console.log("🔹 **Governance Transparency**: Proposal documents publicly accessible to members");
  console.log("🔹 **Disaster Recovery**: Automated backups ensure business continuity");
  console.log("🔹 **Cost Efficient**: Pay-per-use storage model with competitive pricing");

  console.log("\n📊 Final Storage Metrics:");
  console.log(`   📄 Documents Stored: ${finalStats.totalDocuments}`);
  console.log(`   🤝 Active Storage Deals: ${finalStats.totalDeals}`);
  console.log(`   📦 Backup Snapshots: ${finalStats.totalSnapshots}`);
  console.log(`   💰 Storage Fees Collected: ${ethers.formatEther(finalOverview.availableStorageFees)} ETH`);
  console.log(`   🔄 Next Backup Due: ${finalOverview.needsBackup ? 'Yes' : 'No'}`);

  // Show integration with previous features
  console.log("\n🔗 INTEGRATION WITH PREVIOUS FEATURES:");
  console.log("-".repeat(40));
  console.log("✅ ENS + Filecoin: Member subdomains linked to stored KYC documents");
  console.log("✅ Governance + Storage: All proposals backed by immutable documentation");
  console.log("✅ Lending + Audit: Complete loan lifecycle with permanent records");
  console.log("✅ Treasury + Backup: Regular snapshots ensure fund accountability");

  console.log("\n🎉 Filecoin Integration Demo Complete!");
  console.log("=".repeat(60));
  
  return {
    lendingDAO: lendingDAOAddress,
    filecoinStorage: filecoinStorageAddress,
    stats: finalStats
  };
}

main()
  .then((result) => {
    console.log("\n✨ Demo completed successfully!");
    console.log(`📋 Total documents stored: ${result.stats.totalDocuments}`);
    console.log(`🤝 Total storage deals: ${result.stats.totalDeals}`);
    console.log("🚀 Ready for Symbiotic yield generation integration!");
  })
  .catch((error) => {
    console.error("❌ Demo failed:", error);
  });
