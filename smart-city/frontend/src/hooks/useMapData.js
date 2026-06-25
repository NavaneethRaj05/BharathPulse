import { useState, useEffect, useCallback, useMemo } from 'react';
import { getWards, getClusterData } from '../services/gis.api';

export const useMapData = (filters) => {
  const [wards, setWards] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [wardsRes, complaintsRes] = await Promise.all([
        getWards({ level: filters.level, parentCode: filters.parentCode }),
        getClusterData(),
      ]);

      if (wardsRes.success) setWards(wardsRes.data);
      if (complaintsRes.success) setComplaints(complaintsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Failed to fetch map data. Running in offline/demo fallback mode.');
      setWards([]);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [filters.level, filters.parentCode]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Socket updates handlers
  const handleNewComplaint = useCallback((newComplaint) => {
    setComplaints((prev) => {
      if (prev.some((c) => c.id === newComplaint._id || c.id === newComplaint.id)) return prev;
      const formatted = {
        id: newComplaint._id,
        code: newComplaint.complaintCode,
        title: newComplaint.title,
        category: newComplaint.category,
        status: newComplaint.status,
        lat: newComplaint.latitude,
        lng: newComplaint.longitude,
        location: newComplaint.location,
        reportCount: newComplaint.reportCount || 1,
        isEscalated: newComplaint.isEscalated || false,
        ward: newComplaint.ward || null,
        createdAt: newComplaint.createdAt,
      };
      return [formatted, ...prev];
    });

    if (newComplaint.ward && newComplaint.ward.id) {
      setWards((prevWards) =>
        prevWards.map((w) => {
          if (w.id === newComplaint.ward.id) {
            return {
              ...w,
              stats: {
                ...w.stats,
                total: (w.stats.total || 0) + 1,
                open: (w.stats.open || 0) + 1,
              },
            };
          }
          return w;
        })
      );
    }
  }, []);

  const handleUpdateComplaint = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === updatedComplaint._id || c.id === updatedComplaint.id) {
          return {
            ...c,
            title: updatedComplaint.title,
            category: updatedComplaint.category,
            status: updatedComplaint.status,
            lat: updatedComplaint.latitude,
            lng: updatedComplaint.longitude,
            location: updatedComplaint.location,
            reportCount: updatedComplaint.reportCount || 1,
            isEscalated: updatedComplaint.isEscalated || false,
            ward: updatedComplaint.ward || null,
          };
        }
        return c;
      })
    );

    // Refresh wards stats to reflect status changes
    getWards().then((res) => {
      if (res.success) setWards(res.data);
    });
  }, []);

  // Filtered complaints memoized
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (filters.category && filters.category !== 'All' && c.category !== filters.category) return false;
      if (filters.status && filters.status !== 'All' && c.status !== filters.status) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(query);
        const matchesCode = c.code?.toLowerCase().includes(query);
        const matchesLoc = c.location?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCode && !matchesLoc) return false;
      }
      if (filters.wardId && c.ward?.id !== filters.wardId) return false;
      return true;
    });
  }, [complaints, filters]);

  // Overall statistics calculated from active data
  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => c.status !== 'Resolved').length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const escalated = complaints.filter((c) => c.isEscalated).length;
    const totalReports = complaints.reduce((sum, c) => sum + (c.reportCount || 1), 0);

    return {
      total,
      open,
      resolved,
      escalated,
      totalReports,
    };
  }, [complaints]);

  return {
    wards,
    complaints: filteredComplaints,
    allComplaints: complaints,
    loading,
    error,
    stats,
    refreshData: fetchInitialData,
    handleNewComplaint,
    handleUpdateComplaint,
  };
};
