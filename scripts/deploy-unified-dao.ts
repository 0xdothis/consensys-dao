import { ethers } from "hardhat";
import { UnifiedLendingDAO } from "../typechain-types";

interface DeploymentConfig {
  membershipFee: string;
  consensusThreshold: number;
  loanPolicy: {
    minMembershipDuration: number;
    membershipContribution: string;
    maxLoanDuration: number;
    minInterestRate: number;
    maxInterestRate: number;
    cooldownPeriod: number;
  };
  initialTreasuryFunding: string;
  admins: string[];
  features: {
    ensVoting: boolean;
    privateVoting: boolean;
    confidentialLoans: boolean;
    documentStorage: boolean;
    restaking: boolean;
    privacyLevel: number;
  };
  operators?: {
    address: string;
    name: string;
    expectedAPY: number;
  }[];
}

// Default configuration for different networks
const DEPLOYMENT_CONFIGS: Record<string, DeploymentConfig> = {
  localhost: {
    membershipFee: "0.1", // 0.1 ETH
    consensusThreshold: 5100, // 51%
    loanPolicy: {
      minMembershipDuration: 30 * 24 * 60 * 60, // 30 days
      membershipContribution: "0.1", // 0.1 ETH
      maxLoanDuration: 90 * 24 * 60 * 60, // 90 days
      minInterestRate: 500, // 5%
      maxInterestRate: 2000, // 20%
      cooldownPeriod: 7 * 24 * 60 * 60, // 7 days
    },
    initialTreasuryFunding: "10", // 10 ETH
    admins: [], // Will be set to deployer
    features: {
      ensVoting: true,
      privateVoting: true,
      confidentialLoans: true,
      documentStorage: true,
      restaking: true,
      privacyLevel: 2,
    },
  },
  goerli: {
    membershipFee: "0.01", // 0.01 ETH
    consensusThreshold: 5100,
    loanPolicy: {
      minMembershipDuration: 7 * 24 * 60 * 60, // 7 days for testnet
      membershipContribution: "0.01",
      maxLoanDuration: 30 * 24 * 60 * 60, // 30 days
      minInterestRate: 800, // 8%
      maxInterestRate: 2500, // 25%
      cooldownPeriod: 3 * 24 * 60 * 60, // 3 days
    },
    initialTreasuryFunding: "1", // 1 ETH
    admins: [], // Will be set to deployer
    features: {
      ensVoting: true,
      privateVoting: false,
      confidentialLoans: false,
      documentStorage: true,
      restaking: false,
      privacyLevel: 1,
    },
  },
  sepolia: {
    membershipFee: "0.01", // 0.01 ETH
    consensusThreshold: 5100,
    loanPolicy: {
      minMembershipDuration: 7 * 24 * 60 * 60, // 7 days for testnet
      membershipContribution: "0.01",
      maxLoanDuration: 30 * 24 * 60 * 60, // 30 days
      minInterestRate: 800, // 8%
      maxInterestRate: 2500, // 25%
      cooldownPeriod: 3 * 24 * 60 * 60, // 3 days
    },
    initialTreasuryFunding: "1", // 1 ETH
    admins: [], // Will be set to deployer
    features: {
      ensVoting: true,
      privateVoting: false,
      confidentialLoans: false,
      documentStorage: true,
      restaking: false,
      privacyLevel: 1,
    },
  },
  mainnet: {
    membershipFee: "0.1", // 0.1 ETH
    consensusThreshold: 6600, // 66% for mainnet security
    loanPolicy: {
      minMembershipDuration: 90 * 24 * 60 * 60, // 90 days
      membershipContribution: "0.1",
      maxLoanDuration: 180 * 24 * 60 * 60, // 180 days
      minInterestRate: 300, // 3%
      maxInterestRate: 1200, // 12%
      cooldownPeriod: 30 * 24 * 60 * 60, // 30 days
    },
    initialTreasuryFunding: "0", // No initial funding on mainnet
    admins: [], // Must be explicitly set for mainnet
    features: {
      ensVoting: false, // Enable manually after launch
      privateVoting: false,
      confidentialLoans: false,
      documentStorage: true,
      restaking: false, // Enable after operator vetting
      privacyLevel: 1,
    },
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;

  console.log("🚀 Deploying UnifiedLendingDAO...");
  console.log("📍 Network:", networkName);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get configuration for the network
  const config = DEPLOYMENT_CONFIGS[networkName] || DEPLOYMENT_CONFIGS.localhost;
  
  // Set deployer as admin if no admins specified
  if (config.admins.length === 0) {
    config.admins = [deployer.address];
  }

  console.log("⚙️  Configuration:");
  console.log("   - Membership Fee:", config.membershipFee, "ETH");
  console.log("   - Consensus Threshold:", config.consensusThreshold / 100, "%");
  console.log("   - Admins:", config.admins);
  console.log("   - Features:", Object.entries(config.features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name)
    .join(", "));

  // Deploy the contract
  console.log("\n📄 Deploying contract...");
  const UnifiedLendingDAO = await ethers.getContractFactory("UnifiedLendingDAO");
  const dao = await UnifiedLendingDAO.deploy();
  await dao.waitForDeployment();

  const daoAddress = await dao.getAddress();
  console.log("✅ UnifiedLendingDAO deployed to:", daoAddress);

  // Initialize the DAO
  console.log("\n🔧 Initializing DAO...");
  const membershipFee = ethers.parseEther(config.membershipFee);
  const loanPolicy = {
    minMembershipDuration: config.loanPolicy.minMembershipDuration,
    membershipContribution: ethers.parseEther(config.loanPolicy.membershipContribution),
    maxLoanDuration: config.loanPolicy.maxLoanDuration,
    minInterestRate: config.loanPolicy.minInterestRate,
    maxInterestRate: config.loanPolicy.maxInterestRate,
    cooldownPeriod: config.loanPolicy.cooldownPeriod,
    maxLoanToTreasuryRatio: 5000, // 50%
  };

  const initTx = await dao.initialize(
    config.admins,
    config.consensusThreshold,
    membershipFee,
    loanPolicy
  );
  await initTx.wait();
  console.log("✅ DAO initialized");

  // Fund the treasury if specified
  if (config.initialTreasuryFunding !== "0") {
    console.log("\n💰 Funding treasury...");
    const fundingAmount = ethers.parseEther(config.initialTreasuryFunding);
    const fundTx = await deployer.sendTransaction({
      to: daoAddress,
      value: fundingAmount,
    });
    await fundTx.wait();
    console.log("✅ Treasury funded with", config.initialTreasuryFunding, "ETH");
  }

  // Configure features
  console.log("\n🎛️  Configuring features...");
  
  // Set privacy level first (auto-enables some features)
  if (config.features.privacyLevel > 1) {
    const privacyTx = await dao.setPrivacyLevel(config.features.privacyLevel);
    await privacyTx.wait();
    console.log("✅ Privacy level set to", config.features.privacyLevel);
  }

  // Enable individual features
  const featureNames = ["ensVoting", "privateVoting", "confidentialLoans", "documentStorage", "restaking"] as const;
  
  for (const feature of featureNames) {
    if (config.features[feature]) {
      const featureTx = await dao.toggleFeature(feature, true);
      await featureTx.wait();
      console.log("✅", feature, "enabled");
    }
  }

  // Setup operators if specified
  if (config.operators && config.operators.length > 0) {
    console.log("\n👥 Setting up operators...");
    for (const operator of config.operators) {
      const operatorTx = await dao.approveOperator(
        operator.address,
        operator.name,
        operator.expectedAPY
      );
      await operatorTx.wait();
      console.log("✅ Operator approved:", operator.name, "at", operator.expectedAPY / 100, "% APY");
    }
  }

  // Display final status
  console.log("\n📊 Final DAO Status:");
  const stats = await dao.getDAOStats();
  console.log("   - Treasury Balance:", ethers.formatEther(stats[0]), "ETH");
  console.log("   - Total Members:", stats[1].toString());
  console.log("   - Active Members:", stats[2].toString());
  console.log("   - ENS Voting:", stats[9]);
  console.log("   - Privacy Features:", stats[7]);
  console.log("   - Restaking:", stats[8]);
  console.log("   - Document Storage:", stats[10]);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    contractAddress: daoAddress,
    deployerAddress: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    config: config,
    stats: {
      treasuryBalance: ethers.formatEther(stats[0]),
      totalMembers: stats[1].toString(),
      features: {
        ensEnabled: stats[9],
        privacyEnabled: stats[7],
        restakingEnabled: stats[8],
        documentsEnabled: stats[10],
      },
    },
  };

  console.log("\n💾 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verification instructions
  if (networkName !== "localhost") {
    console.log("\n🔍 Verification:");
    console.log("Run the following command to verify the contract:");
    console.log(`npx hardhat verify --network ${networkName} ${daoAddress}`);
  }

  return {
    dao,
    address: daoAddress,
    config,
    deploymentInfo,
  };
}

// Helper function for upgrade deployments
export async function upgradeDAO(
  currentAddress: string,
  newConfig?: Partial<DeploymentConfig>
) {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;

  console.log("🔄 Upgrading UnifiedLendingDAO...");
  console.log("📍 Current Address:", currentAddress);

  // Get current DAO instance
  const dao = await ethers.getContractAt("UnifiedLendingDAO", currentAddress);

  // Apply configuration changes if provided
  if (newConfig) {
    console.log("⚙️  Applying configuration updates...");

    if (newConfig.features) {
      if (newConfig.features.privacyLevel !== undefined) {
        const tx = await dao.setPrivacyLevel(newConfig.features.privacyLevel);
        await tx.wait();
        console.log("✅ Privacy level updated to", newConfig.features.privacyLevel);
      }

      const featureNames = ["ensVoting", "privateVoting", "confidentialLoans", "documentStorage", "restaking"] as const;
      for (const feature of featureNames) {
        if (newConfig.features[feature] !== undefined) {
          const tx = await dao.toggleFeature(feature, newConfig.features[feature]);
          await tx.wait();
          console.log("✅", feature, newConfig.features[feature] ? "enabled" : "disabled");
        }
      }
    }

    if (newConfig.operators) {
      console.log("👥 Adding new operators...");
      for (const operator of newConfig.operators) {
        try {
          const tx = await dao.approveOperator(
            operator.address,
            operator.name,
            operator.expectedAPY
          );
          await tx.wait();
          console.log("✅ Operator approved:", operator.name);
        } catch (error) {
          console.log("⚠️  Operator may already be approved:", operator.name);
        }
      }
    }
  }

  const stats = await dao.getDAOStats();
  console.log("\n📊 Updated DAO Status:");
  console.log("   - Treasury Balance:", ethers.formatEther(stats[0]), "ETH");
  console.log("   - Total Members:", stats[1].toString());
  console.log("   - ENS Voting:", stats[9]);
  console.log("   - Privacy Features:", stats[7]);
  console.log("   - Restaking:", stats[8]);

  return dao;
}

// Helper function to setup test environment
export async function setupTestEnvironment(dao: UnifiedLendingDAO) {
  const [deployer, ...accounts] = await ethers.getSigners();
  
  console.log("\n🧪 Setting up test environment...");
  
  // Register test members
  const membershipFee = await dao.membershipFee();
  const testMembers = accounts.slice(0, 3);
  
  for (let i = 0; i < testMembers.length; i++) {
    const member = testMembers[i];
    const ensName = i === 0 ? "alice.eth" : i === 1 ? "bob.eth" : "";
    const kycHash = `QmTestKYC${i + 1}`;
    
    try {
      const tx = await dao.connect(member).registerMember(ensName, kycHash, { value: membershipFee });
      await tx.wait();
      console.log(`✅ Test member ${i + 1} registered:`, member.address);
    } catch (error) {
      console.log(`⚠️  Member ${i + 1} may already be registered`);
    }
  }

  // Setup test operators if restaking is enabled
  const stats = await dao.getDAOStats();
  if (stats[8]) { // restakingActive is at index 8
    console.log("🔧 Setting up test operators...");
    const operators = accounts.slice(3, 5);
    
    for (let i = 0; i < operators.length; i++) {
      const operator = operators[i];
      const name = `Test Operator ${i + 1}`;
      const apy = 1000 + (i * 200); // 10%, 12%
      
      try {
        const tx = await dao.approveOperator(operator.address, name, apy);
        await tx.wait();
        console.log(`✅ Test operator ${i + 1} approved:`, name);
      } catch (error) {
        console.log(`⚠️  Operator ${i + 1} may already be approved`);
      }
    }
  }

  console.log("✅ Test environment setup complete");
  
  return {
    testMembers,
    membershipFee,
  };
}

// Main deployment function
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

export { main as deployUnifiedDAO, DEPLOYMENT_CONFIGS };
