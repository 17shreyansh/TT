// Sector State Map
// sectorName -> { totalStocks: N, activeSignals: M, sumChangePercent: X, stocks: Map(token -> stockData) }
let sectorMap = new Map();

function updateSector(stockData) {
  const { sector, token, changePercent, signal } = stockData;
  if (!sector) return;

  if (!sectorMap.has(sector)) {
    sectorMap.set(sector, {
      name: sector,
      stocks: new Map()
    });
  }

  const sectorData = sectorMap.get(sector);
  sectorData.stocks.set(token, stockData);
}

function getSectors() {
  const result = [];
  
  for (const [name, sectorData] of sectorMap.entries()) {
    let sumChange = 0;
    let activeSignalsCount = 0;
    const stocks = Array.from(sectorData.stocks.values());

    stocks.forEach(stock => {
      sumChange += stock.changePercent;
      if (stock.signal === 'BUY' || stock.signal === 'SELL') {
        activeSignalsCount++;
      }
    });

    const averageChange = stocks.length > 0 ? (sumChange / stocks.length) : 0;

    result.push({
      name,
      movementPercent: averageChange,
      totalStocks: stocks.length,
      activeSignals: activeSignalsCount
    });
  }

  // Sort by strongest sector first (highest positive movement)
  result.sort((a, b) => b.movementPercent - a.movementPercent);

  return result;
}

function clear() {
  sectorMap.clear();
}

module.exports = {
  updateSector,
  getSectors,
  clear
};
