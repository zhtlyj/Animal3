// import { ethers } from 'ethers';

// // 检查是否安装了 MetaMask
// export const isMetaMaskInstalled = () => {
//   return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
// };

// // 获取 MetaMask 提供者
// export const getProvider = () => {
//   if (!isMetaMaskInstalled()) {
//     throw new Error('请先安装 MetaMask 钱包');
//   }
//   return new ethers.BrowserProvider(window.ethereum);
// };

// // 连接钱包
// export const connectWallet = async () => {
//   try {
//     if (!isMetaMaskInstalled()) {
//       throw new Error('请先安装 MetaMask 钱包。访问 https://metamask.io/ 下载安装。');
//     }

//     const provider = getProvider();
    
//     // 请求账户访问权限
//     const accounts = await provider.send('eth_requestAccounts', []);
    
//     if (accounts.length === 0) {
//       throw new Error('未获取到账户，请授权访问');
//     }

//     // 获取签名者
//     const signer = await provider.getSigner();
//     const address = await signer.getAddress();
//     const balance = await provider.getBalance(address);
    
//     // 获取网络信息
//     const network = await provider.getNetwork();
    
//     // 获取更详细的网络信息
//     const chainId = Number(network.chainId);
//     const blockNumber = await provider.getBlockNumber();
//     const gasPrice = await provider.getFeeData();
    
//     // 检测是否是本地网络（通过 RPC URL 或 chainId）
//     const isLocalNetwork = chainId === 1337 || chainId === 31337 || 
//                           (window.ethereum && (
//                             window.ethereum.chainId === '0x539' || 
//                             window.ethereum.chainId === '0x7a69' ||
//                             chainId.toString(16) === '539' ||
//                             chainId.toString(16) === '7a69'
//                           ));
    
//     // 获取 RPC URL（如果可用）
//     let rpcUrl = 'N/A';
//     try {
//       if (window.ethereum && window.ethereum._state && window.ethereum._state.accounts) {
//         // 尝试从 provider 获取 RPC 信息
//         rpcUrl = provider.connection?.url || 'MetaMask Provider';
//       }
//     } catch (e) {
//       // 忽略错误
//     }
    
//     // 打印详细的网络连接信息
//     console.log('🔗 ========== 钱包连接成功 ==========');
//     console.log('🌐 网络信息:', {
//       '链ID (Chain ID)': chainId,
//       '链ID (十六进制)': `0x${chainId.toString(16)}`,
//       '网络名称': network.name || '未知网络',
//       '网络类型': getNetworkType(chainId),
//       '是否本地网络': isLocalNetwork ? '✅ 是 (Hardhat Local)' : '❌ 否',
//       '当前区块高度': blockNumber,
//       'Gas价格': gasPrice.gasPrice ? `${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} Gwei` : 'N/A',
//       'RPC提供者': rpcUrl
//     });
//     console.log('👤 账户信息:', {
//       '钱包地址': address,
//       '账户余额': `${ethers.formatEther(balance)} ETH`,
//       '账户余额 (Wei)': balance.toString()
//     });
//     console.log('🔧 提供者信息:', {
//       'Provider类型': provider.constructor.name,
//       '连接状态': '已连接'
//     });
//     console.log('=====================================');

//     return {
//       address,
//       balance: ethers.formatEther(balance),
//       network: {
//         chainId: chainId,
//         name: network.name
//       },
//       provider,
//       signer
//     };
//   } catch (error) {
//     console.error('❌ 连接钱包失败:', error);
//     throw error;
//   }
// };

// // 获取网络类型名称
// const getNetworkType = (chainId) => {
//   const networkMap = {
//     1: '以太坊主网 (Ethereum Mainnet)',
//     3: 'Ropsten 测试网 (已废弃)',
//     4: 'Rinkeby 测试网 (已废弃)',
//     5: 'Goerli 测试网',
//     11155111: 'Sepolia 测试网',
//     1337: '✅ Hardhat 本地网络 (Localhost)',
//     31337: '✅ Hardhat 本地网络 (Localhost)',
//     80001: 'Polygon Mumbai 测试网',
//     137: 'Polygon 主网',
//     56: 'BSC 主网',
//     97: 'BSC 测试网',
//     42161: 'Arbitrum 主网',
//     421611: 'Arbitrum 测试网',
//     10: 'Optimism 主网',
//     420: 'Optimism Goerli 测试网'
//   };
  
//   // 如果是本地网络，优先显示
//   if (chainId === 1337 || chainId === 31337) {
//     return networkMap[chainId];
//   }
  
//   return networkMap[chainId] || `未知网络 (Chain ID: ${chainId})`;
// };

