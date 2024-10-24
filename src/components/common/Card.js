// src/components/common/Card.js
import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  action,
  className = '',
  ...props 
}) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="card-header">
          <div className="card-header-text">
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && (
            <div className="card-action">
              {action}
            </div>
          )}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;