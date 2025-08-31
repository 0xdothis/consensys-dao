import { ethers } from "hardhat";
import { UnifiedLendingDAO } from "../typechain-types";

interface ConfigurationOptions {
  // Feature toggles
  features?: {
    ensVoting?: boolean;
    privateVoting?: boolean;
    confidentialLoans?: boolean;
    documentStorage?: boolean;
    restaking?: boolean;
    privacyLevel?: number;
  };
  
  // Governance settings
  governance?: {
    consensusThreshold?: number;
    membershipFee?: string;
  };
  
  // Loan policy updates
  loanPolicy?: {
    minMembershipDuration?: number;
    maxLoanDuration?: number;
    minInterestRate?: number;
    maxInterestRate?: number;
    cooldownPeriod?: number;
  };
  
  // Operator management
  operators?: {
    add?: Array<{
      address: string;
      name: string;
      expectedAPY: number;
    }>;
    remove?: string[]; // Not implemented in current contract
  };
  
  // Treasury operations
  treasury?: {
    allocateToRestaking?: string;
    distributeYield?: string;
  };
  
  // Admin management
  admins?: {
    add?: string[];
    remove?: string[];
  };
}

export class DAOConfigurator {
  private dao: UnifiedLendingDAO;
  private signer: any;

  constructor(dao: UnifiedLendingDAO, signer: any) {
    this.dao = dao;
    this.signer = signer;
  }

  async getCurrentConfiguration() {
    console.log("📊 Fetching current DAO configuration...");
    
    const stats = await this.dao.getDAOStats();
    const loanPolicy = await this.dao.getLoanPolicy();
    
    const config = {
      basic: {
        initialized: await this.dao.initialized(),
        consensusThreshold: await this.dao.consensusThreshold(),
        membershipFee: ethers.formatEther(await this.dao.membershipFee()),
        totalMembers: stats.totalMembers.toString(),
        activeMembers: stats.activeMembers.toString(),
        treasuryBalance: ethers.formatEther(stats.treasuryBalance),
      },
      features: {
        ensVoting: stats.ensEnabled,
        privateVoting: await this.dao.privateVotingEnabled(),
        confidentialLoans: await this.dao.confidentialLoansEnabled(),
        documentStorage: stats.documentsEnabled,
        restaking: stats.restakingEnabled,
        privacyLevel: await this.dao.privacyLevel(),
      },
      loanPolicy: {
        minMembershipDuration: loanPolicy.minMembershipDuration.toString(),
        maxLoanDuration: loanPolicy.maxLoanDuration.toString(),
        minInterestRate: loanPolicy.minInterestRate.toString(),
        maxInterestRate: loanPolicy.maxInterestRate.toString(),
        cooldownPeriod: loanPolicy.cooldownPeriod.toString(),
      },
      restaking: {
        totalYieldGenerated: ethers.formatEther(stats.totalYield),
        totalRestaked: ethers.formatEther(stats.totalRestaked),
        yieldDistributionShares: (await this.dao.yieldDistributionShares()).toString(),
      },
    };

    return config;
  }

  async applyConfiguration(options: ConfigurationOptions) {
    console.log("🔧 Applying DAO configuration changes...");
    
    // Check admin permissions
    const isAdmin = await this.dao.isAdmin(await this.signer.getAddress());
    if (!isAdmin) {
      throw new Error("❌ Signer is not an admin of the DAO");
    }

    const results: string[] = [];

    // Apply feature changes
    if (options.features) {
      results.push(...await this.configureFeatures(options.features));
    }

    // Apply governance changes
    if (options.governance) {
      results.push(...await this.configureGovernance(options.governance));
    }

    // Apply loan policy changes
    if (options.loanPolicy) {
      results.push(...await this.configureLoanPolicy(options.loanPolicy));
    }

    // Apply operator changes
    if (options.operators) {
      results.push(...await this.configureOperators(options.operators));
    }

    // Apply treasury operations
    if (options.treasury) {
      results.push(...await this.configureTreasury(options.treasury));
    }

    // Apply admin changes
    if (options.admins) {
      results.push(...await this.configureAdmins(options.admins));
    }

    console.log("\n✅ Configuration applied successfully:");
    results.forEach(result => console.log("   -", result));

    return results;
  }

