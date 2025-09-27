import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride } from '../types/rider';
import { getServerUrl } from '../utils/network';

interface SocketEvents {
  onRideUpdate?: (ride: Ride) => void;
  onRideCancelled?: (ride: Ride, cancelledBy: string, message: string) => void;
  onRideNotification?: (data: { type: string; message: string; ride?: Ride; data?: any }) => void;
}

export const useSocketConnection = (events: SocketEvents = {}) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<any | null>(null);
  // Guard to prevent multiple concurrent connect attempts
  const connectingRef = useRef(false);
  const pendingSubscriptions = useRef<Set<string>>(new Set());

  // Connect to Socket.IO server
  const connectSocket = useCallback(async () => {
    try {
      // Prevent multiple connections or concurrent connection attempts
      if (socketRef.current || connectingRef.current) {
        console.log('📡 Socket already connected or connecting, skipping connection attempt');
        return;
      }

      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('📡 No access token found, skipping socket connection');
        return;
      }

      console.log('📡 Found access token, connecting to Socket.IO server');
      console.log('📡 Token exists:', !!token);
      console.log('📡 Token length:', token ? token.length : 0);
      console.log('📡 Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      const serverUrl = getServerUrl();
      console.log('📡 Connecting to Socket.IO server:', serverUrl);
      console.log('📡 Using auth.token and query.token for authentication');

      // mark as connecting to avoid races
      connectingRef.current = true;

      const newSocket = io(serverUrl, {
        auth: { token },
        query: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('📡 Socket.IO connected successfully');
        setIsSocketConnected(true);
        setSocket(newSocket);
        socketRef.current = newSocket;
        // connected -> no longer connecting
        connectingRef.current = false;

        // Process any pending subscriptions
        if (pendingSubscriptions.current.size > 0) {
          console.log('📡 Processing pending ride subscriptions:', Array.from(pendingSubscriptions.current));
          pendingSubscriptions.current.forEach(rideId => {
            newSocket.emit('subscribeRide', rideId);
          });
          pendingSubscriptions.current.clear();
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('📡 Socket.IO disconnected:', reason);
        setIsSocketConnected(false);
        // ensure connecting flag reset when socket disconnects
        connectingRef.current = false;
        // clear refs for safety
        socketRef.current = null;
        setSocket(null);
      });

      newSocket.on('connect_error', (error) => {
        console.error('📡 Socket.IO connection error:', error);
        console.error('📡 Error message:', (error as any).message);
        console.error('📡 Error description:', (error as any).description);
        console.error('📡 Error context:', (error as any).context);
        setIsSocketConnected(false);
        // reset connecting flag on connect error
        connectingRef.current = false;
      });

      // Ride events
      newSocket.on('rideUpdate', (data) => {
        console.log('📡 Ride update received:', JSON.stringify(data, null, 2));
        if (events.onRideUpdate && data.ride) {
          events.onRideUpdate(data.ride);
        }
      });

      newSocket.on('rideNotification', (data) => {
        console.log('📡 Ride notification received:', JSON.stringify(data, null, 2));
        if (events.onRideNotification) {
          events.onRideNotification(data);
        }
      });

      newSocket.on('rideCancelled', (data) => {
        console.log('📡 Ride cancelled received:', JSON.stringify(data, null, 2));
        if (events.onRideCancelled && data.ride) {
          events.onRideCancelled(data.ride, data.cancelledBy, data.message);
        }
      });
    } catch (error) {
      console.error('📡 Failed to initialize socket connection:', error);
      connectingRef.current = false;
    }
  }, [events]);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('📡 Disconnecting socket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsSocketConnected(false);
      connectingRef.current = false;
    }
  }, []);

  // Reconnect socket
  const reconnectSocket = useCallback(() => {
    console.log('📡 Reconnecting socket');
    disconnectSocket();
    setTimeout(() => {
      connectSocket();
    }, 1000);
  }, [connectSocket, disconnectSocket]);

  // Subscribe to ride updates
  const subscribeToRide = useCallback((rideId: string) => {
    if (socketRef.current) {
      console.log('📡 Subscribing to ride:', rideId);
      socketRef.current.emit('subscribeRide', rideId);
    } else {
      console.log('📡 Socket not connected, queuing subscription for ride:', rideId);
      pendingSubscriptions.current.add(rideId);
    }
  }, []);

  // Unsubscribe from ride updates
  const unsubscribeFromRide = useCallback((rideId: string) => {
    if (socketRef.current) {
      console.log('📡 Unsubscribing from ride:', rideId);
      socketRef.current.emit('unsubscribeRide', rideId);
    } else {
      console.log('📡 Socket not connected, removing from pending subscriptions:', rideId);
      pendingSubscriptions.current.delete(rideId);
    }
  }, []);

  // Auto-connect on mount and handle cleanup
  useEffect(() => {
    const initializeSocket = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (token && !socketRef.current) {
        console.log('📡 Initializing socket connection on app start');
        connectSocket();
      }
    };

    initializeSocket();

    return () => {
      disconnectSocket();
    };
  }, []); // Remove dependencies to prevent re-initialization

  return {
    socket,
    isSocketConnected,
    connectSocket,
    disconnectSocket,
    reconnectSocket,
    subscribeToRide,
    unsubscribeFromRide,
  };
};