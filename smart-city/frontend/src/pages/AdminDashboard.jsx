import React, { useState, useEffect } from 'react';
import { getComplaints, updateComplaintStatus, getStats } from '../services/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Filter, CheckCircle2, Clock, AlertCircle,
  Lock, ShieldCheck, RefreshCw, Users, ChevronDown, ChevronUp,
  User, Phone, Zap, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, buttonTap, shakeVariants, fadeInUp } from '../animations/variants';
import AnimatedCounter from '../components/AnimatedCounter';
import StatusBadge from '../components/StatusBadge';
import { SkeletonRow, SkeletonStatCard } from '../components/SkeletonLoader';

/* ─── Admin login gate ──────────────────────────────────────────────── */
const LoginGate = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [shake, setShake]       = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') { onSuccess(); toast.success('Welcome, Admin!'); }
    else { setShake(true); setTimeout(() => setShake(false), 600); toast.error('Incorrect password'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-20 p-10 bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-700 shadow-2xl text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/8 to-transparent pointer-events-none" />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.15 }}
        className="w-20 h-20 bg-blue-500/20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
        <Lock className="w-9 h-9 text-blue-400" />
      </motion.div>
      <h2 className="text-3xl font-black mb-2 tracking-tight">Admin Access</h2>
      <p className="text-gray-400 mb-8">Protected area — enter the admin password.</p>
      <form onSubmit={handleLogin} className="space-y-4">
        <motion.div animate={shake ? 'shake' : 'idle'} variants={shakeVariants}>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password (admin123)"
            className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-5 py-4 text-center text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono tracking-widest"
          />
        </motion.div>
        <motion.button {...buttonTap} type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25">
          Access Dashboard
        </motion.button>
      </form>
    </motion.div>
  );
};

