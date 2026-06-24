const smartApiService = require('../services/smartApiService');
const marketDataService = require('../services/marketDataService');
const { emitEngineUpdate } = require('../socket/socketLayer');
const fs = require('fs');
const path = require('path');

let isRunning = false;

async function start() {
  if (isRunning) return;
  console.log('Starting Engine...');
  
  try {
    // 1. Connect to SmartAPI
    await smartApiService.login();
    
    // 2. Load Universe Dynamically from Angel API
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const CACHE_DIR = path.join(os.tmpdir(), 'tt-algo-cache');
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    
    const universeCacheFile = path.join(CACHE_DIR, `universe_${new Date().toISOString().split('T')[0]}.json`);
    let nseEquities = [];
    
    if (fs.existsSync(universeCacheFile)) {
      console.log('Loading live universe from daily cache...');
      nseEquities = JSON.parse(fs.readFileSync(universeCacheFile, 'utf8'));
    } else {
      console.log('Fetching live universe from Angel API (This may take a few minutes)...');
      try {
        const response = await fetch('https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json'
          }
        });
        const fullList = await response.json();
        
        const exactSectors = {
          "RELIANCE-EQ": "Energy", "TCS-EQ": "IT", "INFY-EQ": "IT", "HDFCBANK-EQ": "Banking",
          "ICICIBANK-EQ": "Banking", "SBIN-EQ": "Banking", "KOTAKBANK-EQ": "Banking", "AXISBANK-EQ": "Banking",
          "PNB-EQ": "Banking", "HINDUNILVR-EQ": "FMCG", "ITC-EQ": "FMCG", "NESTLEIND-EQ": "FMCG",
          "BRITANNIA-EQ": "FMCG", "TATAMOTORS-EQ": "Auto", "M&M-EQ": "Auto", "MARUTI-EQ": "Auto",
          "BAJAJ-AUTO-EQ": "Auto", "HEROMOTOCO-EQ": "Auto", "TATASTEEL-EQ": "Metals", "HINDALCO-EQ": "Metals",
          "JSWSTEEL-EQ": "Metals", "SUNPHARMA-EQ": "Pharma", "CIPLA-EQ": "Pharma", "DRREDDY-EQ": "Pharma",
          "DIVISLAB-EQ": "Pharma", "LARSEN-EQ": "Infrastructure", "LT-EQ": "Infrastructure", 
          "BHARTIARTL-EQ": "Telecom", "ASIANPAINT-EQ": "Consumer", "TITAN-EQ": "Consumer", "WIPRO-EQ": "IT",
          "HCLTECH-EQ": "IT", "TECHM-EQ": "IT", "POWERGRID-EQ": "Energy", "NTPC-EQ": "Energy",
          "ONGC-EQ": "Energy", "COALINDIA-EQ": "Energy", "ULTRACEMCO-EQ": "Cement", "GRASIM-EQ": "Cement",
          "BAJFINANCE-EQ": "Finance", "BAJAJFINSV-EQ": "Finance", "HDFCLIFE-EQ": "Finance", "SBILIFE-EQ": "Finance",
          "ADANIENT-EQ": "Infrastructure", "ADANIPORTS-EQ": "Infrastructure", "EICHERMOT-EQ": "Auto"
        };

        const getSector = (symbol) => {
          if (exactSectors[symbol]) return exactSectors[symbol];
          
          const upper = symbol.toUpperCase();
          if (upper.includes("BANK")) return "Banking";
          if (upper.includes("FIN") || upper.includes("CAP")) return "Finance";
          if (upper.includes("PHARMA") || upper.includes("CHEM") || upper.includes("DRUG") || upper.includes("LAB")) return "Pharma";
          if (upper.includes("AUTO") || upper.includes("MOTOR")) return "Auto";
          if (upper.includes("STEEL") || upper.includes("METAL") || upper.includes("ZINC") || upper.includes("COPPER")) return "Metals";
          if (upper.includes("TECH") || upper.includes("SOFT") || upper.includes("INFO")) return "IT";
          if (upper.includes("POWER") || upper.includes("ENERGY") || upper.includes("ELEC") || upper.includes("GAS")) return "Energy";
          if (upper.includes("INFRA") || upper.includes("BUILD") || upper.includes("CEM")) return "Infrastructure";
          if (upper.includes("FOOD") || upper.includes("AGRI") || upper.includes("SUGAR")) return "FMCG";
          
          return "Others";
        };

        nseEquities = fullList
          .filter(item => item.exch_seg === 'NSE' && item.symbol.endsWith('-EQ'))
          .map(item => ({
            symbol: item.symbol,
            token: item.token,
            sector: getSector(item.symbol),
            exchange: 'NSE'
          }));
        console.log(`Successfully fetched ${nseEquities.length} active NSE equity tokens.`);
        fs.writeFileSync(universeCacheFile, JSON.stringify(nseEquities));
      } catch (err) {
        console.error("Failed to fetch Universe from Angel:", err);
        throw err;
      }
    }
    const universe = nseEquities;
    
    // 3. Initialize Market Data Service
    // Run async, do not block the WebSocket connection
    marketDataService.init(universe).catch(err => console.error("Historical fetch error:", err));
    
    // 4. Subscribe to WebSockets instantly
    smartApiService.connectWebSocket(universe, (tickData) => {
      marketDataService.processTick(tickData);
    });
    
    isRunning = true;
    emitEngineUpdate('RUNNING');
    console.log('Engine started successfully. Historical data fetching in background if not cached.');
  } catch (error) {
    console.error('Failed to start engine:', error);
    isRunning = false;
    emitEngineUpdate('STOPPED');
    throw error;
  }
}

async function stop() {
  if (!isRunning) return;
  console.log('Stopping Engine...');
  
  smartApiService.disconnectWebSocket();
  marketDataService.clear();
  
  isRunning = false;
  emitEngineUpdate('STOPPED');
  console.log('Engine stopped');
}

function getStatus() {
  return isRunning ? 'RUNNING' : 'STOPPED';
}

async function restart() {
  console.log('Restarting Engine...');
  await stop();
  await start();
}

module.exports = {
  start,
  stop,
  getStatus,
  restart
};
