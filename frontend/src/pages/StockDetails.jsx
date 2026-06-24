import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, IconButton } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { createChart } from 'lightweight-charts';
import useStore from '../store/useStore';
import { getHistoricalData } from '../api';

export default function StockDetails() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  
  const marketData = useStore(state => state.marketData);
  const globalSignals = useStore(state => state.signals);
  
  const stock = marketData.find(s => s.symbol === symbol);

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const seriesInstance = useRef(null);
  
  // Refs to hold active price lines so we can update/remove them
  const priceLinesRef = useRef({
    sma: null,
    r4: null,
    s4: null
  });
  
  const historicalLoaded = useRef(false);
  const lastCandleRef = useRef(null);

  // 1. Initialize Chart & ResizeObserver
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartInstance.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#aab2c0',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      crosshair: {
        mode: 1, // Magnet mode
      }
    });

    seriesInstance.current = chartInstance.current.addCandlestickSeries({
      upColor: '#00e676',
      downColor: '#ff1744',
      borderVisible: false,
      wickUpColor: '#00e676',
      wickDownColor: '#ff1744',
    });

    // Pro Architecture: Handle Resizing perfectly
    const handleResize = () => {
      if (chartContainerRef.current && chartInstance.current) {
        chartInstance.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
        seriesInstance.current = null;
      }
    };
  }, []); // Run once on mount

  // 2. Load Historical Data
  useEffect(() => {
    let active = true;
    historicalLoaded.current = false;
    
    getHistoricalData(symbol).then(res => {
      if (active && res.success && res.data && seriesInstance.current) {
        // Sort and strictly deduplicate times to prevent lightweight-charts from crashing
        const validData = [...res.data]
          .sort((a, b) => a.time - b.time)
          .filter((item, index, arr) => index === 0 || item.time !== arr[index - 1].time);

        try {
          seriesInstance.current.setData(validData);
          if (validData.length > 0) {
            lastCandleRef.current = validData[validData.length - 1];
          }
        } catch (e) {
          console.error('Chart SetData Error:', e);
        }
        historicalLoaded.current = true;
      }
          lastCandleRef.current = validData[validData.length - 1];
        }
        historicalLoaded.current = true;
      }
    });
    return () => { active = false; };
  }, [symbol]);

  // 3. Intraday 1-minute aggregation for live ticks & Price Lines
  useEffect(() => {
    if (stock && stock.ltp > 0 && historicalLoaded.current && seriesInstance.current) {
      const now = new Date();
      // Unix timestamp in seconds for lightweight-charts (rounded to nearest minute)
      const minuteTime = Math.floor(now.getTime() / 60000) * 60; 

      const lastCandle = lastCandleRef.current;
      let newCandle;

      if (!lastCandle || lastCandle.time !== minuteTime) {
        newCandle = {
          time: minuteTime,
          open: stock.ltp,
          high: stock.ltp,
          low: stock.ltp,
          close: stock.ltp
        };
        // Initialize open from the backend if this is the very first minute we observe it today and no history
        if (!lastCandle && stock.open > 0) {
            newCandle.open = stock.open;
        }
      } else {
        if (lastCandle.close === stock.ltp && lastCandle.high >= stock.ltp && lastCandle.low <= stock.ltp) {
          // No visual candle change needed
        } else {
          newCandle = { ...lastCandle };
          newCandle.high = Math.max(newCandle.high, stock.ltp);
          newCandle.low = Math.min(newCandle.low, stock.ltp);
          newCandle.close = stock.ltp;
          lastCandleRef.current = newCandle;
          try {
            seriesInstance.current.update(newCandle);
          } catch (e) {
            console.error('Chart Update Error:', e);
          }
        }
      }

      // 4. Update Strategy Price Lines Dynamically
      const updatePriceLine = (key, price, color, title, style) => {
        if (!price || price <= 0 || !seriesInstance.current) return;
        
        if (!priceLinesRef.current[key]) {
          priceLinesRef.current[key] = seriesInstance.current.createPriceLine({
            price,
            color,
            lineWidth: 2,
            lineStyle: style, // 0 = Solid, 1 = Dotted, 2 = Dashed
            axisLabelVisible: true,
            title,
          });
        } else {
          // Only update if price changed
          if (priceLinesRef.current[key].options().price !== price) {
             priceLinesRef.current[key].applyOptions({ price });
          }
        }
      };

      updatePriceLine('sma', stock.sma200, '#2962ff', 'SMA 200', 0);
      updatePriceLine('r4', stock.r4, '#ff9800', 'R4 (Res)', 2);
      updatePriceLine('s4', stock.s4, '#ff9800', 'S4 (Sup)', 2);
    }
  }, [stock?.ltp, stock?.sma200, stock?.r4, stock?.s4]);

  // 5. Update TradingView Markers (Signals)
  useEffect(() => {
    if (!seriesInstance.current || !historicalLoaded.current) return;
    
    // Filter global signals for this specific stock
    const stockSignals = globalSignals.filter(s => s.symbol === symbol || s.symbol === `${symbol}-EQ`);
    
    // Convert to lightweight-charts marker format and strictly deduplicate by time
    const markers = stockSignals
      .map(sig => ({
        time: Math.floor(new Date(sig.time).getTime() / 1000),
        position: sig.signal === 'BUY' ? 'belowBar' : 'aboveBar',
        color: sig.signal === 'BUY' ? '#00e676' : '#ff1744',
        shape: sig.signal === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: sig.signal === 'BUY' ? 'BUY' : 'SELL',
        size: 2
      }))
      .sort((a, b) => a.time - b.time)
      .filter((marker, index, arr) => index === 0 || marker.time !== arr[index - 1].time);

    // Lightweight charts handles setting all markers at once efficiently
    try {
      seriesInstance.current.setMarkers(markers);
    } catch (e) {
      console.error('Chart SetMarkers Error:', e);
    }
  }, [globalSignals, symbol]);

  if (!stock) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Stock data not found or disconnected.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/stocks')} sx={{ mr: 2, bgcolor: 'background.paper' }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {stock.symbol.replace('-EQ', '')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip label={stock.sector} size="small" variant="outlined" />
            <Chip 
              icon={<Activity size={14} />} 
              label={`LTP: ₹${stock.ltp.toFixed(2)}`} 
              size="small" 
              color={stock.changePercent >= 0 ? "success" : "error"}
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, p: 0, position: 'relative' }}>
              <div ref={chartContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Strategy Overview</Typography>
              
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Current Signal</Typography>
                {stock.signal === 'BUY' && <Chip icon={<TrendingUp size={18} />} label="STRONG BUY" color="success" sx={{ fontWeight: 'bold' }} />}
                {stock.signal === 'SELL' && <Chip icon={<TrendingDown size={18} />} label="STRONG SELL" color="error" sx={{ fontWeight: 'bold' }} />}
                {stock.signal === 'NONE' && <Chip icon={<Minus size={18} />} label="NEUTRAL" variant="outlined" sx={{ color: 'text.secondary' }} />}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                <Typography color="text.secondary">SMA 200</Typography>
                <Typography fontWeight="bold" color="primary.main">₹{stock.sma200?.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                <Typography color="text.secondary">Resistance (R4)</Typography>
                <Typography fontWeight="bold" color="warning.main">₹{stock.r4?.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                <Typography color="text.secondary">Support (S4)</Typography>
                <Typography fontWeight="bold" color="warning.main">₹{stock.s4?.toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'background.paper', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Strategy Condition
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong style={{ color: '#00e676'}}>BUY:</strong> Price crosses above SMA200 AND Resistance (R4).
              </Typography>
              <Typography variant="body2">
                <strong style={{ color: '#ff1744'}}>SELL:</strong> Price crosses below SMA200 AND Support (S4).
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
