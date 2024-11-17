import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

const TabsContext = createContext({});

export const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
  const [selectedTab, setSelectedTab] = useState(defaultValue);
  
  const currentValue = value !== undefined ? value : selectedTab;
  const handleValueChange = onValueChange || setSelectedTab;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }) => {
  return (
    <div className={cn('flex w-full', className)}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, className }) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn(
        'flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
        isSelected
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className }) => {
  const { value: selectedValue } = useContext(TabsContext);

  if (selectedValue !== value) {
    return null;
  }

  return (
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  );
};