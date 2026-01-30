import React, { useMemo, useState, useRef } from 'react';
import { useAnimals } from '../contexts/AnimalsContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { mintAnimalNFT } from '../services/blockchain';
import { animalsAPI } from '../services/api';
import { sampleAnimals } from '../data/mock';
import AnimalCard from '../components/AnimalCard';
import BackButton from '../components/BackButton';

const Publish = () => {
  const { publishAnimal, updateAnimal, animals } = useAnimals();
  const { user } = useAuth();
  const { account, isConnected, connect } = useWallet();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name: '', species: '猫', city: '', status: '救助中', age: '', description: '', media: [] });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [mintingNFT, setMintingNFT] = useState(false);
  const showcase = useMemo(() => (animals.length ? animals : sampleAnimals).slice(0, 6), [animals]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 处理文件上传
  const processFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setMsg('请选择图片文件');
      return;
    }

    // 检查文件大小（限制5MB）
    const validFiles = imageFiles.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== imageFiles.length) {
      setMsg('部分文件过大，已跳过（限制5MB）');
    }

    // 转换为base64并添加到媒体列表
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setMediaFiles(prev => [...prev, { file, base64, name: file.name }]);
        setForm(prev => ({ ...prev, media: [...prev.media, base64] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  // 拖拽处理
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  // 移除媒体文件
  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setForm(prev => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }));
  };

  // 触发文件选择
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    
    try {
      // 第一步：发布动物信息到数据库
      console.log('📝 开始发布动物信息...');
      const animal = await publishAnimal(form);
      console.log('✅ 动物信息已保存到数据库:', animal);
      setMsg('发布成功！正在铸造NFT...');
      
      // 第二步：如果钱包已连接，调用智能合约铸造NFT
      if (isConnected && account?.signer) {
        try {
          setMintingNFT(true);
          
          // 准备元数据URI（使用后端API的metadata端点）
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const metadataURI = `${API_BASE_URL}/animals/${animal._id}/metadata`;
          
          // 打印发布时的配置信息
          console.log('🚀 ========== 发布动物 - 智能合约调用 ==========');
          console.log('📋 发布信息:', {
            '钱包连接状态': isConnected ? '✅ 已连接' : '❌ 未连接',
            '钱包地址': account?.address || 'N/A',
            '合约地址': process.env.REACT_APP_CONTRACT_ADDRESS || '使用默认值',
            'API地址': API_BASE_URL,
            '元数据URI': metadataURI,
            '动物ID': animal._id,
            '动物名称': form.name,
            '动物种类': form.species
          });
          
          // 调用智能合约
          console.log('⛏️ 开始铸造NFT...');
          const nftResult = await mintAnimalNFT({
            name: form.name,
            species: form.species,
            breed: form.breed || '',
            metadataURI: metadataURI,
            signer: account.signer
          });
          
          console.log('✅ NFT铸造成功:', nftResult);
          
          // 第三步：更新数据库中的NFT信息
          try {
            const nftUpdateData = {
              nft: {
                tokenId: nftResult.tokenId,
                contractAddress: nftResult.contract || process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                metadataURI: metadataURI,
                txHash: nftResult.txHash
              }
            };
            
            console.log('📋 NFT更新数据详情:', {
              tokenId: nftUpdateData.nft.tokenId,
              contractAddress: nftUpdateData.nft.contractAddress,
              txHash: nftUpdateData.nft.txHash,
              metadataURI: nftUpdateData.nft.metadataURI
            });
            
            console.log('💾 更新数据库NFT信息:', nftUpdateData);
            await updateAnimal(animal._id, nftUpdateData);
            console.log('✅ 数据库更新成功');
            
            setMsg(`✅ 发布成功！NFT已铸造，Token ID: ${nftResult.tokenId}，交易哈希: ${nftResult.txHash.slice(0, 10)}...`);
          } catch (updateError) {
            console.error('❌ 更新NFT信息到数据库失败:', updateError);
            setMsg(`⚠️ 发布成功！NFT已铸造（Token ID: ${nftResult.tokenId}），但更新数据库失败，请稍后手动更新。`);
          }
        } catch (nftError) {
          console.error('❌ 铸造NFT失败:', nftError);
          
          // 准备元数据URI（在 catch 块外也需要使用）
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const metadataURI = `${API_BASE_URL}/animals/${animal._id}/metadata`;
          
          // 检查是否是"无法获取TokenID"的错误（交易已成功，但无法获取tokenId）
          if (nftError.message && nftError.message.includes('无法获取TokenID')) {
            // 提取交易哈希
            const txHashMatch = nftError.message.match(/交易哈希:\s*([0-9a-fA-Fx]+)/);
            const txHash = txHashMatch ? txHashMatch[1] : '未知';
            
            // 从数据库读取已保存的 tokenId（后端在发布时已生成）
            try {
              const animalResponse = await animalsAPI.getAnimalById(animal._id);
              const dbTokenId = animalResponse?.data?.animal?.nft?.tokenId;
              
              if (dbTokenId && dbTokenId !== '' && dbTokenId !== 'null' && dbTokenId !== 'unknown') {
                console.log('✅ 从数据库读取到 tokenId:', dbTokenId);
                
                // 更新数据库，保存交易哈希和其他信息
                await updateAnimal(animal._id, {
                  nft: {
                    tokenId: dbTokenId, // 使用数据库中的 tokenId
                    txHash: txHash,
                    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                    metadataURI: metadataURI
                  }
                });
                
                setMsg(`✅ 发布成功！NFT已铸造，Token ID: ${dbTokenId}（从数据库读取），交易哈希: ${txHash.slice(0, 10)}...`);
                console.log('✅ 已使用数据库 tokenId 更新NFT信息');
              } else {
                // 如果数据库也没有 tokenId，保存交易哈希，让用户稍后手动输入
                setMsg(`✅ 发布成功！NFT已铸造，但无法自动获取TokenID。\n` +
                  `交易哈希: ${txHash}\n` +
                  `请查看 MetaMask 交易详情获取 TokenID，或稍后在动物详情页手动输入。`);
                
                await updateAnimal(animal._id, {
                  nft: {
                    txHash: txHash,
                    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                    tokenId: '', // 留空，让用户稍后手动输入
                    metadataURI: metadataURI
                  }
                });
                console.log('✅ 已保存交易哈希，用户可稍后手动输入 TokenID');
              }
            } catch (updateError) {
              console.error('❌ 更新NFT信息失败:', updateError);
              setMsg(`✅ 发布成功！NFT已铸造，但无法自动获取TokenID。\n` +
                `交易哈希: ${txHash}\n` +
                `请查看 MetaMask 交易详情获取 TokenID，或稍后在动物详情页手动输入。`);
            }
          } else {
            // 其他类型的错误
            let errorMsg = '请稍后手动上链';
            if (nftError.message) {
              if (nftError.message.includes('合约地址')) {
                errorMsg = '合约地址未配置';
              } else if (nftError.message.includes('用户拒绝') || nftError.message.includes('rejected')) {
                errorMsg = '用户取消了交易';
              } else if (nftError.message.includes('余额') || nftError.message.includes('balance')) {
                errorMsg = '账户余额不足';
              } else {
                errorMsg = nftError.message;
              }
            }
            setMsg(`✅ 发布成功！但NFT铸造失败: ${errorMsg}。您可以稍后在动物详情页手动上链。`);
          }
        } finally {
          setMintingNFT(false);
        }
      } else {
        // 钱包未连接，提示用户
        console.log('⚠️ 钱包未连接，跳过NFT铸造');
        setMsg('✅ 发布成功！但未连接钱包，NFT未铸造。您可以稍后在动物详情页手动上链。');
      }
      
      // 清空表单
      setForm({ name: '', species: '猫', city: '', status: '救助中', age: '', description: '', media: [] });
      setMediaFiles([]);
    } catch (err) {
      console.error('❌ 发布失败:', err);
      setMsg(err.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  // 登录后若不是救助组织，仍限制；救助组织则有权限
  if (!user) {
    return (
      <div className="auth-container">
        <div className="error-message">请先登录（救助组织）再访问发布页</div>
      </div>
    );
  }
  if (user && user.userType !== '救助组织') {
    return (
      <div className="auth-container">
        <div className="error-message">当前身份“{user.userType}”无权访问，请使用“救助组织”登录</div>
      </div>
    );
  }

  return (
    <div className="publish-page">
      <div className="publish-header">
        <h1 className="publish-title">发布动物信息</h1>
        <p className="publish-subtitle">上传媒体，自动生成链上NFT标识</p>
      </div>

      <div className="publish-main">
        <div className="publish-content">
          {msg && (
            <div className={`publish-message ${msg.includes('成功') ? 'success' : 'error'}`}>
              {msg}
            </div>
          )}

          <div className="publish-section">
            <div className="section-header">
              <h2 className="section-title">🐾 基本信息</h2>
              <p className="section-subtitle">填写动物的基本信息和状态</p>
            </div>
            
            <form className="publish-form" onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">动物名称</label>
                  <input 
                    className="publish-input" 
                    name="name" 
                    value={form.name} 
                    onChange={onChange} 
                    placeholder="请输入动物名称"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">动物种类</label>
                  <select className="publish-select" name="species" value={form.species} onChange={onChange}>
                    <option value="猫">🐱 猫</option>
                    <option value="狗">🐶 狗</option>
                    <option value="兔">🐰 兔</option>
                    <option value="鸟">🐦 鸟</option>
                    <option value="爬宠">🦎 爬宠</option>
                    <option value="其他">🐾 其他</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">当前状态</label>
                  <select className="publish-select" name="status" value={form.status} onChange={onChange}>
                    <option value="救助中">🏥 救助中</option>
                    <option value="可领养">❤️ 可领养</option>
                    <option value="紧急求助">🚨 紧急求助</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">所在城市</label>
                  <input 
                    className="publish-input" 
                    name="city" 
                    value={form.city} 
                    onChange={onChange} 
                    placeholder="请输入城市名称"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">年龄</label>
                  <input 
                    className="publish-input" 
                    name="age" 
                    value={form.age} 
                    onChange={onChange} 
                    placeholder="例如：2岁、3个月、幼年等"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">详细描述</label>
                <textarea 
                  className="publish-textarea" 
                  name="description" 
                  value={form.description} 
                  onChange={onChange} 
                  rows={4}
                  placeholder="请详细描述动物的性格、特点、救助经历等..."
                  required 
                />
              </div>
            </form>
          </div>

          <div className="publish-section">
            <div className="section-header">
              <h2 className="section-title">📸 媒体文件</h2>
              <p className="section-subtitle">上传动物的照片，让更多人了解它们</p>
            </div>
            
            <div className="media-upload-container">
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              {/* 拖拽上传区域 */}
              <div 
                className={`media-upload-area ${isDragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileUpload}
              >
                <div className="upload-icon">📷</div>
                <div className="upload-text">
                  {isDragOver ? '松开鼠标上传图片' : '点击选择图片或拖拽到此处'}
                </div>
                <div className="upload-hint">
                  支持 JPG、PNG、GIF 格式，单个文件不超过5MB
                </div>
                <div className="upload-button">
                  <span className="button-icon">📁</span>
                  选择文件
                </div>
              </div>
              
              {/* 媒体预览 */}
              {mediaFiles.length > 0 && (
                <div className="media-preview-container">
                  <div className="preview-header">
                    <h3 className="preview-title">已上传的图片</h3>
                    <span className="preview-count">{mediaFiles.length} 张</span>
                  </div>
                  <div className="media-preview-grid">
                    {mediaFiles.map((media, i) => (
                      <div key={i} className="media-preview-item">
                        <div className="preview-image-container">
                          <img 
                            src={media.base64} 
                            alt={media.name}
                            className="media-preview-image"
                          />
                          <button
                            type="button"
                            onClick={() => removeMedia(i)}
                            className="media-remove-btn"
                            title="移除图片"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="media-filename">
                          {media.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="publish-actions">
            {!isConnected && (
              <div className="wallet-notice" style={{ 
                marginBottom: '10px', 
                padding: '10px', 
                background: '#fff3cd', 
                borderRadius: '4px', 
                color: '#856404',
                fontSize: '14px'
              }}>
                💡 提示：连接钱包后发布，将自动铸造NFT上链
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
              className={`publish-button ${loading || mintingNFT ? 'loading' : ''}`} 
              disabled={loading || mintingNFT}
              onClick={onSubmit}
            >
              <span className="button-icon">
                {mintingNFT ? '⛏️' : loading ? '⏳' : '🚀'}
              </span>
              {mintingNFT ? '铸造NFT中...' : loading ? '发布中...' : '发布动物信息'}
            </button>
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  );
};

export default Publish;