  private async configureFeatures(features: NonNullable<ConfigurationOptions['features']>) {
    const results: string[] = [];

    // Set privacy level first (may auto-enable other features)
    if (features.privacyLevel !== undefined) {
      const tx = await this.dao.connect(this.signer).setPrivacyLevel(features.privacyLevel);
      await tx.wait();
      results.push(`Privacy level set to ${features.privacyLevel}`);
    }

    // Configure individual features
    const featureMapping: Array<[keyof typeof features, string]> = [
      ['ensVoting', 'ensVoting'],
      ['privateVoting', 'privateVoting'],
      ['confidentialLoans', 'confidentialLoans'],
      ['documentStorage', 'documentStorage'],
      ['restaking', 'restaking'],
    ];

    for (const [key, contractFeature] of featureMapping) {
      if (features[key] !== undefined) {
        const tx = await this.dao.connect(this.signer).toggleFeature(contractFeature, features[key]!);
        await tx.wait();
        results.push(`${contractFeature} ${features[key] ? 'enabled' : 'disabled'}`);
      }
    }

    return results;
  }

  private async configureGovernance(governance: NonNullable<ConfigurationOptions['governance']>) {
    const results: string[] = [];

    if (governance.consensusThreshold !== undefined) {
      const tx = await this.dao.connect(this.signer).setConsensusThreshold(governance.consensusThreshold);
      await tx.wait();
      results.push(`Consensus threshold set to ${governance.consensusThreshold / 100}%`);
    }

    // Note: membershipFee cannot be changed after initialization in current contract
    if (governance.membershipFee !== undefined) {
      results.push("⚠️  Membership fee cannot be changed after initialization");
    }

    return results;
  }

  private async configureLoanPolicy(loanPolicy: NonNullable<ConfigurationOptions['loanPolicy']>) {
    const results: string[] = [];

    if (loanPolicy.minMembershipDuration !== undefined) {
      const tx = await this.dao.connect(this.signer).setMinMembershipDuration(loanPolicy.minMembershipDuration);
      await tx.wait();
      results.push(`Min membership duration set to ${loanPolicy.minMembershipDuration / (24 * 60 * 60)} days`);
    }

    if (loanPolicy.maxLoanDuration !== undefined) {
      const tx = await this.dao.connect(this.signer).setMaxLoanDuration(loanPolicy.maxLoanDuration);
      await tx.wait();
      results.push(`Max loan duration set to ${loanPolicy.maxLoanDuration / (24 * 60 * 60)} days`);
    }

    if (loanPolicy.minInterestRate !== undefined && loanPolicy.maxInterestRate !== undefined) {
      const tx = await this.dao.connect(this.signer).setInterestRateRange(
        loanPolicy.minInterestRate,
        loanPolicy.maxInterestRate
      );
      await tx.wait();
      results.push(`Interest rate range set to ${loanPolicy.minInterestRate / 100}% - ${loanPolicy.maxInterestRate / 100}%`);
    }

    if (loanPolicy.cooldownPeriod !== undefined) {
      const tx = await this.dao.connect(this.signer).setCooldownPeriod(loanPolicy.cooldownPeriod);
      await tx.wait();
      results.push(`Cooldown period set to ${loanPolicy.cooldownPeriod / (24 * 60 * 60)} days`);
    }

    return results;
  }

  private async configureOperators(operators: NonNullable<ConfigurationOptions['operators']>) {
    const results: string[] = [];

    if (operators.add) {
      for (const operator of operators.add) {
        try {
          const tx = await this.dao.connect(this.signer).approveOperator(
            operator.address,
            operator.name,
            operator.expectedAPY
          );
          await tx.wait();
          results.push(`Operator approved: ${operator.name} (${operator.expectedAPY / 100}% APY)`);
        } catch (error: any) {
          if (error.message.includes("Already approved")) {
            results.push(`⚠️  Operator ${operator.name} already approved`);
          } else {
            throw error;
          }
        }
      }
    }

    if (operators.remove) {
      results.push("⚠️  Operator removal not implemented in current contract version");
    }

    return results;
  }

