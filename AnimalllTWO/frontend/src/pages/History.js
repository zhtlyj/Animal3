import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnimals } from '../contexts/AnimalsContext';
import { useWallet } from '../contexts/WalletContext';
import { animalsAPI } from '../services/api';
import { donationsAPI } from '../services/api';
import { getTransactionDetails } from '../services/blockchain';
import { ethers } from 'ethers';
import BackButton from '../components/BackButton';

const History = () => {
  const { user } = useAuth();
  const { animals } = useAnimals();
  const { isConnected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'animals', 'adoptions', 'donations'
  const [txDetailsMap, setTxDetailsMap] = useState({}); // 存储交易详情
  const [loadingTxDetails, setLoadingTxDetails] = useState(false); // 交易详情加载状态

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const historyItems = [];

      // 1. 获取用户发布的动物历史
      if (user.userType === '救助组织') {
        const myAnimals = animals.filter(animal => {
          const publisherId = animal.publisher?._id || animal.publisher || animal.publisherId;
          const userId = user._id || user.id;
          return publisherId?.toString() === userId?.toString();
        });

        myAnimals.forEach(animal => {
          if (animal.history && animal.history.length > 0) {
            animal.history.forEach(record => {
              historyItems.push({
                type: 'animal',
                category: '动物操作',
                animalId: animal._id || animal.id,
                animalName: animal.name,
                animalCover: animal.cover || (animal.media && animal.media[0]) || null,
                record: record,
                timestamp: new Date(record.at),
                blockchain: animal.nft || {}
              });
            });
          }
        });
      }

      // 2. 获取用户的领养申请历史
      if (user.userType === '领养人') {
        try {
          const applicationsResponse = await animalsAPI.getMyApplications();
          if (applicationsResponse && applicationsResponse.success) {
            const applications = applicationsResponse.applications || [];
            applications.forEach(app => {
              // 从动物数据中获取区块链信息（如果存在）
              const blockchain = app.blockchain || {};
              const animal = app.animal || {};
              // 优先使用API返回的animalImage，其次使用animal对象的cover或media
              const animalCover = app.animalImage || animal.cover || (animal.media && animal.media[0]) || null;
              historyItems.push({
                type: 'adoption',
                category: '领养申请',
                animalId: app.animalId || app.animal?._id,
                animalName: app.animalName || app.animal?.name || '未知动物',
                animalCover: animalCover,
                status: app.status,
                message: app.message,
                timestamp: new Date(app.applicationDate || app.createdAt),
                blockchain: blockchain
              });
            });
          }
        } catch (error) {
          console.error('获取领养申请历史失败:', error);
        }
      }

      // 3. 获取用户的捐赠历史
      try {
        const donationsResponse = await donationsAPI.getDonationHistory();
        if (donationsResponse && donationsResponse.success) {
          const donations = donationsResponse.data?.donations || [];
          donations.forEach(donation => {
            historyItems.push({
              type: 'donation',
              category: '捐赠',
              amount: donation.amount,
              method: donation.method,
              projectId: donation.project?._id || donation.projectId,
              projectTitle: donation.project?.title || '通用捐赠',
              txHash: donation.transaction?.txHash || donation.txHash || donation.blockchain?.txHash,
              blockchainDonationId: donation.blockchainDonationId,
              timestamp: new Date(donation.createdAt)
            });
          });
        }
      } catch (error) {
        console.error('获取捐赠历史失败:', error);
      }

      // 按时间排序（最新的在前）
      historyItems.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(historyItems);

      // 获取所有交易哈希并查询区块链详情
      // 即使钱包未连接，也尝试获取交易详情（使用本地RPC）
      if (typeof window !== 'undefined') {
        setLoadingTxDetails(true);
        const txHashes = [];
        historyItems.forEach((item, index) => {
          // 为每个历史记录项生成唯一ID
          const recordTime = item.record?.at ? (typeof item.record.at === 'string' ? item.record.at : new Date(item.record.at).toISOString()) : item.timestamp.toISOString();
          
          if (item.type === 'animal' && item.record?.tx) {
            const itemId = `${item.type}-${item.animalId}-${recordTime}`;
            txHashes.push({ hash: item.record.tx, itemId, index });
            console.log('🔍 添加动物交易:', { hash: item.record.tx, itemId, animalId: item.animalId });
          } else if (item.type === 'adoption' && item.blockchain?.txHash) {
            const itemId = `${item.type}-${item.animalId}-${item.timestamp.toISOString()}`;
            txHashes.push({ hash: item.blockchain.txHash, itemId, index });
            console.log('🔍 添加领养交易:', { hash: item.blockchain.txHash, itemId, animalId: item.animalId });
          } else if (item.type === 'donation' && item.txHash) {
            const itemId = `${item.type}-${item.projectId}-${item.timestamp.toISOString()}`;
            txHashes.push({ hash: item.txHash, itemId, index });
            console.log('🔍 添加捐赠交易:', { hash: item.txHash, itemId, projectId: item.projectId });
          }
        });

        console.log('📋 总共找到', txHashes.length, '个交易哈希');

        if (txHashes.length > 0) {
          // 批量获取交易详情
          const detailsMap = {};
          let provider;
          
          try {
            // 优先使用连接的钱包provider
            if (window.ethereum && isConnected) {
              provider = new ethers.BrowserProvider(window.ethereum);
              console.log('✅ 使用MetaMask Provider');
            } else if (window.ethereum) {
              // 即使未连接，也尝试使用MetaMask的provider
              provider = new ethers.BrowserProvider(window.ethereum);
              console.log('⚠️ 钱包未连接，但尝试使用MetaMask Provider');
            } else {
              // 如果MetaMask不可用，尝试使用本地网络RPC
              const localRpcUrl = 'http://127.0.0.1:8545';
              provider = new ethers.JsonRpcProvider(localRpcUrl);
              console.log('⚠️ MetaMask不可用，尝试使用本地RPC:', localRpcUrl);
            }
          } catch (error) {
            console.error('❌ 创建provider失败:', error);
            // 如果创建provider失败，仍然尝试使用window.ethereum
            if (window.ethereum) {
              try {
                provider = new ethers.BrowserProvider(window.ethereum);
                console.log('✅ 使用备用Provider');
              } catch (e) {
                console.error('❌ 备用Provider也失败:', e);
              }
            }
          }

          if (provider) {
            for (const { hash, itemId, index } of txHashes) {
              try {
                console.log(`⏳ [${index + 1}/${txHashes.length}] 正在获取交易详情:`, hash);
                const details = await getTransactionDetails(hash, provider);
                if (details) {
                  detailsMap[itemId] = details;
                  console.log(`✅ 交易详情获取成功:`, { 
                    itemId, 
                    blockNumber: details.blockNumber, 
                    gasUsed: details.gasUsed,
                    gasFee: details.gasFee,
                    status: details.status
                  });
                } else {
                  console.warn(`⚠️ 交易详情为空:`, hash);
                }
              } catch (error) {
                console.warn(`❌ 获取交易 ${hash} 详情失败:`, error);
              }
            }
            console.log('📊 交易详情映射:', Object.keys(detailsMap).length, '个交易详情已加载');
            setTxDetailsMap(detailsMap);
          } else {
            console.warn('⚠️ 无法创建provider，跳过交易详情查询');
          }
        }
        setLoadingTxDetails(false);
      } else {
        console.warn('⚠️ window 不可用，跳过交易详情查询');
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'animal':
        return '🐾';
      case 'adoption':
        return '❤️';
      case 'donation':
        return '💝';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'pending':
        return '待审核';
      case 'rejected':
        return '已拒绝';
      case 'completed':
        return '已完成';
      default:
        return status || '未知';
    }
  };

  const filteredHistory = activeTab === 'all' 
    ? history 
    : history.filter(item => {
        if (activeTab === 'animals') return item.type === 'animal';
        if (activeTab === 'adoptions') return item.type === 'adoption';
        if (activeTab === 'donations') return item.type === 'donation';
        return true;
      });

  if (!user) {
    return (
      <div className="auth-container">
        <div className="error-message">请先登录</div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1 className="history-title">📜 历史记录</h1>
        <p className="history-subtitle">查看您的所有操作记录</p>
      </div>

      {/* 标签页 */}
      <div className="history-tabs">
        <button
          className={`history-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部
        </button>
        {user.userType === '救助组织' && (
          <button
            className={`history-tab ${activeTab === 'animals' ? 'active' : ''}`}
            onClick={() => setActiveTab('animals')}
          >
            🐾 动物操作
          </button>
        )}
        {user.userType === '领养人' && (
          <button
            className={`history-tab ${activeTab === 'adoptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('adoptions')}
          >
            ❤️ 领养申请
          </button>
        )}
        <button
          className={`history-tab ${activeTab === 'donations' ? 'active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          💝 捐赠记录
        </button>
      </div>

      {/* 历史记录列表 */}
      <div className="history-content">
        {loading ? (
          <div className="loading-message">加载中...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">📭</div>
            <p>暂无历史记录</p>
            <p>开始您的第一次操作吧！</p>
          </div>
        ) : (
          <div className="history-timeline">
            {filteredHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-item-icon">
                  {getTypeIcon(item.type)}
                </div>
                {(item.type === 'animal' || item.type === 'adoption') && item.animalCover && (
                  <div className="history-item-image">
                    <img 
                      src={item.animalCover} 
                      alt={item.animalName || '动物照片'}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=400&auto=format&fit=crop';
                      }}
                    />
                  </div>
                )}
                <div className="history-item-content">
                  <div className="history-item-header">
                    <div className="history-item-title">
                      {item.type === 'animal' && (
                        <>
                          <span className="history-category">{item.category}</span>
                          <span className="history-type">{item.record?.type || '操作'}</span>
                          {item.animalName && (
                            <span className="history-animal-name">- {item.animalName}</span>
                          )}
                        </>
                      )}
                      {item.type === 'adoption' && (
                        <>
                          <span className="history-category">{item.category}</span>
                          <span 
                            className="history-status"
                            style={{ color: getStatusColor(item.status) }}
                          >
                            {getStatusText(item.status)}
                          </span>
                          {item.animalName && (
                            <span className="history-animal-name">- {item.animalName}</span>
                          )}
                        </>
                      )}
                      {item.type === 'donation' && (
                        <>
                          <span className="history-category">{item.category}</span>
                          <span className="history-amount">¥{item.amount}</span>
                          {item.projectTitle && (
                            <span className="history-project">- {item.projectTitle}</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="history-item-time">
                      {item.timestamp.toLocaleString('zh-CN')}
                    </div>
                  </div>
                  
                  <div className="history-item-details">
                    {item.type === 'animal' && item.record && (
                      <>
                        {item.record.details && (
                          <div className="history-detail-text">{item.record.details}</div>
                        )}
                        {item.record.tx && (
                          <div className="blockchain-info">
                            <div className="blockchain-header">
                              <span className="blockchain-icon">⛓️</span>
                              <span className="blockchain-label">区块链信息</span>
                            </div>
                            <div className="blockchain-details">
                              <div className="blockchain-item">
                                <span className="blockchain-key">交易哈希:</span>
                                <span className="blockchain-value">{item.record.tx}</span>
                              </div>
                              {(() => {
                                const recordTime = item.record?.at ? (typeof item.record.at === 'string' ? item.record.at : new Date(item.record.at).toISOString()) : item.timestamp.toISOString();
                                const itemId = `${item.type}-${item.animalId}-${recordTime}`;
                                const txDetails = txDetailsMap[itemId];
                                if (loadingTxDetails && !txDetails) {
                                  return (
                                    <div className="blockchain-loading">
                                      <span>⏳ 正在加载区块链信息...</span>
                                    </div>
                                  );
                                }
                                return txDetails ? (
                                  <>
                                    {txDetails.blockNumber && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">区块号:</span>
                                        <span className="blockchain-value">{txDetails.blockNumber}</span>
                                      </div>
                                    )}
                                    {txDetails.gasUsed && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">Gas使用:</span>
                                        <span className="blockchain-value">{parseInt(txDetails.gasUsed).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {txDetails.gasFee && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">Gas费用:</span>
                                        <span className="blockchain-value">{parseFloat(txDetails.gasFee).toFixed(6)} ETH</span>
                                      </div>
                                    )}
                                    {txDetails.confirmations !== undefined && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">确认数:</span>
                                        <span className="blockchain-value">{txDetails.confirmations}</span>
                                      </div>
                                    )}
                                    {txDetails.status && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">状态:</span>
                                        <span className={`blockchain-status ${txDetails.status}`}>
                                          {txDetails.status === 'success' ? '✅ 成功' : txDetails.status === 'pending' ? '⏳ 待确认' : '❌ 失败'}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {item.type === 'adoption' && (
                      <>
                        {item.message && (
                          <div className="history-detail-text">{item.message}</div>
                        )}
                        {item.blockchain?.txHash && (
                          <div className="blockchain-info">
                            <div className="blockchain-header">
                              <span className="blockchain-icon">⛓️</span>
                              <span className="blockchain-label">区块链信息</span>
                            </div>
                            <div className="blockchain-details">
                              <div className="blockchain-item">
                                <span className="blockchain-key">交易哈希:</span>
                                <span className="blockchain-value">{item.blockchain.txHash}</span>
                              </div>
                              {item.blockchain.applicationId && (
                                <div className="blockchain-item">
                                  <span className="blockchain-key">申请ID:</span>
                                  <span className="blockchain-value">{item.blockchain.applicationId}</span>
                                </div>
                              )}
                              {(() => {
                                const itemId = `${item.type}-${item.animalId}-${item.timestamp.toISOString()}`;
                                const txDetails = txDetailsMap[itemId];
                                if (loadingTxDetails && !txDetails) {
                                  return (
                                    <div className="blockchain-loading">
                                      <span>⏳ 正在加载区块链信息...</span>
                                    </div>
                                  );
                                }
                                return txDetails ? (
                                  <>
                                    {txDetails.blockNumber && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">区块号:</span>
                                        <span className="blockchain-value">{txDetails.blockNumber}</span>
                                      </div>
                                    )}
                                    {txDetails.gasUsed && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">Gas使用:</span>
                                        <span className="blockchain-value">{parseInt(txDetails.gasUsed).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {txDetails.gasFee && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">Gas费用:</span>
                                        <span className="blockchain-value">{parseFloat(txDetails.gasFee).toFixed(6)} ETH</span>
                                      </div>
                                    )}
                                    {txDetails.status && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">状态:</span>
                                        <span className={`blockchain-status ${txDetails.status}`}>
                                          {txDetails.status === 'success' ? '✅ 成功' : txDetails.status === 'pending' ? '⏳ 待确认' : '❌ 失败'}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {item.type === 'donation' && (
                      <>
                        <div className="history-detail-row">
                          <span>支付方式: {item.method}</span>
                        </div>
                        {item.txHash && (
                          <div className="blockchain-info">
                            <div className="blockchain-header">
                              <span className="blockchain-icon">⛓️</span>
                              <span className="blockchain-label">区块链信息</span>
                            </div>
                            <div className="blockchain-details">
                              <div className="blockchain-item">
                                <span className="blockchain-key">交易哈希:</span>
                                <span className="blockchain-value">{item.txHash}</span>
                              </div>
                              {item.blockchainDonationId && (
                                <div className="blockchain-item">
                                  <span className="blockchain-key">捐赠ID:</span>
                                  <span className="blockchain-value">{item.blockchainDonationId}</span>
                                </div>
                              )}
                              {(() => {
                                const itemId = `${item.type}-${item.projectId}-${item.timestamp.toISOString()}`;
                                const txDetails = txDetailsMap[itemId];
                                if (loadingTxDetails && !txDetails) {
                                  return (
                                    <div className="blockchain-loading">
                                      <span>⏳ 正在加载区块链信息...</span>
                                    </div>
                                  );
                                }
                                return txDetails ? (
                                  <>
                                    {txDetails.blockNumber && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">区块号:</span>
                                        <span className="blockchain-value">{txDetails.blockNumber}</span>
                                      </div>
                                    )}
                                    {txDetails.gasUsed && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">Gas使用:</span>
                                        <span className="blockchain-value">{parseInt(txDetails.gasUsed).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {txDetails.gasFee && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">Gas费用:</span>
                                        <span className="blockchain-value">{parseFloat(txDetails.gasFee).toFixed(6)} ETH</span>
                                      </div>
                                    )}
                                    {txDetails.value && parseFloat(txDetails.value) > 0 && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">交易金额:</span>
                                        <span className="blockchain-value highlight">{parseFloat(txDetails.value).toFixed(4)} ETH</span>
                                      </div>
                                    )}
                                    {txDetails.status && (
                                      <div className="blockchain-item">
                                        <span className="blockchain-key">状态:</span>
                                        <span className={`blockchain-status ${txDetails.status}`}>
                                          {txDetails.status === 'success' ? '✅ 成功' : txDetails.status === 'pending' ? '⏳ 待确认' : '❌ 失败'}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="history-item-actions">
                    {item.type === 'animal' && item.animalId && (
                      <a
                        href={`/animals/${item.animalId}`}
                        className="history-action-link"
                      >
                        查看动物详情 →
                      </a>
                    )}
                    {item.type === 'adoption' && item.animalId && (
                      <a
                        href={`/animals/${item.animalId}`}
                        className="history-action-link"
                      >
                        查看动物详情 →
                      </a>
                    )}
                    {item.type === 'donation' && item.projectId && (
                      <a
                        href={`/donate?project=${item.projectId}`}
                        className="history-action-link"
                      >
                        查看项目详情 →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BackButton />
    </div>
  );
};

export default History;

