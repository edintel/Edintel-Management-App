// src/components/common/Button.js
import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  className = '',
  ...props 
}) => {
  return (
    <button 
      className={`
        button 
        button-${variant} 
        button-${size}
        ${fullWidth ? 'button-full-width' : ''}
        ${className}
      `}
      {...props}
    >
      {startIcon && <span className="button-icon button-icon-start">{startIcon}</span>}
      {children}
      {endIcon && <span className="button-icon button-icon-end">{endIcon}</span>}
    </button>
  );
};

export default Button;