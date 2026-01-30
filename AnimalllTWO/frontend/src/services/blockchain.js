import { ethers } from 'ethers';

// 合约地址（部署后需要更新）
// 默认使用 Hardhat 本地网络的合约地址
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// 打印区块链配置信息（应用启动时）
console.log('🔗 ========== 区块链配置信息 ==========');
console.log('📋 合约配置:', {
  '合约地址': CONTRACT_ADDRESS,
  '环境变量 REACT_APP_CONTRACT_ADDRESS': process.env.REACT_APP_CONTRACT_ADDRESS || '❌ 未设置（使用默认值）',
  'MetaMask 已安装': typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
});
console.log('========================================');

// 导出合约地址供其他模块使用
export const getContractAddress = () => CONTRACT_ADDRESS;

// 获取合约实例
const getContract = async (signer) => {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '') {
    console.error('❌ 合约地址未配置！');
    throw new Error('合约地址未配置，请设置 REACT_APP_CONTRACT_ADDRESS 环境变量');
  }
  
  // 打印网络和合约调用信息
  try {
    const network = await signer.provider.getNetwork();
    const userAddress = await signer.getAddress();
    const balance = await signer.provider.getBalance(userAddress);
    const chainId = Number(network.chainId);
    
    // 判断是否是本地网络
    const isLocalNetwork = chainId === 1337 || chainId === 31337;
    const networkType = isLocalNetwork 
      ? '✅ Hardhat 本地网络 (Localhost)' 
      : chainId === 1 
        ? '以太坊主网 (Ethereum Mainnet)' 
        : network.name === 'unknown' 
          ? `未知网络 (Chain ID: ${chainId})` 
          : network.name;
    
    console.log('📝 ========== 合约调用信息 ==========');
    console.log('🌐 网络信息:', {
      '链ID (Chain ID)': chainId,
      '链ID (十六进制)': `0x${chainId.toString(16)}`,
      '网络名称': network.name || '未知',
      '网络类型': networkType,
      '是否本地网络': isLocalNetwork ? '✅ 是' : '❌ 否'
    });
    console.log('👤 账户信息:', {
      '用户地址': userAddress,
      '账户余额': `${ethers.formatEther(balance)} ETH`
    });
    console.log('📄 合约信息:', {
      '合约地址': CONTRACT_ADDRESS,
      '合约类型': 'AnimalProtectionPlatform'
    });
    console.log('=====================================');
  } catch (error) {
    console.warn('⚠️ 获取网络信息失败:', error);
  }

  // 这里需要合约 ABI，可以从 Hardhat 编译后的 artifacts 中获取
  // 为了简化，我们使用接口定义
  const contractABI = [
    "function mintAnimalNFT(address to, string memory tokenURI, string memory name, string memory species, string memory breed) public returns (uint256)",
    "function submitApplication(uint256 animalTokenId, string memory reason) public returns (uint256)",
    "function reviewApplication(uint256 applicationId, bool approved) public",
    "function completeAdoption(uint256 applicationId) public",
    "function createProject(string memory title, string memory description, uint256 goal) public returns (uint256)",
    "function donate(uint256 projectId, string memory note) public payable",
    "function getProject(uint256 projectId) public view returns (uint256 projectId, string memory title, string memory description, address creator, uint256 goal, uint256 currentAmount, bool isActive, uint256 createdAt)",
    "function totalSupply() public view returns (uint256)",
    "function balanceOf(address owner) public view returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "event AnimalNFTMinted(uint256 indexed tokenId, address indexed creator, string name, string species)",
    "event ApplicationSubmitted(uint256 indexed applicationId, uint256 indexed animalTokenId, address indexed applicant)",
    "event ProjectCreated(uint256 indexed projectId, address indexed creator, string title, uint256 goal)",
    "event DonationMade(uint256 indexed donationId, uint256 indexed projectId, address indexed donor, uint256 amount)"
  ];

  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

/**
 * 铸造动物NFT
 * @param {Object} params - 参数对象
 * @param {string} params.name - 动物名称
 * @param {string} params.species - 动物种类
 * @param {string} params.breed - 动物品种
 * @param {string} params.metadataURI - NFT元数据URI（IPFS链接）
 * @param {Object} params.signer - ethers Signer 对象
 */
