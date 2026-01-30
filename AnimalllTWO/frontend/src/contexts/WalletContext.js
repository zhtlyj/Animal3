import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectWallet, disconnectWallet, getCurrentAccount, onAccountsChanged, onChainChanged, isMetaMaskInstalled } from '../services/wallet';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // 检查是否已连接钱包
  const checkConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isMetaMaskInstalled()) {
        setLoading(false);
        return;
      }

      const walletInfo = await getCurrentAccount();
      if (walletInfo) {
        setAccount(walletInfo);
        setIsConnected(true);
      } else {
        setAccount(null);
        setIsConnected(false);
      }
    } catch (err) {
      console.error('检查钱包连接失败:', err);
      setError(err.message);
      setAccount(null);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 连接钱包
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const walletInfo = await connectWallet();
      setAccount(walletInfo);
      setIsConnected(true);
      
      // 保存到本地存储
      localStorage.setItem('walletConnected', 'true');
      
      return walletInfo;
    } catch (err) {
      console.error('连接钱包失败:', err);
      setError(err.message);
      setAccount(null);
      setIsConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 断开钱包
  const disconnect = useCallback(() => {
    try {
      disconnectWallet();
      setAccount(null);
      setIsConnected(false);
      localStorage.removeItem('walletConnected');
      setError(null);
    } catch (err) {
      console.error('断开钱包失败:', err);
      setError(err.message);
    }
  }, []);

  // 刷新账户信息
  const refreshAccount = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      const walletInfo = await getCurrentAccount();
      if (walletInfo) {
        setAccount(walletInfo);
      } else {
        setAccount(null);
        setIsConnected(false);
        localStorage.removeItem('walletConnected');
      }
    } catch (err) {
      console.error('刷新账户失败:', err);
      setAccount(null);
      setIsConnected(false);
      localStorage.removeItem('walletConnected');
    }
  }, [isConnected]);

  // 初始化：检查是否已连接
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    if (wasConnected) {
      checkConnection();
    } else {
      setLoading(false);
    }
  }, [checkConnection]);

  // 监听账户变化
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const cleanupAccounts = onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        // 用户断开连接
        setAccount(null);
        setIsConnected(false);
        localStorage.removeItem('walletConnected');
      } else {
        // 账户切换，刷新信息
        refreshAccount();
      }
    });

    const cleanupChain = onChainChanged(() => {
      // 网络切换，刷新信息
      refreshAccount();
    });

    return () => {
      if (cleanupAccounts) cleanupAccounts();
      if (cleanupChain) cleanupChain();
    };
  }, [refreshAccount]);

  const value = {
    account,
    isConnected,
    loading,
    error,
    connect,
    disconnect,
    refreshAccount,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

