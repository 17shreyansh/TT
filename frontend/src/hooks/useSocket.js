import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import { getEngineStatus } from '../api';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006';

export function useSocket() {
  const socketRef = useRef(null);
  
  const setMarketData = useStore(state => state.setMarketData);
  const setSectors = useStore(state => state.setSectors);
  const addSignal = useStore(state => state.addSignal);
  const setEngineStatus = useStore(state => state.setEngineStatus);

  useEffect(() => {
    // Fetch initial engine status
    getEngineStatus()
      .then(res => setEngineStatus(res.status))
      .catch(err => console.error('Failed to fetch initial engine status:', err));

    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to backend WebSocket');
    });

    socketRef.current.on('market_update', (data) => {
      setMarketData(data);
    });

    socketRef.current.on('sector_update', (data) => {
      setSectors(data);
    });

    socketRef.current.on('signal_update', (data) => {
      addSignal(data);
    });

    socketRef.current.on('engine_update', (status) => {
      setEngineStatus(status);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [setMarketData, setSectors, addSignal, setEngineStatus]);

  return socketRef.current;
}