export async function mintAnimalNFT({ name, species, breed, metadataURI, signer }) {
  try {
    if (!signer) {
      throw new Error('请先连接钱包');
    }

    const contract = await getContract(signer);
    const userAddress = await signer.getAddress();

    // 方法1: 在交易发送前，先查询当前的 totalSupply（可选，失败不影响）
    let tokenIdBefore = null;
    try {
      console.log('🔍 查询当前 totalSupply...');
      const result = await contract.totalSupply();
      tokenIdBefore = Number(result);
      console.log('✅ 当前 totalSupply:', tokenIdBefore);
    } catch (e) {
      console.warn('⚠️ 无法查询 totalSupply（合约可能未实现此方法），将尝试其他方法:', e.message);
      // 不影响后续流程
    }

    // 调用合约方法
    console.log('📝 发送铸造NFT交易...');
    const tx = await contract.mintAnimalNFT(
      userAddress,
      metadataURI || `ipfs://metadata/${Date.now()}`,
      name,
      species,
      breed || ''
    );
    console.log('✅ 交易已发送，哈希:', tx.hash);

    // 等待交易确认
    console.log('⏳ 等待交易确认...');
    const receipt = await tx.wait();
    console.log('✅ 交易已确认，区块号:', receipt.blockNumber);
    console.log('📋 交易日志数量:', receipt.logs.length);

    // 从事件中获取 tokenId
    let tokenId = null;
    
    // 方法2: 尝试从事件日志中解析
    if (receipt.logs && receipt.logs.length > 0) {
      console.log('🔍 尝试从事件日志中解析 tokenId...');
      console.log('📋 日志详情:', receipt.logs.map((log, index) => ({
        index,
        address: log.address,
        addressMatches: log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase(),
        topics: log.topics,
        topicsLength: log.topics?.length,
        data: log.data
      })));
      
      // 检查合约地址是否匹配
      const contractAddressLower = CONTRACT_ADDRESS.toLowerCase();
      console.log('📋 合约地址:', CONTRACT_ADDRESS);
      console.log('📋 合约地址(小写):', contractAddressLower);
      
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        const logAddress = log.address?.toLowerCase();
        
        console.log(`🔍 解析日志 ${i}...`);
        console.log(`  地址: ${log.address}`);
        console.log(`  地址匹配: ${logAddress === contractAddressLower}`);
        console.log(`  Topics数量: ${log.topics?.length}`);
        console.log(`  Topics:`, log.topics);
        
        // 检查地址是否匹配
        if (logAddress !== contractAddressLower) {
          console.log(`⚠️ 日志 ${i} 地址不匹配，跳过`);
          continue;
        }
        
        try {
          const parsed = contract.interface.parseLog(log);
          console.log(`✅ 日志 ${i} 解析成功:`, parsed);
          
          if (parsed && parsed.name === 'AnimalNFTMinted') {
            console.log('✅ 找到 AnimalNFTMinted 事件:', parsed);
            tokenId = parsed.args.tokenId.toString();
            console.log('✅ 从事件中获取到 tokenId:', tokenId);
            break;
          } else {
            console.log(`⚠️ 日志 ${i} 不是 AnimalNFTMinted 事件，事件名: ${parsed?.name || '未知'}`);
          }
        } catch (e) {
          console.log(`⚠️ 日志 ${i} 解析失败:`, e.message);
          // 尝试手动解析（如果标准解析失败）
          if (log.topics && log.topics.length >= 2) {
            // AnimalNFTMinted 事件的第一个 topic 是事件签名，第二个 topic 是 tokenId (indexed)
            try {
              // 事件签名: keccak256("AnimalNFTMinted(uint256,address,string,string)")
              // 但我们不知道确切的签名，所以尝试从 topics 中提取
              // 通常第一个 topic 是事件签名，第二个是第一个 indexed 参数（tokenId）
              if (log.topics.length >= 2) {
                try {
                  // 使用 ethers 的 BigNumber 来解析
                  const potentialTokenId = ethers.getBigInt(log.topics[1]).toString();
                  console.log(`💡 尝试从 topics[1] 提取 tokenId: ${potentialTokenId}`);
                  // 不直接使用，因为不确定是否正确
                } catch (bigIntError) {
                  console.log(`⚠️ 无法解析 topics[1] 为 BigInt:`, bigIntError.message);
                }
              }
            } catch (manualParseError) {
              console.log(`⚠️ 手动解析也失败:`, manualParseError.message);
            }
          }
          // 继续尝试下一个日志
          continue;
        }
      }
    } else {
      console.warn('⚠️ 交易日志为空，可能事件未触发或合约版本不匹配');
      console.warn('⚠️ 将尝试通过 totalSupply 或其他方法获取 tokenId');
    }

    // 方法3: 如果事件解析失败，通过查询 totalSupply 获取（交易后应该增加了1）
    if (!tokenId || tokenId === 'null' || tokenId === 'undefined') {
      console.log('⚠️ 事件解析未获取到 tokenId，尝试从合约查询...');
      try {
        // 等待一小段时间确保状态已更新
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 调用合约的 totalSupply 方法获取当前总供应量
        const totalSupplyResult = await contract.totalSupply();
        const totalSupply = Number(totalSupplyResult);
        console.log('✅ 交易后 totalSupply:', totalSupply);
        
        if (totalSupply && totalSupply > 0) {
          // 如果之前获取到了 tokenIdBefore，新的 tokenId 就是 totalSupply
          // 否则，新的 tokenId 就是 totalSupply（因为从1开始计数）
          tokenId = totalSupply.toString();
          console.log('✅ 从合约查询到最新 tokenId:', tokenId);
        }
      } catch (e) {
        console.error('❌ 从合约查询 tokenId 失败:', e.message);
        // 如果查询失败，但之前有 tokenIdBefore，可以推断新的 tokenId
        if (tokenIdBefore !== null && tokenIdBefore !== undefined && !isNaN(tokenIdBefore)) {
          tokenId = (tokenIdBefore + 1).toString();
          console.log('✅ 通过计算推断 tokenId (totalSupply + 1):', tokenId);
        } else {
          console.warn('⚠️ 无法通过 totalSupply 获取 tokenId');
        }
      }
    }

    // 方法4: 如果所有方法都失败，尝试通过区块查询事件
    if (!tokenId || tokenId === 'null' || tokenId === 'undefined') {
      console.log('⚠️ 所有方法都失败，尝试通过区块查询事件...');
      try {
        // 使用 provider 查询事件
        const filter = contract.filters.AnimalNFTMinted();
        const events = await contract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
        
        if (events && events.length > 0) {
          // 找到最新的事件（应该是我们刚创建的）
          const latestEvent = events[events.length - 1];
          tokenId = latestEvent.args.tokenId.toString();
          console.log('✅ 通过区块查询获取到 tokenId:', tokenId);
        } else {
          console.warn('⚠️ 区块查询未找到事件');
        }
      } catch (e) {
        console.error('❌ 通过区块查询事件失败:', e.message);
      }
    }

    // 方法5: 通过查询用户拥有的 NFT 来推断（如果 totalSupply 可用）
    if (!tokenId || tokenId === 'null' || tokenId === 'undefined') {
      console.log('⚠️ 尝试通过查询用户拥有的 NFT 来推断 tokenId...');
      try {
        // 等待状态更新
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 方法5a: 如果之前有 tokenIdBefore，且 totalSupply 查询失败，尝试通过 balanceOf 和遍历
        if (tokenIdBefore !== null && tokenIdBefore !== undefined && !isNaN(tokenIdBefore)) {
          // 尝试查询 balanceOf 来确认用户拥有的 NFT 数量
          try {
            const balance = await contract.balanceOf(userAddress);
            console.log('✅ 用户拥有的 NFT 数量:', balance.toString());
            
            // 如果 balance 增加了，说明新 NFT 已铸造
            // 新的 tokenId 应该是 tokenIdBefore + 1
            tokenId = (tokenIdBefore + 1).toString();
            console.log('✅ 通过计算推断 tokenId (tokenIdBefore + 1):', tokenId);
          } catch (balanceError) {
            console.warn('⚠️ 查询 balanceOf 失败:', balanceError.message);
            // 仍然使用推断方法
            tokenId = (tokenIdBefore + 1).toString();
            console.log('✅ 通过计算推断 tokenId (tokenIdBefore + 1):', tokenId);
          }
        } else {
          // 方法5b: 尝试通过遍历查找用户拥有的最大 tokenId
          console.log('⚠️ 尝试通过遍历查找用户拥有的最大 tokenId...');
          let maxTokenId = 0;
          const maxAttempts = 100; // 最多尝试 100 次
          
          for (let i = 1; i <= maxAttempts; i++) {
            try {
              const owner = await contract.ownerOf(i);
              if (owner.toLowerCase() === userAddress.toLowerCase()) {
                maxTokenId = i;
                console.log(`✅ 找到用户拥有的 tokenId: ${i}`);
              }
            } catch (e) {
              // tokenId 不存在，继续下一个
              break;
            }
          }
          
          if (maxTokenId > 0) {
            tokenId = maxTokenId.toString();
            console.log('✅ 通过遍历找到用户拥有的最大 tokenId:', tokenId);
          }
        }
      } catch (e) {
        console.error('❌ 通过查询用户拥有的 NFT 失败:', e.message);
      }
    }

    // 方法6: 如果仍然没有 tokenId，抛出错误（最后的手段）
    if (!tokenId || tokenId === 'null' || tokenId === 'undefined') {
      console.warn('⚠️ 所有自动获取 tokenId 的方法都失败');
      console.warn('💡 建议：查看 MetaMask 中的交易详情，或联系技术支持');
      
      // 抛出错误，但提供更友好的提示
      throw new Error(`NFT铸造成功，但无法自动获取TokenID。\n` +
        `交易哈希: ${receipt.hash}\n` +
        `请查看 MetaMask 交易详情，或联系技术支持。\n` +
        `您也可以稍后在动物详情页手动输入 TokenID。`);
    }

    // 如果仍然没有 tokenId，抛出错误
    if (!tokenId || tokenId === 'null' || tokenId === 'undefined') {
      console.error('❌ 无法获取 tokenId');
      console.error('交易哈希:', receipt.hash);
      console.error('交易日志:', receipt.logs);
      console.error('交易前 totalSupply:', tokenIdBefore);
      console.error('区块号:', receipt.blockNumber);
      throw new Error(`NFT铸造成功，但无法获取TokenID。\n` +
        `交易哈希: ${receipt.hash}\n` +
        `请查看 MetaMask 交易详情，或联系技术支持。\n` +
        `您也可以稍后在动物详情页手动输入 TokenID。`);
    }

    console.log('✅ NFT铸造成功，TokenID:', tokenId);

    return {
      contract: CONTRACT_ADDRESS,
      tokenId: tokenId,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('铸造NFT失败:', error);
    throw error;
  }
}