// // 断开钱包连接（实际上只是清除本地状态）
// export const disconnectWallet = () => {
//   // MetaMask 不支持程序化断开，用户需要在 MetaMask 中手动断开
//   return true;
// };

// // 获取当前连接的账户
// export const getCurrentAccount = async () => {
//   try {
//     if (!isMetaMaskInstalled()) {
//       console.log('⚠️ MetaMask 未安装');
//       return null;
//     }

//     const provider = getProvider();
//     const accounts = await provider.send('eth_accounts', []);
    
//     if (accounts.length === 0) {
//       console.log('⚠️ 未检测到已连接的账户');
//       return null;
//     }

//     const signer = await provider.getSigner();
//     const address = await signer.getAddress();
//     const balance = await provider.getBalance(address);
//     const network = await provider.getNetwork();
//     const chainId = Number(network.chainId);
//     const blockNumber = await provider.getBlockNumber();

//     // 检测是否是本地网络
//     const isLocalNetwork = chainId === 1337 || chainId === 31337;
    
//     // 打印当前账户信息
//     console.log('📊 ========== 当前账户信息 ==========');
//     console.log('🌐 网络信息:', {
//       '链ID': chainId,
//       '链ID (十六进制)': `0x${chainId.toString(16)}`,
//       '网络名称': network.name || '未知',
//       '网络类型': getNetworkType(chainId),
//       '是否本地网络': isLocalNetwork ? '✅ 是 (Hardhat Local)' : '❌ 否',
//       '当前区块': blockNumber
//     });
//     console.log('👤 账户信息:', {
//       '地址': address,
//       '余额': `${ethers.formatEther(balance)} ETH`
//     });
//     console.log('=====================================');

//     return {
//       address,
//       balance: ethers.formatEther(balance),
//       network: {
//         chainId: chainId,
//         name: network.name
//       },
//       provider,
//       signer
//     };
//   } catch (error) {
//     console.error('❌ 获取账户失败:', error);
//     return null;
//   }
// };

// // 监听账户变化
// export const onAccountsChanged = (callback) => {
//   if (!isMetaMaskInstalled()) {
//     return null;
//   }

//   window.ethereum.on('accountsChanged', callback);
  
//   // 返回清理函数
//   return () => {
//     window.ethereum.removeListener('accountsChanged', callback);
//   };
// };

// // 监听网络变化
// export const onChainChanged = (callback) => {
//   if (!isMetaMaskInstalled()) {
//     return null;
//   }

//   window.ethereum.on('chainChanged', callback);
  
//   // 返回清理函数
//   return () => {
//     window.ethereum.removeListener('chainChanged', callback);
//   };
// };

// // 切换网络（切换到本地 Hardhat 网络或测试网）
// export const switchNetwork = async (chainId) => {
//   try {
//     if (!isMetaMaskInstalled()) {
//       throw new Error('请先安装 MetaMask 钱包');
//     }

//     const provider = getProvider();
    
//     // 尝试切换网络
//     await provider.send('wallet_switchEthereumChain', [{ chainId: `0x${chainId.toString(16)}` }]);
    
//     return true;
//   } catch (error) {
//     // 如果网络不存在，尝试添加网络
//     if (error.code === 4902) {
//       throw new Error('请先在 MetaMask 中添加该网络');
//     }
//     throw error;
//   }
// };

// // 添加本地 Hardhat 网络到 MetaMask
// export const addHardhatNetwork = async () => {
//   try {
//     if (!isMetaMaskInstalled()) {
//       throw new Error('请先安装 MetaMask 钱包');
//     }

//     await window.ethereum.request({
//       method: 'wallet_addEthereumChain',
//       params: [{
//         chainId: '0x539', // 1337 in hex
//         chainName: 'Hardhat Local',
//         nativeCurrency: {
//           name: 'Ether',
//           symbol: 'ETH',
//           decimals: 18
//         },
//         rpcUrls: ['http://127.0.0.1:8545'],
//         blockExplorerUrls: null
//       }]
//     });

//     return true;
//   } catch (error) {
//     console.error('添加网络失败:', error);
//     throw error;
//   }
// };

// // 格式化地址（显示前6位和后4位）
// export const formatAddress = (address) => {
//   if (!address) return '';
//   return `${address.slice(0, 6)}...${address.slice(-4)}`;
// };

// // 格式化余额
// export const formatBalance = (balance) => {
//   if (!balance) return '0.00';
//   const num = parseFloat(balance);
//   return num.toFixed(4);
// };

import { ethers } from 'ethers';

