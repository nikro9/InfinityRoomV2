// src/App.jsx
// Kublai Trading - Mobile-first responsive app
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import {
  Landing,
  Dashboard,
  PivotsBitcoin,
  PivotsAltcoins,
  CajaVolatilidad,
  ChatIA,
  LogActividad,
  SimuladorRendimiento,
  Backtesting,
  CalculadoraPosiciones
} from './pages';
import './index.css';

// App routes with conditional sidebar
const AppRoutes = () => {
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = sidebarExpanded ? 200 : 50;

  // Only hide sidebar on Landing page - show EVERYWHERE else
  const isLanding = location.pathname === '/';
  const hideSidebar = isLanding || isMobile; // Hide on mobile for trading pages only

  return (
    <div style={{ background: '#0b0e11', minHeight: '100vh' }}>
      {/* Show sidebar only when appropriate */}
      {!hideSidebar && (
        <Sidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            marginLeft: hideSidebar ? 0 : sidebarWidth,
            minHeight: '100vh',
            transition: 'margin-left 0.2s ease',
          }}
        >
          <Routes location={location}>
            {/* Landing Page - Public */}
            <Route path="/" element={<Landing />} />

            {/* App Pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pivots-bitcoin" element={<PivotsBitcoin />} />
            <Route path="/pivots-altcoins" element={<PivotsAltcoins />} />
            <Route path="/caja-volatilidad" element={<CajaVolatilidad />} />
            <Route path="/chat-ia" element={<ChatIA />} />
            <Route path="/log-actividad" element={<LogActividad />} />
            <Route path="/simulador" element={<SimuladorRendimiento />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/calculadora" element={<CalculadoraPosiciones />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
