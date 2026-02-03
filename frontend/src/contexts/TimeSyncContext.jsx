import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const TimeSyncContext = createContext();

export const useTimeSync = () => {
  const context = useContext(TimeSyncContext);
  if (!context) {
    throw new Error('useTimeSync must be used within a TimeSyncProvider');
  }
  return context;
};

export const TimeSyncProvider = ({ children }) => {
  const [timeDrift, setTimeDrift] = useState(0);
  const [isSyncing, setIsSyncing] = useState(true);

  // Fetch server time on mount
  useEffect(() => {
    const syncTime = async () => {
      try {
        const clientTime = Date.now();
        const response = await api.get('/api/time');
        const serverTime = response.data.data.serverTime;
        
        const drift = serverTime - clientTime;
        setTimeDrift(drift);
        setIsSyncing(false);
      } catch (error) {
        console.error('Failed to sync time:', error);
        setIsSyncing(false);
      }
    };

    syncTime();
  }, []);

  // Update time drift from WebSocket TIME_SYNC events
  const updateTimeDrift = (serverTime) => {
    const clientTime = Date.now();
    const drift = serverTime - clientTime;
    setTimeDrift(drift);
  };

  const value = {
    timeDrift,
    isSyncing,
    updateTimeDrift,
  };

  return (
    <TimeSyncContext.Provider value={value}>
      {children}
    </TimeSyncContext.Provider>
  );
};
