import React from 'react';

const FooterStats = ({ stats }) => {
  return (
    <footer className="footer-stats">
      <div className="stat">
        <div className="stat-value">{stats.totalDonations.toLocaleString()}</div>
        <div className="stat-label">链上捐赠总量（¥）</div>
      </div>
      <div className="stat">
        <div className="stat-value">{stats.totalAdoptions}</div>
        <div className="stat-label">成功领养</div>
      </div>
      <div className="stat">
        <div className="stat-value">{stats.totalRescues}</div>
        <div className="stat-label">累计救助</div>
      </div>
    </footer>
  );
};

export default FooterStats;



