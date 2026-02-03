import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socket';
import useAuth from '../hooks/useAuth';
import { useTimeSync } from './TimeSyncContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { updateTimeDrift } = useTimeSync();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketInstance = initializeSocket(token);
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
        });

        // Listen for TIME_SYNC events
        socketInstance.on('TIME_SYNC', (data) => {
          if (data.serverTime) {
            updateTimeDrift(data.serverTime);
          }
        });

        // Request initial time sync
        socketInstance.emit('REQUEST_TIME_SYNC');
      }
    } else {
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('connect_error');
        socketInstance.off('TIME_SYNC');
      }
    };
  }, [isAuthenticated, user, updateTimeDrift]);

  const joinAuction = useCallback((itemId) => {
    if (socket && isConnected) {
      socket.emit('JOIN_AUCTION', { itemId });
    }
  }, [socket, isConnected]);

  const leaveAuction = useCallback((itemId) => {
    if (socket && isConnected) {
      socket.emit('LEAVE_AUCTION', { itemId });
    }
  }, [socket, isConnected]);

  const placeBid = useCallback((itemId, amount) => {
    if (socket && isConnected) {
      socket.emit('BID_PLACED', { itemId, amount });
    }
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    joinAuction,
    leaveAuction,
    placeBid,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
