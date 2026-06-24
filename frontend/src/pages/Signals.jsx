import React from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import useStore from '../store/useStore';

export default function Signals() {
  const signals = useStore(state => state.signals);

  return (
    <div>
      <Typography variant="h5" sx={{ mb: 3 }}>Active Opportunities</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell align="center">Signal</TableCell>
              <TableCell align="right">Current Price</TableCell>
              <TableCell align="right">Change %</TableCell>
              <TableCell align="right">Signal Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signals.map((signal, index) => (
              <TableRow key={`${signal.symbol}-${index}`} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <Typography fontWeight={600}>{signal.symbol}</Typography>
                </TableCell>
                <TableCell>{signal.sector}</TableCell>
                <TableCell align="center">
                  {signal.signal === 'BUY' && <Chip label="BUY" color="secondary" size="small" sx={{ fontWeight: 600 }} />}
                  {signal.signal === 'SELL' && <Chip label="SELL" color="error" size="small" sx={{ fontWeight: 600 }} />}
                </TableCell>
                <TableCell align="right">{signal.price.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Typography color={signal.changePercent >= 0 ? 'secondary.main' : 'error.main'}>
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
            {signals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No active signals yet. Waiting for market opportunities...</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
