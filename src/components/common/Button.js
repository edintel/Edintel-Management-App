import React from 'react';
import { cn } from '../../utils/cn';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  fullWidth = false,
  startIcon,
  endIcon,
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'border border-input bg-background hover:bg-gray-100 hover:text-gray-900',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    link: 'text-primary underline-offset-4 hover:underline',
  };

  const sizes = {
    small: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 py-2',
    large: 'h-12 px-8 text-lg',
  };

  return (
    <button 
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

export default Button;