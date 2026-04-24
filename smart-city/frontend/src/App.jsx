import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentPortal from './pages/DepartmentPortal';
import { Building2, PlusCircle, Search, LayoutDashboard, Heart, BriefcaseBusiness, Phone, Mail, Facebook, Youtube, Instagram, Linkedin } from 'lucide-react';
import { pageVariants, pageTransition, buttonTap } from './animations/variants';

/* ── Animated page wrapper ── */
const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

/* ── Pill navigation toggle ── */
const NAV_TABS = [
  { path: '/submit', label: 'Submit', icon: PlusCircle },
  { path: '/track',  label: 'Track',  icon: Search },
  { path: '/admin',  label: 'Admin',  icon: LayoutDashboard },
  { path: '/department', label: 'Dept', icon: BriefcaseBusiness },
];

const NavigationToggle = () => {
  const location = useLocation();
  return (
    <div className="flex items-center gap-6">
      {NAV_TABS.map(({ path, label }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-white border-b-2 border-white pb-1' : 'text-gray-300 hover:text-white'}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
};

/* ── Root with animated routes ── */
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/submit" element={<PageWrapper><SubmitComplaint /></PageWrapper>} />
        <Route path="/track" element={<PageWrapper><TrackComplaint /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
        <Route path="/department" element={<PageWrapper><DepartmentPortal /></PageWrapper>} />
        <Route path="*" element={
          <PageWrapper>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <h1 className="text-9xl font-black text-gray-800 mb-4">404</h1>
              <h2 className="text-3xl font-bold text-white mb-2">Page Not Found</h2>
              <p className="text-gray-400 mb-8 max-w-md">The page you are looking for doesn't exist or has been moved.</p>
              <Link to="/">
                <motion.button {...buttonTap} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/25">
                  Return Home
                </motion.button>
              </Link>
            </div>
          </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-orange-500/25 selection:text-orange-800 overflow-x-hidden flex flex-col">

        {/* Top Bar (White) */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 border-2 border-gray-900 rounded-lg">
                <Building2 className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-none">CivicPulse</span>
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mt-1">Issue Resolution Agency</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-6 text-sm text-gray-600 font-medium">
              <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> (845) 334-0120</span>
              <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@civicpulse.com</span>
              <div className="flex items-center gap-3 ml-4">
                <div className="p-1.5 bg-[#1e3a5f] rounded text-white cursor-pointer hover:bg-[#152842] transition-colors"><Facebook className="w-4 h-4" /></div>
                <div className="p-1.5 bg-[#1e3a5f] rounded text-white cursor-pointer hover:bg-[#152842] transition-colors"><Youtube className="w-4 h-4" /></div>
                <div className="p-1.5 bg-[#1e3a5f] rounded text-white cursor-pointer hover:bg-[#152842] transition-colors"><Instagram className="w-4 h-4" /></div>
                <div className="p-1.5 bg-[#1e3a5f] rounded text-white cursor-pointer hover:bg-[#152842] transition-colors"><Linkedin className="w-4 h-4" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Bar (Dark Blue) */}
        <nav className="bg-[#1e3a5f] sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-start items-center gap-8 overflow-x-auto">
            <Link to="/" className={`text-sm font-semibold px-3 py-1 rounded bg-white text-[#1e3a5f]`}>Home</Link>
            <NavigationToggle />
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 w-full bg-white relative z-10">
          <AnimatedRoutes />
        </main>

        {/* Footer */}
        <footer className="bg-[#1e3a5f] text-white py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold tracking-tight">CivicPulse</span>
            </div>
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} CivicPulse. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Toast notifications — pill style */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(16px)',
              color: '#f3f4f6',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              borderRadius: '9999px',
              padding: '14px 24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
              fontSize: '0.9rem',
              fontWeight: '600',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
