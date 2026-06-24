const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { initSocket } = require('./socket/socketLayer');
const engineController = require('./engine/engineController');
const marketDataService = require('./services/marketDataService');
const smartApiService = require('./services/smartApiService');

function formatAngelDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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

app.get('/api/history/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const token = marketDataService.getTokenBySymbol(symbol);
    
    if (!token) {
      return res.status(404).json({ success: false, error: 'Symbol not found in active universe' });
    }

    const details = marketDataService.getUniverseDetails(token);
    const now = new Date();
    // Fetch last 3 days of intraday to be safe with weekends
    const fromDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); 
    
    const candleData = await smartApiService.getCandleData({
      exchange: details.exchange === 'NSE' ? 'NSE' : 'BSE',
      symboltoken: token,
      interval: 'ONE_MINUTE',
      fromdate: formatAngelDate(fromDate),
      todate: formatAngelDate(now)
    });

    if (candleData && candleData.data) {
      // Format to lightweight-charts expected array: { time, open, high, low, close }
      const formatted = candleData.data.map(c => {
        // Angel date format: "YYYY-MM-DDTHH:mm:ss+05:30"
        const dateObj = new Date(c[0]);
        // Lightweight charts requires Unix timestamp in seconds for intraday
        const timeInSeconds = Math.floor(dateObj.getTime() / 1000);
        return {
          time: timeInSeconds,
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
          volume: c[5]
        };
      });
      res.json({ success: true, data: formatted });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (err) {
    console.error('History API Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
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

const PORT = process.env.PORT || 5006;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
