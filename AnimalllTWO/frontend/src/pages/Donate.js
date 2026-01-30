import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonation } from '../contexts/DonationContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { createDonationProject, makeDonation } from '../services/blockchain';
import { donationsAPI } from '../services/api';
import { ethers } from 'ethers';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';

// 汇率：1 ETH = 20000 CNY（示例汇率，实际应该从API获取）
const ETH_TO_CNY_RATE = 20000;

// 将人民币金额转换为 Wei
const cnyToWei = (cnyAmount) => {
  const ethAmount = cnyAmount / ETH_TO_CNY_RATE;
  return ethers.parseEther(ethAmount.toString());
};

// 将 Wei 转换为人民币
const weiToCny = (weiAmount) => {
  const ethAmount = parseFloat(ethers.formatEther(weiAmount));
  return (ethAmount * ETH_TO_CNY_RATE).toFixed(2);
};

const Donate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, history, makeDonation: makeDonationAPI, addProject } = useDonation();
  const { account, isConnected, connect } = useWallet();
  const [amount, setAmount] = useState('50');
  const [method, setMethod] = useState('微信');
  const [projectId, setProjectId] = useState('');
  const [toast, setToast] = useState(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [donating, setDonating] = useState(false);

  const [newProj, setNewProj] = useState({ title: '', goal: 1000, description: '', type: '救助' });
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  // 只有救助组织才能创建项目
  const isRescueOrganization = user?.userType === '救助组织';

  // 路由保护：领养人无法访问捐赠中心
  useEffect(() => {
    if (user && user.userType === '领养人') {
      navigate('/home');
    }
  }, [user, navigate]);

  // 如果用户是领养人，不渲染页面内容
  if (user && user.userType === '领养人') {
    return null;
  }

  const submitDonation = async (e) => {
    e.preventDefault();
    setDonating(true);
    
    try {
      const donationAmount = Number(amount);
      
      // 如果选择加密货币支付，调用智能合约
      if (method === '加密货币') {
        if (!isConnected || !account?.signer) {
          showToast('请先连接钱包进行加密货币捐赠', 'error');
          setDonating(false);
          return;
        }

        try {
          // 转换为 Wei
          const amountInWei = cnyToWei(donationAmount);
          
          console.log('💝 ========== 加密货币捐赠 ==========');
          console.log('捐赠信息:', {
            '人民币金额': donationAmount,
            'ETH金额': ethers.formatEther(amountInWei),
            'Wei金额': amountInWei.toString(),
            '项目ID': projectId || '未指定',
            '支付方式': method
          });

          // 如果有指定项目，需要获取链上的项目ID
          let chainProjectId = 0; // 默认0表示未指定项目或通用捐赠
          if (projectId && projectId !== '') {
            // 查找项目，获取链上ID（如果项目有链上ID）
            const selectedProject = projects.find(p => (p.id || p._id) === projectId);
            if (selectedProject) {
              if (selectedProject.blockchain && selectedProject.blockchain.projectId) {
                chainProjectId = parseInt(selectedProject.blockchain.projectId, 10);
                if (isNaN(chainProjectId)) {
                  chainProjectId = 0;
                  console.warn('⚠️ 链上项目ID格式无效，使用通用捐赠');
                } else {
                  console.log('✅ 找到链上项目ID:', chainProjectId);
                }
              } else {
                // 如果没有链上ID，提示用户但继续捐赠
                console.warn('⚠️ 项目未上链，将作为通用捐赠处理');
                // 不显示警告toast，避免打断用户流程
              }
            } else {
              console.warn('⚠️ 未找到指定项目，将作为通用捐赠处理');
            }
          }

          // 调用智能合约
          const nftResult = await makeDonation({
            projectId: chainProjectId,
            note: `捐赠 ¥${donationAmount}，支付方式：${method}`,
            amount: amountInWei,
            signer: account.signer
          });

          // 同时保存到数据库
          const res = await makeDonationAPI({ 
            amount: donationAmount, 
            method, 
            projectId: projectId && projectId !== '' ? projectId : null,
            txHash: nftResult.txHash,
            blockchainDonationId: nftResult.donationId
          });

          showToast(`✅ 加密货币捐赠成功！交易哈希: ${nftResult.txHash.slice(0, 12)}...`, 'success');
          setAmount('50');
        } catch (blockchainError) {
          console.error('❌ 智能合约捐赠失败:', blockchainError);
          
          let errorMsg = '智能合约捐赠失败';
          if (blockchainError.message) {
            if (blockchainError.message.includes('用户拒绝') || blockchainError.message.includes('rejected')) {
              errorMsg = '用户取消了交易';
            } else if (blockchainError.message.includes('余额') || blockchainError.message.includes('balance')) {
              errorMsg = '账户余额不足';
            } else {
              errorMsg = blockchainError.message;
            }
          }
          
          showToast(`❌ ${errorMsg}，请尝试其他支付方式`, 'error');
        }
      } else {
        // 其他支付方式，只保存到数据库
        const res = await makeDonationAPI({ 
          amount: donationAmount, 
          method, 
          projectId: projectId && projectId !== '' ? projectId : null 
        });
        showToast('✅ 捐赠成功，交易已记录：' + (res.txHash ? res.txHash.slice(0, 12) + '...' : 'N/A'), 'success');
        setAmount('50');
      }
    } catch (err) {
      console.error('❌ 捐赠失败:', err);
      showToast(err.message || '捐赠失败', 'error');
    } finally {
      setDonating(false);
    }
  };

  const submitProject = async (e) => {
    e.preventDefault();
    setCreatingProject(true);
    
    try {
      // 第一步：保存到数据库
      const project = await addProject(newProj);
      
      // 第二步：如果钱包已连接，调用智能合约创建项目
      if (isConnected && account?.signer) {
        try {
          // 将目标金额转换为 Wei
          const goalInWei = cnyToWei(newProj.goal);
          
          console.log('📝 ========== 创建捐赠项目 ==========');
          console.log('项目信息:', {
            '标题': newProj.title,
            '描述': newProj.description,
            '目标金额 (¥)': newProj.goal,
            '目标金额 (ETH)': ethers.formatEther(goalInWei),
            '目标金额 (Wei)': goalInWei.toString()
          });

          // 调用智能合约
          const blockchainResult = await createDonationProject({
            title: newProj.title,
            description: newProj.description,
            goal: goalInWei,
            signer: account.signer
          });

          // 更新数据库中的链上项目ID
          try {
            await donationsAPI.updateProject(project.id || project._id, {
              blockchain: {
                projectId: blockchainResult.projectId,
                contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                txHash: blockchainResult.txHash
              }
            });
            console.log('✅ 项目链上信息已保存到数据库');
          } catch (updateError) {
            console.error('❌ 更新项目链上信息失败:', updateError);
            // 不影响成功提示
          }

          showToast(`✅ 项目创建成功！链上项目ID: ${blockchainResult.projectId}`, 'success');
        } catch (blockchainError) {
          console.error('❌ 智能合约创建项目失败:', blockchainError);
          
          // 项目已保存到数据库，只是上链失败
          let errorMsg = '项目已创建，但上链失败';
          if (blockchainError.message) {
            if (blockchainError.message.includes('用户拒绝') || blockchainError.message.includes('rejected')) {
              errorMsg = '项目已创建，但用户取消了上链交易';
            } else {
              errorMsg = `项目已创建，但上链失败: ${blockchainError.message}`;
            }
          }
          
          showToast(errorMsg, 'warning');
        }
      } else {
        // 钱包未连接，只保存到数据库
        showToast('✅ 项目创建成功（未上链，可稍后手动上链）', 'success');
      }
      
      setNewProj({ title: '', goal: 1000, description: '', type: '救助' });
    } catch (err) {
      console.error('❌ 创建项目失败:', err);
      showToast(err.message || '创建失败', 'error');
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <div className="donate-page">
      <div className="donate-header">
        <h1 className="donate-title">捐赠中心</h1>
        <p className="donate-subtitle">
          {isRescueOrganization ? '创建和管理公益项目，筹集资金帮助更多小动物' : '支持多种支付方式，实时显示项目进度'}
        </p>
      </div>

      <div className="donate-main">
        <div className="donate-content">
          {!isRescueOrganization && (
            <div className="donate-section">
              <div className="section-header">
                <h2 className="section-title">💝 立即捐赠</h2>
                <p className="section-subtitle">您的每一份爱心都将帮助更多小动物</p>
              </div>
              
              <form className="donate-form" onSubmit={submitDonation}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">捐赠金额（¥）</label>
                    <div className="amount-input-container">
                      <span className="amount-symbol">¥</span>
                      <input 
                        className="amount-input" 
                        value={amount} 
                        onChange={(e)=>setAmount(e.target.value)} 
                        type="number" 
                        min="1" 
                        placeholder="请输入金额"
                      />
                    </div>
                    <div className="quick-amounts">
                      <button type="button" className="quick-amount" onClick={() => setAmount('50')}>50</button>
                      <button type="button" className="quick-amount" onClick={() => setAmount('100')}>100</button>
                      <button type="button" className="quick-amount" onClick={() => setAmount('200')}>200</button>
                      <button type="button" className="quick-amount" onClick={() => setAmount('500')}>500</button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">支付方式</label>
                    <div className="payment-methods">
                      <label className="payment-option">
                        <input 
                          type="radio" 
                          name="method" 
                          value="微信" 
                          checked={method === '微信'}
                          onChange={(e)=>setMethod(e.target.value)}
                        />
                        <span className="payment-icon">💚</span>
                        <span className="payment-name">微信支付</span>
                      </label>
                      <label className="payment-option">
                        <input 
                          type="radio" 
                          name="method" 
                          value="支付宝" 
                          checked={method === '支付宝'}
                          onChange={(e)=>setMethod(e.target.value)}
                        />
                        <span className="payment-icon">💙</span>
                        <span className="payment-name">支付宝</span>
                      </label>
                      <label className="payment-option">
                        <input 
                          type="radio" 
                          name="method" 
                          value="加密货币" 
                          checked={method === '加密货币'}
                          onChange={(e)=>setMethod(e.target.value)}
                        />
                        <span className="payment-icon">₿</span>
                        <span className="payment-name">加密货币</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">选择项目（可选）</label>
                    <select className="project-select" value={projectId} onChange={(e)=>setProjectId(e.target.value)}>
                      <option value="">不指定项目</option>
                      {projects.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.title}（{p.currentAmount || 0}/{p.goal}）
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {method === '加密货币' && !isConnected && (
                  <div className="wallet-notice" style={{ 
                    marginBottom: '10px', 
                    padding: '10px', 
                    background: '#fff3cd', 
                    borderRadius: '4px', 
                    color: '#856404',
                    fontSize: '14px'
                  }}>
                    💡 加密货币支付需要连接钱包
                    <button 
                      onClick={connect}
                      style={{
                        marginLeft: '10px',
                        padding: '4px 12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      连接钱包
                    </button>
                  </div>
                )}
                <button 
                  className="donate-button" 
                  type="submit"
                  disabled={donating}
                >
                  <span className="button-icon">
                    {donating ? '⏳' : '💝'}
                  </span>
                  {donating ? '捐赠中...' : '立即捐赠'}
                </button>
                {method === '加密货币' && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    💡 提示：¥{amount} ≈ {ethers.formatEther(cnyToWei(Number(amount) || 0))} ETH
                  </div>
                )}
              </form>
            </div>
          )}

          {isRescueOrganization && (
            <div className="donate-section">
              <div className="section-header">
                <h2 className="section-title">🏥 创建公益项目</h2>
                <p className="section-subtitle">救助组织可创建公益项目筹集资金</p>
              </div>
              
              <form className="project-form" onSubmit={submitProject}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">项目标题</label>
                    <input 
                      className="project-input" 
                      value={newProj.title} 
                      onChange={(e)=>setNewProj({...newProj, title: e.target.value})}
                      placeholder="请输入项目标题"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">目标金额（¥）</label>
                    <input 
                      className="project-input" 
                      type="number" 
                      value={newProj.goal} 
                      onChange={(e)=>setNewProj({...newProj, goal: e.target.value})}
                      placeholder="请输入目标金额"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">项目类型</label>
                    <select 
                      className="project-select" 
                      value={newProj.type} 
                      onChange={(e)=>setNewProj({...newProj, type: e.target.value})}
                    >
                      <option value="救助">救助</option>
                      <option value="医疗">医疗</option>
                      <option value="设施">设施</option>
                      <option value="教育">教育</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="form-label">项目描述</label>
                    <textarea 
                      className="project-textarea" 
                      rows={4} 
                      value={newProj.description} 
                      onChange={(e)=>setNewProj({...newProj, description: e.target.value})}
                      placeholder="请详细描述项目内容、目标和意义..."
                    />
                  </div>
                </div>

                {!isConnected && (
                  <div className="wallet-notice" style={{ 
                    marginBottom: '10px', 
                    padding: '10px', 
                    background: '#fff3cd', 
                    borderRadius: '4px', 
                    color: '#856404',
                    fontSize: '14px'
                  }}>
                    💡 连接钱包后创建项目，将自动上链
                    <button 
                      onClick={connect}
                      style={{
                        marginLeft: '10px',
                        padding: '4px 12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      连接钱包
                    </button>
                  </div>
                )}
                <button 
                  className="project-button" 
                  type="submit"
                  disabled={creatingProject}
                >
                  <span className="button-icon">
                    {creatingProject ? '⏳' : '🚀'}
                  </span>
                  {creatingProject ? '创建中...' : '创建项目'}
                </button>
                {isConnected && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    💡 提示：目标金额 ¥{newProj.goal} ≈ {ethers.formatEther(cnyToWei(newProj.goal))} ETH
                  </div>
                )}
              </form>
            </div>
          )}

          {!isRescueOrganization && (
            <div className="donate-section">
              <div className="section-header">
                <h2 className="section-title">📊 我的捐赠记录</h2>
                <p className="section-subtitle">查看您的爱心捐赠历史</p>
              </div>
              
              <div className="donation-history">
                {history.length === 0 ? (
                  <div className="empty-history">
                    <div className="empty-icon">💝</div>
                    <p>暂无捐赠记录</p>
                    <p>开始您的第一次爱心捐赠吧！</p>
                  </div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className="history-item">
                      <div className="history-header">
                        <div className="history-amount">¥{h.amount}</div>
                        <div className="history-method">{h.method}</div>
                      </div>
                      <div className="history-details">
                        <div className="history-time">{new Date(h.createdAt).toLocaleString()}</div>
                        <div className="history-tx">
                          TX: {h.transaction?.txHash ? h.transaction.txHash.slice(0, 12) + '...' : 'N/A'}
                        </div>
                        {h.project && (
                          <div className="history-project">项目：{h.project.title || h.project}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <BackButton />
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Donate;



