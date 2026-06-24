/**
 * Trading Strategy Module
 * Current Strategy: Camarilla Breakout
 * 
 * BUY: Price > R4
 * SELL: Price < S4
 * 
 * Returns: 'BUY', 'SELL', or 'NONE'
 */

function calculate(stockData) {
  const { ltp, r4, s4 } = stockData;

  if (r4 === 0 || s4 === 0 || ltp === 0) {
    return 'NONE';
  }

  if (ltp > r4) {
    return 'BUY';
  }

  if (ltp < s4) {
    return 'SELL';
  }

  return 'NONE';
}

module.exports = {
  calculate
};
