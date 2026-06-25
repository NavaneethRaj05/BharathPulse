import React, { useState, useEffect, useRef } from 'react';
import SubmitPanel from './SubmitPanel';
import ComplaintDrawer from './ComplaintDrawer';
import WardDetailPanel from './WardDetailPanel';
import { askFaqMessage } from '../../services/api';
import { 
  Bot, Send, Sparkles, LayoutGrid, HelpCircle, CornerDownRight, 
  CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, ChevronLeft,
  TrendingUp, Activity, BarChart2, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RightPanel = ({
  mode,
  selectedWard,
  selectedComplaintId,
  pickedLocation,
  isPickingLocation,
  setIsPickingLocation,
  onResetLocation,
  refreshMapData,
  onFocusCoordinates,
  onClosePanel,
  onComplaintClick,
  wards = [],
  complaints = [],
  stats,
  filters,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [faqInput, setFaqInput] = useState('');
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqMessages, setFaqMessages] = useState([
    {
      role: 'bot',
      text: 'Hello! I am your AI Civic Assistant. You can ask me questions about ward performance, reporting categories, SLA windows, or duplicate checks.',
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [faqMessages]);

  // Auto-expand panel when changing modes
  useEffect(() => {
    if (mode !== 'none') {
      setIsCollapsed(false);
    }
  }, [mode]);

  const handleFaqSend = async (messageText) => {
    const text = messageText || faqInput.trim();
    if (!text || faqLoading) return;

    setFaqMessages((prev) => [...prev, { role: 'user', text }]);
    setFaqInput('');
    setFaqLoading(true);
    try {
      const res = await askFaqMessage(text);
      const answer = res?.data?.answer || 'Sorry, I could not fetch an answer right now.';
      setFaqMessages((prev) => [...prev, { role: 'bot', text: answer }]);
    } catch (err) {
      setFaqMessages((prev) => [
        ...prev,
        { role: 'bot', text: err.response?.data?.error || 'FAQ service is temporarily offline.' },
      ]);
    } finally {
      setFaqLoading(false);
    }
  };

  const handleSuggestClick = (q) => {
    handleFaqSend(q);
  };

  const getPanelHeader = () => {
    switch (filters?.level) {
      case 'NATIONAL': return 'National Operations Centre';
      case 'STATE': return `${filters.parentCode || 'State'} Operations Hub`;
      case 'DISTRICT': return `${filters.parentCode || 'District'} Collectorate`;
      default: return 'City Operations Centre';
    }
  };

  const renderDefaultContent = () => {
    const suggestChips = [
      'What is SLA compliance?',
      'How to file a complaint?',
      'Which ward has the most open issues?',
    ];

    // Predict SLA risk wards
    const riskWards = [...wards]
      .filter((w) => w.stats?.open > 5)
      .sort((a, b) => (a.stats?.slaCompliance ?? 100) - (b.stats?.slaCompliance ?? 100))
      .slice(0, 2);

    return (
      <div className="flex flex-col h-full overflow-hidden select-none">
        {/* Header Tabs */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#5B8CFF] text-glow-primary animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">{getPanelHeader()}</span>
          </div>
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1 bg-slate-900/60 border border-white/10 hover:border-[#5B8CFF] text-slate-400 hover:text-white rounded-md cursor-pointer transition-all"
            title="Minimize Panel"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
          {/* AI recommendations card */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-widest block text-glow-primary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#5B8CFF] fill-[#5B8CFF]/15 animate-pulse" /> AI GOVERNANCE ADVISORY
            </span>

            <div className="bg-[#5B8CFF]/5 border border-[#5B8CFF]/20 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FFB020] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#FFB020] uppercase tracking-wide leading-none">PREDICTIVE SLA ALERT</span>
                  <span className="text-[10px] text-slate-300 mt-1 leading-snug">
                    {riskWards.length > 0 
                      ? `Critical load detected in ${riskWards[0].name}. SLA breach risk projected within 18 hours due to category backlog.`
                      : 'High rainfall forecast in Indiranagar. Escalations are projected to spike in Sanitation by 24%.'}
                  </span>
                </div>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex items-center justify-between text-[9px] text-[#00D084] font-black uppercase">
                <span>Recommended Action:</span>
                <span className="bg-[#00D084]/15 border border-[#00D084]/20 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(0,208,132,0.15)]">
                  Deploy Team Alpha
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure risk indices */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">INFRASTRUCTURE RISK FACTORS</span>
            <div className="grid grid-cols-2 gap-2 bg-[#050816]/40 border border-white/5 p-3 rounded-xl">
              <div>
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Water Grid</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D084]"></div>
                  <span className="text-xs font-mono font-black text-slate-200">84% Safe</span>
                </div>
              </div>
              <div>
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Road Transit</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFB020] animate-pulse"></div>
                  <span className="text-xs font-mono font-black text-slate-200">62% Load</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Power Grid</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5C7A] animate-pulse"></div>
                  <span className="text-xs font-mono font-black text-slate-200">91% Peak</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Waste Speed</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D084]"></div>
                  <span className="text-xs font-mono font-black text-slate-200">76% Normal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Citizen trends Sentiment Indicator */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">CITIZEN TRENDS</span>
            <div className="bg-[#050816]/40 border border-white/5 p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#00D084]" /> Public Sentiment
                </span>
                <span className="text-[#00D084] font-mono">+4.2% Weekly</span>
              </div>
              {/* Sentiment percentage bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex">
                <div className="h-full bg-[#00D084]" style={{ width: '78%' }} title="78% Positive"></div>
                <div className="h-full bg-[#FFB020]" style={{ width: '15%' }} title="15% Neutral"></div>
                <div className="h-full bg-[#FF5C7A]" style={{ width: '7%' }} title="7% Negative"></div>
              </div>
              <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                <span>78% Positive</span>
                <span>15% Neutral</span>
                <span>7% Negative</span>
              </div>
            </div>
          </div>

          {/* Officer Workloads */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">OFFICER DISPATCH LOG</span>
            <div className="space-y-2 bg-[#050816]/40 border border-white/5 p-3 rounded-xl">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-300 leading-none">
                  <span>Inspector Suresh K. (PWD)</span>
                  <span className="font-mono text-slate-400">4 active</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5B8CFF]" style={{ width: '40%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-300 leading-none">
                  <span>Officer Ramesh A. (Water)</span>
                  <span className="font-mono text-[#FFB020]">7 active</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFB020]" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-300 leading-none">
                  <span>Engineer Meenakshi R. (Waste)</span>
                  <span className="font-mono text-[#00D084]">2 active</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D084]" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI FAQ Chatbot Widget */}
          <div className="border-t border-white/10 pt-4 flex flex-col h-[260px] overflow-hidden">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-[#5B8CFF] animate-pulse" />
              MUNICIPAL FAQ COGNITIVE CORE
            </span>

            {/* Chat History View */}
            <div className="flex-1 bg-slate-950 border border-white/5 rounded-xl p-2.5 overflow-y-auto flex flex-col gap-2 shadow-inner">
              {faqMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="p-1 bg-slate-900 border border-white/5 rounded-lg text-[#5B8CFF] shrink-0 self-start">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  <div className={`p-2 rounded-xl text-[10px] font-medium leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#5B8CFF] text-white rounded-tr-none shadow-[0_0_8px_rgba(91,140,255,0.25)]'
                      : 'bg-slate-900 text-slate-300 rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="flex gap-1.5 overflow-x-auto py-2 shrink-0 no-scrollbar select-none">
              {suggestChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestClick(chip)}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-full text-[9px] text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Send Form */}
            <div className="flex gap-1.5 mt-0.5">
              <input
                type="text"
                placeholder="Ask AI FAQ Core..."
                value={faqInput}
                onChange={(e) => setFaqInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFaqSend()}
                className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5B8CFF]"
              />
              <button
                onClick={() => handleFaqSend()}
                disabled={faqLoading}
                className="p-1.5 bg-[#5B8CFF] hover:bg-[#5B8CFF]/90 disabled:opacity-50 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <aside className="w-14 h-full glass-panel flex flex-col items-center py-4 border-l border-white/10 z-[1000] select-none transition-all duration-300">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 bg-slate-900 border border-white/10 hover:border-[#5B8CFF] text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors mb-6 glow-primary"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex flex-col gap-6 items-center text-slate-400">
          <Sparkles className="w-4 h-4 text-[#5B8CFF] animate-pulse" />
          <div className="w-px h-10 bg-white/10"></div>
          <TrendingUp className="w-4 h-4" />
          <BarChart2 className="w-4 h-4" />
          <Bot className="w-4 h-4" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full glass-panel flex flex-col border-l border-white/10 z-[1000] transition-all duration-300 shadow-2xl">
      {mode === 'submit' && (
        <SubmitPanel
          onClose={onClosePanel}
          pickedLocation={pickedLocation}
          isPickingLocation={isPickingLocation}
          setIsPickingLocation={setIsPickingLocation}
          onResetLocation={onResetLocation}
          refreshMapData={refreshMapData}
        />
      )}

      {mode === 'complaint' && selectedComplaintId && (
        <ComplaintDrawer
          complaintId={selectedComplaintId}
          onClose={onClosePanel}
          refreshMapData={refreshMapData}
          onFocusCoordinates={onFocusCoordinates}
          userRole={filters?.role || 'Citizen'}
        />
      )}

      {(mode === 'none' || mode === 'ward') && renderDefaultContent()}
    </aside>
  );
};

export default RightPanel;
