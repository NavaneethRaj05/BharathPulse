import React, { useEffect, useState } from 'react';
import { getComplaint, submitFeedback } from '../services/api';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Tag, Calendar, Clock, Image as ImageIcon,
  Users, User, Phone, ChevronDown, ChevronUp, Zap, CheckCircle, Star,
  Mail, ShieldCheck, Wrench, FileText, Info, BadgeCheck, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { staggerContainer, staggerItem, buttonTap, shakeVariants } from '../animations/variants';
import StatusBadge from '../components/StatusBadge';
import ProgressTimeline from '../components/ProgressTimeline';

/* ── Feedback Section for Resolved Complaints ─────────────────── */
const FeedbackSection = ({ complaint, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating');

    setLoading(true);
    try {
      await submitFeedback(complaint._id, {
        reporterContact: 'anonymous', // In real app, get from user session
        rating,
        comment
      });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      if (onSubmitted) onSubmitted();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex p-3 bg-green-500/20 rounded-2xl mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Feedback Submitted</h3>
        <p className="text-gray-400">Your rating helps us improve our services.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
        <Star className="w-4 h-4" /> Rate Our Resolution
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">How satisfied are you with the resolution?</label>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(star => (
              <button
                key={star} type="button" onClick={() => setRating(star)}
                className={`p-2 rounded-lg transition-all ${rating >= star ? 'text-yellow-400 bg-yellow-500/20' : 'text-gray-600 hover:text-yellow-400'}`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Additional Comments (Optional)</label>
          <textarea
            value={comment} onChange={e => setComment(e.target.value)} rows={3}
            placeholder="Tell us how we can improve..."
            className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none"
          />
        </div>
        <button
          type="submit" disabled={loading || rating === 0}
          className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-yellow-500/25"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

/* ── Reporter list accordion ─────────────────────────────────────── */
const ReporterList = ({ reporters }) => {
  const [open, setOpen] = useState(false);
  if (!reporters || reporters.length === 0) return null;

  return (
    <div className="border border-gray-700/60 rounded-3xl overflow-hidden bg-gray-900/40">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <span className="font-bold text-white">
            {reporters.length} {reporters.length === 1 ? 'Person' : 'People'} Reported This
          </span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-700/60 divide-y divide-gray-700/40">
              {reporters.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-gray-700 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{r.name}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 truncate">
                      <Phone className="w-3 h-3 shrink-0" /> {r.contact}
                    </p>
                  </div>
                  <div className="ml-auto text-xs text-gray-500 shrink-0">
                    {new Date(r.reportedAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main page ────────────────────────────────────────────────────── */
const TrackComplaint = () => {
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [shake, setShake]             = useState(false);

  const fetchComplaintById = async (id) => {
    const res = await getComplaint(id.trim());
    if (res.success) setComplaint(res.data);
  };

  useEffect(() => {
    if (!complaint?._id) return undefined;
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.emit('complaint:join', complaint._id);
    socket.on('complaint:update', (updatedComplaint) => {
      setComplaint(updatedComplaint);
      toast.success(`Status updated: ${updatedComplaint.status}`);
    });
    return () => {
      socket.emit('complaint:leave', complaint._id);
      socket.disconnect();
    };
  }, [complaint?._id]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!complaintId.trim()) {
      setShake(true); setTimeout(() => setShake(false), 600);
      toast.error('Please enter a Complaint ID');
      return;
    }
    setLoading(true);
    setComplaint(null);
    try {
      await fetchComplaintById(complaintId);
    } catch {
      setShake(true); setTimeout(() => setShake(false), 600);
      toast.error('Complaint not found — check the ID and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
      {/* Search */}
      <motion.div
        variants={staggerItem}
        className="bg-gray-800/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-gray-700/60 shadow-[0_8px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-[-60px] right-[-60px] w-60 h-60 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-blue-500/8 rounded-full blur-[70px] pointer-events-none" />
        <div className="mb-8 text-center">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-emerald-500/30 to-blue-500/20 rounded-2xl mb-4 shadow-lg shadow-emerald-500/10">
            <Search className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-black mb-2 tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Track Your Case</h2>
          <p className="text-gray-400 text-lg">Enter your Complaint ID to see real-time status and updates.</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <motion.div animate={shake ? 'shake' : 'idle'} variants={shakeVariants} className="flex-1">
            <input
              type="text" value={complaintId} onChange={e => setComplaintId(e.target.value)}
              placeholder="Paste your Complaint ID here…"
              className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono shadow-inner"
            />
          </motion.div>
          <motion.button
            {...buttonTap} type="submit" disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 shrink-0"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Search className="w-5 h-5" />Locate</>}
          </motion.button>
        </form>
      </motion.div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {complaint && (
          <motion.div
            key={complaint._id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="bg-gray-800/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-gray-700 shadow-2xl space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-700/50 pb-8">
              <div>
                <h3 className="text-3xl font-black text-white mb-2 leading-tight">{complaint.title}</h3>
                <code className="text-xs font-mono text-gray-500 bg-gray-900/60 px-3 py-1 rounded-lg">
                  ID: {complaint.complaintCode || complaint._id}
                </code>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={complaint.status} />
                {complaint.reportCount > 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-bold"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {complaint.reportCount} people reported this
                  </motion.div>
                )}
              </div>
            </div>

            {/* Progress timeline */}
            <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 shadow-inner">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-8">Resolution Progress
                <span className="ml-2 text-gray-600 normal-case font-normal tracking-normal">(hover steps for details)</span>
              </p>
              <ProgressTimeline status={complaint.status} />
            </div>

            {/* Authority Resolution Description — In Progress */}
            {complaint.status === 'In Progress' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 p-5 bg-blue-500/8 border border-blue-500/25 rounded-3xl"
              >
                <div className="p-2.5 bg-blue-500/20 rounded-xl shrink-0">
                  <Wrench className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-300 mb-1">Authority Update — Case In Progress</p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {complaint.resolutionNote
                      ? complaint.resolutionNote
                      : `The ${complaint.category || 'relevant'} department has acknowledged this complaint and dispatched a field team. Active investigation and remedial work is currently underway. You will be notified once the issue is fully resolved.`}
                  </p>
                  {complaint.assignedTo && (
                    <p className="text-xs text-blue-400 mt-2 font-medium">Assigned to: <span className="text-white">{complaint.assignedTo}</span></p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Authority Resolution Description — Resolved */}
            {complaint.status === 'Resolved' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 p-5 bg-emerald-500/8 border border-emerald-500/25 rounded-3xl"
              >
                <div className="p-2.5 bg-emerald-500/20 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-300 mb-1">Authority Confirmation — Case Resolved</p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {complaint.resolutionNote
                      ? complaint.resolutionNote
                      : `The ${complaint.category || 'relevant'} department has confirmed that this issue has been fully addressed and resolved. All necessary work was completed by the authorized field team. The case is now officially closed.`}
                  </p>
                  {complaint.resolvedAt && (
                    <p className="text-xs text-emerald-400 mt-2 font-medium">
                      Resolved on: <span className="text-white">{new Date(complaint.resolvedAt).toLocaleString()}</span>
                    </p>
                  )}
                  {complaint.assignedTo && (
                    <p className="text-xs text-emerald-400 font-medium">Resolved by: <span className="text-white">{complaint.assignedTo}</span></p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ML metadata banner */}
            {complaint.mlConfidence > 0 && (
              <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                <Zap className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="text-sm">
                  <span className="text-gray-300">AI categorized as </span>
                  <strong className="text-white">{complaint.category}</strong>
                  <span className="text-gray-300"> with </span>
                  <strong className="text-blue-400">{Math.round(complaint.mlConfidence * 100)}% confidence</strong>
                </div>
              </div>
            )}

            {/* Reporter user details card (minimal) */}
            {complaint.reporters?.[0] && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/60 border border-gray-700/60 rounded-3xl p-5 space-y-3"
              >
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Primary Reporter
                </p>
                <div className="flex flex-wrap gap-4">
                  {complaint.reporters[0].name && (
                    <div className="flex items-center gap-2 bg-gray-800/70 border border-gray-700 rounded-xl px-3 py-2">
                      <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-sm text-gray-200 font-medium">{complaint.reporters[0].name}</span>
                    </div>
                  )}
                  {complaint.reporters[0].contact && (
                    <div className="flex items-center gap-2 bg-gray-800/70 border border-gray-700 rounded-xl px-3 py-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-sm text-gray-200 font-medium">{complaint.reporters[0].contact}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-gray-800/70 border border-gray-700 rounded-xl px-3 py-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-sm text-gray-200 font-medium">
                      {new Date(complaint.reporters[0].reportedAt || complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detail grid */}
            <div className="grid md:grid-cols-5 gap-6">
              <div className="md:col-span-3 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Full Description</p>
                <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 text-gray-200 leading-relaxed shadow-inner">
                  {complaint.description}
                </div>
              </div>

              <div className="md:col-span-2 bg-gray-900 p-6 rounded-3xl border border-gray-700 shadow-inner space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Metadata</p>
                {[
                  { icon: Tag,      color: 'text-purple-400', label: complaint.category },
                  { icon: MapPin,   color: 'text-red-400',    label: complaint.location },
                  { icon: Calendar, color: 'text-blue-400',   label: new Date(complaint.createdAt).toLocaleDateString() },
                  { icon: Clock,    color: 'text-amber-400',  label: new Date(complaint.createdAt).toLocaleTimeString() },
                ].map(({ icon: Icon, color, label }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i + 0.3 }} className="flex items-center gap-3">
                    <div className={`p-2 bg-gray-800 rounded-lg border border-gray-700 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-gray-300 font-medium truncate" title={label}>{label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reporters accordion */}
            <ReporterList reporters={complaint.reporters} />

            {/* Image */}
            {complaint.imageUrl && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="border-t border-gray-700/50 pt-8">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Attached Evidence
                </p>
                <div className="overflow-hidden rounded-3xl border border-gray-700 shadow-2xl max-w-2xl bg-gray-900">
                  <img src={complaint.imageUrl} alt="Evidence" className="w-full object-cover max-h-[480px] hover:scale-105 transition-transform duration-700" />
                </div>
              </motion.div>
            )}

            {/* Feedback for Resolved Complaints */}
            {complaint.status === 'Resolved' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="border-t border-gray-700/50 pt-8">
                <div className="mb-6 bg-gray-900/40 border border-gray-700 rounded-2xl p-4">
                  <p className="text-sm text-gray-300">
                    Feedback count: <span className="font-semibold text-white">{complaint.feedback?.length || 0}</span>
                    {' '}| Average rating:{' '}
                    <span className="font-semibold text-yellow-400">
                      {complaint.averageRating ? complaint.averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </p>
                  {(complaint.feedback?.length || 0) > 0 && (
                    <div className="mt-3 space-y-2">
                      {complaint.feedback.map((item, idx) => (
                        <div key={`${item.reporterContact}-${idx}`} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                          <p className="text-xs text-yellow-400 font-semibold">Rating: {item.rating}/5</p>
                          <p className="text-sm text-gray-300">{item.comment || 'No comment provided.'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <FeedbackSection complaint={complaint} onSubmitted={() => fetchComplaintById(complaintId)} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TrackComplaint;