/**
 * 提交领养申请
 * @param {Object} params - 参数对象
 * @param {number} params.animalTokenId - 动物NFT代币ID
 * @param {string} params.reason - 领养理由
 * @param {Object} params.signer - ethers Signer 对象
 */
export async function recordAdoptionApplication({ animalTokenId, reason, signer }) {
  try {
    if (!signer) {
      throw new Error('请先连接钱包');
    }

    // 详细的 tokenId 验证和转换
    console.log('🔍 TokenID 验证:', {
      '接收到的值': animalTokenId,
      '类型': typeof animalTokenId,
      '是否为null': animalTokenId === null,
      '是否为undefined': animalTokenId === undefined,
      '是否为空字符串': animalTokenId === ''
    });

    // 确保 animalTokenId 是数字类型
    let tokenIdNum;
    if (animalTokenId === null || animalTokenId === undefined || animalTokenId === '') {
      throw new Error(`动物NFT TokenID无效: 值为 ${animalTokenId}`);
    }
    
    if (typeof animalTokenId === 'string') {
      // 去除可能的空格
      const trimmed = animalTokenId.trim();
      tokenIdNum = parseInt(trimmed, 10);
    } else if (typeof animalTokenId === 'number') {
      tokenIdNum = animalTokenId;
    } else {
      tokenIdNum = Number(animalTokenId);
    }
    
    console.log('🔍 TokenID 转换结果:', {
      '转换后值': tokenIdNum,
      '是否为NaN': isNaN(tokenIdNum),
      '是否小于0': tokenIdNum < 0,
      '是否为整数': Number.isInteger(tokenIdNum)
    });
    
    if (isNaN(tokenIdNum) || tokenIdNum < 0 || !Number.isInteger(tokenIdNum)) {
      throw new Error(`动物NFT TokenID无效: 原始值 "${animalTokenId}" 无法转换为有效的正整数`);
    }

    const contract = await getContract(signer);
    const userAddress = await signer.getAddress();

    console.log('📝 ========== 提交领养申请（链上） ==========');
    console.log('申请信息:', {
      '动物NFT TokenID': tokenIdNum,
      '申请理由': reason || '我想领养这只动物',
      '申请人地址': userAddress
    });
    console.log('⏳ 正在调用智能合约方法 submitApplication...');
    console.log('💡 注意：MetaMask 将弹出确认交易窗口，请确认交易');

    // 调用合约方法（这里会触发 MetaMask 弹出确认交易）
    const tx = await contract.submitApplication(tokenIdNum, reason || '我想领养这只动物');
    
    console.log('✅ 交易已发送到 MetaMask，等待用户确认...');

    console.log('⏳ 交易已发送，等待确认...');
    console.log('交易哈希:', tx.hash);

    // 等待交易确认
    const receipt = await tx.wait();

    // 从事件中获取 applicationId
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'ApplicationSubmitted';
      } catch {
        return false;
      }
    });

    let applicationId = null;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      applicationId = parsed.args.applicationId.toString();
    }

    console.log('✅ 领养申请提交成功:', {
      '申请ID': applicationId,
      '交易哈希': receipt.hash
    });
    console.log('=====================================');

    return {
      txHash: receipt.hash,
      applicationId: applicationId || 'unknown'
    };
  } catch (error) {
    console.error('❌ 提交领养申请失败:', error);
    
    // 提供更友好的错误信息
    if (error.message) {
      if (error.message.includes('user rejected') || error.message.includes('用户拒绝')) {
        throw new Error('用户取消了交易');
      } else if (error.message.includes('insufficient funds') || error.message.includes('余额')) {
        throw new Error('账户余额不足');
      }
    }
    
    throw error;
  }
}

