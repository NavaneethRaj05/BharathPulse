import React, { useState, useEffect } from 'react';
import { getWardComplaints } from '../../services/gis.api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Activity, CheckCircle, Clock, ChevronRight, 
  AlertTriangle, ShieldCheck, User, X, ShieldAlert, Award
} from 'lucide-react';
import { PRIORITY_COLORS } from '../../constants/mapConfig';

export const WardDetailPanel = ({
  ward,
  onClose,
  onComplaintClick,
}) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ward && ward.id) {
      setLoading(true);
      getWardComplaints(ward.id)
        .then((res) => {
          if (res.success) {
            setComplaints(res.data);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load ward complaints');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [ward]);

  if (!ward) return null;

  const stats = ward.stats || { total: 0, open: 0, resolved: 0, escalated: 0, slaCompliance: 100, avgResolutionHours: 0 };

  // Calculate local category breakdown
  const categoryCounts = complaints.reduce((acc, curr) => {
    const cat = curr.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categories = ['Sanitation', 'Roads', 'Water Department', 'Electrical', 'General'];

  // Mocked officers based on ward Zone/District
  const officers = [
    { name: 'K. S. Swamy', role: 'Superintendent', dept: 'Health', status: 'ACTIVE' },
    { name: 'Meenakshi R.', role: 'Executive Engineer', dept: 'PWD', status: 'ON DUTY' },
  ];

  return (
    <div className="flex flex-col select-none text-slate-300 w-full">
      {/* Floating HUD Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#5B8CFF]" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Ward Analytics HUD</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 bg-slate-900 border border-white/10 hover:border-[#FF5C7A] text-slate-400 hover:text-white rounded-md cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto no-scrollbar max-h-[70vh]">
        {/* Ward Title Card */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white uppercase leading-none">{ward.name}</h3>
            <span className="text-[9px] font-mono text-slate-500 mt-1 leading-none">
              ID: {ward.number} • {ward.zone} Zone
            </span>
          </div>
          <span className="text-[8px] bg-slate-900 border border-white/10 text-slate-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
            {ward.district || 'City'}
          </span>
        </div>

        {/* SLA Circular Progress & Health Indicators */}
        <div className="grid grid-cols-3 gap-3 bg-[#050816]/40 border border-white/5 p-3 rounded-xl items-center">
          {/* Health circular SVG ring */}
          <div className="flex flex-col items-center justify-center col-span-1">
            <svg className="w-12 h-12" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#00D084]"
                strokeWidth="3.5"
                strokeDasharray={`${stats.slaCompliance}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ stroke: stats.slaCompliance < 70 ? '#FF5C7A' : stats.slaCompliance < 85 ? '#FFB020' : '#00D084' }}
              />
              <text x="18" y="20.5" className="fill-white font-mono font-black text-[8px] text-center" textAnchor="middle">
                {stats.slaCompliance}%
              </text>
            </svg>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block">SLA Rate</span>
          </div>

          <div className="col-span-2 space-y-2 pl-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Total reports:</span>
              <span className="font-mono font-black text-slate-200">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Open cases:</span>
              <span className="font-mono font-black text-[#FFB020] text-glow-warning">{stats.open}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Avg Resolution:</span>
              <span className="font-mono font-black text-[#5B8CFF]">{stats.avgResolutionHours ? `${stats.avgResolutionHours}h` : '12h'}</span>
            </div>
          </div>
        </div>

        {/* Categories Stacked Bar Meter */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">COMPLAINT DISTRIBUTION</span>
          <div className="bg-[#050816]/40 border border-white/5 p-3 rounded-xl space-y-2.5">
            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const total = complaints.length || 1;
              const percent = Math.round((count / total) * 100);

              const colorMap = {
                Sanitation: '#00D084',
                Roads: '#FF5C7A',
                'Water Department': '#5B8CFF',
                Electrical: '#FFB020',
                General: '#7C3AED',
              };

              const color = colorMap[cat] || '#94a3b8';

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                      {cat.replace(' Department', '')}
                    </span>
                    <span className="font-mono text-slate-400">{count}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resolution Trend EKG Sparkline */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-widest block text-glow-primary">RESOLUTION PERFORMANCE TREND</span>
          <div className="bg-[#050816]/40 border border-white/5 p-3 rounded-xl flex flex-col gap-2">
            <svg className="w-full h-8 stroke-current text-[#5B8CFF] filter drop-shadow-[0_0_2px_rgba(91,140,255,0.4)]" viewBox="0 0 100 20" fill="none">
              <path d="M 0,16 Q 15,3 30,12 T 60,6 T 85,15 T 100,8" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="flex justify-between text-[7px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Ward Assigned Officers */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">WARD COMMAND DECK</span>
          <div className="grid grid-cols-2 gap-2">
            {officers.map((off, idx) => (
              <div key={idx} className="p-2 bg-[#050816]/40 border border-white/5 rounded-xl flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-[#5B8CFF]" />
                  <span className="text-[10px] font-bold text-white truncate">{off.name}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[8px] font-extrabold text-[#5B8CFF] uppercase tracking-wider font-mono">{off.dept}</span>
                  <span className="text-[7px] font-black text-[#00D084] animate-pulse">● {off.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Queue */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">LOCAL TICKETS QUEUE</span>
          
          {loading ? (
            <span className="text-[9px] font-bold text-slate-500 italic block pl-1">Syncing ward queues...</span>
          ) : complaints.length === 0 ? (
            <div className="p-3 border border-dashed border-white/10 rounded-xl text-center text-[10px] text-slate-500 font-bold flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#00D084]" />
              WARD COMPLIANT STABLE
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {complaints.map((c) => {
                const statusColors = {
                  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                };

                return (
                  <div
                    key={c._id}
                    onClick={() => onComplaintClick && onComplaintClick({
                      id: c._id,
                      code: c.complaintCode,
                      title: c.title,
                      category: c.category,
                      status: c.status,
                      lat: c.latitude,
                      lng: c.longitude,
                      location: c.location,
                      reportCount: c.reportCount || 1,
                      isEscalated: c.isEscalated || false,
                      ward: c.ward || null,
                    })}
                    className="p-2 bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-white/15 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="text-[10px] font-bold text-slate-200 truncate pr-2 leading-none">{c.title}</span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded border shrink-0 font-mono ${statusColors[c.status]}`}>
                      {c.status.replace('In Progress', 'RUNNING')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WardDetailPanel;
