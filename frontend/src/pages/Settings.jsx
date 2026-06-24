import React, { useState } from 'react';
import { Typography, Card, CardContent, Button, Box, Alert, CircularProgress, Chip } from '@mui/material';
import { Play, Square, RefreshCw } from 'lucide-react';
import useStore from '../store/useStore';
import { startEngine, stopEngine, restartEngine } from '../api';

export default function Settings() {
  const engineStatus = useStore(state => state.engineStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      await startEngine();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    setError('');
    try {
      await stopEngine();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const handleRestart = async () => {
    setLoading(true);
    setError('');
    try {
      await restartEngine();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Typography variant="h5" sx={{ mb: 3 }}>Engine Controls & Settings</Typography>

      <Card sx={{ maxWidth: 600, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Scanner Engine</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="body1" color="text.secondary">Current Status:</Typography>
            <Chip 
              label={engineStatus} 
              color={engineStatus === 'RUNNING' ? 'secondary' : 'error'} 
              size="small" 
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Play size={20} />}
              onClick={handleStart}
              disabled={engineStatus === 'RUNNING' || loading}
              sx={{ px: 4 }}
            >
              Start Engine
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Square size={20} />}
              onClick={handleStop}
              disabled={engineStatus === 'STOPPED' || loading}
              sx={{ px: 4 }}
            >
              Stop Engine
            </Button>
            <Button 
              variant="outlined" 
              color="warning" 
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshCw size={20} />}
              onClick={handleRestart}
              disabled={loading}
              sx={{ px: 4 }}
            >
              Restart Engine
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Configuration Overview</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Active Strategy</Typography>
              <Typography variant="body1" fontWeight={500}>SMA 200 + R4/S4 Breakout</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Market Universe</Typography>
              <Typography variant="body1" fontWeight={500}>config/universe.json (Mocked for testing)</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Data Source</Typography>
              <Typography variant="body1" fontWeight={500}>Angel One SmartAPI (Mock Mode Active if credentials missing)</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}


