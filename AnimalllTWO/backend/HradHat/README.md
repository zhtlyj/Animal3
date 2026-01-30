# 动物保护平台智能合约

基于 Hardhat 框架的智能合约项目，用于动物保护公益与领养平台的区块链功能。

## 项目结构

```
HradHat/
├── contracts/          # 智能合约源码
│   └── AnimalProtectionPlatform.sol  # 综合智能合约（包含NFT、领养、捐赠功能）
├── scripts/           # 部署脚本
│   ├── deploy.js      # 部署合约
│   └── mint-nft.js    # NFT铸造脚本
├── test/              # 测试文件
│   └── AnimalProtectionPlatform.test.js
├── hardhat.config.js  # Hardhat配置文件
└── package.json       # 项目依赖
```

## 安装依赖

```bash
cd HradHat
npm install
```

## 编译合约

```bash
npm run compile
```

## 运行测试

```bash
npm run test
```

## 启动本地节点

```bash
npm run node
```

这将启动一个本地的 Hardhat 网络节点，默认运行在 `http://127.0.0.1:8545`。

## 部署合约

### 部署到本地节点

1. 在一个终端启动本地节点：
```bash
npm run node
```

2. 在另一个终端部署合约：
```bash
npm run deploy:localhost
```

### 部署到其他网络

修改 `hardhat.config.js` 中的网络配置，然后运行：

```bash
npx hardhat run scripts/deploy.js --network <网络名称>
```

## 智能合约说明

### AnimalProtectionPlatform

综合智能合约，整合了NFT铸造、领养管理和捐赠管理三大功能模块。

**NFT 功能：**
- `mintAnimalNFT()`: 铸造动物NFT
- `getAnimalInfo()`: 获取动物信息
- `totalSupply()`: 获取总铸造数量

**领养管理功能：**
- `submitApplication()`: 提交领养申请
- `reviewApplication()`: 审核领养申请（仅所有者）
- `completeAdoption()`: 完成领养（自动转移NFT所有权）

**捐赠管理功能：**
- `createProject()`: 创建捐赠项目
- `donate()`: 进行捐赠
- `withdraw()`: 提取资金（仅项目创建者）
- `deactivateProject()`: 停用项目（仅所有者）

## 环境变量

创建 `.env` 文件（可选，用于部署到测试网或主网）：

```env
PRIVATE_KEY=你的私钥
SEPOLIA_URL=https://sepolia.infura.io/v3/你的API密钥
```

## 开发说明

- Solidity 版本: 0.8.20
- 使用 OpenZeppelin 合约库确保安全性
- 所有合约都经过测试覆盖

## 许可证

MIT

