import { useState, useCallback } from 'react';

export const useTicketState = () => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // View states
  const [viewMode, setViewMode] = useState('list');
  const [selectedTickets, setSelectedTickets] = useState([]);
  
  // Sort states
  const [sortField, setSortField] = useState('tentativeDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedState('');
    setSelectedUsers([]);
  }, []);

  // Toggle ticket selection for batch operations
  const toggleTicketSelection = useCallback((ticketId) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  }, []);

  // Handle sort changes
  const handleSort = useCallback((field) => {
    setSortField(currentField => {
      if (currentField === field) {
        setSortDirection(currentDirection => 
          currentDirection === 'asc' ? 'desc' : 'asc'
        );
        return field;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    searchTerm || 
    startDate || 
    endDate || 
    selectedState || 
    selectedUsers.length > 0
  );

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedState,
    setSelectedState,
    selectedUsers,
    setSelectedUsers,
    
    // View states
    viewMode,
    setViewMode,
    selectedTickets,
    setSelectedTickets,
    
    // Sort states
    sortField,
    sortDirection,
    
    // Actions
    resetFilters,
    toggleTicketSelection,
    handleSort,
    
    // Computed
    hasActiveFilters
  };
};