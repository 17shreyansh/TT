require('dotenv').config();
const { SmartAPI } = require('smartapi-javascript');
const { TOTP } = require('totp-generator');
const axios = require('axios');

async function runTest() {
  const { ANGEL_API_KEY, ANGEL_CLIENT_CODE, ANGEL_PASSWORD, ANGEL_TOTP_SECRET } = process.env;

  const smartApi = new SmartAPI({
    api_key: ANGEL_API_KEY
  });

  try {
    const { otp: totp } = await TOTP.generate(ANGEL_TOTP_SECRET);

    const session = await smartApi.generateSession(ANGEL_CLIENT_CODE, ANGEL_PASSWORD, totp);
    
    if (session && session.status) {
      console.log('Login successful');
      const jwtToken = session.data.jwtToken;
      
      const commonHeaders = {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00-00-00-00-00-00',
        'X-PrivateKey': ANGEL_API_KEY
      };

      // Test Historical API
      try {
        const histData = JSON.stringify({
          "exchange": "NSE",
          "symboltoken": "3045",
          "interval": "ONE_MINUTE",
          "fromdate": "2023-09-06 09:15",
          "todate": "2023-09-06 09:20"
        });

        const histResponse = await axios({
          method: 'post',
          url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData',
          headers: commonHeaders,
          data: histData
        });
        console.log("Historical API response status:", histResponse.status, histResponse.data);
      } catch (e) {
        console.log("Historical API error:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
      }

      // Test Market Data API (Quote)
      try {
        const quoteData = JSON.stringify({
          "mode": "LTP",
          "exchangeTokens": {
            "NSE": ["3045"]
          }
        });
        const quoteResponse = await axios({
          method: 'post',
          url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/',
          headers: commonHeaders,
          data: quoteData
        });
        console.log("Live Market Data API response status:", quoteResponse.status, JSON.stringify(quoteResponse.data, null, 2));
      } catch (e) {
        console.log("Live Market Data API error:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
      }

    } else {
      console.log('Login failed', session);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

runTest();
