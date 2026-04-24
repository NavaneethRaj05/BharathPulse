import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentPortal from './pages/DepartmentPortal';
import { Building2, PlusCircle, Search, LayoutDashboard, Heart, BriefcaseBusiness } from 'lucide-react';
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
  const navigate = useNavigate();

  return (
    <div className="flex bg-gray-900/60 p-1.5 rounded-full border border-gray-700/60 backdrop-blur-md shadow-inner">
      {NAV_TABS.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-200 z-10
              ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-200'}`}
          >
            {/* Sliding pill indicator */}
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full -z-10 shadow-lg shadow-blue-500/30"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
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
      <div className="min-h-screen bg-[#080c14] text-gray-100 antialiased selection:bg-emerald-500/25 selection:text-emerald-200 overflow-x-hidden">

        {/* Global ambient background glows */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Primary orbs */}
          <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[180px]" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full bg-emerald-900/15 blur-[180px]" />
          {/* Accent orbs */}
          <div className="absolute top-[35%] right-[15%] w-[25%] h-[25%] rounded-full bg-violet-900/12 blur-[130px]" />
          <div className="absolute top-[60%] left-[10%] w-[20%] h-[20%] rounded-full bg-cyan-900/10 blur-[110px]" />
          <div className="absolute top-[10%] right-[30%] w-[15%] h-[15%] rounded-full bg-amber-900/8 blur-[100px]" />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
        </div>

        {/* Sticky navigation bar */}
        <nav className="border-b border-gray-800/80 bg-gray-900/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.4 }}
                className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors"
              >
                <Building2 className="w-7 h-7 text-cyan-400" />
              </motion.div>
              <div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-cyan-200 to-sky-400 bg-clip-text text-transparent tracking-tight">
                  CivicPulse
                </span>
                <p className="text-xs text-cyan-200/80 mt-1">
                  AI-powered civic issue response
                </p>
              </div>
            </Link>

            <NavigationToggle />
          </div>
        </nav>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-4 py-12 relative z-10 min-h-[calc(100vh-160px)]">
          <AnimatedRoutes />
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800/80 bg-gray-900/40 backdrop-blur-md relative z-10 py-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm font-medium">
              © {new Date().getFullYear()} CivicPulse — smarter civic issue management
            </p>
            <p className="text-gray-400 text-sm font-medium flex items-center gap-1.5">
              Built with <Heart className="w-4 h-4 text-rose-500" /> for citizens and city teams
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
