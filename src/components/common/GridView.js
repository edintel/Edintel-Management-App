import React from 'react';
import { cn } from '../../utils/cn';

const GridView = ({
  items = [],
  renderItem,
  emptyMessage = "No items to display",
  loading = false,
  error = null,
  cols = {
    default: 2,
    sm: 3,
    md: 4,
    lg: 4
  },
  gap = 4,
  className
}) => {
  // Generate grid columns classes based on provided cols configuration
  const getGridCols = () => {
    const colClasses = [];
    if (cols.default) colClasses.push(`grid-cols-${cols.default}`);
    if (cols.sm) colClasses.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
    return colClasses.join(' ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-error bg-error/10 rounded-lg">
        {error}
      </div>
    );
  }

  // Empty state
  if (!items.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Grid view
  return (
    <div className={cn(
      "grid",
      getGridCols(),
      `gap-${gap}`,
      className
    )}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
};

export default GridView;