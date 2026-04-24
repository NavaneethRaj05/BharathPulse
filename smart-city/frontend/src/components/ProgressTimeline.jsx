/**
 * ProgressTimeline — animated step indicator with icon elaboration cards
 * Steps: Submitted → In Progress → Resolved
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Wrench, FileCheck, AlertCircle, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    key: 'Submitted',
    label: 'Submitted',
    icon: FileCheck,
    color: 'emerald',
    shortDesc: 'Report received',
    elaboration: 'Your complaint has been successfully logged in our system and assigned a unique tracking ID.',
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    icon: Wrench,
    color: 'blue',
    shortDesc: 'Team assigned',
    elaboration: 'The responsible department has been notified and a field team is actively working on resolving the issue.',
  },
  {
    key: 'Resolved',
    label: 'Resolved',
    icon: ShieldCheck,
    color: 'green',
    shortDesc: 'Case closed',
    elaboration: 'The issue has been fully resolved and verified by the authorities. You may submit feedback below.',
  },
];

const colorMap = {
  emerald: {
    ring: 'border-emerald-400 shadow-emerald-500/30',
    bg: 'bg-emerald-600',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    pulse: 'border-emerald-400/40',
    tip: 'border-emerald-500/30 bg-emerald-950/60',
  },
  blue: {
    ring: 'border-blue-400 shadow-blue-500/30',
    bg: 'bg-blue-600',
    text: 'text-blue-400',
    badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    pulse: 'border-blue-400/40',
    tip: 'border-blue-500/30 bg-blue-950/60',
  },
  green: {
    ring: 'border-green-400 shadow-green-500/30',
    bg: 'bg-green-600',
    text: 'text-green-400',
    badge: 'bg-green-500/15 border-green-500/30 text-green-300',
    pulse: 'border-green-400/40',
    tip: 'border-green-500/30 bg-green-950/60',
  },
};

const statusToIndex = (status) => {
  switch (status) {
    case 'In Progress': return 1;
    case 'Resolved':    return 2;
    default:            return 0;
  }
};

const ProgressTimeline = ({ status }) => {
  const activeIndex = statusToIndex(status);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className="w-full">
      {/* Step row */}
      <div className="flex items-start justify-between relative">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-5 h-1 bg-gray-700/70 rounded-full mx-8" />

        {/* Animated fill */}
        <motion.div
          className="absolute top-5 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-green-400 rounded-full ml-8"
          initial={{ width: '0%' }}
          animate={{ width: `${(activeIndex / (STEPS.length - 1)) * 84}%` }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const completed = i <= activeIndex;
          const isActive  = i === activeIndex;
          const c         = colorMap[step.color];

          return (
            <div
              key={step.key}
              className="flex flex-col items-center relative z-10 flex-1 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Icon bubble */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 * i + 0.2 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-500 ${
                    completed
                      ? `${c.bg} ${c.ring}`
                      : 'bg-gray-800 border-gray-600'
                  }`}
                >
                  {/* Pulsing ring for active step */}
                  {isActive && (
                    <motion.div
                      className={`absolute w-16 h-16 rounded-full border ${c.pulse}`}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 ${completed ? 'text-white' : 'text-gray-500'}`} />
                </motion.div>

                {/* Hover elaboration tooltip card */}
                <AnimatePresence>
                  {hoveredIdx === i && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 rounded-2xl border p-3 shadow-xl backdrop-blur-xl pointer-events-none z-50 ${c.tip}`}
                    >
                      <div className={`flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider ${c.text}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {step.label}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{step.elaboration}</p>
                      {/* Arrow */}
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${
                        step.color === 'emerald' ? 'border-t-emerald-500/30' :
                        step.color === 'blue'    ? 'border-t-blue-500/30'    :
                        'border-t-green-500/30'
                      }`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Label + short desc */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * i + 0.4 }}
                className="flex flex-col items-center mt-3 gap-0.5"
              >
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  completed ? c.text : 'text-gray-600'
                }`}>
                  {step.label}
                </span>
                <span className={`text-[10px] font-medium ${
                  completed ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {step.shortDesc}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTimeline;
