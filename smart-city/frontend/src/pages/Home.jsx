import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, FileText, Search, ShieldCheck, ArrowRight,
  Activity, Zap, CheckCircle2, Clock3, Wrench, Droplets,
  Lightbulb, Trees, Cpu, Globe2, Users, TrendingUp,
  BarChart3, MapPin, MessageSquare, Star, ChevronRight,
} from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, cardHover, buttonTap } from '../animations/variants';

/* ── Animated number counter ── */
const Counter = ({ target, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ── Animated background grid canvas ── */
const BackgroundGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
    {/* SVG dot grid */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="cp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#6ee7b7" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cp-grid)" />
    </svg>

    {/* Floating glow orbs */}
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', top: '-10%', left: '-10%' }}
      animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', bottom: '-10%', right: '-5%' }}
      animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[300px] h-[300px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', top: '40%', right: '25%' }}
      animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Scan line */}
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

/* ── City service pill ── */
const SERVICE_ITEMS = [
  { icon: Wrench,   label: 'Roads & Infrastructure',      color: 'from-orange-500/20 to-orange-600/5',  border: 'border-orange-500/25', text: 'text-orange-300' },
  { icon: Droplets, label: 'Water Supply & Drainage',     color: 'from-cyan-500/20 to-cyan-600/5',      border: 'border-cyan-500/25',   text: 'text-cyan-300' },
  { icon: Lightbulb,label: 'Electricity & Street Lights', color: 'from-yellow-500/20 to-yellow-600/5',  border: 'border-yellow-500/25', text: 'text-yellow-300' },
  { icon: Trees,    label: 'Sanitation & Public Clean',   color: 'from-emerald-500/20 to-emerald-600/5',border: 'border-emerald-500/25',text: 'text-emerald-300' },
];

/* ── How-it-works steps ── */
const HOW_STEPS = [
  { num: '01', icon: MessageSquare, title: 'Citizen Reports',    desc: 'Complaint filed via smart form or AI chatbot with location & evidence.', color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/25' },
  { num: '02', icon: Cpu,           title: 'AI Classifies',      desc: 'ML engine categorizes the issue and routes it to the right department.', color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25' },
  { num: '03', icon: Wrench,        title: 'Department Acts',    desc: 'Field team dispatched; authority updates status in real time.',          color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25' },
  { num: '04', icon: Star,          title: 'Citizen Rates',      desc: 'Feedback loop closes — ratings drive accountability and governance.',    color: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/25' },
];

/* ── Live stats ── */
const STATS = [
  { icon: FileText,   value: 1240,  suffix: '+', label: 'Complaints Filed',   color: 'text-emerald-400' },
  { icon: CheckCircle2,value: 890,  suffix: '+', label: 'Cases Resolved',     color: 'text-blue-400' },
  { icon: Clock3,     value: 48,    suffix: 'h', label: 'Avg Resolution Time',color: 'text-amber-400' },
  { icon: Star,       value: 4,     suffix: '.8★',label: 'Citizen Satisfaction',color: 'text-violet-400' },
];

const Home = () => {
  const heroRef = useRef(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundGrid />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-20 pt-2 pb-16"
      >

        {/* ══════════════ HERO ══════════════ */}
        <motion.section variants={staggerItem} className="w-full max-w-6xl" ref={heroRef}>
          <div className="relative rounded-[2.8rem] overflow-hidden border border-white/8 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            {/* Hero background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/8" />
            {/* Grid overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6ee7b7" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>

            {/* Corner accent lines */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-emerald-400/20 rounded-tl-[2.8rem]" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cyan-400/20 rounded-br-[2.8rem]" />

            <div className="relative p-8 md:p-14 flex flex-col items-center text-center gap-8">
              {/* Live badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live Resolution System · Smart City Initiative
              </motion.div>

              {/* Main heading */}
              <div className="space-y-3">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
                  <span className="text-white">CivicPulse</span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    Smart City Hub
                  </span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                  Report civic issues, track real-time resolution, and hold authorities accountable — all powered by AI.
                </p>
              </div>

              {/* Feature chips */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: Zap,          label: 'AI-Powered Routing',    color: 'border-blue-500/30   bg-blue-500/8   text-blue-300' },
                  { icon: Activity,     label: 'Real-Time Tracking',    color: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300' },
                  { icon: Globe2,       label: 'City-Wide Coverage',    color: 'border-cyan-500/30    bg-cyan-500/8   text-cyan-300' },
                  { icon: TrendingUp,   label: 'Accountability Reports',color: 'border-violet-500/30  bg-violet-500/8 text-violet-300' },
                ].map(({ icon: Icon, label, color }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.05 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </motion.div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link to="/submit">
                  <motion.div
                    {...buttonTap}
                    className="group flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-gray-900 font-black text-base px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    Lodge a Complaint
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </Link>
                <Link to="/track">
                  <motion.div
                    {...buttonTap}
                    className="group flex items-center gap-3 bg-gray-800/80 border border-gray-600/60 hover:border-cyan-500/50 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:bg-gray-700/80"
                  >
                    <Search className="w-5 h-5 text-cyan-400" />
                    Track Your Case
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════ LIVE STATS ══════════════ */}
        <motion.section variants={staggerItem} className="w-full max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map(({ icon: Icon, value, suffix, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group bg-gray-800/60 border border-gray-700/60 hover:border-gray-600 rounded-3xl p-6 text-center overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-3xl" />
                <div className={`inline-flex p-2.5 rounded-xl bg-gray-900/80 border border-gray-700 mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-3xl font-black mb-1 ${color}`}>
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ══════════════ SERVICES COVERED ══════════════ */}
        <motion.section variants={staggerItem} className="w-full max-w-6xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">Coverage Areas</p>
              <h2 className="text-3xl font-black text-white">City Services We Handle</h2>
            </div>
            <MapPin className="w-5 h-5 text-gray-600" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICE_ITEMS.map(({ icon: Icon, label, color, border, text }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`relative group bg-gradient-to-br ${color} border ${border} rounded-3xl p-6 overflow-hidden cursor-default transition-all`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] blur-2xl pointer-events-none" />
                <div className={`inline-flex p-3 bg-gray-900/60 border border-gray-700/60 rounded-2xl mb-4 ${text}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-bold text-white text-base leading-snug">{label}</p>
                <div className={`mt-3 h-0.5 w-8 rounded-full bg-current ${text} opacity-40 group-hover:w-16 transition-all duration-300`} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ══════════════ PRIMARY ACTION CARDS ══════════════ */}
        <motion.section variants={staggerItem} className="w-full max-w-6xl">
          <div className="mb-6">
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">Quick Access</p>
            <h2 className="text-3xl font-black text-white">What Do You Need?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Lodge Card */}
            <Link to="/submit">
              <motion.div
                {...cardHover}
                className="group relative overflow-hidden rounded-[2rem] border border-gray-700/60 hover:border-emerald-500/50 bg-gray-800/70 backdrop-blur-xl transition-all hover:shadow-[0_16px_60px_rgba(16,185,129,0.18)] h-full"
              >
                {/* Glowing bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Top accent bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-transparent" />
                <div className="p-8 md:p-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl group-hover:bg-emerald-500/25 transition-colors duration-300">
                      <FileText className="w-9 h-9 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">AI-Assisted</span>
                  </div>
                  <h2 className="text-3xl font-black mb-3 text-white">Lodge a Complaint</h2>
                  <p className="text-gray-400 text-base leading-relaxed mb-8 flex-1">
                    Submit civic issues using our intelligent form — AI fills in category, location, and routes to the right department automatically.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-colors duration-300 text-sm">
                      Start Report
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span className="text-xs text-gray-500">Takes &lt; 2 min</span>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Track Card */}
            <Link to="/track">
              <motion.div
                {...cardHover}
                className="group relative overflow-hidden rounded-[2rem] border border-gray-700/60 hover:border-cyan-500/50 bg-gray-800/70 backdrop-blur-xl transition-all hover:shadow-[0_16px_60px_rgba(6,182,212,0.18)] h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-transparent" />
                <div className="p-8 md:p-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-cyan-500/15 border border-cyan-500/25 rounded-2xl group-hover:bg-cyan-500/25 transition-colors duration-300">
                      <Search className="w-9 h-9 text-cyan-400" />
                    </div>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full">Real-Time</span>
                  </div>
                  <h2 className="text-3xl font-black mb-3 text-white">Track Your Case</h2>
                  <p className="text-gray-400 text-base leading-relaxed mb-8 flex-1">
                    Enter your Complaint ID for live status updates, authority action notes, and resolution confirmation with full timeline view.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-cyan-600 group-hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl transition-colors duration-300 text-sm">
                      View Status
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span className="text-xs text-gray-500">Live updates</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.section>

        {/* ══════════════ HOW IT WORKS ══════════════ */}
        <motion.section variants={staggerItem} className="w-full max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-xs text-violet-400 font-bold uppercase tracking-widest mb-2">Process</p>
            <h2 className="text-4xl font-black text-white">How CivicPulse Works</h2>
            <p className="text-gray-400 mt-2 text-base max-w-xl mx-auto">Four seamless steps from report to resolution — transparent at every stage.</p>
          </div>

          <div className="relative">
            {/* Connector line (desktop) */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 via-amber-500/30 to-emerald-500/30 hidden md:block" />

            <div className="grid md:grid-cols-4 gap-5">
              {HOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 }}
                    whileHover={{ y: -5 }}
                    className={`relative bg-gray-900/70 border ${step.border} rounded-3xl p-6 group transition-all hover:shadow-xl`}
                  >
                    {/* Step badge */}
                    <div className={`absolute -top-3 -right-2 text-[10px] font-black px-2.5 py-1 rounded-full ${step.bg} ${step.color} border ${step.border}`}>
                      {step.num}
                    </div>
                    <div className={`inline-flex p-3 rounded-2xl ${step.bg} border ${step.border} mb-4 ${step.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-white text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                    {/* Bottom accent */}
                    <div className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full ${step.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ══════════════ BOTTOM CTA ══════════════ */}
        <motion.section variants={staggerItem} className="w-full max-w-6xl">
          <div className="relative rounded-[2.5rem] overflow-hidden border border-white/8 p-8 md:p-12 text-center shadow-[0_10px_60px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/6 via-cyan-500/4 to-blue-500/6" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cta-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#6ee7b7" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-grid)" />
            </svg>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">City Administration</p>
                <h3 className="text-2xl font-black text-white">Authority & Admin Access</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-md">Monitor all complaints, manage department assignments, and review resolution statistics.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link to="/admin">
                  <motion.div
                    {...buttonTap}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
                  >
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    Admin Dashboard
                  </motion.div>
                </Link>
                <Link to="/department">
                  <motion.div
                    {...buttonTap}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 text-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Department Portal
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

      </motion.div>
    </div>
  );
};

export default Home;
