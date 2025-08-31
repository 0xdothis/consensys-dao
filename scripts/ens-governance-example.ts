import { ethers } from "hardhat";

async function main() {
  console.log("🌐 ENS Governance Feature Demo");
  console.log("=" .repeat(50));

  // Get signers
  const [deployer, admin, member1, member2, member3] = await ethers.getSigners();
  
  // Connect to deployed contracts (replace with actual addresses)
  const lendingDAOAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // From deployment
  const lendingDAO = await ethers.getContractAt("LendingDAOWithENS", lendingDAOAddress);
  
  const ensGovernanceAddress = await lendingDAO.ensGovernance();
  const ensGovernance = await ethers.getContractAt("ENSGovernance", ensGovernanceAddress);

  console.log(`\n📋 LendingDAO: ${lendingDAOAddress}`);
  console.log(`🌐 ENSGovernance: ${ensGovernanceAddress}`);

  // Step 1: Register members
  console.log("\n👥 STEP 1: Registering DAO Members");
  const membershipFee = ethers.parseEther("0.1");
  
  try {
    await lendingDAO.connect(member1).registerMember({ value: membershipFee });
    console.log("✅ Member 1 registered:", member1.address);
  } catch (e) {
    console.log("ℹ️  Member 1 already registered");
  }

  try {
    await lendingDAO.connect(member2).registerMember({ value: membershipFee });
    console.log("✅ Member 2 registered:", member2.address);
  } catch (e) {
    console.log("ℹ️  Member 2 already registered");
  }

  try {
    await lendingDAO.connect(member3).registerMember({ value: membershipFee });
    console.log("✅ Member 3 registered:", member3.address);
  } catch (e) {
    console.log("ℹ️  Member 3 already registered");
  }

  // Step 2: Enable ENS voting
  console.log("\n🗳️  STEP 2: Enabling ENS-Weighted Voting");
  await lendingDAO.setENSVotingEnabled(true);
  console.log("✅ ENS-weighted voting enabled");

  // Step 3: Demonstrate subdomain purchase
  console.log("\n🏷️  STEP 3: Member Subdomain Purchase");
  try {
    const subdomainPrice = await ensGovernance.subdomainPrice();
    await lendingDAO.connect(member1).purchaseSubdomain("alice", { value: subdomainPrice });
    console.log("✅ Member 1 purchased subdomain: alice.lendingdao.eth");
    
    // Check member's governance profile
    const profile1 = await lendingDAO.getMemberGovernanceProfile(member1.address);
    console.log(`   └─ Voting weight: ${profile1.votingWeight}`);
    console.log(`   └─ ENS verified: ${profile1.ensData.isENSVerified}`);
    console.log(`   └─ ENS name: ${profile1.ensData.ensName || "None"}`);
  } catch (e) {
    console.log("ℹ️  Subdomain purchase failed (expected without proper ENS setup)");
  }

  // Step 4: Create and vote on proposal
  console.log("\n📝 STEP 4: Creating and Voting on Loan Proposal");
  
  // Fast forward past membership duration
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);

  // Member 1 requests a loan
  const loanAmount = ethers.parseEther("1.0");
  console.log(`💰 Member 1 requesting loan of ${ethers.formatEther(loanAmount)} ETH`);
  
  const tx = await lendingDAO.connect(member1).requestLoan(loanAmount);
  const receipt = await tx.wait();
  
  // Extract proposal ID
  const loanRequestEvent = receipt?.logs.find(log => {
    try {
      const parsed = lendingDAO.interface.parseLog(log);
      return parsed?.name === "LoanRequested";
    } catch {
      return false;
    }
  });
  
  if (!loanRequestEvent) {
    console.log("❌ Could not find loan request event");
    return;
  }
  
  const parsedEvent = lendingDAO.interface.parseLog(loanRequestEvent);
  const proposalId = parsedEvent?.args[0];
  console.log(`✅ Loan proposal created with ID: ${proposalId}`);

  // Fast forward past editing period
  await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);

  // Members vote on the proposal
  console.log("\n🗳️  Voting on loan proposal:");
  
  await lendingDAO.connect(member2).voteOnLoanProposal(proposalId, true);
  console.log("✅ Member 2 voted in favor");
  
  await lendingDAO.connect(member3).voteOnLoanProposal(proposalId, true);
  console.log("✅ Member 3 voted in favor");

  // Check voting details
  const votingDetails = await lendingDAO.getProposalVotingDetails(proposalId);
  console.log(`\n📊 Voting Results:`);
  console.log(`   Total votes cast: ${votingDetails.votes.length}`);
  console.log(`   Total voting weight: ${votingDetails.totalWeight}`);
  console.log(`   Weighted votes FOR: ${votingDetails.weightedForVotes}`);
  console.log(`   Weighted votes AGAINST: ${votingDetails.weightedAgainstVotes}`);

  // Display individual votes
  console.log(`\n📋 Individual Votes:`);
  for (let i = 0; i < votingDetails.votes.length; i++) {
    const vote = votingDetails.votes[i];
    console.log(`   ${i + 1}. ${vote.voter}`);
    console.log(`      └─ Support: ${vote.support}`);
    console.log(`      └─ Weight: ${vote.weight}`);
    console.log(`      └─ ENS: ${vote.ensName || "None"}`);
  }

  // Check proposal status
  const proposal = await lendingDAO.getProposal(proposalId);
  console.log(`\n🏛️  Proposal Status:`);
  console.log(`   Status: ${["PENDING", "APPROVED", "REJECTED", "EXECUTED"][proposal.status]}`);
  console.log(`   For votes: ${proposal.forVotes}`);
  console.log(`   Against votes: ${proposal.againstVotes}`);

  // Step 5: Display governance profiles
  console.log("\n👤 STEP 5: Member Governance Profiles");
  
  const members = [member1, member2, member3];
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const profile = await lendingDAO.getMemberGovernanceProfile(member.address);
    
    console.log(`\n🧑‍💼 Member ${i + 1} (${member.address}):`);
    console.log(`   └─ Member since: ${new Date(Number(profile.member.joinDate) * 1000).toLocaleDateString()}`);
    console.log(`   └─ Contribution: ${ethers.formatEther(profile.member.contributionAmount)} ETH`);
    console.log(`   └─ Active loan: ${profile.member.hasActiveLoan}`);
    console.log(`   └─ Voting weight: ${profile.votingWeight}`);
    console.log(`   └─ ENS verified: ${profile.ensData.isENSVerified}`);
    console.log(`   └─ ENS name: ${profile.ensData.ensName || "None"}`);
  }

  // Step 6: Treasury information
  console.log("\n💰 STEP 6: Treasury Status");
  const treasuryBalance = await lendingDAO.getTreasuryBalance();
  const totalMembers = await lendingDAO.getTotalMembers();
  const activeMembers = await lendingDAO.getActiveMembers();
  
  console.log(`Treasury balance: ${ethers.formatEther(treasuryBalance)} ETH`);
  console.log(`Total members: ${totalMembers}`);
  console.log(`Active members: ${activeMembers}`);

  console.log("\n🎉 ENS Governance Demo Complete!");
  console.log("=" .repeat(50));
}

main()
  .then(() => {
    console.log("\n✨ Demo completed successfully!");
  })
  .catch((error) => {
    console.error("❌ Demo failed:", error);
  });
