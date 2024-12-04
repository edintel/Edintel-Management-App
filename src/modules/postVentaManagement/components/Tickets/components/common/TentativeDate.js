import React from 'react';

const formatTentativeDate = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  // Subtract 2 hours
  date.setHours(date.getHours() - 2);
  
  return date.toLocaleString('es-CR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const TentativeDate = ({ date, className = '' }) => {
  const formattedDate = formatTentativeDate(date);
  if (!formattedDate) return null;
  
  return (
    <span className={className}>{formattedDate}</span>
  );
};

export default TentativeDate;