/**
 * 模拟版本（当合约未部署时使用）
 */
export async function mintAnimalNFTMock({ name, species, metadataURI }) {
  await wait(800);
  return {
    contract: '0xFAKE_NFT_CONTRACT',
    tokenId: Math.floor(Math.random() * 1_000_000).toString(),
    txHash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0')
  };
}

export async function recordAdoptionApplicationMock({ animalId, applicant }) {
  await wait(600);
  return {
    txHash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
    matchedOrgId: 'org-' + (1000 + Math.floor(Math.random() * 9000))
  };
}

/**
 * 创建捐赠项目
 * @param {Object} params - 参数对象
 * @param {string} params.title - 项目标题
 * @param {string} params.description - 项目描述
 * @param {number} params.goal - 目标金额（wei，需要将人民币转换为ETH再转为wei）
 * @param {Object} params.signer - ethers Signer 对象
 */
export async function createDonationProject({ title, description, goal, signer }) {
  try {
    if (!signer) {
      throw new Error('请先连接钱包');
    }

    const contract = await getContract(signer);
    
    console.log('📝 ========== 创建捐赠项目 ==========');
    console.log('项目信息:', {
      '标题': title,
      '描述': description,
      '目标金额 (Wei)': goal.toString(),
      '目标金额 (ETH)': ethers.formatEther(goal)
    });

    // 调用合约方法
    const tx = await contract.createProject(title, description, goal);

    // 等待交易确认
    const receipt = await tx.wait();

    // 从事件中获取 projectId
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'ProjectCreated';
      } catch {
        return false;
      }
    });

    let projectId = null;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      projectId = parsed.args.projectId.toString();
    }

    console.log('✅ 项目创建成功:', {
      '项目ID': projectId,
      '交易哈希': receipt.hash
    });
    console.log('=====================================');

    return {
      projectId: projectId || 'unknown',
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('❌ 创建项目失败:', error);
    throw error;
  }
}

