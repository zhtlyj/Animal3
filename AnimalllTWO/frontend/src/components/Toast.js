import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose && onClose(), 300);
  };

  if (!visible) return null;

  const getToastStyle = () => {
    const baseStyle = {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 20px 12px 20px',
      borderRadius: '8px',
      color: '#fff',
      fontWeight: '500',
      zIndex: 9999,
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '500px',
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' };
      case 'error':
        return { ...baseStyle, background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' };
      case 'warning':
        return { ...baseStyle, background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' };
      default:
        return { ...baseStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
    }
  };

  const closeButtonStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background 0.2s ease',
    flexShrink: 0,
  };

  return (
    <div style={getToastStyle()}>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={handleClose}
        style={closeButtonStyle}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
