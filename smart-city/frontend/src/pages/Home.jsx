import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText, Search, ShieldCheck, ArrowRight, Zap, MapPin, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, cardHover, buttonTap } from '../animations/variants';

/* Floating ambient particles (purely decorative) */
const FloatingParticle = ({ delay, x, y, size }) => (
  <motion.div
    className="absolute rounded-full bg-blue-500/10 pointer-events-none"
    style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
    transition={{ repeat: Infinity, duration: 4 + delay, delay, ease: 'easeInOut' }}
  />
);

const PARTICLES = [
  { delay: 0, x: 10, y: 20, size: 60 },
  { delay: 1, x: 80, y: 60, size: 90 },
  { delay: 2, x: 50, y: 80, size: 40 },
  { delay: 0.5, x: 90, y: 15, size: 70 },
  { delay: 1.5, x: 30, y: 70, size: 50 },
];

const Home = () => {
  return (
    <div className="relative overflow-hidden min-h-[80vh]">
      {/* Background particles */}
      {PARTICLES.map((p, i) => <FloatingParticle key={i} {...p} />)}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center justify-center text-center space-y-16 pt-8 pb-12 relative z-10"
      >
        {/* Hero */}
        <motion.div variants={staggerItem} className="space-y-6 max-w-4xl">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
            className="inline-flex p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.2)]"
          >
            <AlertCircle className="w-14 h-14 text-blue-400" />
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-br from-white via-blue-100 to-blue-400 bg-clip-text text-transparent leading-[1.05]">
            Fix Your City. <br />
            <span className="text-5xl md:text-6xl">Fast &amp; Simple.</span>
          </h1>

          <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Report neighborhood issues and our AI automatically routes your complaint to the right department — instantly.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div variants={staggerItem} className="flex flex-wrap justify-center gap-3">
          {[
            { icon: Zap, label: 'AI Auto-Categorization' },
            { icon: MapPin, label: 'Location Tracking' },
            { icon: Activity, label: 'Real-Time Updates' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-gray-800/60 backdrop-blur-sm border border-gray-700 px-4 py-2 rounded-full text-sm font-semibold text-gray-300">
              <Icon className="w-4 h-4 text-blue-400" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Action cards */}
        <motion.div variants={staggerItem} className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          <Link to="/submit">
            <motion.div
              {...cardHover}
              className="group p-10 bg-gray-800/60 backdrop-blur-xl rounded-[2rem] border border-gray-700 hover:border-blue-500/60 transition-colors hover:shadow-[0_8px_40px_rgba(59,130,246,0.18)] flex flex-col items-center text-center h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-5 bg-gray-900 rounded-2xl mb-6 border border-gray-800 group-hover:bg-blue-500/10 transition-colors duration-300 shadow-inner">
                <FileText className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Report Issue</h2>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">Found a pothole or broken streetlight? Let us know instantly.</p>
              <div className="mt-auto flex items-center gap-2 text-blue-400 font-bold bg-blue-500/10 px-6 py-3 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                Submit Complaint <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>

          <Link to="/track">
            <motion.div
              {...cardHover}
              className="group p-10 bg-gray-800/60 backdrop-blur-xl rounded-[2rem] border border-gray-700 hover:border-emerald-500/60 transition-colors hover:shadow-[0_8px_40px_rgba(16,185,129,0.18)] flex flex-col items-center text-center h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-5 bg-gray-900 rounded-2xl mb-6 border border-gray-800 group-hover:bg-emerald-500/10 transition-colors duration-300 shadow-inner">
                <Search className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Track Status</h2>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">Check real-time progress of your submitted complaints.</p>
              <div className="mt-auto flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-6 py-3 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                Track Progress <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Admin link */}
        <motion.div variants={staggerItem}>
          <Link to="/admin">
            <motion.div
              {...buttonTap}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-300 bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 px-6 py-3 rounded-full transition-colors font-medium group"
            >
              <ShieldCheck className="w-4 h-4 group-hover:text-white transition-colors" />
              Authorized Personnel Only
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
