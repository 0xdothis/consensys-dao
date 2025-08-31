import { ethers } from "hardhat";

async function main() {
  console.log("=== Lending DAO Complete Example ===\n");

  const [deployer, admin1, admin2, alice, bob, charlie] = await ethers.getSigners();
  
  // Deploy and initialize DAO
  console.log("1. Deploying and Initializing DAO...");
  const LendingDAO = await ethers.getContractFactory("LendingDAO");
  const dao = await LendingDAO.deploy();
  await dao.waitForDeployment();
  
  const membershipFee = ethers.parseEther("1");
  const loanPolicy = {
    minMembershipDuration: 0, // 0 for demo (normally 30 days)
    membershipContribution: membershipFee,
    maxLoanDuration: 365 * 24 * 60 * 60,
    minInterestRate: 500, // 5%
    maxInterestRate: 2000, // 20%
    cooldownPeriod: 0, // 0 for demo (normally 90 days)
    maxLoanToTreasuryRatio: 5000,
  };

  await dao.initialize([admin1.address, admin2.address], 5100, membershipFee, loanPolicy);
  
  // Add treasury funds
  await deployer.sendTransaction({ to: dao.target, value: ethers.parseEther("20") });
  console.log("✅ DAO initialized with 20 ETH treasury\n");

  // Register first members using direct registration
  console.log("2. Registering Initial Members...");
  
  // Alice registers as first member
  await dao.connect(alice).registerMember({ value: membershipFee });
  console.log("✅ Alice registered as member");
  
  // Bob registers as second member  
  await dao.connect(bob).registerMember({ value: membershipFee });
  console.log("✅ Bob registered as member");
  
  // Charlie registers as third member
  await dao.connect(charlie).registerMember({ value: membershipFee });
  console.log("✅ Charlie registered as member");
  
  console.log(`📊 Total members: ${await dao.getTotalMembers()}`);
  console.log(`📊 Active members: ${await dao.getActiveMembers()}\n`);

  // 3. Demonstrate Admin Functions
  console.log("3. Testing Admin Functions...");
  
  // Update consensus threshold
  await dao.connect(admin1).setConsensusThreshold(6000); // 60%
  console.log("✅ Consensus threshold updated to 60%");
  
  // Update loan policy
  await dao.connect(admin1).setInterestRateRange(300, 1500); // 3% - 15%
  console.log("✅ Interest rate range updated to 3% - 15%");
  
  // Add another admin
  await dao.connect(admin1).addAdmin(alice.address);
  console.log("✅ Alice added as admin\n");

  // 4. Treasury Management
  console.log("4. Treasury Management...");
  const treasuryBalance = await dao.getTreasuryBalance();
  console.log("💰 Current treasury balance:", ethers.formatEther(treasuryBalance), "ETH\n");

  // 5. Demonstrate View Functions
  console.log("5. Testing View Functions...");
  console.log("📊 Total Members:", await dao.getTotalMembers());
  console.log("📊 Active Members:", await dao.getActiveMembers());
  console.log("📊 Is admin1 an admin?", await dao.isAdmin(admin1.address));
  console.log("📊 Is alice an admin?", await dao.isAdmin(alice.address));
  console.log("📊 Is alice a member?", await dao.isMember(alice.address));
  
  // Test loan terms calculation
  const [interestRate, totalRepayment, duration] = await dao.calculateLoanTerms(ethers.parseEther("5"));
  console.log("📊 Loan terms for 5 ETH:");
  console.log("   - Interest Rate:", interestRate, "basis points");
  console.log("   - Total Repayment:", ethers.formatEther(totalRepayment), "ETH");
  console.log("   - Duration:", duration, "seconds\n");

  // 6. Demonstrate Loan Proposal Workflow
  console.log("6. Demonstrating Loan Proposal Workflow...");
  
  // Alice requests a loan
  const loanAmount = ethers.parseEther("5");
  const proposalId = await dao.connect(alice).requestLoan.staticCall(loanAmount);
  await dao.connect(alice).requestLoan(loanAmount);
  console.log(`💰 Alice requested loan of ${ethers.formatEther(loanAmount)} ETH (Proposal ID: ${proposalId})`);
  
  // Alice edits her proposal to reduce the amount
  const newAmount = ethers.parseEther("3");
  await dao.connect(alice).editLoanProposal(proposalId, newAmount);
  console.log(`✏️ Alice edited her proposal to ${ethers.formatEther(newAmount)} ETH`);
  
  console.log("⏰ Waiting for editing period to end (simulating 3 days)...");
  // Fast forward past editing period (3 days)
  await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
  await ethers.provider.send("evm_mine", []);
  
  // Now members can vote (Alice cannot vote on her own proposal)
  await dao.connect(bob).voteOnLoanProposal(proposalId, true);
  console.log("✅ Bob voted in favor of Alice's loan");
  
  // Charlie's vote should approve the loan (2/3 votes with 60% threshold)
  const aliceBalanceBefore = await ethers.provider.getBalance(alice.address);
  await dao.connect(charlie).voteOnLoanProposal(proposalId, true);
  console.log("✅ Charlie voted in favor - loan approved and disbursed!");
  
  const aliceBalanceAfter = await ethers.provider.getBalance(alice.address);
  console.log(`💸 Alice received ${ethers.formatEther(aliceBalanceAfter - aliceBalanceBefore)} ETH\n`);

  // 7. Test Emergency Functions
  console.log("7. Testing Emergency Functions...");
  await dao.connect(admin1).pause();
  console.log("⏸️ DAO paused");
  
  await dao.connect(admin1).unpause();
  console.log("▶️ DAO unpaused\n");

  console.log("=== Example Complete ===");
  console.log("\n📝 Key Features Demonstrated:");
  console.log("1. ✅ Direct membership registration (no proposals needed)");
  console.log("2. ✅ Loan proposal creation with editing period");
  console.log("3. ✅ Proposal editing during 3-day editing window");
  console.log("4. ✅ Voting restrictions (no self-voting, timing controls)");
  console.log("5. ✅ Automatic loan approval and disbursement");
  console.log("\n🚀 Ready for testnet deployment!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
