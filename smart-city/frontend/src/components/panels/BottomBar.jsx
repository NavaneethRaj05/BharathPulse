import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, Play } from 'lucide-react';
import { getActivityFeed } from '../../services/gis.api';

export const BottomBar = ({ feedEvents, onEventClick }) => {
  const [localEvents, setLocalEvents] = useState([]);

  useEffect(() => {
    getActivityFeed().then((res) => {
      if (res.success) setLocalEvents(res.data);
    });
  }, []);

  useEffect(() => {
    if (feedEvents && feedEvents.length > 0) {
      setLocalEvents((prev) => {
        const merged = [...feedEvents, ...prev];
        const unique = merged.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
        return unique.slice(0, 20);
      });
    }
  }, [feedEvents]);

  const getEventPrefix = (type) => {
    switch (type) {
      case 'created':
        return '🔵 SUBMITTED';
      case 'resolved':
        return '🟢 RESOLVED';
      case 'escalated':
        return '🔴 ESCALATED';
      default:
        return '🟡 UPDATE';
    }
  };

  const renderEventItem = (event, idx) => {
    // Generate a consistent timestamp if not present
    const timeStr = event.createdAt 
      ? new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const prefix = getEventPrefix(event.type);
    const prefixColor = event.type === 'resolved' 
      ? 'text-[#00D084]' 
      : event.type === 'escalated' 
        ? 'text-[#FF5C7A]' 
        : 'text-[#5B8CFF]';

    return (
      <div
        key={`${event.id || event.code}-${idx}`}
        onClick={() => onEventClick && onEventClick(event)}
        className="flex items-center gap-2.5 px-3 py-1 bg-[#0F172A]/50 border border-white/5 hover:border-[#5B8CFF] rounded-lg text-[11px] font-mono transition-all hover:bg-[#0F172A] cursor-pointer select-none text-slate-300"
      >
        <span className="text-slate-600 font-bold">[{timeStr}]</span>
        <span className={`font-black tracking-wider ${prefixColor}`}>{prefix}</span>
        <span className="font-black text-slate-100">{event.code}</span>
        <span className="text-slate-400 font-semibold max-w-[180px] truncate">{event.title}</span>
        {event.ward && (
          <span className="text-[8px] bg-[#050816] px-1.5 py-0.5 rounded border border-white/5 font-extrabold uppercase tracking-wider text-slate-500">
            {event.ward.name}
          </span>
        )}
      </div>
    );
  };

  // Repeat events to fill marquee if there are few
  const displayEvents = localEvents.length > 0 
    ? (localEvents.length < 8 ? [...localEvents, ...localEvents, ...localEvents] : [...localEvents, ...localEvents])
    : [];

  return (
    <footer className="h-12 w-full bg-[#050816] border-t border-white/10 z-[1001] flex items-center px-4 relative overflow-hidden select-none">
      {/* Live Activity Beacon Badge */}
      <div className="flex items-center gap-2 bg-[#050816] border-r border-white/10 pr-4 h-full relative z-[100] shadow-[10px_0_15px_-3px_rgba(5,8,22,1)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C7A] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5C7A]"></span>
        </span>
        <span className="text-[10px] font-black tracking-widest text-[#FF5C7A] uppercase text-glow-danger">LIVE FEED</span>
      </div>

      {/* Terminal Marquee Wrapper */}
      <div className="flex-1 ticker-wrap pl-4">
        {localEvents.length === 0 ? (
          <span className="text-xs text-slate-500 font-mono italic">
            Connecting to municipal event stream channels...
          </span>
        ) : (
          <div className="ticker gap-4">
            {displayEvents.map((event, idx) => renderEventItem(event, idx))}
          </div>
        )}
      </div>
    </footer>
  );
};

export default BottomBar;
