import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying LendingDAO with ENS Governance Integration...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy LendingDAO with ENS
  console.log("\n📋 Deploying LendingDAOWithENS...");
  const LendingDAOFactory = await ethers.getContractFactory("LendingDAOWithENS");
  const lendingDAO = await LendingDAOFactory.deploy();
  await lendingDAO.waitForDeployment();

  const lendingDAOAddress = await lendingDAO.getAddress();
  console.log("✅ LendingDAOWithENS deployed to:", lendingDAOAddress);

  // Get ENS Governance contract address
  const ensGovernanceAddress = await lendingDAO.ensGovernance();
  console.log("✅ ENSGovernance deployed to:", ensGovernanceAddress);

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
    "" // ENS domain - can be set later via configureDAOENS
  );

  console.log("✅ DAO initialized successfully!");

  // Configure ENS settings
  console.log("\n🌐 Configuring ENS settings...");
  
  // Set subdomain price through DAO
  await lendingDAO.setSubdomainPrice(ethers.parseEther("0.01"));
  console.log("✅ Subdomain price set to 0.01 ETH");

  // Reserve important subdomains through DAO
  await lendingDAO.reserveSubdomains([
    "admin",
    "treasury", 
    "governance",
    "dao",
    "voting",
    "proposals"
  ]);
  console.log("✅ Reserved important subdomains");

  // Add some initial treasury funds
  console.log("\n💰 Adding initial treasury funds...");
  await deployer.sendTransaction({
    to: lendingDAOAddress,
    value: ethers.parseEther("5.0")
  });
  console.log("✅ Added 5 ETH to treasury");

  // Display deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log(`📋 LendingDAOWithENS: ${lendingDAOAddress}`);
  console.log(`🌐 ENSGovernance: ${ensGovernanceAddress}`);
  console.log(`👤 Admin: ${deployer.address}`);
  console.log(`💰 Membership Fee: ${ethers.formatEther(membershipFee)} ETH`);
  console.log(`📊 Consensus Threshold: ${consensusThreshold / 100}%`);
  console.log(`💎 Treasury Balance: ${ethers.formatEther(await lendingDAO.getTreasuryBalance())} ETH`);
  console.log("=".repeat(60));

  console.log("\n📖 NEXT STEPS:");
  console.log("1. Configure DAO ENS domain: lendingDAO.configureDAOENS('your-domain.eth', resolverAddress)");
  console.log("2. Enable ENS voting: lendingDAO.setENSVotingEnabled(true)");
  console.log("3. Members can link ENS: lendingDAO.linkMemberENS('member.eth')");
  console.log("4. Members can buy subdomains: lendingDAO.purchaseSubdomain('username')");

  console.log("\n🔗 CONTRACT INTERACTIONS:");
  console.log("- Register as member: lendingDAO.registerMember() with 0.1 ETH");
  console.log("- Request loan: lendingDAO.requestLoan(amount)");
  console.log("- Vote on proposals: lendingDAO.voteOnLoanProposal(id, support)");
  console.log("- View governance profile: lendingDAO.getMemberGovernanceProfile(address)");

  return {
    lendingDAO: lendingDAOAddress,
    ensGovernance: ensGovernanceAddress
  };
}

main()
  .then((contracts) => {
    console.log("\n✨ Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
