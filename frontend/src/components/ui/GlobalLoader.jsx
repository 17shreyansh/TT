import React from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';
import { Activity } from 'lucide-react';

export default function GlobalLoader() {
  return (
    <Fade in={true} timeout={1000}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'rgba(4, 8, 15, 0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={100} thickness={2} sx={{ color: 'primary.main', position: 'absolute' }} />
          <Activity size={40} color="#2962ff" className="pulse-animation" />
        </Box>
        
        <Typography 
          variant="h5" 
          sx={{ 
            mt: 4, 
            fontWeight: 700, 
            color: 'text.primary', 
            letterSpacing: 2,
            fontFamily: '"JetBrains Mono", monospace'
          }}
        >
          INITIALIZING MARKET ENGINE
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ mt: 1, color: 'text.secondary', letterSpacing: 1 }}
        >
          Connecting to SmartAPI and streaming live ticks...
        </Typography>
      </Box>
    </Fade>
  );
}
