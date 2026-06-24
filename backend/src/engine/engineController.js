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
    
    // 2. Load Universe
    const universePath = path.join(__dirname, '../../config/universe.json');
    const universe = JSON.parse(fs.readFileSync(universePath, 'utf8'));
    
    // 3. Initialize Market Data Service
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
