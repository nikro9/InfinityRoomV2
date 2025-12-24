// src/components/layout/Sidebar.jsx
// Modern TradingView-style compact sidebar with icons only
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Bitcoin,
  TrendingUp,
  Box,
  MessageCircle,
  FileText,
  Calculator,
  FlaskConical,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Settings,
  Layers
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutGrid, label: 'Dashboard' },
  { divider: true },
  { path: '/pivots-bitcoin', icon: Bitcoin, label: 'BTC Pivots' },
  { path: '/pivots-altcoins', icon: TrendingUp, label: 'Altcoins' },
  { path: '/caja-volatilidad', icon: Box, label: 'Volatilidad' },
  { divider: true },
  { path: '/chat-ia', icon: MessageCircle, label: 'AI Chat' },
  { path: '/log-actividad', icon: FileText, label: 'Logs' },
  { path: '/simulador', icon: LineChart, label: 'Simulador' },
  { path: '/backtesting', icon: FlaskConical, label: 'Backtest' },
  { path: '/calculadora', icon: Calculator, label: 'Calculadora' },
];

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const location = useLocation();

  return (
    <motion.aside
      className="sidebar-compact"
      animate={{ width: isExpanded ? 200 : 50 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        background: '#131722',
        borderRight: '1px solid #2a2e39',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #2a2e39',
          gap: 8,
          padding: isExpanded ? '0 12px' : 0,
        }}
      >
        <Layers size={22} color="#2962ff" />
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#d1d4dc',
                whiteSpace: 'nowrap',
                letterSpacing: '0.5px'
              }}
            >
              NEXUS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 8, overflowY: 'auto' }}>
        {menuItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div
                key={`divider-${idx}`}
                style={{
                  height: 1,
                  background: '#2a2e39',
                  margin: '8px 0'
                }}
              />
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={!isExpanded ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: 40,
                padding: isExpanded ? '0 16px' : '0 14px',
                color: isActive ? '#2962ff' : '#787b86',
                background: isActive ? 'rgba(41, 98, 255, 0.1)' : 'transparent',
                borderLeft: isActive ? '2px solid #2962ff' : '2px solid transparent',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#d1d4dc';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#787b86';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={18} />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Expand/Collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid #2a2e39',
          color: '#787b86',
          cursor: 'pointer',
        }}
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
