import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";

const LendingDAOModule = buildModule("LendingDAOModule", (m) => {
  // Parameters for DAO initialization
  const membershipFee = m.getParameter("membershipFee", parseEther("1")); // 1 ETH membership fee
  const consensusThreshold = m.getParameter("consensusThreshold", 5100); // 51%
  
  // Initial admin addresses (you can modify these)
  const initialAdmins = m.getParameter("initialAdmins", [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Default Hardhat account
  ]);

  // Loan policy parameters
  const loanPolicy = {
    minMembershipDuration: m.getParameter("minMembershipDuration", 30 * 24 * 60 * 60), // 30 days
    membershipContribution: membershipFee,
    maxLoanDuration: m.getParameter("maxLoanDuration", 365 * 24 * 60 * 60), // 1 year
    minInterestRate: m.getParameter("minInterestRate", 500), // 5% (500 basis points)
    maxInterestRate: m.getParameter("maxInterestRate", 2000), // 20% (2000 basis points)
    cooldownPeriod: m.getParameter("cooldownPeriod", 90 * 24 * 60 * 60), // 90 days
    maxLoanToTreasuryRatio: m.getParameter("maxLoanToTreasuryRatio", 5000), // 50%
  };

  // Deploy the DAO contract
  const lendingDAO = m.contract("LendingDAO", []);

  // Initialize the DAO
  m.call(lendingDAO, "initialize", [
    initialAdmins,
    consensusThreshold,
    membershipFee,
    loanPolicy,
  ]);

  return { lendingDAO };
});

export default LendingDAOModule;