/* ─── Inline reporter list for a row ───────────────────────────────── */
const ReporterDropdown = ({ reporters }) => {
  const [open, setOpen] = useState(false);
  if (!reporters || reporters.length === 0) return <span className="text-gray-600 text-xs">—</span>;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold transition-colors"
      >
        <Users className="w-3.5 h-3.5" />
        {reporters.length} {reporters.length === 1 ? 'reporter' : 'reporters'}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute left-0 top-9 z-50 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-64 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-700 text-xs text-gray-500 font-bold uppercase tracking-wider px-4 py-2.5">
              All Reporters
            </div>
            {reporters.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                    <Phone className="w-3 h-3 shrink-0" />{r.contact}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(r.reportedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Stat card ─────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value }) => (
  <motion.div variants={staggerItem}
    whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
    className="bg-gray-800/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-700 flex items-center gap-5 shadow-lg">
    <div className={`p-4 ${iconBg} rounded-2xl shrink-0`}>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <AnimatedCounter target={value} />
    </div>
  </motion.div>
);

/* ─── Main dashboard ─────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters]       = useState({ category: 'All', status: 'All', sort: '-createdAt' });
  const [stats, setStats]           = useState({ total: 0, pending: 0, resolved: 0, totalReports: 0 });
  const [updatingId, setUpdatingId] = useState(null);
  const [resolutionMap, setResolutionMap] = useState({});
  const [statusDraftMap, setStatusDraftMap] = useState({});

  const fetchComplaints = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await getComplaints(filters);
      if (res.success) setComplaints(res.data);
    } catch { toast.error('Failed to fetch complaints'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await getStats();
      if (res.success) setStats(res.data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchComplaints();
    fetchStats();
  }, [filters, isAuthenticated]);

  const handleStatusUpdate = async (complaint) => {
    const id = complaint._id;
    const newStatus = statusDraftMap[id] || complaint.status;
    const resolution = resolutionMap[id] || complaint.resolution || '';
    if (newStatus === 'Resolved' && !resolution.trim()) {
      toast.error('Please add resolution details before resolving.');
      return;
    }
    setUpdatingId(id);
    try {
      const res = await updateComplaintStatus(id, { status: newStatus, resolution, changedBy: 'admin' });
      if (res.success) {
        toast.success(`Saved update: ${newStatus}`);
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, ...res.data } : c));
        setResolutionMap((prev) => ({ ...prev, [id]: res.data?.resolution || resolution }));
        fetchStats();
      }
    } catch { toast.error('Failed to update status'); }
    finally { setUpdatingId(null); }
  };

  if (!isAuthenticated) return <LoginGate onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={staggerItem} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-2xl">
            <ShieldCheck className="w-9 h-9 text-blue-400" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h2>
            <p className="text-gray-400 text-sm mt-0.5">{complaints.length} complaints • {stats.totalReports || 0} total reports</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button {...buttonTap} onClick={() => fetchComplaints(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </motion.button>
          <motion.button {...buttonTap} onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl transition-colors">
            <Lock className="w-4 h-4" /> Lock
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? [0,1,2,3].map(i => <motion.div key={i} variants={staggerItem}><SkeletonStatCard /></motion.div>) : (
          <>
            <StatCard icon={LayoutDashboard} iconBg="bg-blue-500/20"    iconColor="text-blue-400"    label="Total Complaints" value={stats.total || 0} />
            <StatCard icon={TrendingUp}      iconBg="bg-purple-500/20"   iconColor="text-purple-400"  label="Total Reports"    value={stats.totalReports || 0} />
            <StatCard icon={Clock}           iconBg="bg-amber-500/20"    iconColor="text-amber-400"   label="Pending"          value={stats.pending || 0} />
            <StatCard icon={CheckCircle2}    iconBg="bg-emerald-500/20"  iconColor="text-emerald-400" label="Resolved"         value={stats.resolved || 0} />
          </>
        )}
      </div>

      {/* Filters */}
      <motion.div variants={staggerItem}
        className="bg-gray-800/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-700 shadow-md flex flex-col sm:flex-row gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2 font-semibold text-gray-300">
          <Filter className="w-5 h-5 text-blue-400" /> Filters:
        </div>

        <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="bg-gray-900/60 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto transition-all cursor-pointer font-medium">
          <option value="All">All Categories</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Roads">Roads</option>
          <option value="Water Department">Water Department</option>
          <option value="Electrical">Electrical</option>
          <option value="General">General</option>
        </select>

        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="bg-gray-900/60 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto transition-all cursor-pointer font-medium">
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
          className="bg-gray-900/60 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto transition-all cursor-pointer font-medium">
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="-reportCount">Most Reported</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div variants={staggerItem}
        className="bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/70 border-b border-gray-700">
                {['Complaint', 'Category', 'Reporters', 'Status', 'Feedback', 'Actions'].map(h => (
                  <th key={h} className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0,1,2,3].map(i => <SkeletonRow key={i} />)
                : complaints.length === 0
                  ? (
                    <tr>
                      <td colSpan="6" className="p-16 text-center text-gray-500">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 opacity-40" />
                          </div>
                          <p className="font-semibold text-lg">No complaints found</p>
                          <p className="text-sm text-gray-600 mt-1">Try adjusting your filters</p>
                        </motion.div>
                      </td>
                    </tr>
                  )
                  : complaints.map((c, i) => (
                    <motion.tr
                      key={c._id}
                      custom={i}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="border-b border-gray-700/40 hover:bg-gray-700/20 transition-colors group"
                    >
                      {/* Title */}
                      <td className="p-5 max-w-xs">
                        <div className="font-bold text-white mb-1 truncate group-hover:text-blue-300 transition-colors" title={c.title}>
                          {c.title}
                        </div>
                        <code className="text-xs text-gray-500 bg-gray-900/60 px-2 py-0.5 rounded">
                          {c._id.slice(0, 14)}…
                        </code>
                        <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-5">
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-block px-3 py-1 bg-gray-900 rounded-full text-xs font-bold text-purple-400 border border-purple-500/20 w-fit">
                            {c.category}
                          </span>
                          {c.mlConfidence > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                              <Zap className="w-3 h-3 text-blue-400" />
                              {Math.round(c.mlConfidence * 100)}% AI
                            </span>
                          )}
                          <div className="text-xs text-gray-400 truncate max-w-[160px]" title={c.location}>{c.location}</div>
                        </div>
                      </td>

                      {/* Reporters */}
                      <td className="p-5">
                        <ReporterDropdown reporters={c.reporters} />
                      </td>

                      {/* Status badge */}
                      <td className="p-5">
                        <StatusBadge status={c.status} size="sm" />
                      </td>

                      {/* Feedback summary */}
                      <td className="p-5">
                        <div className="text-xs text-gray-300 space-y-1">
                          <p>{c.feedback?.length || 0} feedback(s)</p>
                          <p className="text-yellow-400 font-semibold">
                            Avg: {c.averageRating ? c.averageRating.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                      </td>

                      {/* Update dropdown + resolution */}
                      <td className="p-5">
                        <div className="relative inline-block">
                          {updatingId === c._id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-xl z-10">
                              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          <select
                            value={statusDraftMap[c._id] || c.status}
                            onChange={e => setStatusDraftMap((prev) => ({ ...prev, [c._id]: e.target.value }))}
                            disabled={updatingId === c._id}
                            className="bg-gray-900 border border-gray-600 hover:border-blue-500 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-medium"
                          >
                            <option value="Pending">Set Pending</option>
                            <option value="In Progress">Set In Progress</option>
                            <option value="Resolved">Set Resolved</option>
                          </select>
                        </div>
                        <textarea
                          value={resolutionMap[c._id] ?? c.resolution ?? ''}
                          onChange={(e) => setResolutionMap((prev) => ({ ...prev, [c._id]: e.target.value }))}
                          placeholder="Resolution details for citizen..."
                          rows={2}
                          className="mt-2 w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500"
                        />
                        <button
                          onClick={() => handleStatusUpdate(c)}
                          disabled={updatingId === c._id}
                          className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          Save Action
                        </button>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
