import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  
  const setMarketData = useStore(state => state.setMarketData);
  const setSectors = useStore(state => state.setSectors);
  const addSignal = useStore(state => state.addSignal);
  const setEngineStatus = useStore(state => state.setEngineStatus);

  useEffect(() => {
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