/**
 * 进行捐赠
 * @param {Object} params - 参数对象
 * @param {number} params.projectId - 项目ID（链上ID）
 * @param {string} params.note - 捐赠备注
 * @param {number} params.amount - 捐赠金额（wei）
 * @param {Object} params.signer - ethers Signer 对象
 */
export async function makeDonation({ projectId, note, amount, signer }) {
  try {
    if (!signer) {
      throw new Error('请先连接钱包');
    }

    if (!amount || amount <= 0) {
      throw new Error('捐赠金额必须大于0');
    }

    const contract = await getContract(signer);
    const userAddress = await signer.getAddress();
    
    // 确保 projectId 是数字类型
    const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : Number(projectId);
    if (isNaN(projectIdNum) || projectIdNum < 0) {
      throw new Error('项目ID无效');
    }

    console.log('💝 ========== 进行捐赠 ==========');
    console.log('捐赠信息:', {
      '项目ID': projectIdNum,
      '捐赠金额 (Wei)': amount.toString(),
      '捐赠金额 (ETH)': ethers.formatEther(amount),
      '捐赠者地址': userAddress,
      '备注': note || '无'
    });

    // 调用合约方法（payable函数，需要发送ETH）
    const tx = await contract.donate(projectIdNum, note || '', { value: amount });

    // 等待交易确认
    const receipt = await tx.wait();

    // 从事件中获取 donationId
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'DonationMade';
      } catch {
        return false;
      }
    });

    let donationId = null;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      donationId = parsed.args.donationId.toString();
    }

    console.log('✅ 捐赠成功:', {
      '捐赠ID': donationId,
      '交易哈希': receipt.hash
    });
    console.log('=====================================');

    return {
      donationId: donationId || 'unknown',
      txHash: receipt.hash,
      amount: amount.toString()
    };
  } catch (error) {
    console.error('❌ 捐赠失败:', error);
    throw error;
  }
}