  private async configureTreasury(treasury: NonNullable<ConfigurationOptions['treasury']>) {
    const results: string[] = [];

    if (treasury.allocateToRestaking) {
      const amount = ethers.parseEther(treasury.allocateToRestaking);
      const tx = await this.dao.connect(this.signer).allocateToRestaking(amount);
      await tx.wait();
      results.push(`Allocated ${treasury.allocateToRestaking} ETH to restaking`);
    }

    if (treasury.distributeYield) {
      const amount = ethers.parseEther(treasury.distributeYield);
      const tx = await this.dao.connect(this.signer).distributeYield(amount);
      await tx.wait();
      results.push(`Distributed ${treasury.distributeYield} ETH as yield`);
    }

    return results;
  }

  private async configureAdmins(admins: NonNullable<ConfigurationOptions['admins']>) {
    const results: string[] = [];

    if (admins.add) {
      for (const admin of admins.add) {
        const tx = await this.dao.connect(this.signer).addAdmin(admin);
        await tx.wait();
        results.push(`Admin added: ${admin}`);
      }
    }

    if (admins.remove) {
      for (const admin of admins.remove) {
        const tx = await this.dao.connect(this.signer).removeAdmin(admin);
        await tx.wait();
        results.push(`Admin removed: ${admin}`);
      }
    }

    return results;
  }

  async getOperatorsInfo() {
    console.log("👥 Fetching operators information...");
    const operators = await this.dao.getAllOperators();
    
    console.log(`Found ${operators.length} operators:`);
    operators.forEach((op, index) => {
      console.log(`   ${index + 1}. ${op.name}`);
      console.log(`      Address: ${op.operatorAddress}`);
      console.log(`      Expected APY: ${Number(op.expectedAPY) / 100}%`);
      console.log(`      Total Staked: ${ethers.formatEther(op.totalStaked)} ETH`);
      console.log(`      Status: ${op.isApproved ? 'Approved' : 'Pending'}`);
    });

    return operators;
  }

  async getMembersInfo(limit: number = 10) {
    console.log("👤 Fetching members information...");
    const memberAddresses = await this.dao.getMemberAddresses();
    const totalMembers = memberAddresses.length;
    
    console.log(`Found ${totalMembers} members (showing first ${Math.min(limit, totalMembers)}):`);
    
    for (let i = 0; i < Math.min(limit, totalMembers); i++) {
      const address = memberAddresses[i];
      const profile = await this.dao.getMemberProfile(address);
      
      console.log(`   ${i + 1}. ${address}`);
      console.log(`      ENS: ${profile.ensName || 'None'}`);
      console.log(`      Voting Weight: ${profile.votingWeight}`);
      console.log(`      Join Date: ${new Date(Number(profile.memberData.joinDate) * 1000).toISOString()}`);
      console.log(`      Pending Rewards: ${ethers.formatEther(profile.pendingRewards)} ETH`);
      console.log(`      Pending Yield: ${ethers.formatEther(profile.pendingYield)} ETH`);
      console.log(`      Has Active Loan: ${profile.memberData.hasActiveLoan}`);
      
      if (i < Math.min(limit, totalMembers) - 1) console.log();
    }

    if (totalMembers > limit) {
      console.log(`   ... and ${totalMembers - limit} more members`);
    }

    return memberAddresses.slice(0, limit);
  }

  async getProposalsInfo(limit: number = 10) {
    console.log("📋 Fetching proposals information...");
    const [proposalIds, hasMore] = await this.dao.getProposals(0, limit, false);
    
    console.log(`Found ${proposalIds.length} proposals (${hasMore ? 'showing first ' + limit : 'all'}):`);
    
    for (let i = 0; i < proposalIds.length; i++) {
      const proposalId = proposalIds[i];
      const enhanced = await this.dao.getEnhancedProposal(proposalId);
      
      const typeNames = ['Loan', 'Treasury Withdrawal'];
      const statusNames = ['Pending', 'Approved', 'Rejected', 'Executed'];
      
      console.log(`   ${i + 1}. Proposal #${proposalId}`);
      console.log(`      Type: ${typeNames[Number(enhanced.proposalType)]}`);
      console.log(`      Status: ${statusNames[Number(enhanced.status)]}`);
      console.log(`      Proposer: ${enhanced.proposer}`);
      console.log(`      Votes: ${enhanced.forVotes} for, ${enhanced.againstVotes} against`);
      console.log(`      Created: ${new Date(Number(enhanced.createdAt) * 1000).toISOString()}`);
      console.log(`      Private: ${enhanced.isPrivate}`);
      if (enhanced.documentHash) {
        console.log(`      Document: ${enhanced.documentHash}`);
      }
      
      if (i < proposalIds.length - 1) console.log();
    }

    return proposalIds;
  }

