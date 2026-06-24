let ioInstance = null;

function initSocket(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Optionally emit initial state upon connection
    // socket.emit('engine_update', engineController.getStatus());
    
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
