// src/modules/postVentaManagement/components/Tickets/hooks/useTicketState.js
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "ticketListFilters";

export const useTicketState = () => {
  // Initialize state from sessionStorage or defaults
  const [searchTerm, setSearchTerm] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const filters = JSON.parse(stored);
      return filters.searchTerm || "";
    }
    return "";
  });

  const [startDate, setStartDate] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const filters = JSON.parse(stored);
      return filters.startDate || "";
    }
    return "";
  });

  const [endDate, setEndDate] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const filters = JSON.parse(stored);
      return filters.endDate || "";
    }
    return "";
  });

  const [selectedState, setSelectedState] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const filters = JSON.parse(stored);
      return filters.selectedState || [];
    }
    return [];
  });

  const [selectedUsers, setSelectedUsers] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const filters = JSON.parse(stored);
      return filters.selectedUsers || [];
    }
    return [];
  });

  // Save to sessionStorage whenever filters change
  useEffect(() => {
    const filters = {
      searchTerm,
      startDate,
      endDate,
      selectedState,
      selectedUsers,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [searchTerm, startDate, endDate, selectedState, selectedUsers]);

  // Custom setters that handle both state and storage
  const handleSetSearchTerm = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSetStartDate = useCallback((value) => {
    setStartDate(value);
  }, []);

  const handleSetEndDate = useCallback((value) => {
    setEndDate(value);
  }, []);

  const handleSetSelectedState = useCallback((value) => {
    setSelectedState(value);
  }, []);

  const handleSetSelectedUsers = useCallback((value) => {
    setSelectedUsers(value);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedState([]);
    setSelectedUsers([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    searchTerm ||
      startDate ||
      endDate ||
      selectedState.length > 0 ||
      selectedUsers.length > 0
  );

  return {
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    startDate,
    setStartDate: handleSetStartDate,
    endDate,
    setEndDate: handleSetEndDate,
    selectedState,
    setSelectedState: handleSetSelectedState,
    selectedUsers,
    setSelectedUsers: handleSetSelectedUsers,
    resetFilters,
    hasActiveFilters,
  };
};
