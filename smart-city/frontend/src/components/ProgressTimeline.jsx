/**
 * ProgressTimeline — animated step indicator for complaint status
 * Steps: Submitted → In Progress → Resolved
 */
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Wrench } from 'lucide-react';

const STEPS = [
  { key: 'Submitted', label: 'Submitted', icon: Clock },
  { key: 'In Progress', label: 'In Progress', icon: Wrench },
  { key: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
];

const statusToIndex = (status) => {
  switch (status) {
    case 'In Progress': return 1;
    case 'Resolved': return 2;
    default: return 0; // Pending / Submitted
  }
};

const ProgressTimeline = ({ status }) => {
  const activeIndex = statusToIndex(status);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-5 h-1 bg-gray-700 rounded-full mx-8" />

        {/* Animated fill */}
        <motion.div
          className="absolute top-5 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full ml-8"
          initial={{ width: '0%' }}
          animate={{ width: `${(activeIndex / (STEPS.length - 1)) * 84}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const completed = i <= activeIndex;
          const isActive = i === activeIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 * i + 0.2 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors duration-500 ${
                  completed
                    ? isActive
                      ? 'bg-blue-600 border-blue-400 shadow-blue-500/30'
                      : 'bg-emerald-600 border-emerald-400 shadow-emerald-500/20'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                {isActive && (
                  <motion.div
                    className="absolute w-14 h-14 rounded-full border border-blue-400/40"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 ${
                    completed ? 'text-white' : 'text-gray-500'
                  }`}
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * i + 0.4 }}
                className={`mt-3 text-xs font-bold uppercase tracking-wider ${
                  completed ? (isActive ? 'text-blue-400' : 'text-emerald-400') : 'text-gray-600'
                }`}
              >
                {step.label}
              </motion.p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTimeline;
