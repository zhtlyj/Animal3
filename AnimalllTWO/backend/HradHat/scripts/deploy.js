const hre = require("hardhat");

async function main() {
  console.log("开始部署智能合约...\n");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // 部署 AnimalProtectionPlatform 综合合约
  console.log("\n部署 AnimalProtectionPlatform 合约...");
  const AnimalProtectionPlatform = await hre.ethers.getContractFactory("AnimalProtectionPlatform");
  const platform = await AnimalProtectionPlatform.deploy();
  await platform.waitForDeployment();
  const platformAddress = await platform.getAddress();
  console.log("AnimalProtectionPlatform 合约地址:", platformAddress);

  console.log("\n✅ 合约部署完成！");
  console.log("\n合约地址:", platformAddress);
  console.log("\n合约功能:");
  console.log("- NFT 铸造和管理");
  console.log("- 领养申请和审核");
  console.log("- 捐赠项目管理");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

