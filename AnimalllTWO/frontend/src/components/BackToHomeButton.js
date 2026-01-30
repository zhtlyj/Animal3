import React from 'react';
import { Link } from 'react-router-dom';

const BackToHomeButton = () => {
  return (
    <Link to="/home" className="back-to-home-btn">
      <span className="btn-icon">🏠</span>
      返回首页
    </Link>
  );
};

export default BackToHomeButton;




