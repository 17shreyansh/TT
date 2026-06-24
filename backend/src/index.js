const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { initSocket } = require('./socket/socketLayer');
const engineController = require('./engine/engineController');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize socket layer
initSocket(io);

// API Routes
app.get('/api/engine/status', (req, res) => {
  res.json({ status: engineController.getStatus() });
});

app.post('/api/engine/start', async (req, res) => {
  try {
    await engineController.start();
    res.json({ success: true, status: engineController.getStatus() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/engine/stop', async (req, res) => {
  try {
    await engineController.stop();
    res.json({ success: true, status: engineController.getStatus() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/engine/restart', async (req, res) => {
  try {
    await engineController.restart();
    res.json({ success: true, status: engineController.getStatus() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
