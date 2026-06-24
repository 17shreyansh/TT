const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
require('dotenv').config();

let smartApi = null;
let webSocket = null;
let feedToken = null;

async function login() {
  const { ANGEL_API_KEY, ANGEL_CLIENT_CODE, ANGEL_PASSWORD, ANGEL_TOTP_SECRET } = process.env;
  
  if (!ANGEL_API_KEY || ANGEL_API_KEY === 'your_api_key_here') {
    console.log('Angel API keys not found, please check your .env file.');
    return;
  }

  smartApi = new SmartAPI({
    api_key: ANGEL_API_KEY
  });

  try {
    const { TOTP } = require('totp-generator');
    const { otp: totp } = await TOTP.generate(ANGEL_TOTP_SECRET);

    const session = await smartApi.generateSession(ANGEL_CLIENT_CODE, ANGEL_PASSWORD, totp);
    
    if (session && session.status === false) {
      throw new Error(`SmartAPI Login Failed: ${session.message || session.errorcode}`);
    }
    
    if (session && session.data && session.data.feedToken) {
      feedToken = session.data.feedToken;
    } else if (session && session.feedToken) {
      feedToken = session.feedToken;
    }

    console.log('SmartAPI Login Success:', session.message);
  } catch (error) {
    console.error('SmartAPI Login Failed:', error);
    throw error;
  }
}

function connectWebSocket(universe, onTick) {
  if (!smartApi) return;

  const { ANGEL_CLIENT_CODE } = process.env;

  webSocket = new WebSocketV2({
    jwttoken: smartApi.access_token,
    apikey: smartApi.api_key,
    clientcode: ANGEL_CLIENT_CODE,
    feedtype: feedToken
  });

  webSocket.connect().then(() => {
    console.log('SmartAPI WebSocket Connected');
    
    // Prepare token list for subscription
    // Mode 1: LTP
    // Mode 2: Quote
    // Mode 3: SnapQuote
    
    const tokenList = universe.map(item => ({
      exchangeType: item.exchange === 'NSE' ? 1 : 2, 
      tokens: [item.token]
    }));

    const request = {
      correlationID: "scanner_dashboard",
      action: 1, // Subscribe
      params: {
        mode: 1, 
        tokenList: tokenList
      }
    };

    webSocket.fetchData(request);
  });

  webSocket.on('tick', (data) => {
    // data format depends on the mode, typically: { token, last_traded_price, ... }
    onTick(data);
  });

  webSocket.on('close', () => {
    console.log('SmartAPI WebSocket Closed');
  });

  webSocket.on('error', (err) => {
    console.error('SmartAPI WebSocket Error:', err);
  });
}

function disconnectWebSocket() {
  if (webSocket) {
    try {
      webSocket.close();
    } catch (e) {
      console.error('Handled WebSocket close error:', e.message);
    }
  }
}

async function getCandleData(params) {
  if (!smartApi) {
    throw new Error('SmartAPI not initialized');
  }
  return smartApi.getCandleData(params);
}

module.exports = {
  login,
  connectWebSocket,
  disconnectWebSocket,
  getCandleData
};
