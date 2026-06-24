const sectorCalculator = require('./sectorCalculator');
const strategy = require('./strategy');
const { emitMarketUpdate, emitSectorUpdate, emitSignalUpdate } = require('../socket/socketLayer');
const smartApiService = require('./smartApiService');

// State maps
let universeMap = new Map(); // token -> universe details
let marketState = new Map(); // token -> { ltp, open, high, low, close, volume, changePercent, sma200, r4, s4, signal }

function formatAngelDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function init(universe) {
  universeMap.clear();
  marketState.clear();
  sectorCalculator.init(universe);

  const now = new Date();
  const dailyToDateStr = formatAngelDate(now);
  
  const dailyFrom = new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000); // 300 days ago
  const dailyFromDateStr = formatAngelDate(dailyFrom);

  const min15From = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago for safety
  const min15FromDateStr = formatAngelDate(min15From);

  for (const item of universe) {
    universeMap.set(item.token, item);
    
    let sma200 = 0;
    let r4 = 0;
    let s4 = 0;
    let lastClose = 0; // fallback open/ltp

    try {
      // Fetch Daily Data for SMA 200
      const dailyData = await smartApiService.getCandleData({
        exchange: item.exchange === 'NSE' ? 'NSE' : 'BSE', // default handling
        symboltoken: item.token,
        interval: 'ONE_DAY',
        fromdate: dailyFromDateStr,
        todate: dailyToDateStr
      });

      if (dailyData && dailyData.data && dailyData.data.length > 0) {
        const candles = dailyData.data;
        // Take the last 200 candles
        const last200 = candles.slice(-200);
        const sum = last200.reduce((acc, candle) => acc + candle[4], 0); // close is at index 4
        sma200 = sum / last200.length;
      }

      // Small delay to prevent rate limit
      await new Promise(r => setTimeout(r, 200));

      // Fetch 15-minute Data for R4/S4 Camarilla
      const min15Data = await smartApiService.getCandleData({
        exchange: item.exchange === 'NSE' ? 'NSE' : 'BSE',
        symboltoken: item.token,
        interval: 'FIFTEEN_MINUTE',
        fromdate: min15FromDateStr,
        todate: dailyToDateStr
      });

      if (min15Data && min15Data.data && min15Data.data.length > 0) {
        const candles = min15Data.data;
        // Use the last available candle for camarilla calculation
        const lastCandle = candles[candles.length - 1];
        const high = lastCandle[2];
        const low = lastCandle[3];
        const close = lastCandle[4];
        lastClose = close;

        const range = high - low;
        r4 = close + (range * 1.1 / 2);
        s4 = close - (range * 1.1 / 2);
      }

      await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      console.error(`Error fetching historical data for ${item.symbol}:`, err.message || err);
    }

    const initialState = {
      symbol: item.symbol,
      sector: item.sector,
      token: item.token,
      ltp: lastClose, // Initialize with last close
      open: lastClose,
      changePercent: 0,
      volume: 0,
      sma200: sma200,
      r4: r4,
      s4: s4,
      signal: 'NONE',
      signalTime: null
    };

    // Calculate signal from historical data
    const initialSignal = strategy.calculate(initialState);
    if (initialSignal !== 'NONE') {
      initialState.signal = initialSignal;
      initialState.signalTime = new Date().toISOString();
      
      // Emit signal immediately for the frontend
      emitSignalUpdate({
        symbol: initialState.symbol,
        sector: initialState.sector,
        signal: initialState.signal,
        price: initialState.ltp,
        changePercent: initialState.changePercent,
        time: initialState.signalTime
      });
    }

    marketState.set(item.token, initialState);
    
    // Ensure the sector data is updated with this initial signal
    sectorCalculator.updateSector(initialState);
  }

  emitMarketState();
}

function processTick(tickData) {
  const token = tickData.token || tickData.tk; // Handle different Angel payload structures
  if (!token || !universeMap.has(token)) return;

  const state = marketState.get(token);
  
  // SmartAPI LTP usually comes in paise, or sometimes float. We'll handle a direct float for simplicity here.
  // If real API is returning paise, it needs `ltp = tickData.last_traded_price / 100`
  const newLtp = tickData.last_traded_price || tickData.ltp || state.ltp;
  
  if (newLtp === state.ltp) return; // No change

  // Update State
  state.ltp = parseFloat(newLtp);
  state.changePercent = ((state.ltp - state.open) / state.open) * 100;
  
  // Run Strategy
  const newSignal = strategy.calculate(state);
  
  let signalChanged = false;
  if (newSignal !== state.signal) {
    state.signal = newSignal;
    state.signalTime = new Date().toISOString();
    signalChanged = true;
  }

  // Update sector calculation
  sectorCalculator.updateSector(state);

  // Throttle emissions in a real production app. For now, emit immediately.
  emitMarketUpdate(Array.from(marketState.values()));
  emitSectorUpdate(sectorCalculator.getSectors());
  
  if (signalChanged && newSignal !== 'NONE') {
    emitSignalUpdate({
      symbol: state.symbol,
      sector: state.sector,
      signal: state.signal,
      price: state.ltp,
      changePercent: state.changePercent,
      time: state.signalTime
    });
  }
}

function clear() {
  marketState.clear();
  sectorCalculator.clear();
}

function emitMarketState() {
  emitMarketUpdate(Array.from(marketState.values()));
  emitSectorUpdate(sectorCalculator.getSectors());
}

function getMarketState() {
  return Array.from(marketState.values());
}

module.exports = {
  init,
  processTick,
  clear,
  getMarketState
};
