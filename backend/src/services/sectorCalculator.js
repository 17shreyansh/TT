// Sector State Map
// sectorName -> { totalStocks: N, activeSignals: M, sumChangePercent: X, stocks: Map(token -> stockData) }
let sectorMap = new Map();

function init(universe) {
  sectorMap.clear();
  if (!universe) return;

  universe.forEach(item => {
    if (!item.sector) return;

    if (!sectorMap.has(item.sector)) {
      sectorMap.set(item.sector, {
        name: item.sector,
        stocks: new Map()
      });
    }

    const sectorData = sectorMap.get(item.sector);
    // Pre-initialize stock with 0 movement so it counts towards totalStocks
    if (!sectorData.stocks.has(item.token)) {
      sectorData.stocks.set(item.token, {
        sector: item.sector,
        token: item.token,
        changePercent: 0,
        signal: null
      });
    }
  });
}

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
  init,
  updateSector,
  getSectors,
  clear
};
