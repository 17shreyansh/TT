import React from 'react';
import { Grid, Typography, Fade, Box } from '@mui/material';
import { Activity, Target, Layers, ArrowUpCircle, ArrowDownCircle, Wifi } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import useStore from '../store/useStore';

export default function Dashboard() {
  const engineStatus = useStore(state => state.engineStatus);
  const totalScanned = useStore(state => state.getTotalScanned());
  const activeSignals = useStore(state => state.getActiveSignalsCount());
  const sectors = useStore(state => state.sectors);

  const strongestSector = sectors.length > 0 ? sectors[0] : null;
  const weakestSector = sectors.length > 0 ? sectors[sectors.length - 1] : null;

  return (
    <Fade in={true} timeout={800}>
      <Box>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: 1.5 }}>
          Dashboard Overview
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="System Connection" 
              value={engineStatus === 'RUNNING' ? 'Online' : 'Offline'} 
              icon={<Wifi size={24} />} 
              valueColor={engineStatus === 'RUNNING' ? 'secondary.main' : 'error.main'}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Total Stocks Scanned" 
              value={totalScanned} 
              icon={<Layers size={24} />} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Active Signals" 
              value={activeSignals} 
              icon={<Target size={24} />} 
              valueColor="primary.main"
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 5, mb: 3, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: 1.5 }}>
          Sector Highlights
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StatCard 
              title="Strongest Sector" 
              value={strongestSector ? strongestSector.name : 'Awaiting Data'} 
              subtitle={strongestSector ? `+${(strongestSector.movementPercent || 0).toFixed(2)}% Average Movement` : 'Start the engine to receive data'}
              icon={<ArrowUpCircle size={24} />} 
              valueColor="secondary.main"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatCard 
              title="Weakest Sector" 
              value={weakestSector ? weakestSector.name : 'Awaiting Data'} 
              subtitle={weakestSector ? `${(weakestSector.movementPercent || 0).toFixed(2)}% Average Movement` : 'Start the engine to receive data'}
              icon={<ArrowDownCircle size={24} />} 
              valueColor="error.main"
            />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}