  async performHealthCheck() {
    console.log("🏥 Performing DAO health check...");
    
    const stats = await this.dao.getDAOStats();
    const loanPolicy = await this.dao.getLoanPolicy();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check treasury health
    const treasuryBalance = Number(ethers.formatEther(stats.treasuryBalance));
    const membershipFeeETH = Number(ethers.formatEther(await this.dao.membershipFee()));
    const totalContributions = Number(stats.totalMembers) * membershipFeeETH;

    if (treasuryBalance < totalContributions * 0.5) {
      issues.push("Treasury balance is low compared to member contributions");
      recommendations.push("Consider proposing additional treasury funding");
    }

    // Check loan parameters
    const minRate = Number(loanPolicy.minInterestRate);
    const maxRate = Number(loanPolicy.maxInterestRate);
    
    if (maxRate - minRate < 500) { // Less than 5% range
      recommendations.push("Consider widening interest rate range for better risk pricing");
    }

    // Check consensus threshold
    const threshold = Number(await this.dao.consensusThreshold());
    if (threshold < 5000) { // Less than 50%
      issues.push("Consensus threshold is below 50% - potential security risk");
    }

    // Check feature consistency
    if (stats.privacyEnabled && !stats.documentsEnabled) {
      recommendations.push("Consider enabling document storage for better privacy documentation");
    }

    if (stats.restakingEnabled) {
      const operators = await this.dao.getAllOperators();
      if (operators.length === 0) {
        issues.push("Restaking enabled but no operators approved");
        recommendations.push("Approve restaking operators before allocating funds");
      }
    }

    // Display results
    console.log("\n📊 Health Check Results:");
    
    if (issues.length === 0) {
      console.log("✅ No critical issues found");
    } else {
      console.log("⚠️  Issues found:");
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    return { issues, recommendations };
  }
}

// Predefined configuration presets
export const CONFIGURATION_PRESETS = {
  // Development setup with all features
  development: {
    features: {
      ensVoting: true,
      privateVoting: true,
      confidentialLoans: true,
      documentStorage: true,
      restaking: true,
      privacyLevel: 3,
    },
    loanPolicy: {
      minMembershipDuration: 1 * 24 * 60 * 60, // 1 day for testing
      maxLoanDuration: 30 * 24 * 60 * 60, // 30 days
      minInterestRate: 500, // 5%
      maxInterestRate: 2000, // 20%
      cooldownPeriod: 1 * 24 * 60 * 60, // 1 day
    },
  } as ConfigurationOptions,

  // Production-ready conservative setup
  production: {
    features: {
      ensVoting: true,
      privateVoting: false,
      confidentialLoans: false,
      documentStorage: true,
      restaking: false,
      privacyLevel: 1,
    },
    governance: {
      consensusThreshold: 6600, // 66%
    },
    loanPolicy: {
      minMembershipDuration: 90 * 24 * 60 * 60, // 90 days
      maxLoanDuration: 180 * 24 * 60 * 60, // 180 days
      minInterestRate: 300, // 3%
      maxInterestRate: 1200, // 12%
      cooldownPeriod: 30 * 24 * 60 * 60, // 30 days
    },
  } as ConfigurationOptions,

  // Enhanced features for mature DAO
  enhanced: {
    features: {
      ensVoting: true,
      privateVoting: true,
      confidentialLoans: true,
      documentStorage: true,
      restaking: true,
      privacyLevel: 2,
    },
  } as ConfigurationOptions,

  // Emergency mode - disable risky features
  emergency: {
    features: {
      ensVoting: false,
      privateVoting: false,
      confidentialLoans: false,
      documentStorage: true,
      restaking: false,
      privacyLevel: 1,
    },
    governance: {
      consensusThreshold: 7500, // 75% for emergency decisions
    },
  } as ConfigurationOptions,
};

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log("Usage: npx hardhat run scripts/configure-unified-dao.ts --network <network> -- <action> [options]");
    console.log("");
    console.log("Actions:");
    console.log("  status <dao_address>                    - Show current DAO configuration");
    console.log("  health <dao_address>                    - Perform health check");
    console.log("  preset <dao_address> <preset_name>      - Apply configuration preset");
    console.log("  members <dao_address> [limit]           - List DAO members");
    console.log("  operators <dao_address>                 - List approved operators");
    console.log("  proposals <dao_address> [limit]         - List proposals");
    console.log("");
    console.log("Presets: development, production, enhanced, emergency");
    process.exit(1);
  }

  const [action, daoAddress, ...options] = args;
  
  if (!daoAddress || !ethers.isAddress(daoAddress)) {
    console.error("❌ Please provide a valid DAO contract address");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  const dao = await ethers.getContractAt("UnifiedLendingDAO", daoAddress);
  const configurator = new DAOConfigurator(dao, signer);

  console.log("🔧 DAO Configuration Tool");
  console.log("📍 DAO Address:", daoAddress);
  console.log("👤 Signer:", signer.address);

  switch (action) {
    case "status":
      const config = await configurator.getCurrentConfiguration();
      console.log("\n📊 Current Configuration:");
      console.log(JSON.stringify(config, null, 2));
      break;

    case "health":
      await configurator.performHealthCheck();
      break;

    case "preset":
      const presetName = options[0];
      if (!presetName || !(presetName in CONFIGURATION_PRESETS)) {
        console.error("❌ Invalid preset. Available presets:", Object.keys(CONFIGURATION_PRESETS).join(", "));
        process.exit(1);
      }
      
      const preset = CONFIGURATION_PRESETS[presetName as keyof typeof CONFIGURATION_PRESETS];
      console.log(`\n🎯 Applying '${presetName}' preset...`);
      await configurator.applyConfiguration(preset);
      break;

    case "members":
      const memberLimit = options[0] ? parseInt(options[0]) : 10;
      await configurator.getMembersInfo(memberLimit);
      break;

    case "operators":
      await configurator.getOperatorsInfo();
      break;

    case "proposals":
      const proposalLimit = options[0] ? parseInt(options[0]) : 10;
      await configurator.getProposalsInfo(proposalLimit);
      break;

    default:
      console.error("❌ Unknown action:", action);
      process.exit(1);
  }
}

