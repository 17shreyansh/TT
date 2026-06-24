import React from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function SectorStrength() {
  const sectors = useStore(state => state.sectors);
  const navigate = useNavigate();

  return (
    <div>
      <Typography variant="h5" sx={{ mb: 3 }}>Sector Strength</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sector Name</TableCell>
              <TableCell align="right">Movement %</TableCell>
              <TableCell align="right">Total Stocks</TableCell>
              <TableCell align="right">Active Signals</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sectors.map((sector) => (
              <TableRow 
                key={sector.name}
                hover
                onClick={() => navigate(`/sectors/${sector.name}`)}
                sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography fontWeight={600}>{sector.name}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color={sector.movementPercent >= 0 ? 'secondary.main' : 'error.main'} fontWeight={600}>
                    {sector.movementPercent > 0 ? '+' : ''}{sector.movementPercent.toFixed(2)}%
                  </Typography>
                </TableCell>
                <TableCell align="right">{sector.totalStocks}</TableCell>
                <TableCell align="right">
                  {sector.activeSignals > 0 ? (
                    <Chip label={sector.activeSignals} color="primary" size="small" />
                  ) : (
                    <Typography color="text.secondary">-</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sectors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No sector data available. Start the engine.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
