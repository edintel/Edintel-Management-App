import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

const Checkbox = ({
  checked = false,
  onChange,
  className,
  id,
  disabled = false,
  label,
  labelPosition = 'right',
  ...props
}) => {
  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e.target.checked, e);
  };

  const checkboxContent = (
    <div
      className={cn(
        "relative flex items-center justify-center w-5 h-5 rounded border transition-colors",
        checked ? "bg-primary border-primary" : "border-gray-300 bg-white",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer",
        className
      )}
    >
      {checked && (
        <Check className="w-3.5 h-3.5 text-white" />
      )}
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="absolute opacity-0 w-full h-full cursor-pointer"
        {...props}
      />
    </div>
  );

  if (label) {
    return (
      <label 
        htmlFor={id} 
        className={cn(
          "flex items-center gap-2",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer"
        )}
      >
        {labelPosition === 'left' && (
          <span className="text-sm">{label}</span>
        )}
        
        {checkboxContent}
        
        {labelPosition === 'right' && (
          <span className="text-sm">{label}</span>
        )}
      </label>
    );
  }

  return checkboxContent;
};

export default Checkbox;