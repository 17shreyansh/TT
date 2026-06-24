import React from 'react';
import { Grid, Typography } from '@mui/material';
import { Activity, Target, Layers, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
    <div>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 1 }}>Dashboard Overview</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard 
            title="Market Status" 
            value="OPEN" 
            icon={<Activity size={24} />} 
            valueColor="secondary.main"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard 
            title="Engine Status" 
            value={engineStatus} 
            icon={<Activity size={24} />} 
            valueColor={engineStatus === 'RUNNING' ? 'secondary.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard 
            title="Total Stocks Scanned" 
            value={totalScanned} 
            icon={<Layers size={24} />} 
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard 
            title="Active Signals" 
            value={activeSignals} 
            icon={<Target size={24} />} 
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 1 }}>Sector Highlights</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <StatCard 
            title="Strongest Sector" 
            value={strongestSector ? strongestSector.name : '-'} 
            subtitle={strongestSector ? `+${strongestSector.movementPercent.toFixed(2)}% Average Movement` : ''}
            icon={<ArrowUpCircle size={24} />} 
            valueColor="secondary.main"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard 
            title="Weakest Sector" 
            value={weakestSector ? weakestSector.name : '-'} 
            subtitle={weakestSector ? `${weakestSector.movementPercent.toFixed(2)}% Average Movement` : ''}
            icon={<ArrowDownCircle size={24} />} 
            valueColor="error.main"
          />
        </Grid>
      </Grid>
    </div>
  );
}