// Example usage functions
export async function enableAllFeatures(daoAddress: string) {
  const [signer] = await ethers.getSigners();
  const dao = await ethers.getContractAt("UnifiedLendingDAO", daoAddress);
  const configurator = new DAOConfigurator(dao, signer);

  return await configurator.applyConfiguration({
    features: {
      ensVoting: true,
      privateVoting: true,
      confidentialLoans: true,
      documentStorage: true,
      restaking: true,
      privacyLevel: 3,
    },
  });
}

export async function setupProductionDAO(daoAddress: string) {
  const [signer] = await ethers.getSigners();
  const dao = await ethers.getContractAt("UnifiedLendingDAO", daoAddress);
  const configurator = new DAOConfigurator(dao, signer);

  return await configurator.applyConfiguration(CONFIGURATION_PRESETS.production);
}

export async function emergencyMode(daoAddress: string) {
  const [signer] = await ethers.getSigners();
  const dao = await ethers.getContractAt("UnifiedLendingDAO", daoAddress);
  const configurator = new DAOConfigurator(dao, signer);

  // First pause the DAO
  await dao.connect(signer).pause();
  console.log("⏸️  DAO paused");

  // Apply emergency configuration
  await configurator.applyConfiguration(CONFIGURATION_PRESETS.emergency);

  // Unpause
  await dao.connect(signer).unpause();
  console.log("▶️  DAO unpaused with emergency configuration");

  return dao;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Configuration failed:", error);
      process.exit(1);
    });
}

export { DAOConfigurator };
