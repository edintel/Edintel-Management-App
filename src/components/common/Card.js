import React from 'react';
import { cn } from '../../utils/cn';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  action,
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )} 
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex flex-col space-y-1.5 p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="font-semibold leading-none tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;