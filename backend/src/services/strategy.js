/**
 * Trading Strategy Module
 * Current Strategy: SMA200 + R4 + S4
 * 
 * BUY: Price > SMA200 AND Price > R4
 * SELL: Price < SMA200 AND Price < S4
 * 
 * Returns: 'BUY', 'SELL', or 'NONE'
 */

function calculate(stockData) {
  const { ltp, sma200, r4, s4 } = stockData;

  if (ltp > sma200 && ltp > r4) {
    return 'BUY';
  }

  if (ltp < sma200 && ltp < s4) {
    return 'SELL';
  }

  return 'NONE';
}

module.exports = {
  calculate
};
