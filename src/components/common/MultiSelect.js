import React, { useState, useRef, useEffect } from 'react';
import { Check, X, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  disabled = false,
  error,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleOption = (option) => {
    const isSelected = value.some(item => item.id === option.id);
    if (isSelected) {
      onChange(value.filter(item => item.id !== option.id));
    } else {
      onChange([...value, option]);
    }
  };

  const handleRemoveOption = (e, optionId) => {
    e.stopPropagation();
    onChange(value.filter(item => item.id !== optionId));
  };

  const filteredOptions = options
  .filter(option =>
    option.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "min-h-[42px] px-3 py-2 border rounded-lg flex flex-wrap gap-2 cursor-pointer",
          isOpen && "ring-2 ring-primary/50 border-primary",
          error && "border-error",
          disabled && "bg-gray-100 cursor-not-allowed",
          "relative"
        )}
      >
        {value.length === 0 ? (
          <span className="text-gray-500">{placeholder}</span>
        ) : (
          value.map(item => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1 text-sm"
            >
              {item.displayName}
              <button
                onClick={(e) => handleRemoveOption(e, item.id)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X size={14} />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={20}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.some(item => item.id === option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleToggleOption(option)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 border rounded flex items-center justify-center",
                      isSelected && "bg-primary border-primary text-white"
                    )}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <span className="flex-1">
                      {option.displayName}
                      <span className="text-sm text-gray-500 ml-1">
                        ({option.email})
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;