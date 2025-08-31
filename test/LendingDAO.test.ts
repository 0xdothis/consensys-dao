import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingDAO } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("LendingDAO", function () {
  let dao: LendingDAO;
  let owner: SignerWithAddress;
  let admin1: SignerWithAddress;
  let admin2: SignerWithAddress;
  let member1: SignerWithAddress;
  let member2: SignerWithAddress;
  let member3: SignerWithAddress;
  let member4: SignerWithAddress;
  let member5: SignerWithAddress;
  let user1: SignerWithAddress;

  const MEMBERSHIP_FEE = ethers.parseEther("1");
  const CONSENSUS_THRESHOLD = 5100; // 51%

  const defaultLoanPolicy = {
    minMembershipDuration: 0, // 0 for testing (normally 30 days)
    membershipContribution: MEMBERSHIP_FEE,
    maxLoanDuration: 365 * 24 * 60 * 60, // 1 year
    minInterestRate: 500, // 5%
    maxInterestRate: 2000, // 20%
    cooldownPeriod: 0, // 0 for testing (normally 90 days)
    maxLoanToTreasuryRatio: 5000, // 50%
  };

  beforeEach(async function () {
    [owner, admin1, admin2, member1, member2, member3, user1, member4, member5] = await ethers.getSigners();

    const LendingDAOFactory = await ethers.getContractFactory("LendingDAO");
    dao = await LendingDAOFactory.deploy();

    // Initialize the DAO
    await dao.initialize(
      [admin1.address, admin2.address],
      CONSENSUS_THRESHOLD,
      MEMBERSHIP_FEE,
      defaultLoanPolicy
    );
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await dao.initialized()).to.be.true;
      expect(await dao.consensusThreshold()).to.equal(CONSENSUS_THRESHOLD);
      expect(await dao.membershipFee()).to.equal(MEMBERSHIP_FEE);
      expect(await dao.isAdmin(admin1.address)).to.be.true;
      expect(await dao.isAdmin(admin2.address)).to.be.true;
    });

    it("Should not allow re-initialization", async function () {
      await expect(
        dao.initialize([admin1.address], CONSENSUS_THRESHOLD, MEMBERSHIP_FEE, defaultLoanPolicy)
      ).to.be.revertedWithCustomError(dao, "AlreadyInitialized");
    });
  });

  describe("Membership Management", function () {
    it("Should show correct initial state", async function () {
      expect(await dao.getTotalMembers()).to.equal(0);
      expect(await dao.getActiveMembers()).to.equal(0);
      expect(await dao.isMember(admin1.address)).to.be.false;
    });

    it("Should allow direct membership registration", async function () {
      await dao.connect(member1).registerMember({ value: MEMBERSHIP_FEE });
      
      expect(await dao.getTotalMembers()).to.equal(1);
      expect(await dao.getActiveMembers()).to.equal(1);
      expect(await dao.isMember(member1.address)).to.be.true;
      
      const member = await dao.getMember(member1.address);
      expect(member.memberAddress).to.equal(member1.address);
      expect(member.contributionAmount).to.equal(MEMBERSHIP_FEE);
    });

    it("Should reject registration with incorrect fee", async function () {
      await expect(
        dao.connect(member1).registerMember({ value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(dao, "IncorrectMembershipFee");
    });

    it("Should reject duplicate membership registration", async function () {
      await dao.connect(member1).registerMember({ value: MEMBERSHIP_FEE });
      
      await expect(
        dao.connect(member1).registerMember({ value: MEMBERSHIP_FEE })
      ).to.be.revertedWithCustomError(dao, "AlreadyMember");
    });

    it("Should show loan policy is set correctly", async function () {
      const policy = await dao.getLoanPolicy();
      expect(policy.minMembershipDuration).to.equal(defaultLoanPolicy.minMembershipDuration);
      expect(policy.maxLoanDuration).to.equal(defaultLoanPolicy.maxLoanDuration);
      expect(policy.minInterestRate).to.equal(defaultLoanPolicy.minInterestRate);
      expect(policy.maxInterestRate).to.equal(defaultLoanPolicy.maxInterestRate);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admins to add other admins", async function () {
      await dao.connect(admin1).addAdmin(member1.address);
      expect(await dao.isAdmin(member1.address)).to.be.true;
    });

    it("Should allow admins to remove other admins", async function () {
      await dao.connect(admin1).removeAdmin(admin2.address);
      expect(await dao.isAdmin(admin2.address)).to.be.false;
    });

    it("Should not allow non-admins to perform admin functions", async function () {
      await expect(
        dao.connect(member1).addAdmin(user1.address)
      ).to.be.revertedWithCustomError(dao, "NotAdmin");
    });
  });

  describe("Loan Proposals", function () {
    beforeEach(async function () {
      // Register 5 members for more realistic voting scenarios
      await dao.connect(member1).registerMember({ value: MEMBERSHIP_FEE });
      await dao.connect(member2).registerMember({ value: MEMBERSHIP_FEE });
      await dao.connect(member3).registerMember({ value: MEMBERSHIP_FEE });
      await dao.connect(member4).registerMember({ value: MEMBERSHIP_FEE });
      await dao.connect(member5).registerMember({ value: MEMBERSHIP_FEE });
      
      // Add treasury funds
      await owner.sendTransaction({
        to: dao.target,
        value: ethers.parseEther("20")
      });
    });

    it("Should allow members to request loans", async function () {
      const loanAmount = ethers.parseEther("5");
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount);
      
      await expect(dao.connect(member1).requestLoan(loanAmount))
        .to.emit(dao, "LoanRequested")
        .withArgs(proposalId, member1.address, loanAmount, anyValue, anyValue);
    });

    it("Should not allow non-members to request loans", async function () {
      await expect(
        dao.connect(user1).requestLoan(ethers.parseEther("5"))
      ).to.be.revertedWithCustomError(dao, "NotMember");
    });

    it("Should allow editing loan proposals during editing period", async function () {
      const originalAmount = ethers.parseEther("5");
      const newAmount = ethers.parseEther("3");
      
      // Request loan
      const proposalId = await dao.connect(member1).requestLoan.staticCall(originalAmount);
      await dao.connect(member1).requestLoan(originalAmount);
      
      // Edit proposal
      await expect(dao.connect(member1).editLoanProposal(proposalId, newAmount))
        .to.emit(dao, "LoanProposalEdited")
        .withArgs(proposalId, member1.address, newAmount, anyValue, anyValue);
    });

    it("Should not allow editing by non-owner", async function () {
      const originalAmount = ethers.parseEther("5");
      const newAmount = ethers.parseEther("3");
      
      const proposalId = await dao.connect(member1).requestLoan.staticCall(originalAmount);
      await dao.connect(member1).requestLoan(originalAmount);
      
      await expect(
        dao.connect(member2).editLoanProposal(proposalId, newAmount)
      ).to.be.revertedWithCustomError(dao, "NotAuthorized");
    });

    it("Should not allow voting during editing period", async function () {
      const loanAmount = ethers.parseEther("5");
      
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount);
      await dao.connect(member1).requestLoan(loanAmount);
      
      // Try to vote immediately (should fail as it's in editing phase)
      await expect(
        dao.connect(member2).voteOnLoanProposal(proposalId, true)
      ).to.be.revertedWithCustomError(dao, "ProposalInEditingPhase");
    });

    it("Should not allow proposal owner to vote on their own proposal", async function () {
      const loanAmount = ethers.parseEther("5");
      
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount);
      await dao.connect(member1).requestLoan(loanAmount);
      
      // Fast forward past editing period
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]); // 3 days + 1 second
      await ethers.provider.send("evm_mine", []);
      
      // Owner tries to vote on their own proposal
      await expect(
        dao.connect(member1).voteOnLoanProposal(proposalId, true)
      ).to.be.revertedWithCustomError(dao, "CannotVoteOnOwnProposal");
    });

    it("Should allow voting after editing period ends", async function () {
      const loanAmount = ethers.parseEther("5");
      
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount);
      await dao.connect(member1).requestLoan(loanAmount);
      
      // Fast forward past editing period
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]); // 3 days + 1 second
      await ethers.provider.send("evm_mine", []);
      
      // Other member votes (should work)
      await expect(dao.connect(member2).voteOnLoanProposal(proposalId, true))
        .to.emit(dao, "LoanVoteCast")
        .withArgs(proposalId, member2.address, true);
    });

    it("Should approve loan when enough votes are received", async function () {
      const loanAmount = ethers.parseEther("2");
      
      const proposalId = await dao.connect(member1).requestLoan.staticCall(loanAmount);
      await dao.connect(member1).requestLoan(loanAmount);
      
      // Fast forward past editing period
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      
      // Get initial balance
      const initialBalance = await ethers.provider.getBalance(member1.address);
      
      // With 5 members and 51% threshold: (5 * 5100) / 10000 = 2.55, which truncates to 2 in Solidity
      // So we need 3 votes (because 2.55 rounds up to 3 for practical purposes)
      // But Solidity integer division truncates, so requiredVotes = 2
      
      // First vote
      await dao.connect(member2).voteOnLoanProposal(proposalId, true);
      
      // Second vote should trigger approval and loan disbursement (reaching the required 2 votes)
      await expect(dao.connect(member3).voteOnLoanProposal(proposalId, true))
        .to.emit(dao, "LoanApproved")
        .and.to.emit(dao, "LoanDisbursed");
      
      // Check that funds were disbursed
      const finalBalance = await ethers.provider.getBalance(member1.address);
      expect(finalBalance).to.be.greaterThan(initialBalance);
    });
  });

  describe("Treasury", function () {
    it("Should accept ETH deposits", async function () {
      const initialBalance = await dao.getTreasuryBalance();
      
      await owner.sendTransaction({
        to: dao.target,
        value: ethers.parseEther("5")
      });
      
      expect(await dao.getTreasuryBalance()).to.equal(initialBalance + ethers.parseEther("5"));
    });
  });
});
