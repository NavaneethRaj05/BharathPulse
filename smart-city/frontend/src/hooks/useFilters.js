import { useState, useCallback } from 'react';

const initialFilters = {
  category: 'All',
  status: 'All',
  department: 'All',
  priority: 'All',
  search: '',
  wardId: null,
  level: 'NATIONAL',
  parentCode: null,
  role: 'Citizen',
};

export const useFilters = () => {
  const [filters, setFilters] = useState(initialFilters);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return {
    filters,
    setFilter,
    resetFilters,
  };
};
