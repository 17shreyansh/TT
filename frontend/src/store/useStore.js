import { create } from 'zustand';

const useStore = create((set, get) => ({
  marketData: [], // Array of stock states
  sectors: [],    // Array of sector states
  signals: [],    // Filtered array of active signals
  engineStatus: 'STOPPED', // 'STOPPED' | 'RUNNING'
  
  // Setters
  setMarketData: (data) => set({ marketData: data }),
  setSectors: (data) => set({ sectors: data }),
  
  addSignal: (signalData) => set((state) => {
    // Keep only the latest signal per symbol, or add new
    const existingIndex = state.signals.findIndex(s => s.symbol === signalData.symbol);
    let newSignals = [...state.signals];
    if (existingIndex >= 0) {
      newSignals[existingIndex] = signalData;
    } else {
      newSignals.unshift(signalData); // Add to front
    }
    return { signals: newSignals };
  }),
  
  setEngineStatus: (status) => set({ engineStatus: status }),

  // Computed / Selectors
  getActiveSignalsCount: () => get().signals.length,
  getTotalScanned: () => get().marketData.length,
}));

export default useStore;
