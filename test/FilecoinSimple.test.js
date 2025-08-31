const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Filecoin Simple Tests", function () {
    it("Should deploy FilecoinStorage contract", async function () {
        const FilecoinStorage = await ethers.getContractFactory("FilecoinStorage");
        const filecoinStorage = await FilecoinStorage.deploy();
        await filecoinStorage.waitForDeployment();
        
        expect(await filecoinStorage.documentCounter()).to.equal(0);
        expect(await filecoinStorage.dealCounter()).to.equal(0);
        expect(await filecoinStorage.snapshotCounter()).to.equal(0);
    });

    it("Should deploy LendingDAOWithFilecoin", async function () {
        const [owner] = await ethers.getSigners();
        
        const LendingDAOWithFilecoin = await ethers.getContractFactory("LendingDAOWithFilecoin");
        const dao = await LendingDAOWithFilecoin.deploy();
        await dao.waitForDeployment();
        
        // Check that Filecoin storage was deployed
        const filecoinStorageAddress = await dao.filecoinStorage();
        expect(filecoinStorageAddress).to.not.equal(ethers.ZeroAddress);
        
        // Check initial state
        expect(await dao.autoDocumentStorageEnabled()).to.be.false;
        expect(await dao.autoBackupEnabled()).to.be.false;
        expect(await dao.storageFeePool()).to.equal(0);
    });
});
