const { ethers } = require("hardhat");

async function main() {
    console.log("Starting LendingDAO with Filecoin Integration deployment...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Deploy LendingDAOWithFilecoin contract
    console.log("\n1. Deploying LendingDAOWithFilecoin...");
    const LendingDAOWithFilecoin = await ethers.getContractFactory("LendingDAOWithFilecoin");
    const dao = await LendingDAOWithFilecoin.deploy();
    await dao.waitForDeployment();
    
    const daoAddress = await dao.getAddress();
    console.log("✅ LendingDAOWithFilecoin deployed to:", daoAddress);

    // Get FilecoinStorage contract address
    const filecoinStorageAddress = await dao.filecoinStorage();
    console.log("✅ FilecoinStorage deployed to:", filecoinStorageAddress);

    // Get ENSGovernance contract address
    const ensGovernanceAddress = await dao.ensGovernance();
    console.log("✅ ENSGovernance deployed to:", ensGovernanceAddress);

    // Initialize DAO
    console.log("\n2. Initializing DAO...");
    
    const membershipFee = ethers.parseEther("0.1"); // 0.1 ETH
    const consensusThreshold = 5100; // 51%
    
    // Configure loan policy
    const loanPolicy = {
        minMembershipDuration: 30 * 24 * 60 * 60, // 30 days
        membershipContribution: membershipFee,
        maxLoanDuration: 365 * 24 * 60 * 60, // 1 year
        minInterestRate: 500, // 5%
        maxInterestRate: 1500, // 15%
        cooldownPeriod: 90 * 24 * 60 * 60, // 90 days
        maxLoanToTreasuryRatio: 5000 // 50% max loan to treasury ratio
    };

    const initTx = await dao["initialize(address[],uint256,uint256,(uint256,uint256,uint256,uint256,uint256,uint256,uint256))"](
        [deployer.address], // Initial admin
        consensusThreshold,
        membershipFee,
        loanPolicy
    );
    await initTx.wait();
    console.log("✅ DAO initialized successfully");

    // Configure Filecoin storage settings
    console.log("\n3. Configuring Filecoin storage...");
    
    const storagePrice = ethers.parseEther("0.001"); // 0.001 ETH per GB per year
    const backupInterval = 7 * 24 * 60 * 60; // 7 days
    
    const configTx = await dao.configureFilecoinStorage(storagePrice, backupInterval);
    await configTx.wait();
    console.log("✅ Filecoin storage configured");
    console.log("   Storage price:", ethers.formatEther(storagePrice), "ETH per GB per year");
    console.log("   Backup interval:", backupInterval / (24 * 60 * 60), "days");

    // Enable automatic features (optional)
    console.log("\n4. Enabling automatic features...");
    
    const enableAutoStorageTx = await dao.setAutoDocumentStorageEnabled(true);
    await enableAutoStorageTx.wait();
    console.log("✅ Auto document storage enabled");
    
    const enableAutoBackupTx = await dao.setAutoBackupEnabled(true);
    await enableAutoBackupTx.wait();
    console.log("✅ Auto backup enabled");

    // Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("LendingDAOWithFilecoin:", daoAddress);
    console.log("FilecoinStorage:      ", filecoinStorageAddress);
    console.log("ENSGovernance:        ", ensGovernanceAddress);
    console.log("");
    console.log("Configuration:");
    console.log("- Membership Fee:     ", ethers.formatEther(membershipFee), "ETH");
    console.log("- Consensus Threshold:", consensusThreshold / 100, "%");
    console.log("- Storage Price:      ", ethers.formatEther(storagePrice), "ETH/GB/year");
    console.log("- Backup Interval:    ", backupInterval / (24 * 60 * 60), "days");
    console.log("- Auto Storage:       ", "Enabled");
    console.log("- Auto Backup:        ", "Enabled");
    console.log("");
    console.log("Loan Policy:");
    console.log("- Min Membership:     ", loanPolicy.minMembershipDuration / (24 * 60 * 60), "days");
    console.log("- Max Loan Duration:  ", loanPolicy.maxLoanDuration / (24 * 60 * 60), "days");
    console.log("- Interest Range:     ", loanPolicy.minInterestRate / 100, "% -", loanPolicy.maxInterestRate / 100, "%");
    console.log("- Cooldown Period:    ", loanPolicy.cooldownPeriod / (24 * 60 * 60), "days");
    console.log("=".repeat(60));

    // Verify deployment
    console.log("\n5. Verifying deployment...");
    
    try {
        // Check DAO state
        const initialized = await dao.initialized();
        const totalMembers = await dao.getTotalMembers();
        const treasuryBalance = await dao.getTreasuryBalance();
        
        console.log("✅ DAO Status:");
        console.log("   Initialized:", initialized);
        console.log("   Total Members:", totalMembers.toString());
        console.log("   Treasury Balance:", ethers.formatEther(treasuryBalance), "ETH");
        
        // Check Filecoin storage state
        const filecoinStorage = await ethers.getContractAt("FilecoinStorage", filecoinStorageAddress);
        const documentCounter = await filecoinStorage.documentCounter();
        const dealCounter = await filecoinStorage.dealCounter();
        const currentStoragePrice = await filecoinStorage.storagePrice();
        
        console.log("✅ Filecoin Storage Status:");
        console.log("   Documents:", documentCounter.toString());
        console.log("   Storage Deals:", dealCounter.toString());
        console.log("   Storage Price:", ethers.formatEther(currentStoragePrice), "ETH");
        
        // Check ENS governance state
        const ensGovernance = await ethers.getContractAt("ENSGovernance", ensGovernanceAddress);
        const ensVotingEnabled = await dao.ensVotingEnabled();
        const subdomainPrice = await ensGovernance.subdomainPrice();
        
        console.log("✅ ENS Governance Status:");
        console.log("   ENS Voting Enabled:", ensVotingEnabled);
        console.log("   Subdomain Price:", ethers.formatEther(subdomainPrice), "ETH");
        
        console.log("\n🎉 Deployment verification completed successfully!");
        
    } catch (error) {
        console.error("❌ Deployment verification failed:", error.message);
        process.exit(1);
    }

    // Optional: Fund the DAO with initial treasury
    console.log("\n6. Optional: Funding initial treasury...");
    const initialFunding = ethers.parseEther("5"); // 5 ETH
    
    try {
        const fundTx = await deployer.sendTransaction({
            to: daoAddress,
            value: initialFunding
        });
        await fundTx.wait();
        
        const newBalance = await dao.getTreasuryBalance();
        console.log("✅ DAO funded with", ethers.formatEther(initialFunding), "ETH");
        console.log("   New treasury balance:", ethers.formatEther(newBalance), "ETH");
    } catch (error) {
        console.log("⚠️  Optional funding skipped:", error.message);
    }

    // Save deployment addresses for future reference
    const deploymentInfo = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            LendingDAOWithFilecoin: daoAddress,
            FilecoinStorage: filecoinStorageAddress,
            ENSGovernance: ensGovernanceAddress
        },
        configuration: {
            membershipFee: ethers.formatEther(membershipFee),
            consensusThreshold: consensusThreshold,
            storagePrice: ethers.formatEther(storagePrice),
            backupInterval: backupInterval,
            loanPolicy: {
                minMembershipDuration: loanPolicy.minMembershipDuration,
                maxLoanDuration: loanPolicy.maxLoanDuration,
                minInterestRate: loanPolicy.minInterestRate,
                maxInterestRate: loanPolicy.maxInterestRate,
                cooldownPeriod: loanPolicy.cooldownPeriod
            }
        }
    };

    console.log("\n" + "=".repeat(60));
    console.log("Deployment completed successfully! 🚀");
    console.log("=".repeat(60));
    console.log("Save these addresses for interaction:");
    console.log("");
    console.log("export LENDING_DAO_ADDRESS=" + daoAddress);
    console.log("export FILECOIN_STORAGE_ADDRESS=" + filecoinStorageAddress);
    console.log("export ENS_GOVERNANCE_ADDRESS=" + ensGovernanceAddress);
    console.log("=".repeat(60));

    return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then((deploymentInfo) => {
        console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
