let ioInstance = null;

function initSocket(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Lazy load to avoid circular dependencies at top level
    const engineController = require('../engine/engineController');
    const marketDataService = require('../services/marketDataService');
    const sectorCalculator = require('../services/sectorCalculator');
    
    // Emit initial state upon connection
    const status = engineController.getStatus();
    socket.emit('engine_update', status);
    
    if (status === 'RUNNING') {
      const state = marketDataService.getMarketState();
      socket.emit('market_update', state);
      socket.emit('sector_update', sectorCalculator.getSectors());
      socket.emit('signals_history', marketDataService.getSignalsHistory());
    }
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

function emitMarketUpdate(data) {
  if (ioInstance) ioInstance.emit('market_update', data);
}

function emitSectorUpdate(data) {
  if (ioInstance) ioInstance.emit('sector_update', data);
}

function emitSignalUpdate(data) {
  if (ioInstance) ioInstance.emit('signal_update', data);
}

function emitEngineUpdate(status) {
  if (ioInstance) ioInstance.emit('engine_update', status);
}

module.exports = {
  initSocket,
  emitMarketUpdate,
  emitSectorUpdate,
  emitSignalUpdate,
  emitEngineUpdate
};
