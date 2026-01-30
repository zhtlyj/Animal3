import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnimals } from '../contexts/AnimalsContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { animalsAPI } from '../services/api';
import { recordAdoptionApplication } from '../services/blockchain';
import { getContractAddress } from '../services/blockchain';
import BackButton from '../components/BackButton';

const AdoptionApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applyForAdoption } = useAnimals();
  const { user } = useAuth();
  const { isConnected, account, connect } = useWallet();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ realName: '', phone: '', address: '', motivation: '' });
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingBlockchain, setSubmittingBlockchain] = useState(false);

  // 从后端加载动物信息
  useEffect(() => {
    const loadAnimal = async () => {
      try {
        setLoading(true);
        const response = await animalsAPI.getAnimalById(id);
        if (response.success) {
          const animalData = response.data.animal;
          setItem(animalData);
          
          // 调试：打印动物数据，特别是NFT信息
          console.log('📋 加载的动物数据:', animalData);
          console.log('📋 NFT信息:', animalData?.nft);
          console.log('📋 NFT TokenID:', animalData?.nft?.tokenId);
          console.log('📋 完整的item对象:', JSON.stringify(animalData, null, 2));
        } else {
          setMsg('未找到该动物信息');
        }
      } catch (error) {
        console.error('加载动物信息失败:', error);
        setMsg('加载动物信息失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadAnimal();
    }
  }, [id]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="error-message">请先登录</div>
        <button className="auth-button" onClick={() => navigate('/login')}>去登录</button>
      </div>
    );
  }

  if (user.userType !== '领养人') {
    return (
      <div className="auth-container">
        <div className="error-message">仅领养人可提交申请</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-message">加载中...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="auth-container">
        <div className="error-message">{msg || '未找到该动物'}</div>
      </div>
    );
  }

  if (item.status !== '可领养') {
    return (
      <div className="auth-container">
        <div className="error-message">该动物当前不可领养</div>
        <button className="auth-button" onClick={() => navigate(-1)}>返回</button>
      </div>
    );
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    
    try {
      // 检查动物是否有 NFT tokenId（支持多种可能的字段路径）
      let animalTokenId = null;
      
      // 尝试多种可能的路径
      if (item?.nft?.tokenId) {
        animalTokenId = item.nft.tokenId;
      } else if (item?.nft?.token_id) {
        animalTokenId = item.nft.token_id;
      } else if (item?.tokenId) {
        animalTokenId = item.tokenId;
      }
      
      // 调试信息
      console.log('🔍 检查NFT TokenID:', {
        '完整item对象': item,
        'item.nft': item?.nft,
        'item.nft类型': typeof item?.nft,
        'item.nft.tokenId': item?.nft?.tokenId,
        'item.nft.tokenId类型': typeof item?.nft?.tokenId,
        'item.nft.token_id': item?.nft?.token_id,
        'item.tokenId': item?.tokenId,
        '最终animalTokenId': animalTokenId,
        '最终animalTokenId类型': typeof animalTokenId,
        '是否为空字符串': animalTokenId === '',
        '是否为null': animalTokenId === null,
        '是否为undefined': animalTokenId === undefined,
        '是否为0': animalTokenId === 0,
        '字符串形式': String(animalTokenId)
      });
      
      // 检查 tokenId 是否有效（不能是空字符串、null、undefined、0 或字符串 'null'/'undefined'/'unknown'）
      if (!animalTokenId || 
          animalTokenId === '' || 
          animalTokenId === null || 
          animalTokenId === undefined ||
          animalTokenId === 'null' || 
          animalTokenId === 'undefined' ||
          animalTokenId === 'unknown' ||
          (typeof animalTokenId === 'string' && animalTokenId.trim() === '')) {
        console.warn('⚠️ NFT TokenID无效或不存在:', animalTokenId);
        let errorMsg = '该动物尚未铸造NFT，无法进行链上申请。';
        if (animalTokenId === 'unknown') {
          errorMsg = '该动物的NFT TokenID记录为"unknown"，说明NFT铸造时未能正确获取TokenID。请联系发布者重新为动物铸造NFT。';
        }
        setMsg(errorMsg);
        setSubmitting(false);
        return;
      }
      
      // 确保 tokenId 是字符串或数字格式
      const tokenIdStr = String(animalTokenId).trim();
      if (tokenIdStr === '' || tokenIdStr === 'null' || tokenIdStr === 'undefined') {
        console.warn('⚠️ NFT TokenID格式无效:', animalTokenId);
        setMsg('该动物尚未铸造NFT，无法进行链上申请。请联系发布者先为动物铸造NFT。');
        setSubmitting(false);
        return;
      }
      
      // 使用清理后的值
      animalTokenId = tokenIdStr;

      let blockchainData = null;
      
      // 如果钱包已连接，调用智能合约
      if (isConnected && account?.signer) {
        try {
          setSubmittingBlockchain(true);
          console.log('📝 ========== 提交领养申请（链上） ==========');
          console.log('✅ 钱包已连接，准备调用智能合约');
          console.log('钱包地址:', await account.signer.getAddress());
          console.log('动物信息:', {
            '动物ID': id,
            '动物名称': item.name,
            'NFT TokenID': animalTokenId
          });
          console.log('申请信息:', {
            '申请人': form.realName,
            '联系电话': form.phone,
            '动机': form.motivation
          });
          console.log('⏳ 即将弹出 MetaMask 确认交易...');
          
          // 验证并转换 tokenId
          const tokenIdParsed = parseInt(animalTokenId, 10);
          console.log('🔍 TokenID 转换检查:', {
            '原始值': animalTokenId,
            '类型': typeof animalTokenId,
            '转换后': tokenIdParsed,
            '是否为NaN': isNaN(tokenIdParsed),
            '是否小于0': tokenIdParsed < 0
          });
          
          if (isNaN(tokenIdParsed) || tokenIdParsed < 0) {
            throw new Error(`NFT TokenID无效: ${animalTokenId} (转换后: ${tokenIdParsed})`);
          }

          // 调用智能合约（这里会触发 MetaMask 弹出确认交易）
          const blockchainResult = await recordAdoptionApplication({
            animalTokenId: tokenIdParsed,
            reason: form.motivation || `申请领养${item.name}，联系电话：${form.phone}`,
            signer: account.signer
          });

          blockchainData = {
            applicationId: blockchainResult.applicationId,
            txHash: blockchainResult.txHash,
            contractAddress: getContractAddress()
          };

          console.log('✅ 链上申请成功:', blockchainData);
          console.log('=====================================');
        } catch (blockchainError) {
          console.error('❌ 智能合约申请失败:', blockchainError);
          
          let errorMsg = '申请已保存，但链上申请失败';
          if (blockchainError.message) {
            if (blockchainError.message.includes('用户拒绝') || blockchainError.message.includes('rejected')) {
              errorMsg = '申请已保存，但用户取消了链上交易';
            } else {
              errorMsg = `申请已保存，但链上申请失败: ${blockchainError.message}`;
            }
          }
          
          // 链上申请失败，但继续保存到数据库
          setMsg(errorMsg);
        } finally {
          setSubmittingBlockchain(false);
        }
      } else {
        // 钱包未连接，只保存到数据库
        console.log('⚠️ 钱包未连接，仅保存到数据库');
        console.log('钱包连接状态:', { isConnected, hasSigner: !!account?.signer });
        console.log('💡 提示：连接钱包后提交申请，将自动上链记录');
      }

      // 保存申请到数据库（无论是否上链）
      await applyForAdoption({
        animalId: id,
        profile: { 
          realName: form.realName, 
          phone: form.phone, 
          address: form.address 
        },
        motivation: form.motivation,
        blockchain: blockchainData
      });

      if (blockchainData) {
        setMsg('✅ 申请已提交成功（已上链）！链上申请ID: ' + blockchainData.applicationId + '，交易哈希: ' + blockchainData.txHash.slice(0, 12) + '...');
      } else {
        setMsg('✅ 申请已提交成功（未上链）！救助组织将在申请管理页面审核您的申请。');
      }
      
      setForm({ realName: '', phone: '', address: '', motivation: '' });
      
      // 3秒后跳转到首页
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    } catch (err) {
      console.error('❌ 提交申请失败:', err);
      setMsg(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
      setSubmittingBlockchain(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">申请领养：{item.name}</h1>
          <p className="auth-subtitle">请填写真实信息并阐述您的领养动机</p>
        </div>

        {msg && <div className={msg.includes('已提交') || msg.includes('成功') ? 'success-message' : 'error-message'}>{msg}</div>}

        {(() => {
          // 检查是否有有效的 NFT tokenId
          const hasTokenId = item?.nft?.tokenId && 
                            item.nft.tokenId !== '' && 
                            item.nft.tokenId !== 'null' && 
                            item.nft.tokenId !== 'undefined';
          
          if (!hasTokenId && item) {
            return (
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                background: '#fee2e2', 
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                ⚠️ 该动物尚未铸造NFT，无法进行链上申请。请联系发布者先为动物铸造NFT。
                <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                  调试信息：NFT数据 = {JSON.stringify(item?.nft || '无')}
                </div>
              </div>
            );
          }
          
          if (hasTokenId && !isConnected) {
            return (
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                background: '#fff3cd', 
                borderRadius: '8px',
                color: '#856404',
                fontSize: '14px'
              }}>
                💡 提示：连接钱包后提交申请，将自动上链记录（NFT TokenID: {item.nft.tokenId}）
                <button 
                  onClick={connect}
                  style={{
                    marginLeft: '10px',
                    padding: '6px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  连接钱包
                </button>
              </div>
            );
          }
          
          return null;
        })()}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">真实姓名</label>
            <input className="form-input" name="realName" value={form.realName} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">联系电话</label>
            <input className="form-input" name="phone" value={form.phone} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">居住地址</label>
            <input className="form-input" name="address" value={form.address} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">动机陈述</label>
            <textarea className="form-input" name="motivation" value={form.motivation} onChange={onChange} rows={5} required />
          </div>
          <button className={`auth-button ${submitting ? 'loading' : ''}`} disabled={submitting || submittingBlockchain}>
            {submittingBlockchain ? '⏳ 正在上链...' : submitting ? '提交中...' : '提交申请'}
          </button>
        </form>
      </div>
      <BackButton />
    </>
  );
};

export default AdoptionApply;



