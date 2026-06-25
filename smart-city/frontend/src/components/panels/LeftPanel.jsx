import React, { useState } from 'react';
import { 
  Filter, MapPin, Activity, ChevronRight, ArrowLeft, 
  Droplets, HardHat, Trash2, Zap, LayoutGrid,
  ShieldAlert, UserCheck, AlertTriangle, ChevronLeft
} from 'lucide-react';
import { WARD_COLORS } from '../../constants/mapConfig';

export const LeftPanel = ({
  wards = [],
  complaints = [],
  filters,
  setFilter,
  onWardClick,
  selectedWardId,
  onBack,
  onDrillDown,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const categories = ['All', 'Sanitation', 'Roads', 'Water Department', 'Electrical', 'General'];
  const statuses = ['All', 'Pending', 'In Progress', 'Resolved'];

  const getHealthColor = (openCount) => {
    if (openCount <= 10) return WARD_COLORS.healthy;
    if (openCount <= 25) return WARD_COLORS.moderate;
    if (openCount <= 50) return WARD_COLORS.high;
    return WARD_COLORS.critical;
  };

  const getLevelLabel = () => {
    switch (filters.level) {
      case 'NATIONAL': return 'State Jurisdictions';
      case 'STATE': return 'District Operations';
      case 'DISTRICT': return 'Local Body Registries';
      default: return 'Ward Workloads';
    }
  };

  // Grouping for Local Body / Ward level
  const isWardLevel = filters.level === 'LOCAL_BODY';
  
  // Group wards by Zone if at ward level
  const zones = isWardLevel
    ? wards.reduce((acc, ward) => {
        const zone = ward.zone || 'Other';
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(ward);
        return acc;
      }, {})
    : null;

  const sortedZones = zones ? Object.keys(zones).sort() : [];

  const handleItemClick = (item) => {
    if (filters.level === 'NATIONAL') {
      onDrillDown('STATE', item.number);
    } else if (filters.level === 'STATE') {
      onDrillDown('DISTRICT', item.number);
    } else if (filters.level === 'DISTRICT') {
      onDrillDown('LOCAL_BODY', item.number);
    } else {
      onWardClick(item);
    }
  };

  // Get department metrics
  const getDeptCount = (deptName) => {
    return complaints.filter(c => c.status !== 'Resolved' && (c.category === deptName || (deptName === 'Water Department' && c.category === 'Water'))).length;
  };

  const deptMetrics = [
    { name: 'Water Department', count: getDeptCount('Water Department'), color: '#5B8CFF', icon: Droplets },
    { name: 'Roads', count: getDeptCount('Roads'), color: '#FF5C7A', icon: HardHat },
    { name: 'Sanitation', count: getDeptCount('Sanitation'), color: '#00D084', icon: Trash2 },
    { name: 'Electrical', count: getDeptCount('Electrical'), color: '#FFB020', icon: Zap },
    { name: 'General', count: getDeptCount('General'), color: '#7C3AED', icon: LayoutGrid },
  ];

  // Critical Escalated Alerts
  const criticalAlerts = complaints
    .filter(c => c.status !== 'Resolved' && (c.isEscalated || c.reportCount > 5))
    .slice(0, 3);

  // Mock Field response teams
  const fieldTeams = [
    { name: 'Team Alpha (Water)', status: 'ACTIVE', color: '#FFB020' },
    { name: 'Team Gamma (Roads)', status: 'ACTIVE', color: '#FF5C7A' },
    { name: 'Team Omega (Sanitation)', status: 'STANDBY', color: '#00D084' },
  ];

  if (isCollapsed) {
    return (
      <aside className="w-14 h-full glass-panel flex flex-col items-center py-4 border-r border-white/10 z-[1000] select-none transition-all duration-300">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 bg-slate-900 border border-white/10 hover:border-[#5B8CFF] text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors mb-6 glow-primary"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 flex flex-col gap-6 items-center text-slate-400">
          <Activity className="w-4 h-4 text-[#5B8CFF] animate-pulse" />
          <div className="w-px h-10 bg-white/10"></div>
          <MapPin className="w-4 h-4" />
          <Filter className="w-4 h-4" />
          <ShieldAlert className="w-4 h-4 text-[#FF5C7A]" />
          <UserCheck className="w-4 h-4 text-[#00D084]" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 h-full glass-panel flex flex-col border-r border-white/10 z-[1000] select-none transition-all duration-300 relative shadow-2xl">
      {/* Dynamic Header & Back Nav */}
      <div className="p-4 border-b border-white/10 bg-slate-950/40 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#5B8CFF] animate-pulse" />
            <span className="text-[10px] font-black text-white tracking-widest uppercase">
              {filters.level} Console
            </span>
          </div>
          <span className="text-[9px] font-semibold text-slate-400 truncate mt-0.5">
            India &gt; {filters.parentCode || 'National'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {filters.level !== 'NATIONAL' && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-[10px] font-bold text-[#5B8CFF] hover:text-[#5B8CFF]/80 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          )}
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1 bg-slate-900/60 border border-white/10 hover:border-[#5B8CFF] text-slate-400 hover:text-white rounded-md cursor-pointer transition-all"
            title="Minimize Panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
        {/* Section 1: Departmental Workloads */}
        <div className="space-y-2.5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">DEPARTMENTS LOAD</span>
          <div className="space-y-2 bg-[#050816]/40 border border-white/5 p-3 rounded-xl">
            {deptMetrics.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                  <span className="flex items-center gap-1">
                    <dept.icon className="w-3 h-3" style={{ color: dept.color }} />
                    {dept.name.replace(' Department', '')}
                  </span>
                  <span className="font-mono text-slate-400">{dept.count} cases</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950/60 border border-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 shadow-sm" 
                    style={{ 
                      width: `${Math.min(dept.count * 10, 100) || 5}%`,
                      backgroundColor: dept.color,
                      boxShadow: `0 0 6px ${dept.color}`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Active Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-2">
            <span className="text-[9px] font-black text-[#FF5C7A] uppercase tracking-widest block text-glow-danger flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-[#FF5C7A]" /> CRITICAL ALERTS
            </span>
            <div className="space-y-1.5">
              {criticalAlerts.map((alert) => (
                <div 
                  key={alert._id}
                  onClick={() => handleItemClick(alert.ward)}
                  className="p-2 bg-[#FF5C7A]/5 border border-[#FF5C7A]/25 rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#FF5C7A]/10 transition-colors"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-[10px] font-bold text-slate-200 truncate">{alert.title}</span>
                    <span className="text-[8px] font-bold text-slate-500 mt-0.5">{alert.complaintCode} • {alert.location}</span>
                  </div>
                  <span className="text-[8px] font-black uppercase text-[#FF5C7A] bg-[#FF5C7A]/10 border border-[#FF5C7A]/20 px-1.5 py-0.5 rounded shrink-0">
                    {alert.isEscalated ? 'ESCALATED' : 'CRITICAL'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Field Response Units */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">FIELD RESPONSE TEAMS</span>
          <div className="grid grid-cols-1 gap-1.5 bg-[#050816]/40 border border-white/5 p-2 rounded-xl">
            {fieldTeams.map((team) => (
              <div key={team.name} className="flex justify-between items-center px-2 py-1 text-[10px] font-semibold">
                <span className="text-slate-300">{team.name}</span>
                <span 
                  className="text-[8px] font-black px-1.5 py-0.5 rounded border"
                  style={{
                    color: team.color,
                    borderColor: `${team.color}30`,
                    backgroundColor: `${team.color}05`,
                    boxShadow: `inset 0 0 4px ${team.color}15`
                  }}
                >
                  {team.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Jurisdictional Units & Ward Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
              {getLevelLabel()}
            </span>
            <span className="text-[8px] bg-slate-900 border border-white/5 text-slate-400 font-bold px-1.5 py-0.5 rounded-md">
              {wards.length} Units
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
            {!isWardLevel ? (
              // Simple drilldown list (States, Districts, Cities)
              wards.map((item) => {
                const openCount = item.stats?.open ?? 0;
                const totalCount = item.stats?.total ?? 0;
                const sla = item.stats?.slaCompliance ?? 100;
                const healthColor = getHealthColor(openCount);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between bg-slate-900/30 border-white/5 hover:bg-slate-900/75 hover:border-white/15 hover:translate-x-1"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shadow-md flex-shrink-0"
                        style={{
                          backgroundColor: healthColor,
                          boxShadow: `0 0 6px ${healthColor}`,
                        }}
                      ></div>
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-tight">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-slate-500">
                        SLA: <span className={sla < 70 ? 'text-[#FF5C7A]' : 'text-[#00D084]'}>{sla}%</span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-300" />
                    </div>
                  </div>
                );
              })
            ) : (
              // Ward level grouped list
              sortedZones.map((zone) => (
                <div key={zone} className="space-y-1">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1 mt-1 block">
                    {zone} Zone
                  </span>
                  
                  {zones[zone]
                    .sort((a, b) => (b.stats?.open ?? 0) - (a.stats?.open ?? 0))
                    .map((ward) => {
                      const openCount = ward.stats?.open ?? 0;
                      const totalCount = ward.stats?.total ?? 0;
                      const sla = ward.stats?.slaCompliance ?? 100;
                      const isSelected = selectedWardId === ward.id;
                      const healthColor = getHealthColor(openCount);

                      return (
                        <div
                          key={ward.id}
                          onClick={() => handleItemClick(ward)}
                          className={`group p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between hover:translate-x-1 ${
                            isSelected
                              ? 'bg-[#5B8CFF]/10 border-[#5B8CFF] shadow-lg shadow-[#5B8CFF]/15'
                              : 'bg-slate-900/30 border-white/5 hover:bg-slate-900/75 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div
                              className="w-2 h-2 rounded-full shadow-md flex-shrink-0"
                              style={{
                                backgroundColor: healthColor,
                                boxShadow: `0 0 6px ${healthColor}`,
                              }}
                            ></div>

                            <div className="flex flex-col truncate">
                              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-none truncate">
                                {ward.name}
                              </span>
                              <span className="text-[8px] font-bold text-slate-500 mt-1 font-mono leading-none">
                                {ward.number}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {openCount > 0 ? (
                              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-950 border border-white/10 text-[#FFB020] text-glow-warning">
                                {openCount}
                              </span>
                            ) : (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/25 text-[#00D084]">
                                IDLE
                              </span>
                            )}
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-300" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 5: Filter Box */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">CONSOLE SETTINGS</span>
          <div className="p-3 bg-[#050816]/40 border border-white/5 rounded-xl space-y-2.5">
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Issue Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilter('category', e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#5B8CFF] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-950 text-slate-200">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Issue Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilter('status', e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#5B8CFF] cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s} value={s} className="bg-slate-950 text-slate-200">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="p-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-500 font-bold bg-slate-950/40 shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] animate-pulse"></span>
          SECURE CONNECTION
        </span>
        <span>v3.0.0-PRO</span>
      </div>
    </aside>
  );
};

export default LeftPanel;
