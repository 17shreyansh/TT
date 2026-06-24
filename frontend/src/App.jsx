import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { useSocket } from './hooks/useSocket';

import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import SectorStrength from './pages/SectorStrength';
import SectorDetails from './pages/SectorDetails';
import Signals from './pages/Signals';
import Settings from './pages/Settings';

function App() {
  // Initialize WebSocket connection
  useSocket();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sectors" element={<SectorStrength />} />
            <Route path="/sectors/:name" element={<SectorDetails />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
