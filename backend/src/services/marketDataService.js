const sectorCalculator = require('./sectorCalculator');
const strategy = require('./strategy');
const { emitMarketUpdate, emitSectorUpdate, emitSignalUpdate } = require('../socket/socketLayer');
const smartApiService = require('./smartApiService');
const fs = require('fs');
const path = require('path');

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
    
    const initialState = {
      symbol: item.symbol,
      sector: item.sector,
      token: item.token,
      ltp: 0, 
      open: 0,
      changePercent: 0,
      volume: 0,
      sma200: 0,
      r4: 0,
      s4: 0,
      signal: 'NONE',
      signalTime: null
    };

    marketState.set(item.token, initialState);
    sectorCalculator.updateSector(initialState);
  }

  emitMarketState();
  
  // Do not wait for historical data, let it run in background to instantly unblock WebSocket
}

async function fetchHistoricalDataInBackground(universe, dailyFromDateStr, dailyToDateStr, min15FromDateStr) {
  const os = require('os');
  const cacheDir = path.join(os.tmpdir(), 'tt-algo-cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const cacheFile = path.join(cacheDir, `historical_data_${todayStr}.json`);

  if (fs.existsSync(cacheFile)) {
    console.log(`Daily cache found for ${todayStr}. Loading instantly...`);
    try {
      const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      for (const item of cachedData) {
        const state = marketState.get(item.token);
        if (state) {
          state.sma200 = item.sma200;
          state.r4 = item.r4;
          state.s4 = item.s4;
          // Note: we don't overwrite ltp if it's 0 because live socket will populate it, 
          // or we can just leave it as 0. 
        }
      }
      emitMarketState();
      console.log('Daily cache loaded in 0.1 seconds!');
      return;
    } catch (e) {
      console.error('Failed to read cache, falling back to API fetch...', e);
    }
  }

  console.log(`Starting background historical fetch for ${universe.length} tokens...`);
  let count = 0;
  for (const item of universe) {
    let sma200 = 0;
    let r4 = 0;
    let s4 = 0;
    let lastClose = marketState.get(item.token)?.ltp || 0;

    try {
      const dailyData = await smartApiService.getCandleData({
        exchange: item.exchange === 'NSE' ? 'NSE' : 'BSE',
        symboltoken: item.token,
        interval: 'ONE_DAY',
        fromdate: dailyFromDateStr, // 300 days ago to get SMA200
        todate: dailyToDateStr
      });

      if (dailyData && dailyData.data && dailyData.data.length >= 2) {
        const candles = dailyData.data;
        
        // Calculate SMA200
        const last200 = candles.slice(-200);
        if (last200.length > 0) {
          const sum = last200.reduce((acc, candle) => acc + candle[4], 0);
          sma200 = sum / last200.length;
        }

        // Calculate Camarilla R4/S4 from yesterday
        const yesterdayCandle = candles[candles.length - 2];
        const high = yesterdayCandle[2];
        const low = yesterdayCandle[3];
        const close = yesterdayCandle[4];
        lastClose = candles[candles.length - 1][4]; // latest available close

        const range = high - low;
        r4 = close + (range * 1.1 / 2);
        s4 = close - (range * 1.1 / 2);
      } else if (dailyData && dailyData.data && dailyData.data.length === 1) {
        lastClose = dailyData.data[0][4];
      }

      await new Promise(r => setTimeout(r, 400));

    } catch (err) {
      // Silently ignore
    }

    const state = marketState.get(item.token);
    if (!state) continue;

    // Update state with background historical data
    state.sma200 = sma200;
    state.r4 = r4;
    state.s4 = s4;
    if (state.ltp === 0) {
      state.ltp = lastClose;
      state.open = lastClose;
    }

    // Deliberately do NOT evaluate/emit the signal here.
    // We only want to trigger a signal when a LIVE price tick crosses the R4/S4 level TODAY.

    sectorCalculator.updateSector(state);
    count++;
    if (count % 10 === 0) {
      emitMarketState(); // Periodic flush
    }
  }
  
  // Save cache after successful fetch
  try {
    const cacheToSave = Array.from(marketState.values()).map(s => ({
      token: s.token,
      sma200: s.sma200,
      r4: s.r4,
      s4: s.s4
    }));
    fs.writeFileSync(cacheFile, JSON.stringify(cacheToSave), 'utf8');
    console.log(`Background historical fetch completed. Saved cache to ${cacheFile}`);
  } catch (err) {
    console.error('Failed to save daily cache:', err);
  }
  
  emitMarketState();
}

function processTick(tickData) {
  if (Array.isArray(tickData)) {
    tickData.forEach(tick => processTick(tick));
    return;
  }

  // Debug payload once to understand the exact keys Angel is sending
  if (!global.loggedTickPayload && tickData && (tickData.token || tickData.tk)) {
    console.log("DEBUG: First valid tick payload:", JSON.stringify(tickData));
    global.loggedTickPayload = true;
  }

  const token = tickData.token || tickData.tk; 
  if (!token || !universeMap.has(token)) return;

  const state = marketState.get(token);
  
  // SmartAPI V2 parsed payload uses last_traded_price
  let newLtp = tickData.last_traded_price || tickData.lastTradedPrice || tickData.ltp || tickData.LTP;
  
  // Try to find any price field if standard ones are missing
  if (newLtp === undefined) {
    if (!global.loggedMissingLtp) {
      console.log("DEBUG: Tick missing LTP fields:", JSON.stringify(tickData));
      global.loggedMissingLtp = true;
    }
    // V2 uses different keys sometimes, like `lp` or inside `best_5` etc depending on mode.
    // Mode 1 (LTP) usually has last_traded_price.
  }  
  if (!newLtp) return;

  // Sometimes Angel API returns LTP in paise (integer). If it's completely massive compared to open price, we adjust it.
  // E.g. open is 200, LTP comes in as 20000.
  if (state.open > 0 && newLtp > state.open * 50) {
    newLtp = newLtp / 100;
  }

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
