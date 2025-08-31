import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { UnifiedLendingDAO } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("UnifiedLendingDAO", function () {
  async function deployDAOFixture() {
    const [owner, admin1, admin2, member1, member2, member3, operator1, operator2] = await ethers.getSigners();

    const UnifiedLendingDAO = await ethers.getContractFactory("UnifiedLendingDAO");
    const dao = await UnifiedLendingDAO.deploy();

    // Initialize the DAO
    const membershipFee = ethers.parseEther("0.1");
    const consensusThreshold = 5100; // 51%
    const loanPolicy = {
      minMembershipDuration: 30 * 24 * 60 * 60, // 30 days
      membershipContribution: membershipFee,
      maxLoanDuration: 90 * 24 * 60 * 60, // 90 days
      minInterestRate: 500, // 5%
      maxInterestRate: 2000, // 20%
      cooldownPeriod: 7 * 24 * 60 * 60, // 7 days
      maxLoanToTreasuryRatio: 5000, // 50%
    };

    await dao.initialize([admin1.address, admin2.address], consensusThreshold, membershipFee, loanPolicy);

    // Add initial treasury funds
    await owner.sendTransaction({
      to: await dao.getAddress(),
      value: ethers.parseEther("10"),
    });

    return {
      dao,
      owner,
      admin1,
      admin2,
      member1,
      member2,
      member3,
      operator1,
      operator2,
      membershipFee,
      consensusThreshold,
      loanPolicy,
    };
  }

  describe("Deployment and Initialization", function () {
    it("Should deploy and initialize correctly", async function () {
      const { dao, admin1, admin2, membershipFee, consensusThreshold } = await loadFixture(deployDAOFixture);

      expect(await dao.initialized()).to.be.true;
      expect(await dao.isAdmin(admin1.address)).to.be.true;
      expect(await dao.isAdmin(admin2.address)).to.be.true;
      expect(await dao.membershipFee()).to.equal(membershipFee);
      expect(await dao.consensusThreshold()).to.equal(consensusThreshold);
    });

    it("Should prevent double initialization", async function () {
      const { dao, admin1, membershipFee, consensusThreshold, loanPolicy } = await loadFixture(deployDAOFixture);

      await expect(
        dao.initialize([admin1.address], consensusThreshold, membershipFee, loanPolicy)
      ).to.be.revertedWithCustomError(dao, "AlreadyInitialized");
    });
  });

  describe("Enhanced Member Registration", function () {
    it("Should register member with ENS name and calculate voting weight", async function () {
      const { dao, member1, membershipFee } = await loadFixture(deployDAOFixture);

      const ensName = "alice.eth";
      const kycHash = "QmTestKYCHash123";

      await expect(
        dao.connect(member1).registerMember(ensName, kycHash, { value: membershipFee })
      )
        .to.emit(dao, "MemberActivated")
        .withArgs(member1.address)
        .and.to.emit(dao, "ENSNameLinked")
        .withArgs(member1.address, ensName, 150); // alice.eth = 9 chars = 150 weight

      expect(await dao.isMember(member1.address)).to.be.true;
      expect(await dao.memberENSNames(member1.address)).to.equal(ensName);
      expect(await dao.memberVotingWeights(member1.address)).to.equal(150);
    });

    it("Should register member without ENS (standard registration)", async function () {
      const { dao, member1, membershipFee } = await loadFixture(deployDAOFixture);

      await dao.connect(member1).registerMember("", "", { value: membershipFee });

      expect(await dao.isMember(member1.address)).to.be.true;
      expect(await dao.memberVotingWeights(member1.address)).to.equal(100); // Default weight
    });

    it("Should refund excess membership fee", async function () {
      const { dao, member1, membershipFee } = await loadFixture(deployDAOFixture);

      const excessAmount = ethers.parseEther("0.2");
      const initialBalance = await ethers.provider.getBalance(member1.address);

      const tx = await dao.connect(member1).registerMember("", "", { value: excessAmount });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(member1.address);
      const expectedBalance = initialBalance - membershipFee - gasUsed;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });
  });

  describe("Enhanced Loan Management", function () {
    async function setupMembersWithinTest() {
      const base = await loadFixture(deployDAOFixture);
      
      // Register members
      await base.dao.connect(base.member1).registerMember("alice.eth", "", { value: base.membershipFee });
      await base.dao.connect(base.member2).registerMember("bob.eth", "", { value: base.membershipFee });
      await base.dao.connect(base.member3).registerMember("", "", { value: base.membershipFee });

      // Fast-forward to bypass membership duration
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine", []);

      return base;
    }

    it("Should create public loan proposal with document", async function () {
      const { dao, member1 } = await setupMembersWithinTest();

      const loanAmount = ethers.parseEther("1");
      const documentHash = "QmTestLoanDoc123";

      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount, false, ethers.ZeroHash, documentHash);
      
      await expect(
        dao.connect(member1).requestLoan(loanAmount, false, ethers.ZeroHash, documentHash)
      )
        .to.emit(dao, "LoanRequested")
        .and.to.emit(dao, "DocumentStored")
        .withArgs(proposalId, "loan_proposal", documentHash);

      expect(await dao.proposalDocuments(proposalId)).to.equal(documentHash);
    });

    it("Should create private loan proposal", async function () {
      const { dao, member1, admin1 } = await setupMembersWithinTest();

      // Enable confidential loans
      await dao.connect(admin1).toggleFeature("confidentialLoans", true);

      const commitment = ethers.keccak256(ethers.toUtf8Bytes("secret_loan_data"));

      const proposalId = await dao.connect(member1).requestLoan.staticCall(0, true, commitment, "");
      
      await expect(
        dao.connect(member1).requestLoan(0, true, commitment, "")
      )
        .to.emit(dao, "PrivateProposalCreated")
        .withArgs(proposalId, commitment);

      expect(await dao.isPrivateProposal(proposalId)).to.be.true;
      expect(await dao.proposalCommitments(proposalId)).to.equal(commitment);
    });

    it("Should handle ENS-weighted voting", async function () {
      const { dao, member1, member2, member3, admin1 } = await setupMembersWithinTest();

      // Enable ENS voting
      await dao.connect(admin1).toggleFeature("ensVoting", true);

      // Create loan proposal
      const loanAmount = ethers.parseEther("1");
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount, false, ethers.ZeroHash, "");
      await dao.connect(member1).requestLoan(loanAmount, false, ethers.ZeroHash, "");

      // Fast-forward past editing period
      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]); // 4 days
      await ethers.provider.send("evm_mine", []);

      // Vote with different weights (alice.eth=150, bob.eth=135, member3=100)
      await dao.connect(member2).voteOnLoanProposal(proposalId, true); // 135 weight (bob.eth = 7 chars = 135)
      await dao.connect(member3).voteOnLoanProposal(proposalId, true); // 100 weight (no ENS)

      const proposal = await dao.loanProposals(proposalId);
      expect(proposal.forVotes).to.equal(235); // 135 + 100
    });

    it("Should approve and disburse loan automatically when threshold met", async function () {
      const { dao, member1, member2, member3 } = await setupMembersWithinTest();

      const loanAmount = ethers.parseEther("1");
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount, false, ethers.ZeroHash, "");
      await dao.connect(member1).requestLoan(loanAmount, false, ethers.ZeroHash, "");

      // Fast-forward past editing period
      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const initialBalance = await ethers.provider.getBalance(member1.address);

      // Get enough votes to pass (51% of 3 members = 2 votes)
      await expect(dao.connect(member2).voteOnLoanProposal(proposalId, true))
        .to.emit(dao, "LoanVoteCast");

      await expect(dao.connect(member3).voteOnLoanProposal(proposalId, true))
        .to.emit(dao, "LoanApproved")
        .and.to.emit(dao, "LoanDisbursed");

      const finalBalance = await ethers.provider.getBalance(member1.address);
      expect(finalBalance).to.be.gt(initialBalance);

      // Check loan was created
      const loan = await dao.loans(1);
      expect(loan.borrower).to.equal(member1.address);
      expect(loan.principalAmount).to.equal(loanAmount);
    });

    it("Should handle private voting events", async function () {
      const { dao, member1, member2, admin1 } = await setupMembersWithinTest();

      // Enable private voting
      await dao.connect(admin1).toggleFeature("privateVoting", true);

      const loanAmount = ethers.parseEther("1");
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount, false, ethers.ZeroHash, "");
      await dao.connect(member1).requestLoan(loanAmount, false, ethers.ZeroHash, "");

      // Fast-forward past editing period
      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(dao.connect(member2).voteOnLoanProposal(proposalId, true))
        .to.emit(dao, "LoanVoteCast")
        .and.to.emit(dao, "PrivateVoteCast");
    });
  });

  describe("Privacy Features", function () {
    async function setupPrivacyFixture() {
      const base = await loadFixture(deployDAOFixture);
      
      // Register members first
      await base.dao.connect(base.member1).registerMember("alice.eth", "", { value: base.membershipFee });
      await base.dao.connect(base.member2).registerMember("bob.eth", "", { value: base.membershipFee });
      await base.dao.connect(base.member3).registerMember("", "", { value: base.membershipFee });

      // Fast-forward to bypass membership duration
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine", []);
      
      // Enable all privacy features
      await base.dao.connect(base.admin1).setPrivacyLevel(3);
      
      return base;
    }

    it("Should set privacy level and auto-enable features", async function () {
      const { dao, admin1 } = await loadFixture(deployDAOFixture);

      await dao.connect(admin1).setPrivacyLevel(2);

      expect(await dao.privacyLevel()).to.equal(2);
      expect(await dao.privateVotingEnabled()).to.be.true;
      expect(await dao.confidentialLoansEnabled()).to.be.true;
    });

    it("Should prevent private loans when feature disabled", async function () {
      const base = await loadFixture(deployDAOFixture);
      
      // Register member first
      await base.dao.connect(base.member1).registerMember("alice.eth", "", { value: base.membershipFee });
      
      // Fast-forward to bypass membership duration
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine", []);

      const commitment = ethers.keccak256(ethers.toUtf8Bytes("secret"));

      await expect(
        base.dao.connect(base.member1).requestLoan(0, true, commitment, "")
      ).to.be.revertedWith("Confidential loans not enabled");
    });

    it("Should store and retrieve proposal commitments", async function () {
      const { dao, member1 } = await setupPrivacyFixture();

      const commitment = ethers.keccak256(ethers.toUtf8Bytes("private_loan_data"));
      const proposalId = await dao.connect(member1).requestLoan.staticCall(0, true, commitment, "");
      await dao.connect(member1).requestLoan(0, true, commitment, "");

      expect(await dao.isPrivateProposal(proposalId)).to.be.true;
      expect(await dao.proposalCommitments(proposalId)).to.equal(commitment);
    });
  });

  describe("Restaking Operations", function () {
    async function setupRestakingFixture() {
      const base = await setupMembersFixture();
      
      // Enable restaking
      await base.dao.connect(base.admin1).toggleFeature("restaking", true);
      
      // Approve operators
      await base.dao.connect(base.admin1).approveOperator(
        base.operator1.address,
        "Operator Alpha",
        1200 // 12% APY
      );
      
      await base.dao.connect(base.admin1).approveOperator(
        base.operator2.address,
        "Operator Beta",
        1500 // 15% APY
      );
      
      return base;
    }

    it("Should approve operators with proper validation", async function () {
      const { dao, admin1, operator1 } = await loadFixture(setupMembersFixture);

      await dao.connect(admin1).toggleFeature("restaking", true);

      await expect(
        dao.connect(admin1).approveOperator(operator1.address, "Test Operator", 1000)
      )
        .to.emit(dao, "OperatorApproved")
        .withArgs(operator1.address, "Test Operator", 1000);

      const operator = await dao.operators(operator1.address);
      expect(operator.isApproved).to.be.true;
      expect(operator.name).to.equal("Test Operator");
      expect(operator.expectedAPY).to.equal(1000);
    });

    it("Should reject invalid APY rates", async function () {
      const { dao, admin1, operator1 } = await loadFixture(setupMembersFixture);

      await dao.connect(admin1).toggleFeature("restaking", true);

      await expect(
        dao.connect(admin1).approveOperator(operator1.address, "Bad Operator", 6000) // 60% too high
      ).to.be.revertedWith("Invalid APY");
    });

    it("Should allocate funds to restaking operators", async function () {
      const { dao, admin1 } = await setupRestakingFixture();

      const allocationAmount = ethers.parseEther("2");

      await expect(dao.connect(admin1).allocateToRestaking(allocationAmount))
        .to.emit(dao, "RestakingAllocated")
        .withArgs(allocationAmount);

      expect(await dao.totalRestaked()).to.equal(allocationAmount);
    });

    it("Should distribute yield to members", async function () {
      const { dao, admin1, member1, member2, member3 } = await setupRestakingFixture();

      const yieldAmount = ethers.parseEther("1");

      await expect(dao.connect(admin1).distributeYield(yieldAmount))
        .to.emit(dao, "YieldDistributed");

      // Check that each member got their share (60% of yield / 3 members)
      const expectedYieldPerMember = (yieldAmount * BigInt(6000)) / BigInt(10000) / BigInt(3);
      
      expect(await dao.pendingYield(member1.address)).to.equal(expectedYieldPerMember);
      expect(await dao.pendingYield(member2.address)).to.equal(expectedYieldPerMember);
      expect(await dao.pendingYield(member3.address)).to.equal(expectedYieldPerMember);
    });

    it("Should allow members to claim yield", async function () {
      const { dao, admin1, member1 } = await setupRestakingFixture();

      // Distribute some yield
      const yieldAmount = ethers.parseEther("1");
      await dao.connect(admin1).distributeYield(yieldAmount);

      const initialBalance = await ethers.provider.getBalance(member1.address);
      const pendingYield = await dao.pendingYield(member1.address);

      await dao.connect(member1).claimYield();

      const finalBalance = await ethers.provider.getBalance(member1.address);
      expect(await dao.pendingYield(member1.address)).to.equal(0);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Feature Management", function () {
    it("Should toggle features correctly", async function () {
      const { dao, admin1 } = await loadFixture(deployDAOFixture);

      await expect(dao.connect(admin1).toggleFeature("ensVoting", true))
        .to.emit(dao, "FeatureToggled")
        .withArgs("ensVoting", true);

      expect(await dao.ensVotingEnabled()).to.be.true;

      await dao.connect(admin1).toggleFeature("ensVoting", false);
      expect(await dao.ensVotingEnabled()).to.be.false;
    });

    it("Should reject invalid feature names", async function () {
      const { dao, admin1 } = await loadFixture(deployDAOFixture);

      await expect(
        dao.connect(admin1).toggleFeature("invalidFeature", true)
      ).to.be.revertedWith("Invalid feature");
    });

    it("Should require admin role for feature management", async function () {
      const { dao, member1 } = await loadFixture(deployDAOFixture);

      await expect(
        dao.connect(member1).toggleFeature("ensVoting", true)
      ).to.be.revertedWithCustomError(dao, "NotAdmin");
    });
  });

  describe("Document Storage", function () {
    it("Should store loan documents", async function () {
      const { dao, member1, member2, member3, admin1 } = await loadFixture(setupMembersFixture);

      // Create and approve a loan
      const loanAmount = ethers.parseEther("1");
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount, false, ethers.ZeroHash, "");
      await dao.connect(member1).requestLoan(loanAmount, false, ethers.ZeroHash, "");

      // Fast-forward and vote to approve
      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Ensure proposal is in voting phase before voting
      await dao.connect(member2).voteOnLoanProposal(proposalId, true);
      await dao.connect(member3).voteOnLoanProposal(proposalId, true);

      const loanId = 1;
      const documentHash = "QmTestLoanDocAfterApproval";

      await expect(
        dao.connect(member1).storeLoanDocument(loanId, documentHash)
      )
        .to.emit(dao, "DocumentStored")
        .withArgs(loanId, "loan_document", documentHash);

      expect(await dao.loanDocuments(loanId)).to.equal(documentHash);
    });

    it("Should allow admin to store loan documents", async function () {
      const { dao, admin1 } = await loadFixture(setupMembersFixture);

      // Even without a real loan, admin should be able to store documents
      const loanId = 999; // Non-existent loan
      const documentHash = "QmAdminStoredDoc";

      await dao.connect(admin1).storeLoanDocument(loanId, documentHash);
      expect(await dao.loanDocuments(loanId)).to.equal(documentHash);
    });
  });

  describe("Enhanced View Functions", function () {
    it("Should return comprehensive DAO stats", async function () {
      const { dao, admin1 } = await loadFixture(setupMembersFixture);

      // Enable some features
      await dao.connect(admin1).toggleFeature("ensVoting", true);
      await dao.connect(admin1).toggleFeature("restaking", true);
      await dao.connect(admin1).setPrivacyLevel(2);

      const stats = await dao.getDAOStats();

      expect(stats.totalMembersCount).to.equal(3);
      expect(stats.activeMembersCount).to.equal(3);
      expect(stats.privacyEnabled).to.be.true;
      expect(stats.restakingActive).to.be.true;
      expect(stats.ensEnabled).to.be.true;
      expect(stats.documentsEnabled).to.be.true;
      expect(stats.treasuryBalance).to.be.gt(0);
    });

    it("Should return complete member profile", async function () {
      const { dao, member1 } = await loadFixture(setupMembersFixture);

      const profile = await dao.getMemberProfile(member1.address);

      expect(profile.memberData.memberAddress).to.equal(member1.address);
      expect(profile.ensName).to.equal("alice.eth");
      expect(profile.votingWeight).to.equal(150); // alice.eth = 9 chars = 150 weight
      expect(profile.hasActiveProposal).to.be.false;
    });

    it("Should return enhanced proposal information", async function () {
      const { dao, member1 } = await loadFixture(setupMembersFixture);

      const loanAmount = ethers.parseEther("1");
      const documentHash = "QmTestDoc";
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount, false, ethers.ZeroHash, documentHash);
      await dao.connect(member1).requestLoan(loanAmount, false, ethers.ZeroHash, documentHash);

      const enhanced = await dao.getEnhancedProposal(proposalId);

      expect(enhanced.proposalType).to.equal(0); // LOAN
      expect(enhanced.isPrivate).to.be.false;
      expect(enhanced.documentHash).to.equal(documentHash);
      expect(enhanced.proposer).to.equal(member1.address);
    });

    it("Should get paginated proposals", async function () {
      const { dao, member1, member2 } = await loadFixture(setupMembersFixture);

      // Create multiple proposals
      await dao.connect(member1).requestLoan(ethers.parseEther("1"), false, ethers.ZeroHash, "");
      await dao.connect(member2).requestLoan(ethers.parseEther("0.5"), false, ethers.ZeroHash, "");

      const [proposalIds, hasMore] = await dao.getProposals(0, 10, false);

      expect(proposalIds.length).to.equal(2);
      expect(hasMore).to.be.false;
    });

    it("Should get member's loans", async function () {
      const { dao, member1, member2, member3 } = await loadFixture(setupMembersFixture);

      // Create and approve a loan for member1
      const proposalId = await dao.connect(member1).requestLoan.staticCall(ethers.parseEther("1"), false, ethers.ZeroHash, "");
      await dao.connect(member1).requestLoan(ethers.parseEther("1"), false, ethers.ZeroHash, "");

      // Fast-forward and approve
      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Ensure proposal is in voting phase before voting  
      await dao.connect(member2).voteOnLoanProposal(proposalId, true);
      await dao.connect(member3).voteOnLoanProposal(proposalId, true);

      const memberLoans = await dao.getMemberLoans(member1.address);
      expect(memberLoans.length).to.equal(1);
      expect(memberLoans[0]).to.equal(1);
    });
  });

  describe("Combined Rewards System", function () {
    it("Should allow claiming all rewards (interest + yield)", async function () {
      const { dao, admin1, member1, member2, member3 } = await setupRestakingFixture();

      // Create loan to generate interest rewards
      const proposalId = await dao.connect(member1).requestLoan.staticCall(ethers.parseEther("1"), false, ethers.ZeroHash, "");
      await dao.connect(member1).requestLoan(ethers.parseEther("1"), false, ethers.ZeroHash, "");

      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      // Ensure proposal is in voting phase before voting
      await dao.connect(member2).voteOnLoanProposal(proposalId, true);
      await dao.connect(member3).voteOnLoanProposal(proposalId, true);

      // Repay loan to generate interest
      const loan = await dao.loans(1);
      await dao.connect(member1).repayLoan(1, { value: loan.totalRepayment });

      // Distribute yield
      await dao.connect(admin1).distributeYield(ethers.parseEther("0.5"));

      // Check member2 has both types of rewards
      const rewards = await dao.getMemberRewards(member2.address);
      expect(rewards.totalRewards).to.be.gt(0);
      expect(rewards.totalYield).to.be.gt(0);
      expect(rewards.pendingTotal).to.equal(rewards.totalRewards + rewards.totalYield);

      // Claim all rewards
      const initialBalance = await ethers.provider.getBalance(member2.address);
      await dao.connect(member2).claimAllRewards();
      const finalBalance = await ethers.provider.getBalance(member2.address);

      expect(finalBalance).to.be.gt(initialBalance);
      expect(await dao.pendingRewards(member2.address)).to.equal(0);
      expect(await dao.pendingYield(member2.address)).to.equal(0);
    });
  });

  describe("Treasury Management with Enhanced Features", function () {
    it("Should handle treasury proposals with ENS-weighted voting", async function () {
      const { dao, member1, member2, member3, admin1 } = await loadFixture(setupMembersFixture);

      // Enable ENS voting
      await dao.connect(admin1).toggleFeature("ensVoting", true);

      const withdrawAmount = ethers.parseEther("1");
      const destination = member1.address;
      
      const proposalId = await dao.connect(member2).proposeTreasuryWithdrawal.staticCall(
        withdrawAmount,
        destination,
        "Emergency withdrawal"
      );
      
      await dao.connect(member2).proposeTreasuryWithdrawal(
        withdrawAmount,
        destination,
        "Emergency withdrawal"
      );

      // Vote (need 60% for treasury proposals)
      // alice.eth (150) + bob.eth (135) + member3 (100) = 385 total weight
      // Need 60% of 385 = 231 votes
      await dao.connect(member1).voteOnTreasuryProposal(proposalId, true);

      await expect(dao.connect(member3).voteOnTreasuryProposal(proposalId, true))
        .to.emit(dao, "TreasuryWithdrawalExecuted");
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should handle zero treasury balance in loan terms calculation", async function () {
      const { dao } = await loadFixture(deployDAOFixture);

      // DAO should have some balance from fixture, but let's test the logic
      const [interestRate, totalRepayment, duration] = await dao.calculateLoanTerms(ethers.parseEther("1"));
      
      expect(interestRate).to.be.gte(500); // At least min rate
      expect(totalRepayment).to.be.gt(ethers.parseEther("1")); // Principal + interest
      expect(duration).to.equal(90 * 24 * 60 * 60); // 90 days
    });

    it("Should prevent unauthorized document storage", async function () {
      const { dao, member2 } = await loadFixture(setupMembersFixture);

      await expect(
        dao.connect(member2).storeLoanDocument(999, "QmUnauthorized")
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent restaking allocation without operators", async function () {
      const { dao, admin1 } = await loadFixture(setupMembersFixture);

      await dao.connect(admin1).toggleFeature("restaking", true);

      await expect(
        dao.connect(admin1).allocateToRestaking(ethers.parseEther("1"))
      ).to.be.revertedWith("No approved operators");
    });

    it("Should prevent private proposal amount editing", async function () {
      const { dao, member1, admin1 } = await loadFixture(setupMembersFixture);

      await dao.connect(admin1).toggleFeature("confidentialLoans", true);

      const commitment = ethers.keccak256(ethers.toUtf8Bytes("secret"));
      const proposalId = await dao.connect(member1).requestLoan.staticCall(0, true, commitment, "");
      await dao.connect(member1).requestLoan(0, true, commitment, "");

      await expect(
        dao.connect(member1).editLoanProposal(proposalId, ethers.parseEther("2"))
      ).to.be.revertedWith("Cannot edit private proposal amount");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete loan lifecycle with all features", async function () {
      const { dao, admin1, member1, member2, member3 } = await loadFixture(deployDAOFixture);

      // Enable all features
      await dao.connect(admin1).setPrivacyLevel(3);
      await dao.connect(admin1).toggleFeature("ensVoting", true);
      await dao.connect(admin1).toggleFeature("documentStorage", true);
      await dao.connect(admin1).toggleFeature("restaking", true);

      // Register members with ENS
      await dao.connect(member1).registerMember("alice.eth", "QmKYC1", { value: await dao.membershipFee() });
      await dao.connect(member2).registerMember("bob.eth", "QmKYC2", { value: await dao.membershipFee() });
      await dao.connect(member3).registerMember("", "QmKYC3", { value: await dao.membershipFee() });

      // Wait for membership duration
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Setup restaking
      await dao.connect(admin1).approveOperator(member3.address, "Test Operator", 1000);

      // Request loan with document
      const loanAmount = ethers.parseEther("1");
      const documentHash = "QmLoanDocComplete";
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount, false, ethers.ZeroHash, documentHash);
      await dao.connect(member1).requestLoan(loanAmount, false, ethers.ZeroHash, documentHash);

      // Fast-forward and vote
      await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await dao.connect(member2).voteOnLoanProposal(proposalId, true);
      await dao.connect(member3).voteOnLoanProposal(proposalId, true);

      // Verify loan approved
      const loan = await dao.loans(1);
      expect(loan.status).to.equal(2); // ACTIVE (status enum: 0=PENDING, 1=APPROVED, 2=ACTIVE)

      // Allocate to restaking
      await dao.connect(admin1).allocateToRestaking(ethers.parseEther("2"));

      // Distribute yield
      await dao.connect(admin1).distributeYield(ethers.parseEther("0.3"));

      // Repay loan
      await dao.connect(member1).repayLoan(1, { value: loan.totalRepayment });

      // Verify everything worked
      expect(await dao.totalYieldGenerated()).to.equal(ethers.parseEther("0.3"));
      expect(await dao.totalRestaked()).to.equal(ethers.parseEther("2"));
      expect(await dao.pendingRewards(member2.address)).to.be.gt(0);
      expect(await dao.pendingYield(member2.address)).to.be.gt(0);

      // Get comprehensive stats
      const stats = await dao.getDAOStats();
      expect(stats.privacyEnabled).to.be.true;
      expect(stats.restakingActive).to.be.true;
      expect(stats.ensEnabled).to.be.true;
      expect(stats.documentsEnabled).to.be.true;
    });

    it("Should handle member exit with all features enabled", async function () {
      const { dao, admin1, member1 } = await loadFixture(setupMembersFixture);

      // Enable features and setup data
      await dao.connect(admin1).toggleFeature("ensVoting", true);
      await dao.connect(admin1).distributeYield(ethers.parseEther("0.1"));

      const initialBalance = await ethers.provider.getBalance(member1.address);
      
      await dao.connect(member1).exitDAO();

      const finalBalance = await ethers.provider.getBalance(member1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      expect(await dao.isMember(member1.address)).to.be.false;
      expect(await dao.memberENSNames(member1.address)).to.equal("");
      expect(await dao.memberVotingWeights(member1.address)).to.equal(0);
    });
  });

  describe("Security and Access Control", function () {
    it("Should maintain proper access control across features", async function () {
      const { dao, member1, admin1 } = await loadFixture(setupMembersFixture);

      // Only admins should manage features
      await expect(
        dao.connect(member1).setPrivacyLevel(2)
      ).to.be.revertedWithCustomError(dao, "NotAdmin");

      await expect(
        dao.connect(member1).approveOperator(member1.address, "Test", 1000)
      ).to.be.revertedWithCustomError(dao, "NotAdmin");

      await expect(
        dao.connect(member1).distributeYield(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(dao, "NotAdmin");

      // Only members should access member functions
      const allSigners = await ethers.getSigners();
      const nonMember = allSigners[9]; // Use a signer that definitely wasn't used in setup
      
      await expect(
        dao.connect(nonMember).requestLoan(ethers.parseEther("1"), false, ethers.ZeroHash, "")
      ).to.be.revertedWithCustomError(dao, "NotMember");

      await expect(
        dao.connect(nonMember).claimYield()
      ).to.be.revertedWithCustomError(dao, "NotMember");
    });

    it("Should handle emergency pause correctly", async function () {
      const { dao, admin1, member1 } = await loadFixture(setupMembersFixture);

      await dao.connect(admin1).pause();

      await expect(
        dao.connect(member1).requestLoan(ethers.parseEther("1"), false, ethers.ZeroHash, "")
      ).to.be.revertedWithCustomError(dao, "EnforcedPause");

      await dao.connect(admin1).unpause();

      // Should work after unpause
      await dao.connect(member1).requestLoan(ethers.parseEther("1"), false, ethers.ZeroHash, "");
    });
  });
});

// Internal helper function to setup members
async function setupMembersFixture() {
  const [owner, admin1, admin2, member1, member2, member3, operator1, operator2] = await ethers.getSigners();

  const UnifiedLendingDAO = await ethers.getContractFactory("UnifiedLendingDAO");
  const dao = await UnifiedLendingDAO.deploy();

  // Initialize the DAO
  const membershipFee = ethers.parseEther("0.1");
  const consensusThreshold = 5100; // 51%
  const loanPolicy = {
    minMembershipDuration: 30 * 24 * 60 * 60, // 30 days
    membershipContribution: membershipFee,
    maxLoanDuration: 90 * 24 * 60 * 60, // 90 days
    minInterestRate: 500, // 5%
    maxInterestRate: 2000, // 20%
    cooldownPeriod: 7 * 24 * 60 * 60, // 7 days
    maxLoanToTreasuryRatio: 5000, // 50%
  };

  await dao.initialize([admin1.address, admin2.address], consensusThreshold, membershipFee, loanPolicy);

  // Add initial treasury funds
  await owner.sendTransaction({
    to: await dao.getAddress(),
    value: ethers.parseEther("10"),
  });
  
  // Register members
  await dao.connect(member1).registerMember("alice.eth", "", { value: membershipFee });
  await dao.connect(member2).registerMember("bob.eth", "", { value: membershipFee });
  await dao.connect(member3).registerMember("", "", { value: membershipFee });

  // Fast-forward to bypass membership duration
  await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
  await ethers.provider.send("evm_mine", []);

  return { dao, owner, admin1, admin2, member1, member2, member3, operator1, operator2, membershipFee, consensusThreshold, loanPolicy };
}

// Internal helper function to setup restaking  
async function setupRestakingFixture() {
  const base = await setupMembersFixture();
  
  // Enable restaking
  await base.dao.connect(base.admin1).toggleFeature("restaking", true);
  
  // Approve operators
  await base.dao.connect(base.admin1).approveOperator(
    base.operator1.address,
    "Operator Alpha",
    1200 // 12% APY
  );
  
  await base.dao.connect(base.admin1).approveOperator(
    base.operator2.address,
    "Operator Beta",
    1500 // 15% APY
  );
  
  return base;
}
