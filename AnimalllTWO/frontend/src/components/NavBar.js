import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnimals } from '../contexts/AnimalsContext';
import { useWallet } from '../contexts/WalletContext';
import { animalsAPI } from '../services/api';
import { formatAddress, formatBalance } from '../services/wallet';

const NavBar = () => {
  const { user, logout } = useAuth();
  const { animals } = useAnimals();
  const { account, isConnected, loading: walletLoading, connect, disconnect, isMetaMaskInstalled } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [myApplicationsCount, setMyApplicationsCount] = useState(0);

  // 计算当前用户发布的动物数量
  const myAnimalsCount = useMemo(() => {
    if (!user) return 0;
    return animals.filter(animal => 
      animal.publisher === user._id || 
      animal.publisher === user.id ||
      animal.publisherId === user._id ||
      animal.publisherId === user.id
    ).length;
  }, [animals, user]);

  // 获取领养人的申请记录数量
  useEffect(() => {
    const fetchApplicationsCount = async () => {
      if (user && user.userType === '领养人') {
        try {
          console.log('NavBar: 开始获取申请记录数量，用户ID:', user._id || user.id);
          const response = await animalsAPI.getMyApplications();
          console.log('NavBar: API响应:', response);
          if (response && response.success) {
            const count = response.applications?.length || 0;
            console.log('NavBar: 申请记录数量:', count);
            setMyApplicationsCount(count);
          } else {
            console.error('NavBar: 获取申请记录失败:', response?.error || response?.message);
            setMyApplicationsCount(0);
          }
        } catch (error) {
          console.error('NavBar: 获取申请记录异常:', error);
          setMyApplicationsCount(0);
        }
      } else {
        // 如果不是领养人，重置为0
        setMyApplicationsCount(0);
      }
    };
    fetchApplicationsCount();
  }, [user]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleUserClick = () => {
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
      setShowWalletModal(false);
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
    setShowWalletModal(false);
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="brand">动物保护公益与领养平台</Link>
      </div>
      <div className="navbar-right">
        <Link 
          to="/home" 
          className={`nav-link ${isActive('/home') ? 'active' : ''}`}
        >
          首页
        </Link>
        {/* 捐赠中心：仅救助组织可见，游客和领养人不可见 */}
        {user && user.userType === '救助组织' && (
          <Link 
            to="/donate" 
            className={`nav-link ${isActive('/donate') ? 'active' : ''}`}
          >
            💝 捐赠中心
          </Link>
        )}
        {user && user.userType === '救助组织' && (
          <>
          <Link 
            to="/publish" 
            className={`nav-link ${isActive('/publish') ? 'active' : ''}`}
          >
            发布动物
          </Link>
            <Link 
              to="/my-animals" 
              className={`nav-link ${isActive('/my-animals') ? 'active' : ''}`}
            >
              我的发布
            </Link>
            <Link 
              to="/adoption-management" 
              className={`nav-link ${isActive('/adoption-management') ? 'active' : ''}`}
            >
              申请管理
            </Link>
          </>
        )}
        {user && user.userType === '领养人' && (
          <>
            <Link 
              to="/my-adoptions" 
              className={`nav-link ${isActive('/my-adoptions') ? 'active' : ''}`}
            >
              我的申请
            </Link>
            <Link 
              to="/my-adopted-animals" 
              className={`nav-link ${isActive('/my-adopted-animals') ? 'active' : ''}`}
            >
              我的领养动物
            </Link>
          </>
        )}
        {user && (
          <Link 
            to="/history" 
            className={`nav-link ${isActive('/history') ? 'active' : ''}`}
          >
            📜 历史记录
          </Link>
        )}
        {user ? (
          <div className="nav-user-container" onClick={handleUserClick}>
            <div className="nav-user-avatar">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="用户头像" 
                  className="nav-avatar-image"
                />
              ) : (
                <div className="nav-avatar-placeholder">
                  {user.userType === '救助组织' ? '🏥' : '👤'}
                </div>
              )}
            </div>
            <span className="nav-user-text">{user.userId}（{user.userType}）</span>
          </div>
        ) : (
          <>
            <Link 
              to="/login" 
              className={`nav-link ${isActive('/login') ? 'active' : ''}`}
            >
              登录
            </Link>
            <Link 
              to="/register" 
              className={`nav-link ${isActive('/register') ? 'active' : ''}`}
            >
              注册
            </Link>
          </>
        )}
        {/* 钱包连接按钮 - 放在最右边 */}
        <div className="wallet-container">
          {isConnected && account ? (
            <div 
              className="wallet-connected" 
              onClick={() => setShowWalletModal(true)}
              title={account.address}
            >
              <span className="wallet-icon">🦊</span>
              <span className="wallet-address">{formatAddress(account.address)}</span>
            </div>
          ) : (
            <button 
              className="wallet-connect-btn"
              onClick={handleConnectWallet}
              disabled={!isMetaMaskInstalled || walletLoading}
              title={!isMetaMaskInstalled ? '请先安装 MetaMask' : ''}
            >
              {walletLoading ? '连接中...' : isMetaMaskInstalled ? '连接钱包' : '安装 MetaMask'}
            </button>
          )}
        </div>
      </div>

      {/* 用户信息弹窗 */}
      {showUserModal && (
        <div className="user-modal-backdrop" onClick={closeUserModal}>
          <div className="user-modal user-modal-positioned" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h2 className="user-modal-title">👤 用户信息</h2>
              <button className="user-modal-close" onClick={closeUserModal}>×</button>
            </div>
            
            <div className="user-modal-content">
              <div className="user-info-section">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="用户头像" 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    user.userType === '救助组织' ? '🏥' : '👤'
                  )}
                </div>
                <div className="user-details">
                  <h3 className="user-name">{user.userId}</h3>
                  <p className="user-type">{user.userType}</p>
                </div>
              </div>

              <div className="user-stats">
                {user.userType === '救助组织' && (
                  <div className="stat-item">
                    <div className="stat-icon">🐾</div>
                    <div className="stat-content">
                      <div className="stat-label">发布动物</div>
                      <div className="stat-value">{myAnimalsCount} 只</div>
                    </div>
                  </div>
                )}

                {user.userType === '领养人' && (
                  <div className="stat-item">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-content">
                      <div className="stat-label">申请记录</div>
                      <div className="stat-value">{myApplicationsCount} 次</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-actions">
                <button className="user-action-btn primary" onClick={closeUserModal}>
                  <span className="btn-icon">✅</span>
                  确定
                </button>
                <button className="user-action-btn info" onClick={() => {
                  closeUserModal();
                  // 这里可以添加跳转到个人信息页面的逻辑
                  window.location.href = '/profile';
                }}>
                  <span className="btn-icon">👤</span>
                  个人信息
                </button>
                <button className="user-action-btn secondary" onClick={() => {
                  closeUserModal();
                  logout();
                  navigate('/login');
                }}>
                  <span className="btn-icon">🚪</span>
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 钱包信息弹窗 */}
      {showWalletModal && (
        <div className="user-modal-backdrop" onClick={() => setShowWalletModal(false)}>
          <div className="user-modal user-modal-positioned" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h2 className="user-modal-title">🦊 钱包信息</h2>
              <button className="user-modal-close" onClick={() => setShowWalletModal(false)}>×</button>
            </div>
            
            <div className="user-modal-content">
              {isConnected && account ? (
                <>
                  <div className="user-info-section">
                    <div className="wallet-info-item">
                      <div className="wallet-info-label">钱包地址</div>
                      <div className="wallet-info-value">{account.address}</div>
                    </div>
                    <div className="wallet-info-item">
                      <div className="wallet-info-label">余额</div>
                      <div className="wallet-info-value">{formatBalance(account.balance)} ETH</div>
                    </div>
                    <div className="wallet-info-item">
                      <div className="wallet-info-label">网络</div>
                      <div className="wallet-info-value">{account.network.name} (Chain ID: {account.network.chainId})</div>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button className="user-action-btn secondary" onClick={handleDisconnectWallet}>
                      <span className="btn-icon">🔌</span>
                      断开连接
                    </button>
                    <button className="user-action-btn primary" onClick={() => setShowWalletModal(false)}>
                      <span className="btn-icon">✅</span>
                      确定
                    </button>
                  </div>
                </>
              ) : (
                <div className="wallet-connect-prompt">
                  <p>未连接钱包</p>
                  {!isMetaMaskInstalled && (
                    <p className="wallet-install-hint">
                      请先安装 <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> 钱包
                    </p>
                  )}
                  <button className="user-action-btn primary" onClick={handleConnectWallet}>
                    <span className="btn-icon">🦊</span>
                    连接钱包
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavBar;



