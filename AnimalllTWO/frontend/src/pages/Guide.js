import React, { useState } from 'react';
import BackButton from '../components/BackButton';

const Guide = () => {
  const [activeTab, setActiveTab] = useState('adoption');

  const adoptionSteps = [
    {
      step: 1,
      title: '浏览动物信息',
      description: '在领养中心浏览可领养的动物，了解它们的基本信息、健康状况和性格特点。',
      icon: '🔍'
    },
    {
      step: 2,
      title: '提交领养申请',
      description: '填写详细的领养申请表，包括个人资料、居住环境、养宠经验等信息。',
      icon: '📝'
    },
    {
      step: 3,
      title: '审核与面谈',
      description: '救助组织会审核您的申请，并安排面谈了解您的领养动机和准备情况。',
      icon: '👥'
    },
    {
      step: 4,
      title: '家访与评估',
      description: '工作人员会到您家中进行实地考察，确保居住环境适合动物生活。',
      icon: '🏠'
    },
    {
      step: 5,
      title: '签署领养协议',
      description: '通过审核后，签署正式的领养协议，明确双方的权利和义务。',
      icon: '📋'
    },
    {
      step: 6,
      title: '接动物回家',
      description: '在约定的时间接动物回家，开始新的生活。记得准备必要的用品。',
      icon: '🏡'
    }
  ];

  const careTips = [
    {
      category: '日常护理',
      tips: [
        '每天定时喂食，选择适合的优质宠物粮',
        '保持充足的清洁饮水，定期更换',
        '每天梳理毛发，保持清洁卫生',
        '定期洗澡，使用专用宠物洗护用品',
        '及时清理排泄物，保持环境整洁'
      ]
    },
    {
      category: '健康管理',
      tips: [
        '定期带宠物到兽医处体检',
        '按时接种疫苗，预防疾病',
        '定期驱虫，内外驱虫都要做',
        '观察宠物的精神状态和食欲',
        '发现异常及时就医，不要拖延'
      ]
    },
    {
      category: '运动与娱乐',
      tips: [
        '每天保证足够的运动时间',
        '提供适合的玩具和娱乐设施',
        '与宠物互动，增进感情',
        '注意运动安全，避免意外伤害',
        '根据宠物年龄调整运动强度'
      ]
    },
    {
      category: '心理关怀',
      tips: [
        '给予足够的关爱和陪伴',
        '尊重宠物的个性和习惯',
        '耐心训练，使用正向激励',
        '为宠物提供安全舒适的环境',
        '关注宠物的情绪变化'
      ]
    }
  ];

  const adaptationGuide = [
    {
      phase: '第一周',
      title: '适应期',
      description: '新环境适应，建立信任关系',
      tips: [
        '保持环境安静，减少外界干扰',
        '让宠物自由探索新环境',
        '不要强迫互动，让宠物主动接近',
        '保持规律的作息时间',
        '观察宠物的饮食和排泄情况'
      ]
    },
    {
      phase: '第二周',
      title: '熟悉期',
      description: '逐渐熟悉家庭成员和日常生活',
      tips: [
        '开始建立基本的训练规则',
        '逐渐增加互动时间',
        '保持耐心，不要急于求成',
        '观察宠物的性格特点',
        '开始社会化训练'
      ]
    },
    {
      phase: '第三周',
      title: '融入期',
      description: '完全融入家庭生活',
      tips: [
        '建立稳定的日常生活规律',
        '开始更复杂的训练',
        '增加户外活动时间',
        '与其他宠物或人建立关系',
        '享受与宠物的美好时光'
      ]
    }
  ];

  const renderAdoptionProcess = () => (
    <div className="guide-section">
      <h2 className="section-title">领养流程</h2>
      <div className="steps-container">
        {adoptionSteps.map((step, index) => (
          <div key={index} className="step-card">
            <div className="step-number">{step.step}</div>
            <div className="step-icon">{step.icon}</div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCareTips = () => (
    <div className="guide-section">
      <h2 className="section-title">照护知识</h2>
      <div className="care-categories">
        {careTips.map((category, index) => (
          <div key={index} className="care-category">
            <h3 className="category-title">{category.category}</h3>
            <ul className="tips-list">
              {category.tips.map((tip, tipIndex) => (
                <li key={tipIndex} className="tip-item">{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdaptationGuide = () => (
    <div className="guide-section">
      <h2 className="section-title">适应指南</h2>
      <div className="adaptation-phases">
        {adaptationGuide.map((phase, index) => (
          <div key={index} className="phase-card">
            <div className="phase-header">
              <div className="phase-phase">{phase.phase}</div>
              <h3 className="phase-title">{phase.title}</h3>
              <p className="phase-description">{phase.description}</p>
            </div>
            <ul className="phase-tips">
              {phase.tips.map((tip, tipIndex) => (
                <li key={tipIndex} className="phase-tip">{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="guide-page">
      <div className="guide-header">
        <h1 className="guide-title">科普与指南</h1>
        <p className="guide-subtitle">领养流程、照护知识与适应指南</p>
      </div>

      <div className="guide-main">
        <div className="guide-tabs">
          <button 
            className={`tab-button ${activeTab === 'adoption' ? 'active' : ''}`}
            onClick={() => setActiveTab('adoption')}
          >
            📋 领养流程
          </button>
          <button 
            className={`tab-button ${activeTab === 'care' ? 'active' : ''}`}
            onClick={() => setActiveTab('care')}
          >
            🏥 照护知识
          </button>
          <button 
            className={`tab-button ${activeTab === 'adaptation' ? 'active' : ''}`}
            onClick={() => setActiveTab('adaptation')}
          >
            🏡 适应指南
          </button>
        </div>

        <div className="guide-content">
          {activeTab === 'adoption' && renderAdoptionProcess()}
          {activeTab === 'care' && renderCareTips()}
          {activeTab === 'adaptation' && renderAdaptationGuide()}
        </div>
      </div>
      <BackButton />
    </div>
  );
};

export default Guide;
