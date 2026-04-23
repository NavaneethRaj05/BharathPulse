/**
 * SkeletonCard — placeholder shimmer while data loads
 */
import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { repeat: Infinity, duration: 1.6, ease: 'linear' },
  },
};

const Shimmer = ({ className }) => (
  <motion.div
    variants={shimmer}
    animate="animate"
    style={{
      backgroundImage: 'linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%)',
      backgroundSize: '400% 100%',
    }}
    className={`rounded-xl ${className}`}
  />
);

export const SkeletonRow = () => (
  <tr className="border-b border-gray-700/50">
    <td className="p-5">
      <Shimmer className="h-5 w-48 mb-2" />
      <Shimmer className="h-3 w-32" />
    </td>
    <td className="p-5">
      <Shimmer className="h-5 w-24 mb-2" />
      <Shimmer className="h-3 w-36" />
    </td>
    <td className="p-5 text-center">
      <Shimmer className="h-7 w-20 mx-auto rounded-full" />
    </td>
    <td className="p-5 text-right">
      <Shimmer className="h-9 w-36 ml-auto rounded-xl" />
    </td>
  </tr>
);

export const SkeletonStatCard = () => (
  <div className="bg-gray-800/80 p-6 rounded-3xl border border-gray-700 flex items-center gap-4">
    <Shimmer className="w-16 h-16 rounded-2xl" />
    <div className="flex-1">
      <Shimmer className="h-3 w-16 mb-3" />
      <Shimmer className="h-9 w-12" />
    </div>
  </div>
);

export default Shimmer;
