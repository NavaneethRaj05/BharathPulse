import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Building2, RefreshCw, CheckCircle2, MapPin, Tag, Clock,
  Wrench, Loader2, ChevronRight, LayoutGrid, X, AlertCircle,
  Droplets, Lightbulb, Trees, ShieldCheck, Globe2, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getComplaints, getLocations, updateComplaintStatus } from '../services/api';
import StatusBadge from '../components/StatusBadge';

/* ── Category config ── */
const CATEGORY_CONFIG = {
  'Sanitation':         { icon: Trees,    color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/25', dept: 'Public Health & Sanitation Department' },
  'Roads':              { icon: Wrench,   color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/25', dept: 'Public Works & Infrastructure Department' },
  'Water Department':   { icon: Droplets, color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/25',   dept: 'Water & Sewerage Department' },
  'Electrical':         { icon: Lightbulb,color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25', dept: 'Electricity & Power Department' },
  'General':            { icon: Globe2,   color: 'text-gray-400',   bg: 'bg-gray-500/15',   border: 'border-gray-500/25',   dept: 'General Administration Department' },
};

/* ── Status pill helper ── */
const statusColor = (status) => {
  if (status === 'Resolved')    return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
  if (status === 'In Progress') return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
  return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
};

/* ── Location card ── */
const LocationCard = ({ loc, isSelected, onClick }) => {
  const resolvedPct = loc.total > 0 ? Math.round((loc.resolved / loc.total) * 100) : 0;
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative text-left w-full rounded-3xl border p-5 transition-all overflow-hidden group ${
        isSelected
          ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
          : 'bg-gray-800/60 border-gray-700/60 hover:border-gray-600'
      }`}
    >
      {/* Glow */}
      {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent pointer-events-none" />}

      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-500/20' : 'bg-gray-700/60'}`}>
          <MapPin className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-sm leading-snug truncate ${isSelected ? 'text-emerald-200' : 'text-white'}`} title={loc.location}>
            {loc.location}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{loc.total} complaint{loc.total !== 1 ? 's' : ''}</p>
        </div>
        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
      </div>

      {/* Mini stat row */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {loc.pending > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400">
            {loc.pending} Pending
          </span>
        )}
        {loc.inProgress > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400">
            {loc.inProgress} Active
          </span>
        )}
        {loc.resolved > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            {loc.resolved} Done
          </span>
        )}
      </div>

      {/* Resolution bar */}
      <div className="h-1 bg-gray-700/60 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${resolvedPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-1">{resolvedPct}% resolved</p>
    </motion.button>
  );
};

/* ── Category selector chip ── */
const CategoryChip = ({ cat, count, isSelected, onClick }) => {
  const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['General'];
  const Icon = cfg.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold transition-all ${
        isSelected
          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
          : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {cat}
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/10' : 'bg-gray-700'}`}>
        {count}
      </span>
    </motion.button>
  );
};

/* ══════════════════════════════════════════════ */
const DepartmentPortal = () => {
  const [locations, setLocations]       = useState([]);      // all location entries
  const [locLoading, setLocLoading]     = useState(true);
  const [selectedLoc, setSelectedLoc]   = useState(null);    // selected location string
  const [selectedCat, setSelectedCat]   = useState('All');   // category filter
  const [complaints, setComplaints]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [savingId, setSavingId]         = useState('');
  const [resolutionMap, setResolutionMap] = useState({});

  /* categories available in selected location */
  const availableCategories = useMemo(() => {
    if (!selectedLoc) return [];
    const found = locations.find((l) => l.location === selectedLoc);
    return found ? found.categories : [];
  }, [selectedLoc, locations]);

  /* ── Load locations on mount ── */
  const fetchLocations = async () => {
    setLocLoading(true);
    try {
      const res = await getLocations();
      if (res.success) setLocations(res.data);
    } catch {
      toast.error('Failed to fetch locations');
    } finally {
      setLocLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  /* ── Load complaints whenever location/category changes ── */
  const fetchComplaints = async () => {
    if (!selectedLoc) { setComplaints([]); return; }
    setLoading(true);
    try {
      const params = { sort: '-createdAt', location: selectedLoc };
      if (selectedCat !== 'All') params.category = selectedCat;
      const res = await getComplaints(params);
      if (res.success) setComplaints(res.data);
    } catch {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [selectedLoc, selectedCat]);

  /* ── Status update ── */
  const handleUpdate = async (complaintId, status) => {
    setSavingId(complaintId);
    try {
      const resolution = resolutionMap[complaintId] || '';
      const dept = complaints.find((c) => c._id === complaintId)?.assignedDept || 'Department';
      await updateComplaintStatus(complaintId, { status, resolution, changedBy: dept });
      toast.success(`Updated to ${status}`);
      fetchComplaints();
      fetchLocations(); // refresh location stats
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-800/70 border border-gray-700/60 rounded-[2rem] p-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-violet-500/10 border border-blue-500/25 rounded-2xl">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Department Portal</h2>
              <p className="text-sm text-gray-400">Select a location → filter by category → manage complaints</p>
            </div>
          </div>
          <button
            onClick={() => { fetchLocations(); fetchComplaints(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-700/60 hover:bg-gray-600 border border-gray-600/60 text-white font-semibold text-sm transition-all shrink-0"
          >
            <RefreshCw className="w-4 h-4" /> Refresh All
          </button>
        </div>
      </motion.div>

      {/* ── Locations grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">Step 1</p>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Registered Locations
              {!locLoading && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                  {locations.length} area{locations.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
          </div>
          {selectedLoc && (
            <button
              onClick={() => { setSelectedLoc(null); setSelectedCat('All'); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-full transition-all"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {locLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-800/40 border border-gray-700/40 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-2xl mb-4">
              <Globe2 className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 font-semibold">No locations registered yet</p>
            <p className="text-sm text-gray-600 mt-1">Locations appear as citizens submit complaints</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locations.map((loc, i) => (
              <motion.div
                key={loc.location}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <LocationCard
                  loc={loc}
                  isSelected={selectedLoc === loc.location}
                  onClick={() => {
                    setSelectedLoc(selectedLoc === loc.location ? null : loc.location);
                    setSelectedCat('All');
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Category filter (visible only when location selected) ── */}
      <AnimatePresence>
        {selectedLoc && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <div className="mb-3">
              <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">Step 2</p>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                Filter by Category
                <span className="text-xs font-semibold text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                  {selectedLoc}
                </span>
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* All chip */}
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCat('All')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold transition-all ${
                  selectedCat === 'All'
                    ? 'bg-gray-600/60 border-gray-500 text-white'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                All Categories
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700">{complaints.length || '—'}</span>
              </motion.button>

              {availableCategories.map((cat) => {
                const catCount = complaints.filter((c) => c.category === cat).length;
                return (
                  <CategoryChip
                    key={cat}
                    cat={cat}
                    count={catCount}
                    isSelected={selectedCat === cat}
                    onClick={() => setSelectedCat(selectedCat === cat ? 'All' : cat)}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Complaints table ── */}
      <AnimatePresence>
        {selectedLoc && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-violet-400 font-bold uppercase tracking-widest mb-1">Step 3</p>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-violet-400" />
                  Complaints Queue
                  {!loading && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                      {complaints.length} result{complaints.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="bg-gray-800/70 border border-gray-700/60 rounded-[2rem] overflow-hidden shadow-xl">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-6 py-3 bg-gray-900/70 border-b border-gray-700/60">
                {['Complaint', 'Category', 'Status', 'Resolution Note'].map((h) => (
                  <p key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</p>
                ))}
              </div>

              {/* Rows */}
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Loading complaints…</span>
                </div>
              ) : complaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-2xl mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 font-semibold">No complaints for this selection</p>
                  <p className="text-sm text-gray-600 mt-1">Try a different location or category</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/40">
                  {complaints.map((complaint, idx) => {
                    const cfg = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG['General'];
                    const CatIcon = cfg.icon;
                    return (
                      <motion.div
                        key={complaint._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-6 py-4 items-center hover:bg-gray-800/30 transition-colors group"
                      >
                        {/* Title + code */}
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{complaint.title}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{complaint.complaintCode || complaint._id?.slice(-8)}</p>
                          <p className="text-xs text-gray-600 mt-0.5 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {complaint.location}
                          </p>
                        </div>

                        {/* Category */}
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.color} w-fit`}>
                          <CatIcon className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[80px]">{complaint.category}</span>
                        </div>

                        {/* Status select */}
                        <div className="w-fit">
                          <StatusBadge status={complaint.status} size="sm" />
                        </div>

                        {/* Resolution note */}
                        <div className="text-xs text-gray-300 italic truncate max-w-md" title={complaint.resolution || 'No resolution note provided yet.'}>
                          {complaint.resolution || <span className="text-gray-500">No resolution note provided yet.</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state if no location selected */}
      {!selectedLoc && !locLoading && locations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center bg-gray-800/30 border border-dashed border-gray-700/60 rounded-[2rem]"
        >
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-2xl mb-4">
            <MapPin className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-white font-bold text-lg">Select a Location to Begin</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">Pick one of the registered areas above to view and manage its complaints by category.</p>
        </motion.div>
      )}

    </div>
  );
};

export default DepartmentPortal;
