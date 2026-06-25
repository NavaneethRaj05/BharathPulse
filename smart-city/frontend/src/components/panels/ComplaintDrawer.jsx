import React, { useState, useEffect } from 'react';
import { getComplaint, updateComplaintStatus, escalateComplaint } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Users, Calendar, AlertTriangle, CheckCircle2, ShieldAlert,
  Clock, CheckCircle, Image as ImageIcon, Sparkles, User, RefreshCw
} from 'lucide-react';
import { PRIORITY_COLORS } from '../../constants/mapConfig';

export const ComplaintDrawer = ({
  complaintId,
  onClose,
  refreshMapData,
  onFocusCoordinates,
  userRole = 'Citizen',
}) => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  
  // Authority controls
  const [statusVal, setStatusVal] = useState('Pending');
  const [resolutionText, setResolutionText] = useState('');
  const [resolvedFile, setResolvedFile] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await getComplaint(complaintId);
      if (res.success) {
        setComplaint(res.data);
        setStatusVal(res.data.status);
        setResolutionText(res.data.resolution || '');
      }
    } catch (err) {
      toast.error('Failed to fetch complaint details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) {
      fetchDetails();
    }
  }, [complaintId]);

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!escalateReason.trim()) return toast.error('Please enter a reason for escalation');

    setUpdateLoading(true);
    try {
      const res = await escalateComplaint(complaint._id, escalateReason.trim());
      if (res.success) {
        toast.success('Complaint escalated to Higher Authority');
        setComplaint(res.data);
        setEscalateOpen(false);
        if (refreshMapData) refreshMapData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Escalation failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const payload = new FormData();
      payload.append('status', statusVal);
      payload.append('resolution', resolutionText);
      payload.append('changedBy', userRole);
      if (resolvedFile) {
        payload.append('resolvedImage', resolvedFile);
      }

      const res = await updateComplaintStatus(complaint._id, payload);
      if (res.success) {
        toast.success('Incident status updated');
        setComplaint(res.data);
        setResolvedFile(null);
        if (refreshMapData) refreshMapData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Status update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-slate-400 select-none">
        <div className="text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <span className="text-xs font-semibold">Retrieving ticket history...</span>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  // Inferred Priority based on escalation
  const priority = complaint.isEscalated ? 'Critical' : complaint.reportCount > 5 ? 'High' : 'Medium';
  const priorityColor = PRIORITY_COLORS[priority] || '#94a3b8';

  const categoryColors = {
    Sanitation: 'text-emerald-400 border-emerald-500/25 bg-emerald-950/20',
    Roads: 'text-rose-400 border-rose-500/25 bg-rose-950/20',
    'Water Department': 'text-blue-400 border-blue-500/25 bg-blue-950/20',
    Electrical: 'text-amber-400 border-amber-500/25 bg-amber-950/20',
    General: 'text-purple-400 border-purple-500/25 bg-purple-950/20',
  };

  const statusColors = {
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-xs font-mono font-black text-slate-400 uppercase">{complaint.complaintCode}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Escalation Alert Ribbon */}
        {complaint.isEscalated && (
          <div className="bg-rose-950/40 border border-rose-500/35 rounded-xl p-3 flex gap-2.5 items-start">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wide">Escalated Ticket</span>
              <span className="text-[10px] text-slate-300 mt-0.5 leading-tight">{complaint.escalationReason}</span>
            </div>
          </div>
        )}

        {/* Title & Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{ borderColor: `${priorityColor}30`, backgroundColor: `${priorityColor}15`, color: priorityColor }}
            >
              {priority}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${categoryColors[complaint.category] || 'bg-slate-800 text-slate-300'}`}>
              {complaint.category}
            </span>
          </div>

          <h3 className="text-base font-bold text-white leading-snug">{complaint.title}</h3>
          
          <button
            onClick={() => onFocusCoordinates && onFocusCoordinates([complaint.latitude, complaint.longitude])}
            className="mt-2 text-[10px] font-semibold text-slate-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            {complaint.location}
            {complaint.ward && complaint.ward.name && (
              <span className="text-white font-bold">({complaint.ward.name} Ward)</span>
            )}
          </button>
        </div>

        {/* General Details Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-white/5 p-3 rounded-xl">
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Status</span>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-1 ${statusColors[complaint.status]}`}>
              {complaint.status}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Reports</span>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1 mt-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {complaint.reportCount} citizens
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Filed At</span>
            <span className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Authority Route</span>
            <span className="text-xs text-slate-300 mt-1 block truncate font-medium">
              {complaint.assignedDept || 'General'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Details / Description</span>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/20 border border-white/5 p-3 rounded-xl">
            {complaint.description}
          </p>
        </div>

        {/* Image Attachments */}
        {complaint.imageUrl && (
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Evidence Photo</span>
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg aspect-video relative group bg-black/40">
              <img src={complaint.imageUrl} alt="Incident Evidence" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* Resolution Notes */}
        {complaint.status === 'Resolved' && (
          <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Resolution Details</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {complaint.resolution || 'Incident marked resolved by authorities.'}
            </p>
            {complaint.resolvedImageUrl && (
              <div className="rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/40 mt-2">
                <img src={complaint.resolvedImageUrl} alt="Resolution Evidence" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        )}

        {/* Status History Timeline */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3.5">Audit History Log</span>
          
          <div className="relative pl-4 border-l border-white/10 space-y-4 ml-1">
            {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
              complaint.statusHistory.map((history, idx) => (
                <div key={idx} className="relative">
                  {/* Bullet */}
                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                    history.status === 'Resolved' ? 'bg-emerald-500' : history.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}></div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white leading-none flex items-center gap-1.5">
                      {history.status}
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400 uppercase">
                        {history.changedBy}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-300 mt-1">{history.note}</span>
                    <span className="text-[9px] text-slate-500 font-semibold mt-1">
                      {new Date(history.changedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic block">No log history available.</span>
            )}
          </div>
        </div>

        {/* Authority Operations Form (Change Status) */}
        {complaint.status !== 'Resolved' && userRole !== 'Citizen' && (
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-4 shadow-inner">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Authority Dispatch Desk</span>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Set Operations Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Pending">Pending Audit</option>
                  <option value="In Progress">Deploy Dispatch Unit (In Progress)</option>
                  <option value="Resolved">Confirm Resolution (Resolved)</option>
                </select>
              </div>

              {statusVal === 'Resolved' && (
                <>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Resolution Summary Note *</label>
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Explain how the grievance was resolved..."
                      rows="2"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Upload Work Verification Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setResolvedFile(e.target.files[0])}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer file:cursor-pointer"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={updateLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
              >
                {updateLoading ? 'Updating Incident...' : 'Commit Status Update'}
              </button>
            </form>
          </div>
        )}

        {/* Citizen Escalation Portal */}
        {complaint.status !== 'Resolved' && !complaint.isEscalated && userRole === 'Citizen' && (
          <div className="border-t border-white/5 pt-4">
            {!escalateOpen ? (
              <button
                onClick={() => setEscalateOpen(true)}
                className="w-full py-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-rose-400 hover:text-rose-300 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Escalate Complaint to Board
              </button>
            ) : (
              <form onSubmit={handleEscalate} className="bg-rose-950/10 border border-rose-500/20 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">File Board Escalation</span>
                  <button
                    type="button"
                    onClick={() => setEscalateOpen(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="State the escalation grounds (e.g. SLA delay, unresolved after 48h)..."
                  rows="2"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-md shadow-rose-600/10"
                >
                  {updateLoading ? 'Sending Alert...' : 'File Official Escalation'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDrawer;
