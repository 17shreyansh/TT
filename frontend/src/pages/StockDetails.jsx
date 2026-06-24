import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, IconButton, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import useStore from '../store/useStore';

export default function StockDetails() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  
  const marketData = useStore(state => state.marketData);
  const allSignals = useStore(state => state.signals);
  const stock = marketData.find(s => s.symbol === symbol);
  
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const seriesInstance = useRef(null);
  
  const [candleData, setCandleData] = useState([]);

  // Intraday 1-minute aggregation
  useEffect(() => {
    if (stock && stock.ltp > 0) {
      const now = new Date();
      // Unix timestamp in seconds for lightweight-charts (rounded to nearest minute)
      const minuteTime = Math.floor(now.getTime() / 60000) * 60; 

      setCandleData(prev => {
        const lastCandle = prev.length > 0 ? prev[prev.length - 1] : null;

        if (!lastCandle || lastCandle.time !== minuteTime) {
          const newCandle = {
            time: minuteTime,
            open: stock.ltp,
            high: stock.ltp,
            low: stock.ltp,
            close: stock.ltp
          };
          // Initialize open from the backend if this is the very first minute we observe it today
          if (prev.length === 0 && stock.open > 0) {
              newCandle.open = stock.open;
          }
          return [...prev, newCandle];
        } else {
          if (lastCandle.close === stock.ltp && lastCandle.high >= stock.ltp && lastCandle.low <= stock.ltp) {
            return prev; // No visual change needed
          }
          const updatedCandles = [...prev];
          const updatedCandle = { ...lastCandle };
          updatedCandle.high = Math.max(updatedCandle.high, stock.ltp);
          updatedCandle.low = Math.min(updatedCandle.low, stock.ltp);
          updatedCandle.close = stock.ltp;
          updatedCandles[updatedCandles.length - 1] = updatedCandle;
          return updatedCandles;
        }
      });
    }
  }, [stock?.ltp]);

  // Init Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Add strategy lines
    if (stock) {
      if (stock.sma200 > 0) {
        candleSeries.createPriceLine({ price: stock.sma200, color: '#ffc658', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'SMA 200' });
      }
      if (stock.r4 > 0) {
        candleSeries.createPriceLine({ price: stock.r4, color: '#82ca9d', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'R4' });
      }
      if (stock.s4 > 0) {
        candleSeries.createPriceLine({ price: stock.s4, color: '#ff7300', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'S4' });
      }
    }

    chartInstance.current = chart;
    seriesInstance.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); // Run once on mount

  // Update chart data
  useEffect(() => {
    if (seriesInstance.current && candleData.length > 0) {
      // Sort and deduplicate times just in case to avoid lightweight-charts errors
      const validData = [...candleData].sort((a, b) => a.time - b.time);
      seriesInstance.current.setData(validData);
    }
  }, [candleData]);


  const stockSignals = useMemo(() => {
    return allSignals.filter(s => s.symbol === symbol).sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [allSignals, symbol]);

  if (!stock) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">Stock not found or loading...</Typography>
      </Box>
    );
  }

  const renderSignalBadge = (signal) => {
    if (signal === 'BUY') return <Chip icon={<TrendingUp size={16} />} label="BUY" color="success" sx={{ fontWeight: 'bold' }} />;
    if (signal === 'SELL') return <Chip icon={<TrendingDown size={16} />} label="SELL" color="error" sx={{ fontWeight: 'bold' }} />;
    return <Chip icon={<Minus size={16} />} label="NONE" variant="outlined" />;
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowLeft />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {stock.symbol.replace('-EQ', '')}
            {renderSignalBadge(stock.signal)}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sector: {stock.sector} | Open: ₹{(stock.open || 0).toFixed(2)} | High: ₹{(stock.high || 0).toFixed(2)} | Low: ₹{(stock.low || 0).toFixed(2)} | Vol: {stock.volume || 0}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Chart Section */}
        <Grid item xs={12} md={8} lg={9}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Live Intraday Chart (LTP: ₹{(stock.ltp || 0).toFixed(2)})</span>
                <span style={{ color: (stock.changePercent || 0) >= 0 ? '#4caf50' : '#f44336' }}>
                  {(stock.changePercent || 0) > 0 ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                </span>
              </Typography>
              
              <Box sx={{ width: '100%', mt: 2 }}>
                <div ref={chartContainerRef} style={{ width: '100%', position: 'relative' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Info Section */}
        <Grid item xs={12} md={4} lg={3}>
          <Grid container spacing={3} direction="column">
            
            {/* Market Data Panel */}
            <Grid item>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Strategy Metrics</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Prev Close" secondary={`₹${(stock.prevClose || 0).toFixed(2)}`} />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText primary="SMA 200" secondary={`₹${(stock.sma200 || 0).toFixed(2)}`} />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText primary="Resistance (R4)" secondary={`₹${(stock.r4 || 0).toFixed(2)}`} />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText primary="Support (S4)" secondary={`₹${(stock.s4 || 0).toFixed(2)}`} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Signals Timeline Panel */}
            <Grid item>
              <Card sx={{ borderRadius: 3, flexGrow: 1 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Activity size={20} /> Signal History
                  </Typography>
                  
                  {stockSignals.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      No strategy signals triggered for this stock yet today.
                    </Typography>
                  ) : (
                    <List>
                      {stockSignals.map((sig, i) => (
                        <React.Fragment key={i}>
                          <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {sig.signal === 'BUY' ? <TrendingUp color="#4caf50" /> : <TrendingDown color="#f44336" />}
                            </ListItemIcon>
                            <ListItemText 
                              primary={
                                <Typography variant="subtitle2" sx={{ color: sig.signal === 'BUY' ? 'success.main' : 'error.main' }}>
                                  {sig.signal} SIGNAL
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" component="span" display="block">
                                    Triggered at ₹{(sig.price || 0).toFixed(2)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(sig.time).toLocaleTimeString()}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          {i < stockSignals.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
