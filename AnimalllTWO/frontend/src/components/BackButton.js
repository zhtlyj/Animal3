import React from 'react';
import { Link } from 'react-router-dom';

const BackButton = () => {
  return (
    <Link to="/home" className="back-button">
      <span className="btn-icon">🐾</span>
      <span className="btn-text">返回首页</span>
    </Link>
  );
};

export default BackButton;

