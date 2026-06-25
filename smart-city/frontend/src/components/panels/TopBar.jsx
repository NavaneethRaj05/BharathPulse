import React, { useState } from 'react';
import { Building2, Layers, Search, PlusCircle, Sun, Moon, ShieldCheck, Award } from 'lucide-react';

export const TopBar = ({
  stats,
  filters,
  setFilter,
  activeLayers,
  toggleLayer,
  isDarkMode,
  setIsDarkMode,
  onStartReporting,
  isPickingLocation,
}) => {
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);

  // Compute a live SLA compliance based on open and resolved reports or mock dynamic SLA compliance
  const slaPercentage = stats.totalReports > 0 
    ? Math.round(((stats.resolved) / (stats.totalReports)) * 100)
    : 92;
  const clampedSla = Math.min(Math.max(slaPercentage, 75), 98); // Ensure realistic range

  return (
    <header className="h-14 w-full glass-panel flex items-center justify-between px-6 z-[1001] border-b border-white/10 relative select-none">
      {/* Brand Logo & LGD Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#050816] border border-white/15 rounded-lg flex items-center justify-center glow-primary">
            <Building2 className="w-5 h-5 text-[#5B8CFF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white tracking-tight leading-none uppercase">BharathPulse</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Operating System</span>
          </div>
        </div>

        {/* LGD Hierarchy Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[9px] font-extrabold bg-[#050816]/60 border border-white/5 py-1 px-2.5 rounded-lg text-slate-400 uppercase tracking-wider">
          <span className={filters.level === 'NATIONAL' ? 'text-[#5B8CFF] text-glow-primary' : 'opacity-40'}>National</span>
          <span className="text-slate-600">&rarr;</span>
          <span className={filters.level === 'STATE' ? 'text-[#5B8CFF] text-glow-primary' : 'opacity-40'}>State</span>
          <span className="text-slate-600">&rarr;</span>
          <span className={filters.level === 'DISTRICT' ? 'text-[#5B8CFF] text-glow-primary' : 'opacity-40'}>District</span>
          <span className="text-slate-600">&rarr;</span>
          <span className={filters.level === 'LOCAL_BODY' ? 'text-[#5B8CFF] text-glow-primary' : 'opacity-40'}>Ward</span>
        </div>
      </div>

      {/* Live Command Health Ribbon */}
      <div className="hidden xl:flex items-center gap-6 bg-[#050816]/75 border border-white/5 px-4 py-1.5 rounded-xl shadow-inner shadow-black/40">
        {/* City Health Progress Track */}
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-wider text-glow-primary">City Health</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-black text-white">87%</span>
            <div className="w-20 h-2.5 bg-slate-950 border border-white/10 rounded-sm overflow-hidden flex items-center p-0.5">
              <div className="h-full bg-gradient-to-r from-[#FF5C7A] via-[#FFB020] to-[#00D084] rounded-sm shadow-[0_0_5px_rgba(0,208,132,0.4)]" style={{ width: '87%' }}></div>
            </div>
          </div>
        </div>

        <div className="w-px h-5 bg-white/10"></div>

        {/* Dynamic Live Counters */}
        <div className="flex items-center gap-5">
          <div className="text-center">
            <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">OPEN</span>
            <span className="text-xs font-mono font-black text-[#FFB020] text-glow-warning">{stats.open || 0}</span>
          </div>
          <div className="text-center">
            <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">RESOLVED</span>
            <span className="text-xs font-mono font-black text-[#00D084] text-glow-success">{stats.resolved || 0}</span>
          </div>
          <div className="text-center">
            <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">SLA</span>
            <span className="text-xs font-mono font-black text-[#5B8CFF] text-glow-primary">{clampedSla}%</span>
          </div>
          <div className="text-center">
            <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">SATISFACTION</span>
            <span className="text-xs font-mono font-black text-purple-400 flex items-center gap-0.5">
              4.7<span className="text-[9px] text-[#FFB020]">★</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls & Dropdowns */}
      <div className="flex items-center gap-3">
        {/* Command Center Mode Selector */}
        <div className="relative">
          <select
            value={filters.mode || 'Operations'}
            onChange={(e) => setFilter('mode', e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-[#5B8CFF] transition-colors cursor-pointer appearance-none pr-6 relative"
          >
            <option value="Operations" className="bg-slate-950 text-slate-200">📊 Operations HUD</option>
            <option value="Mayor" className="bg-slate-950 text-slate-200">👑 Mayor Executive</option>
            <option value="Commissioner" className="bg-slate-950 text-slate-200">🏢 Commissioner Audit</option>
            <option value="Presentation" className="bg-slate-950 text-slate-200">📺 Presentation View</option>
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[8px]">▼</div>
        </div>

        {/* Role/Profile Selector */}
        <div className="relative">
          <select
            value={filters.role || 'Citizen'}
            onChange={(e) => setFilter('role', e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-[#5B8CFF] transition-colors cursor-pointer appearance-none pr-6 relative"
          >
            <option value="Citizen" className="bg-slate-950 text-slate-200">👤 Citizen Profile</option>
            <option value="JE" className="bg-slate-950 text-slate-200">🛠️ JE (Engineer)</option>
            <option value="Collector" className="bg-slate-950 text-slate-200">💼 Collector Mode</option>
            <option value="Secretary" className="bg-slate-950 text-slate-200">🏛️ Secretary Mode</option>
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[8px]">▼</div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, wards..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="w-36 lg:w-44 bg-slate-900/60 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5B8CFF] transition-colors"
          />
        </div>

        {/* Layer Manager Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayersDropdown(!showLayersDropdown)}
            className={`p-2 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              showLayersDropdown ? 'border-[#5B8CFF] bg-slate-800 text-white shadow-[0_0_10px_rgba(91,140,255,0.25)]' : ''
            }`}
            title="Toggle Map Layers"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          
          {showLayersDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl p-3 flex flex-col gap-2 z-[2000] backdrop-blur-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 px-1">Map Layers</span>
              <label className="flex items-center gap-2.5 px-1 py-1 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeLayers.wards}
                  onChange={() => toggleLayer('wards')}
                  className="rounded border-slate-700 bg-slate-800 text-[#5B8CFF] focus:ring-[#5B8CFF] focus:ring-offset-slate-900"
                />
                Ward Boundaries
              </label>
              <label className="flex items-center gap-2.5 px-1 py-1 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeLayers.labels}
                  disabled={!activeLayers.wards}
                  onChange={() => toggleLayer('labels')}
                  className="rounded border-slate-700 bg-slate-800 text-[#5B8CFF] focus:ring-[#5B8CFF] focus:ring-offset-slate-900 disabled:opacity-50"
                />
                Ward Labels
              </label>
              <label className="flex items-center gap-2.5 px-1 py-1 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeLayers.markers}
                  onChange={() => toggleLayer('markers')}
                  className="rounded border-slate-700 bg-slate-800 text-[#5B8CFF] focus:ring-[#5B8CFF] focus:ring-offset-slate-900"
                />
                Complaint Pins
              </label>
              <label className="flex items-center gap-2.5 px-1 py-1 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeLayers.heatmap}
                  onChange={() => toggleLayer('heatmap')}
                  className="rounded border-slate-700 bg-slate-800 text-[#5B8CFF] focus:ring-[#5B8CFF] focus:ring-offset-slate-900"
                />
                Complaint Heatmap
              </label>
              <div className="h-px bg-white/10 my-1"></div>
              <button
                onClick={() => {
                  setIsDarkMode(!isDarkMode);
                  setShowLayersDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-1 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer justify-start"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#FFB020]" /> : <Moon className="w-3.5 h-3.5 text-[#5B8CFF]" />}
                {isDarkMode ? 'Light Map Mode' : 'Dark Map Mode'}
              </button>
            </div>
          )}
        </div>

        {/* Report Issue CTA */}
        <button
          onClick={onStartReporting}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shadow-md select-none cursor-pointer ${
            isPickingLocation
              ? 'bg-[#FF5C7A] hover:bg-[#FF5C7A]/80 text-white border-[#FF5C7A] animate-pulse shadow-[#FF5C7A]/20'
              : 'bg-[#5B8CFF] hover:bg-[#5B8CFF]/90 border-[#5B8CFF] text-white shadow-[#5B8CFF]/20'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {isPickingLocation ? 'Cancel' : 'Report Issue'}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
