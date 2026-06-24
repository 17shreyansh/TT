const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
// Depending on smartapi-javascript version, constants might be exported directly or under specific objects
// We will require them from the config directly if needed, but they are usually exported by the main package.
let constants;
try {
  constants = require('smartapi-javascript/config/constant');
} catch (e) {
  // fallback
}
const ACTION = constants ? constants.ACTION : { Subscribe: 1 };
const MODE = constants ? constants.MODE : { LTP: 1 };
const EXCHANGES = constants ? constants.EXCHANGES : { nse_cm: 1, bse_cm: 3 };

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
    
    const nseTokens = universe.filter(i => i.exchange === 'NSE').map(i => String(i.token));
    const bseTokens = universe.filter(i => i.exchange === 'BSE').map(i => String(i.token));

    const CHUNK_SIZE = 50;

    const subscribeTokens = async (tokens, exchangeType, prefix) => {
      for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        const chunk = tokens.slice(i, i + CHUNK_SIZE);
        webSocket.fetchData({
          correlationID: `${prefix}_${i}`,
          action: ACTION.Subscribe,
          params: {
            mode: MODE.LTP,
            tokenList: [
              {
                exchangeType: exchangeType,
                tokens: chunk
              }
            ]
          }
        });
        // Wait 200ms between subscriptions to avoid AngelOne WebSocket rate limits
        await new Promise(r => setTimeout(r, 200));
      }
    };

    if (nseTokens.length > 0) {
      subscribeTokens(nseTokens, EXCHANGES.nse_cm, 'scanner_dashboard_nse').catch(console.error);
    }

    if (bseTokens.length > 0) {
      subscribeTokens(bseTokens, EXCHANGES.bse_cm, 'scanner_dashboard_bse').catch(console.error);
    }
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
