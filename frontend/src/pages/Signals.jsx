import React, { useState, useMemo } from 'react';
import { 
  Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip, Box, TextField, 
  InputAdornment, ToggleButtonGroup, ToggleButton 
} from '@mui/material';
import { Search } from 'lucide-react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function Signals() {
  const signals = useStore(state => state.signals);
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilterType(newFilter);
    }
  };

  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      // Filter by Type
      if (filterType !== 'ALL' && signal.signal !== filterType) {
        return false;
      }
      
      // Filter by Search (Symbol or Sector)
      if (search) {
        const query = search.toLowerCase();
        if (!signal.symbol.toLowerCase().includes(query) && 
            !signal.sector.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [signals, search, filterType]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Signal History
      </Typography>

      {/* Filter Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by symbol or sector..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 250, bgcolor: 'background.paper', borderRadius: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />
        
        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={handleFilterChange}
          size="small"
          sx={{ bgcolor: 'background.paper' }}
        >
          <ToggleButton value="ALL" sx={{ px: 3 }}>ALL</ToggleButton>
          <ToggleButton value="BUY" sx={{ px: 3, color: 'success.main', '&.Mui-selected': { color: 'success.main', bgcolor: 'success.light', opacity: 0.8 } }}>BUY</ToggleButton>
          <ToggleButton value="SELL" sx={{ px: 3, color: 'error.main', '&.Mui-selected': { color: 'error.main', bgcolor: 'error.light', opacity: 0.8 } }}>SELL</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell align="center">Signal</TableCell>
              <TableCell align="right">Trigger Price</TableCell>
              <TableCell align="right">Change %</TableCell>
              <TableCell align="right">Time Triggered</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSignals.map((signal, index) => (
              <TableRow 
                key={`${signal.symbol}-${signal.time}-${index}`} 
                hover 
                onClick={() => navigate(`/stocks/${encodeURIComponent(signal.symbol)}`)}
                sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography fontWeight="bold">{signal.symbol.replace('-EQ', '')}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={signal.sector} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="center">
                  {signal.signal === 'BUY' && <Chip label="BUY" color="success" size="small" sx={{ fontWeight: 'bold' }} />}
                  {signal.signal === 'SELL' && <Chip label="SELL" color="error" size="small" sx={{ fontWeight: 'bold' }} />}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'medium' }}>₹{signal.price.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Typography fontWeight="bold" color={signal.changePercent >= 0 ? 'success.main' : 'error.main'}>
                    {signal.changePercent > 0 ? '+' : ''}{signal.changePercent.toFixed(2)}%
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {new Date(signal.time).toLocaleTimeString()}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {filteredSignals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>No signals found</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your filters or wait for market opportunities.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
