import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { useSocket } from './hooks/useSocket';
import useStore from './store/useStore';
import GlobalLoader from './components/ui/GlobalLoader';

import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import SectorStrength from './pages/SectorStrength';
import SectorDetails from './pages/SectorDetails';
import Signals from './pages/Signals';
import Settings from './pages/Settings';
import AllStocks from './pages/AllStocks';
import StockDetails from './pages/StockDetails';

function App() {
  // Initialize WebSocket connection
  useSocket();

  const engineStatus = useStore(state => state.engineStatus);
  const marketDataLength = useStore(state => state.marketData.length);
  const isLoading = engineStatus === 'RUNNING' && marketDataLength === 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoading && <GlobalLoader />}
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sectors" element={<SectorStrength />} />
            <Route path="/sectors/:name" element={<SectorDetails />} />
            <Route path="/stocks" element={<AllStocks />} />
            <Route path="/stocks/:symbol" element={<StockDetails />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
