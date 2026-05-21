import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { useFileStore } from './store/useFileStore';
import { Home } from './views/Home';
import { ToolWorkspace } from './views/ToolWorkspace';
import { Dashboard } from './views/Dashboard';
import { History } from './views/History';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="flex-1 flex flex-col"
  >
    {children}
  </motion.div>
);

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/history" element={<PageWrapper><History /></PageWrapper>} />
        <Route path="/tool/:toolId" element={<PageWrapper><ToolWorkspace /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const theme = useFileStore((state) => state.theme);

  useEffect(() => {
    // Apply theme on initial load to html element
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
      <Toaster theme={theme} position="bottom-right" />
    </Router>
  );
}

export default App;
