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
    const https = require('https');
    console.log('Fetching live universe from Angel API...');
    const universe = await new Promise((resolve, reject) => {
      https.get('https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json', (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const fullList = JSON.parse(data);
            
            const getAlphabeticalSector = (symbol) => {
              const firstChar = symbol.charAt(0).toUpperCase();
              if (firstChar >= 'A' && firstChar <= 'D') return 'A-D';
              if (firstChar >= 'E' && firstChar <= 'H') return 'E-H';
              if (firstChar >= 'I' && firstChar <= 'L') return 'I-L';
              if (firstChar >= 'M' && firstChar <= 'P') return 'M-P';
              if (firstChar >= 'Q' && firstChar <= 'T') return 'Q-T';
              if (firstChar >= 'U' && firstChar <= 'Z') return 'U-Z';
              return 'OTHER';
            };

            const nseEquities = fullList
              .filter(item => item.exch_seg === 'NSE' && item.symbol.endsWith('-EQ'))
              .map(item => ({
                symbol: item.symbol,
                token: item.token,
                sector: getAlphabeticalSector(item.symbol),
                exchange: 'NSE'
              }));
            console.log(`Successfully fetched ${nseEquities.length} active NSE equity tokens.`);
            resolve(nseEquities);
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);
    });
    
    // 3. Initialize Market Data Service
    emitEngineUpdate('INITIALIZING');
    await marketDataService.init(universe);
    
    // 4. Subscribe to WebSockets
    smartApiService.connectWebSocket(universe, (tickData) => {
      marketDataService.processTick(tickData);
    });
    
    isRunning = true;
    emitEngineUpdate('RUNNING');
    console.log('Engine started successfully');
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
