import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, IconButton, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import useStore from '../store/useStore';

export default function StockDetails() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  
  const marketData = useStore(state => state.marketData);
  const allSignals = useStore(state => state.signals);
  
  const stock = marketData.find(s => s.symbol === symbol);
  
  // Keep local history of the LTP for the live chart
  const [chartData, setChartData] = useState([]);

  // Every time stock.ltp updates, push to chart history
  useEffect(() => {
    if (stock && stock.ltp > 0) {
      const now = new Date();
      setChartData(prev => {
        const newData = [...prev, {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: now.getTime(),
          price: stock.ltp
        }];
        // Keep last 100 data points to prevent memory issues and keep chart readable
        if (newData.length > 100) return newData.slice(newData.length - 100);
        return newData;
      });
    }
  }, [stock?.ltp]);

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

  // Determine chart bounds to make the lines visible
  // We want the Y-axis domain to fit the price, sma200, r4, and s4
  const dataMin = Math.min(...chartData.map(d => d.price), stock.s4, stock.sma200) * 0.995;
  const dataMax = Math.max(...chartData.map(d => d.price), stock.r4, stock.sma200) * 1.005;

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
            Sector: {stock.sector}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Chart Section */}
        <Grid item xs={12} md={8} lg={9}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Live Chart (LTP: ₹{(stock.ltp || 0).toFixed(2)})</span>
                <span style={{ color: (stock.changePercent || 0) >= 0 ? '#4caf50' : '#f44336' }}>
                  {(stock.changePercent || 0) > 0 ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                </span>
              </Typography>
              
              <Box sx={{ width: '100%', height: 500, mt: 4 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="time" minTickGap={30} tick={{ fontSize: 12, fill: '#888' }} />
                    <YAxis domain={[dataMin, dataMax]} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `₹${val.toFixed(0)}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', borderRadius: 8 }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    
                    {/* Live Price Line */}
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      name="Live Price" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false} // Disable animation for pure live streaming feel
                    />

                    {/* Strategy Reference Lines */}
                    {stock.sma200 > 0 && (
                      <ReferenceLine y={stock.sma200} label={{ position: 'insideTopLeft', value: 'SMA 200', fill: '#ffc658' }} stroke="#ffc658" strokeDasharray="3 3" />
                    )}
                    {stock.r4 > 0 && (
                      <ReferenceLine y={stock.r4} label={{ position: 'insideTopLeft', value: 'Camarilla R4', fill: '#82ca9d' }} stroke="#82ca9d" strokeDasharray="3 3" />
                    )}
                    {stock.s4 > 0 && (
                      <ReferenceLine y={stock.s4} label={{ position: 'insideTopLeft', value: 'Camarilla S4', fill: '#ff7300' }} stroke="#ff7300" strokeDasharray="3 3" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
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
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Metrics</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Open Price" secondary={`₹${(stock.open || 0).toFixed(2)}`} />
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
