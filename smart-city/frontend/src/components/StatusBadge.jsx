/**
 * StatusBadge — color-coded with smooth transition when status changes
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

const statusConfig = {
  Pending: {
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10',
    Icon: Clock,
  },
  'In Progress': {
    classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-blue-500/10',
    Icon: Loader2,
  },
  Resolved: {
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
    Icon: CheckCircle2,
  },
};

const StatusBadge = ({ status, size = 'md' }) => {
  const cfg = statusConfig[status] || statusConfig['Pending'];
  const { Icon } = cfg;
  const padding = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-5 py-2 text-sm';

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        className={`inline-flex items-center gap-2 rounded-full border font-bold shadow-sm ${padding} ${cfg.classes}`}
      >
        <Icon
          className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
            status === 'In Progress' ? 'animate-spin' : ''
          }`}
        />
        {status}
      </motion.span>
    </AnimatePresence>
  );
};

export default StatusBadge;
