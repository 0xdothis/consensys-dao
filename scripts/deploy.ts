import { ethers } from "hardhat";

async function main() {
  const [deployer, admin1, admin2] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy the DAO contract
  const LendingDAO = await ethers.getContractFactory("LendingDAO");
  const dao = await LendingDAO.deploy();

  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();

  console.log("LendingDAO deployed to:", daoAddress);

  // Initialize the DAO with sample configuration
  const membershipFee = ethers.parseEther("1"); // 1 ETH
  const consensusThreshold = 5100; // 51%
  
  const loanPolicy = {
    minMembershipDuration: 30 * 24 * 60 * 60, // 30 days
    membershipContribution: membershipFee,
    maxLoanDuration: 365 * 24 * 60 * 60, // 1 year
    minInterestRate: 500, // 5%
    maxInterestRate: 2000, // 20%
    cooldownPeriod: 90 * 24 * 60 * 60, // 90 days
    maxLoanToTreasuryRatio: 5000, // 50%
  };

  console.log("Initializing DAO...");
  const initTx = await dao.initialize(
    [admin1.address, admin2.address],
    consensusThreshold,
    membershipFee,
    loanPolicy
  );

  await initTx.wait();
  console.log("DAO initialized successfully!");

  // Add some initial funds to the treasury
  console.log("Adding initial funds to treasury...");
  const fundTx = await deployer.sendTransaction({
    to: daoAddress,
    value: ethers.parseEther("10")
  });
  await fundTx.wait();

  const treasuryBalance = await dao.getTreasuryBalance();
  console.log("Treasury balance:", ethers.formatEther(treasuryBalance), "ETH");

  console.log("\n=== DAO Deployment Summary ===");
  console.log("Contract Address:", daoAddress);
  console.log("Membership Fee:", ethers.formatEther(membershipFee), "ETH (direct registration)");
  console.log("Consensus Threshold:", consensusThreshold / 100, "%");
  console.log("Proposal Editing Period: 3 days");
  console.log("Voting Period: 7 days");
  console.log("Initial Admins:", [admin1.address, admin2.address]);
  console.log("Treasury Balance:", ethers.formatEther(treasuryBalance), "ETH");
  console.log("\n📝 Note: Users can now register directly by calling registerMember() with the membership fee.");
  console.log("📝 Loan proposals have a 3-day editing period followed by a 7-day voting period.");
  console.log("===============================");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
