import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Box } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import useStore from '../store/useStore';

export default function SectorDetails() {
  const { name } = useParams();
  const navigate = useNavigate();
  const marketData = useStore(state => state.marketData);
  const sectors = useStore(state => state.sectors);

  // Filter stocks matching the sector
  const sectorStocks = marketData.filter(stock => stock.sector === name && stock.signal !== 'NONE');
  const sectorInfo = sectors.find(s => s.name === name);

  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/sectors')} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h5">{name} Sector Details</Typography>
      </Box>

      {sectorInfo && (
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Chip label={`Movement: ${sectorInfo.movementPercent > 0 ? '+' : ''}${sectorInfo.movementPercent.toFixed(2)}%`} color={sectorInfo.movementPercent >= 0 ? 'secondary' : 'error'} />
          <Chip label={`Total Stocks: ${sectorInfo.totalStocks}`} variant="outlined" />
          <Chip label={`Active Signals: ${sectorInfo.activeSignals}`} color="primary" />
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell align="right">LTP</TableCell>
              <TableCell align="right">Change %</TableCell>
              <TableCell align="right">Volume</TableCell>
              <TableCell align="right">SMA 200</TableCell>
              <TableCell align="right">R4</TableCell>
              <TableCell align="right">S4</TableCell>
              <TableCell align="center">Signal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sectorStocks.map((stock) => (
              <TableRow key={stock.token} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <Typography fontWeight={600}>{stock.symbol}</Typography>
                </TableCell>
                <TableCell align="right">{stock.ltp.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Typography color={stock.changePercent >= 0 ? 'secondary.main' : 'error.main'}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </Typography>
                </TableCell>
                <TableCell align="right">{stock.volume}</TableCell>
                <TableCell align="right">{stock.sma200.toFixed(2)}</TableCell>
                <TableCell align="right">{stock.r4.toFixed(2)}</TableCell>
                <TableCell align="right">{stock.s4.toFixed(2)}</TableCell>
                <TableCell align="center">
                  {stock.signal === 'BUY' && <Chip label="BUY" color="secondary" size="small" sx={{ fontWeight: 600 }} />}
                  {stock.signal === 'SELL' && <Chip label="SELL" color="error" size="small" sx={{ fontWeight: 600 }} />}
                  {stock.signal === 'NONE' && <Typography variant="body2" color="text.secondary">NONE</Typography>}
                </TableCell>
              </TableRow>
            ))}
            {sectorStocks.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No stocks found matching the strategy conditions in this sector.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