// 检查是否安装了 MetaMask
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// 获取 MetaMask 提供者
export const getProvider = () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('请先安装 MetaMask 钱包');
  }
  return new ethers.BrowserProvider(window.ethereum);
};

// 连接钱包
export const connectWallet = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('请先安装 MetaMask 钱包。访问 https://metamask.io/ 下载安装。');
    }

    const provider = getProvider();
    
    // 请求账户访问权限
    const accounts = await provider.send('eth_requestAccounts', []);
    
    if (accounts.length === 0) {
      throw new Error('未获取到账户，请授权访问');
    }

    // 检查当前网络，如果不是 localhost，自动切换
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);
    const localhostChainId = 1337; // Hardhat 默认 chainId
    
    // 如果不是 localhost 网络，尝试切换
    if (currentChainId !== localhostChainId && currentChainId !== 31337) {
      console.log(`🔄 当前网络 Chain ID: ${currentChainId}，尝试切换到 localhost 网络 (Chain ID: ${localhostChainId})...`);
      
      try {
        // 尝试切换到 localhost 网络
        await provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${localhostChainId.toString(16)}` }
        ]);
        console.log('✅ 已切换到 localhost 网络');
      } catch (switchError) {
        // 如果网络不存在（错误码 4902），尝试添加网络
        if (switchError.code === 4902) {
          console.log('⚠️ localhost 网络不存在，尝试添加...');
          try {
            await addHardhatNetwork();
            console.log('✅ localhost 网络已添加，请重新连接钱包');
            // 添加网络后，再次尝试切换
            await provider.send('wallet_switchEthereumChain', [
              { chainId: `0x${localhostChainId.toString(16)}` }
            ]);
            console.log('✅ 已切换到 localhost 网络');
          } catch (addError) {
            console.warn('⚠️ 添加 localhost 网络失败:', addError);
            console.warn('💡 提示：请手动在 MetaMask 中添加 localhost 网络');
            // 继续使用当前网络，不抛出错误
          }
        } else {
          console.warn('⚠️ 切换网络失败:', switchError);
          console.warn('💡 提示：将使用当前网络继续操作');
          // 继续使用当前网络，不抛出错误
        }
      }
    } else {
      console.log('✅ 当前已连接到 localhost 网络');
    }

    // 重新获取网络信息（可能已切换）
    const updatedNetwork = await provider.getNetwork();
    
    // 获取签名者
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    
    // 获取更详细的网络信息
    const chainId = Number(updatedNetwork.chainId);
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getFeeData();
    
    // 检测是否是本地网络（通过 RPC URL 或 chainId）
    const isLocalNetwork = chainId === 1337 || chainId === 31337 || 
                          (window.ethereum && (
                            window.ethereum.chainId === '0x539' || 
                            window.ethereum.chainId === '0x7a69' ||
                            chainId.toString(16) === '539' ||
                            chainId.toString(16) === '7a69'
                          ));
    
    // 获取 RPC URL（如果可用）
    let rpcUrl = 'N/A';
    try {
      if (window.ethereum && window.ethereum._state && window.ethereum._state.accounts) {
        // 尝试从 provider 获取 RPC 信息
        rpcUrl = provider.connection?.url || 'MetaMask Provider';
      }
    } catch (e) {
      // 忽略错误
    }
    
    // 打印详细的网络连接信息
    console.log('🔗 ========== 钱包连接成功 ==========');
    console.log('🌐 网络信息:', {
      '链ID (Chain ID)': chainId,
      '链ID (十六进制)': `0x${chainId.toString(16)}`,
      '网络名称': network.name || '未知网络',
      '网络类型': getNetworkType(chainId),
      '是否本地网络': isLocalNetwork ? '✅ 是 (Hardhat Local)' : '❌ 否',
      '当前区块高度': blockNumber,
      'Gas价格': gasPrice.gasPrice ? `${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} Gwei` : 'N/A',
      'RPC提供者': rpcUrl
    });
    console.log('👤 账户信息:', {
      '钱包地址': address,
      '账户余额': `${ethers.formatEther(balance)} ETH`,
      '账户余额 (Wei)': balance.toString()
    });
    console.log('🔧 提供者信息:', {
      'Provider类型': provider.constructor.name,
      '连接状态': '已连接'
    });
    console.log('=====================================');

    return {
      address,
      balance: ethers.formatEther(balance),
      network: {
        chainId: chainId,
        name: network.name
      },
      provider,
      signer
    };
  } catch (error) {
    console.error('❌ 连接钱包失败:', error);
    throw error;
  }
};

// 获取网络类型名称
const getNetworkType = (chainId) => {
  const networkMap = {
    1: '以太坊主网 (Ethereum Mainnet)',
    3: 'Ropsten 测试网 (已废弃)',
    4: 'Rinkeby 测试网 (已废弃)',
    5: 'Goerli 测试网',
    11155111: 'Sepolia 测试网',
    1337: '✅ Hardhat 本地网络 (Localhost)',
    31337: '✅ Hardhat 本地网络 (Localhost)',
    80001: 'Polygon Mumbai 测试网',
    137: 'Polygon 主网',
    56: 'BSC 主网',
    97: 'BSC 测试网',
    42161: 'Arbitrum 主网',
    421611: 'Arbitrum 测试网',
    10: 'Optimism 主网',
    420: 'Optimism Goerli 测试网'
  };
  
  // 如果是本地网络，优先显示
  if (chainId === 1337 || chainId === 31337) {
    return networkMap[chainId];
  }
  
  return networkMap[chainId] || `未知网络 (Chain ID: ${chainId})`;
};

// 断开钱包连接（实际上只是清除本地状态）
export const disconnectWallet = () => {
  // MetaMask 不支持程序化断开，用户需要在 MetaMask 中手动断开
  return true;
};

// 获取当前连接的账户
export const getCurrentAccount = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      console.log('⚠️ MetaMask 未安装');
      return null;
    }

    const provider = getProvider();
    const accounts = await provider.send('eth_accounts', []);
    
    if (accounts.length === 0) {
      console.log('⚠️ 未检测到已连接的账户');
      return null;
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const blockNumber = await provider.getBlockNumber();

    // 检测是否是本地网络
    const isLocalNetwork = chainId === 1337 || chainId === 31337;
    
    // 打印当前账户信息
    console.log('📊 ========== 当前账户信息 ==========');
    console.log('🌐 网络信息:', {
      '链ID': chainId,
      '链ID (十六进制)': `0x${chainId.toString(16)}`,
      '网络名称': network.name || '未知',
      '网络类型': getNetworkType(chainId),
      '是否本地网络': isLocalNetwork ? '✅ 是 (Hardhat Local)' : '❌ 否',
      '当前区块': blockNumber
    });
    console.log('👤 账户信息:', {
      '地址': address,
      '余额': `${ethers.formatEther(balance)} ETH`
    });
    console.log('=====================================');

    return {
      address,
      balance: ethers.formatEther(balance),
      network: {
        chainId: chainId,
        name: network.name
      },
      provider,
      signer
    };
  } catch (error) {
    console.error('❌ 获取账户失败:', error);
    return null;
  }
};

// 监听账户变化
export const onAccountsChanged = (callback) => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  window.ethereum.on('accountsChanged', callback);
  
  // 返回清理函数
  return () => {
    window.ethereum.removeListener('accountsChanged', callback);
  };
};

// 监听网络变化
export const onChainChanged = (callback) => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  window.ethereum.on('chainChanged', callback);
  
  // 返回清理函数
  return () => {
    window.ethereum.removeListener('chainChanged', callback);
  };
};

// 切换网络（切换到本地 Hardhat 网络或测试网）
export const switchNetwork = async (chainId) => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('请先安装 MetaMask 钱包');
    }

    const provider = getProvider();
    
    // 尝试切换网络
    await provider.send('wallet_switchEthereumChain', [{ chainId: `0x${chainId.toString(16)}` }]);
    
    return true;
  } catch (error) {
    // 如果网络不存在，尝试添加网络
    if (error.code === 4902) {
      throw new Error('请先在 MetaMask 中添加该网络');
    }
    throw error;
  }
};

// 添加本地 Hardhat 网络到 MetaMask
export const addHardhatNetwork = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('请先安装 MetaMask 钱包');
    }

    console.log('➕ 正在添加 Hardhat 本地网络到 MetaMask...');
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x539', // 1337 in hex (Hardhat 默认)
        chainName: 'Hardhat Local',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['http://127.0.0.1:8545'],
        blockExplorerUrls: [] // 本地网络没有区块浏览器
      }]
    });

    console.log('✅ Hardhat 本地网络已成功添加到 MetaMask');
    return true;
  } catch (error) {
    console.error('❌ 添加网络失败:', error);
    
    // 如果是用户拒绝，给出友好提示
    if (error.code === 4001) {
      throw new Error('用户拒绝了添加网络的请求');
    }
    
    throw error;
  }
};

// 格式化地址（显示前6位和后4位）
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 格式化余额
export const formatBalance = (balance) => {
  if (!balance) return '0.00';
  const num = parseFloat(balance);
  return num.toFixed(4);
};

