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
    // Keep history of signals. Just unshift to the front.
    // Keep a maximum of 5000 signals in memory to prevent memory leaks.
    const newSignals = [signalData, ...state.signals].slice(0, 5000);
    return { signals: newSignals };
  }),
  
  setEngineStatus: (status) => set({ engineStatus: status }),

  // Computed / Selectors
  getActiveSignalsCount: () => get().signals.length,
  getTotalScanned: () => get().marketData.length,
}));

export default useStore;
