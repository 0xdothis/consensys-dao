import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("DAO Contract", function () {
    async function deployDaoFixture() {
        const [owner, member1, member2] = await hre.ethers.getSigners();

        const Dao = await hre.ethers.getContractFactory("Dao");
        const dao = await Dao.deploy();

        return { dao, owner, member1, member2 };
    }

    describe("joinDao", function () {
        it("Should allow a new member to join with exact fee", async function () {
            const { dao, member1 } = await loadFixture(deployDaoFixture);

            await expect(
                dao.connect(member1).joinDao({ value: hre.ethers.parseEther("1") })
            )
                .to.emit(dao, "DaoJoined")
                .withArgs(member1.address, hre.ethers.parseEther("1"));

            const member = await dao.members(member1.address);
            expect(member.isMember).to.equal(true);
        });

        it("Should revert if membership fee is incorrect", async function () {
            const { dao, member1 } = await loadFixture(deployDaoFixture);

            await expect(
                dao.connect(member1).joinDao({ value: hre.ethers.parseEther("0.5") })
            ).to.be.revertedWithCustomError(dao, "MembershipFeeNotMet");
        });

        it("Should revert if the member already joined", async function () {
            const { dao, member1 } = await loadFixture(deployDaoFixture);

            await dao.connect(member1).joinDao({ value: hre.ethers.parseEther("1") });

            await expect(
                dao.connect(member1).joinDao({ value: hre.ethers.parseEther("1") })
            ).to.be.revertedWithCustomError(dao, "AlreadyMember");
        });
    });

    describe("createProposal", function () {
        it("Should allow a member to create a proposal", async function () {
            const { dao, member1 } = await loadFixture(deployDaoFixture);

            await dao.connect(member1).joinDao({ value: hre.ethers.parseEther("1") });

            await expect(
                dao.connect(member1).createProposal("Proposal 1", "Description 1")
            )
                .to.emit(dao, "ProposalCreated")
                .withArgs(anyValue, "Proposal 1");

            const proposal = await dao.proposals(0);
            expect(proposal.title).to.equal("Proposal 1");
            expect(proposal.description).to.equal("Description 1");
            expect(proposal.proposedBy).to.equal(member1.address);
        });

        it("Should revert if a non-member tries to create proposal", async function () {
            const { dao, member2 } = await loadFixture(deployDaoFixture);

            await expect(
                dao.connect(member2).createProposal("Proposal 2", "Description 2")
            ).to.be.revertedWithCustomError(dao, "NotAMember");
        });
    });
});
