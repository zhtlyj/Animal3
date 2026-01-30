const hre = require("hardhat");

async function main() {
  // 从命令行参数获取合约地址和参数
  const platformAddress = process.argv[2];
  const recipient = process.argv[3] || process.env.DEPLOYER_ADDRESS;
  const tokenURI = process.argv[4] || "ipfs://QmExampleTokenURI";
  const name = process.argv[5] || "测试动物";
  const species = process.argv[6] || "狗";
  const breed = process.argv[7] || "金毛";

  if (!platformAddress) {
    console.error("请提供 AnimalProtectionPlatform 合约地址");
    console.log("用法: npx hardhat run scripts/mint-nft.js --network localhost <合约地址> [接收者] [tokenURI] [名称] [种类] [品种]");
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("使用账户:", signer.address);

  const AnimalProtectionPlatform = await hre.ethers.getContractFactory("AnimalProtectionPlatform");
  const platform = AnimalProtectionPlatform.attach(platformAddress);

  console.log("\n铸造 NFT...");
  console.log("接收者:", recipient);
  console.log("Token URI:", tokenURI);
  console.log("名称:", name);
  console.log("种类:", species);
  console.log("品种:", breed);

  const tx = await platform.mintAnimalNFT(
    recipient,
    tokenURI,
    name,
    species,
    breed
  );
  await tx.wait();

  const receipt = await hre.ethers.provider.getTransactionReceipt(tx.hash);
  const event = receipt.logs.find(log => {
    try {
      const parsed = platform.interface.parseLog(log);
      return parsed && parsed.name === "AnimalNFTMinted";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = platform.interface.parseLog(event);
    console.log("\n✅ NFT 铸造成功！");
    console.log("Token ID:", parsed.args.tokenId.toString());
    console.log("交易哈希:", tx.hash);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