/**
 * 获取项目信息
 * @param {Object} params - 参数对象
 * @param {number} params.projectId - 项目ID（链上ID）
 * @param {Object} params.signer - ethers Signer 对象
 */
export async function getProjectInfo({ projectId, signer }) {
  try {
    if (!signer) {
      throw new Error('请先连接钱包');
    }

    const contract = await getContract(signer);
    const project = await contract.getProject(projectId);

    return {
      projectId: project.projectId.toString(),
      title: project.title,
      description: project.description,
      creator: project.creator,
      goal: project.goal.toString(),
      currentAmount: project.currentAmount.toString(),
      isActive: project.isActive,
      createdAt: project.createdAt.toString()
    };
  } catch (error) {
    console.error('获取项目信息失败:', error);
    throw error;
  }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * 获取交易详情（区块号、gas费用等）
 * @param {string} txHash - 交易哈希
 * @param {Object} provider - ethers Provider 对象（可选，如果不提供则尝试从window.ethereum获取）
 * @returns {Promise<Object>} 交易详情对象
 */
export async function getTransactionDetails(txHash, provider = null) {
  try {
    if (!txHash || !txHash.startsWith('0x')) {
      return null;
    }

    // 如果没有提供provider，尝试从window.ethereum获取
    let ethersProvider = provider;
    if (!ethersProvider && typeof window !== 'undefined' && window.ethereum) {
      ethersProvider = new ethers.BrowserProvider(window.ethereum);
    }

    if (!ethersProvider) {
      console.warn('⚠️ 无法获取provider，跳过交易详情查询');
      return null;
    }

    // 获取交易详情
    const tx = await ethersProvider.getTransaction(txHash);
    if (!tx) {
      return null;
    }

    // 获取交易回执（包含区块号、gas使用量等）
    const receipt = await ethersProvider.getTransactionReceipt(txHash);
    if (!receipt) {
      // 如果交易还未确认，只返回基本信息
      return {
        hash: txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value ? ethers.formatEther(tx.value) : '0',
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
        status: 'pending',
        blockNumber: null,
        blockHash: null,
        gasUsed: null,
        confirmations: 0
      };
    }

    // 获取当前区块号以计算确认数
    const currentBlock = await ethersProvider.getBlockNumber();
    const confirmations = receipt.blockNumber ? currentBlock - receipt.blockNumber + 1 : 0;

    // 计算gas费用（gasUsed * gasPrice）
    const gasUsed = receipt.gasUsed || 0n;
    const gasPrice = tx.gasPrice || receipt.gasPrice || 0n;
    const gasFee = gasUsed * gasPrice;
    const gasFeeEth = ethers.formatEther(gasFee);

    return {
      hash: txHash,
      from: tx.from,
      to: tx.to || receipt.to,
      value: tx.value ? ethers.formatEther(tx.value) : '0',
      gasPrice: gasPrice ? ethers.formatUnits(gasPrice, 'gwei') : null,
      gasLimit: tx.gasLimit ? tx.gasLimit.toString() : null,
      gasUsed: gasUsed.toString(),
      gasFee: gasFeeEth,
      status: receipt.status === 1 ? 'success' : 'failed',
      blockNumber: receipt.blockNumber ? receipt.blockNumber.toString() : null,
      blockHash: receipt.blockHash,
      confirmations: confirmations,
      timestamp: null // 需要从区块获取
    };
  } catch (error) {
    console.error('❌ 获取交易详情失败:', error);
    return null;
  }
}



