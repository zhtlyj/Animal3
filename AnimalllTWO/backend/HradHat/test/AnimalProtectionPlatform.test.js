const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AnimalProtectionPlatform", function () {
  let platform;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const AnimalProtectionPlatform = await ethers.getContractFactory("AnimalProtectionPlatform");
    platform = await AnimalProtectionPlatform.deploy();
    await platform.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置合约名称和符号", async function () {
      expect(await platform.name()).to.equal("Animal Protection NFT");
      expect(await platform.symbol()).to.equal("APNFT");
    });
  });

  describe("NFT 功能", function () {
    it("应该能够铸造NFT", async function () {
      const tokenURI = "ipfs://QmExample";
      const name = "测试动物";
      const species = "狗";
      const breed = "金毛";

      await expect(
        platform.mintAnimalNFT(addr1.address, tokenURI, name, species, breed)
      )
        .to.emit(platform, "AnimalNFTMinted")
        .withArgs(1, owner.address, name, species);

      expect(await platform.ownerOf(1)).to.equal(addr1.address);
      expect(await platform.tokenURI(1)).to.equal(tokenURI);
    });

    it("应该正确存储动物信息", async function () {
      const tokenURI = "ipfs://QmExample";
      const name = "小花";
      const species = "猫";
      const breed = "英短";

      await platform.mintAnimalNFT(addr1.address, tokenURI, name, species, breed);

      const animalInfo = await platform.getAnimalInfo(1);
      expect(animalInfo.name).to.equal(name);
      expect(animalInfo.species).to.equal(species);
      expect(animalInfo.breed).to.equal(breed);
      expect(animalInfo.creator).to.equal(owner.address);
    });

    it("应该正确增加总供应量", async function () {
      expect(await platform.totalSupply()).to.equal(0);

      await platform.mintAnimalNFT(
        addr1.address,
        "ipfs://Qm1",
        "动物1",
        "狗",
        "金毛"
      );
      expect(await platform.totalSupply()).to.equal(1);

      await platform.mintAnimalNFT(
        addr2.address,
        "ipfs://Qm2",
        "动物2",
        "猫",
        "英短"
      );
      expect(await platform.totalSupply()).to.equal(2);
    });
  });

  describe("领养管理功能", function () {
    beforeEach(async function () {
      await platform.mintAnimalNFT(
        owner.address,
        "ipfs://Qm1",
        "测试动物",
        "狗",
        "金毛"
      );
    });

    it("应该能够提交领养申请", async function () {
      const reason = "我想给这只动物一个温暖的家";

      await expect(platform.connect(addr1).submitApplication(1, reason))
        .to.emit(platform, "ApplicationSubmitted")
        .withArgs(1, 1, addr1.address);

      const application = await platform.getApplication(1);
      expect(application.animalTokenId).to.equal(1);
      expect(application.applicant).to.equal(addr1.address);
      expect(application.reason).to.equal(reason);
      expect(application.status).to.equal(0); // Pending
    });

    it("只有所有者能够审核申请", async function () {
      await platform.connect(addr1).submitApplication(1, "申请理由");

      await expect(
        platform.connect(addr1).reviewApplication(1, true)
      ).to.be.revertedWithCustomError(platform, "OwnableUnauthorizedAccount");
    });

    it("应该能够批准申请", async function () {
      await platform.connect(addr1).submitApplication(1, "申请理由");

      await expect(platform.connect(owner).reviewApplication(1, true))
        .to.emit(platform, "ApplicationReviewed")
        .withArgs(1, 1, owner.address); // Approved = 1

      const application = await platform.getApplication(1);
      expect(application.status).to.equal(1); // Approved
    });

    it("应该能够完成领养并转移NFT", async function () {
      await platform.connect(addr1).submitApplication(1, "申请理由");
      await platform.connect(owner).reviewApplication(1, true);

      await expect(platform.connect(addr1).completeAdoption(1))
        .to.emit(platform, "AdoptionCompleted")
        .withArgs(1, 1, addr1.address);

      const application = await platform.getApplication(1);
      expect(application.status).to.equal(3); // Completed
      expect(await platform.ownerOf(1)).to.equal(addr1.address);
    });
  });

  describe("捐赠管理功能", function () {
    it("应该能够创建捐赠项目", async function () {
      const title = "救助流浪动物";
      const description = "为流浪动物提供食物和医疗";
      const goal = ethers.parseEther("10");

      await expect(platform.connect(addr1).createProject(title, description, goal))
        .to.emit(platform, "ProjectCreated")
        .withArgs(1, addr1.address, title, goal);

      const project = await platform.getProject(1);
      expect(project.title).to.equal(title);
      expect(project.description).to.equal(description);
      expect(project.goal).to.equal(goal);
      expect(project.creator).to.equal(addr1.address);
      expect(project.isActive).to.equal(true);
    });

    it("应该能够进行捐赠", async function () {
      await platform.connect(addr1).createProject(
        "测试项目",
        "测试描述",
        ethers.parseEther("10")
      );

      const donationAmount = ethers.parseEther("1");
      const note = "支持动物保护";

      await expect(
        platform.connect(addr2).donate(1, note, { value: donationAmount })
      )
        .to.emit(platform, "DonationMade")
        .withArgs(1, 1, addr2.address, donationAmount);

      const project = await platform.getProject(1);
      expect(project.currentAmount).to.equal(donationAmount);
    });

    it("只有项目创建者能够提取资金", async function () {
      await platform.connect(addr1).createProject(
        "测试项目",
        "测试描述",
        ethers.parseEther("10")
      );
      await platform.connect(addr2).donate(1, "捐赠", {
        value: ethers.parseEther("5"),
      });

      await expect(
        platform.connect(addr2).withdraw(1, ethers.parseEther("1"))
      ).to.be.revertedWith("Only creator can withdraw");
    });

    it("应该能够提取资金", async function () {
      await platform.connect(addr1).createProject(
        "测试项目",
        "测试描述",
        ethers.parseEther("10")
      );
      await platform.connect(addr2).donate(1, "捐赠", {
        value: ethers.parseEther("5"),
      });

      const withdrawAmount = ethers.parseEther("2");
      const initialBalance = await ethers.provider.getBalance(addr1.address);

      const tx = await platform.connect(addr1).withdraw(1, withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.equal(initialBalance + withdrawAmount - gasUsed);

      const project = await platform.getProject(1);
      expect(project.currentAmount).to.equal(ethers.parseEther("3"));
    });
  });
});

