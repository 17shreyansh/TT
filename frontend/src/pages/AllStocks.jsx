import React, { useState, useMemo } from 'react';
import { Box, Typography, Card, CardContent, TextField, InputAdornment, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination } from '@mui/material';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function AllStocks() {
  const navigate = useNavigate();
  const marketData = useStore(state => state.marketData);
  
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('signalScore');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getSignalScore = (signal) => {
    if (signal === 'BUY') return 2;
    if (signal === 'SELL') return 1;
    return 0; // NONE
  };

  const filteredAndSortedData = useMemo(() => {
    let data = marketData.filter(stock => 
      stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
      stock.sector.toLowerCase().includes(search.toLowerCase())
    );

    data.sort((a, b) => {
      let valA, valB;

      if (orderBy === 'signalScore') {
        valA = getSignalScore(a.signal);
        valB = getSignalScore(b.signal);
      } else {
        valA = a[orderBy];
        valB = b[orderBy];
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [marketData, search, order, orderBy]);

  const renderSignalBadge = (signal) => {
    if (signal === 'BUY') return <Chip icon={<TrendingUp size={16} />} label="BUY" color="success" size="small" variant="outlined" />;
    if (signal === 'SELL') return <Chip icon={<TrendingDown size={16} />} label="SELL" color="error" size="small" variant="outlined" />;
    return <Chip icon={<Minus size={16} />} label="NONE" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider' }} />;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Market Screener
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Live view of all {marketData.length} stocks. Click a stock to view its live chart and strategy overlay.
      </Typography>

      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by symbol or sector..."
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
          />
        </CardContent>
      </Card>

      <TableContainer component={Card} sx={{ borderRadius: 3 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={orderBy === 'symbol'} direction={orderBy === 'symbol' ? order : 'asc'} onClick={() => handleSort('symbol')}>
                  Symbol
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={orderBy === 'sector'} direction={orderBy === 'sector' ? order : 'asc'} onClick={() => handleSort('sector')}>
                  Sector
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel active={orderBy === 'ltp'} direction={orderBy === 'ltp' ? order : 'asc'} onClick={() => handleSort('ltp')}>
                  LTP
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel active={orderBy === 'changePercent'} direction={orderBy === 'changePercent' ? order : 'asc'} onClick={() => handleSort('changePercent')}>
                  Change %
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">SMA 200</TableCell>
              <TableCell align="center">
                <TableSortLabel active={orderBy === 'signalScore'} direction={orderBy === 'signalScore' ? order : 'asc'} onClick={() => handleSort('signalScore')}>
                  Strategy Signal
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((stock) => (
              <TableRow 
                key={stock.symbol} 
                hover
                onClick={() => navigate(`/stocks/${encodeURIComponent(stock.symbol)}`)}
                sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  {stock.symbol.replace('-EQ', '')}
                </TableCell>
                <TableCell>
                  <Chip label={stock.sector} size="small" sx={{ bgcolor: 'action.hover' }} />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                  ₹{(stock.ltp || 0).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ color: (stock.changePercent || 0) >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                  {(stock.changePercent || 0) > 0 ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                </TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                  ₹{(stock.sma200 || 0).toFixed(2)}
                </TableCell>
                <TableCell align="center">
                  {renderSignalBadge(stock.signal)}
                </TableCell>
              </TableRow>
            ))}
            {filteredAndSortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No stocks found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
}
