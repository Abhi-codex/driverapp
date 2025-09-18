import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Ride, RideStatus } from '../types/rider';
import { getServerUrl } from '../utils/network';
import notificationService, { RideNotification } from '../utils/notificationService';

interface SocketEvents {
  onRideUpdate?: (ride: Ride) => void;
  onRideCancelled?: (ride: Ride, cancelledBy: string, message: string) => void;
  onRideNotification?: (data: { type: string; message: string; ride?: Ride }) => void;
}

export const useSocketConnection = (events: SocketEvents = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Handle real-time ride updates
  const handleRealTimeRideUpdate = useCallback((updatedRide: Ride) => {
    console.log('Processing real-time ride update:', updatedRide);
    
    if (events.onRideUpdate) {
      events.onRideUpdate(updatedRide);
    }

    // Handle status-specific updates
    if (updatedRide.status === RideStatus.COMPLETED) {
      Alert.alert(
        'Ride Completed',
        'The ride has been marked as completed.',
        [{ text: 'OK' }]
      );
    } else if (updatedRide.status === RideStatus.CANCELLED) {
      const cancelledBy = updatedRide.cancellation?.cancelledBy || 'system';
      if (events.onRideCancelled) {
        events.onRideCancelled(updatedRide, cancelledBy, 'Ride was cancelled');
      }
    }
  }, [events]);

  // Handle ride cancellation
  const handleRideCancellation = useCallback(async (ride: Ride, cancelledBy: string, message: string) => {
    console.log('Processing ride cancellation:', { ride: ride._id, cancelledBy, message });
    
    if (events.onRideCancelled) {
      events.onRideCancelled(ride, cancelledBy, message);
    }

    // Show appropriate alert based on who cancelled
    const alertTitle = cancelledBy === 'patient' ? 'Ride Cancelled by Patient' : 'Ride Cancelled';
    const alertMessage = cancelledBy === 'patient' 
      ? 'The patient has cancelled this ride. You can now accept other ride requests.'
      : message;
    
    Alert.alert(alertTitle, alertMessage, [{ text: 'OK' }]);
  }, [events]);

  // Socket.io initialization and real-time updates
  const initializeSocket = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        console.log('No auth token found, skipping socket connection');
        return;
      }

      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
      }

      // Create new socket connection
      const serverUrl = getServerUrl().replace('/api', ''); // Remove /api for socket connection
      const newSocket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket'],
        timeout: 10000,
      });

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsSocketConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsSocketConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsSocketConnected(false);
      });

      // Ride status updates for real-time marker sync
      newSocket.on('rideStatusUpdate', (data: { ride: Ride }) => {
        console.log('⚡ Real-time ride status update:', data);
        handleRealTimeRideUpdate(data.ride);
      });

      // Real-time ride location updates for precise marker positioning
      newSocket.on('rideLocationUpdate', (data: { ride: Ride; location: { latitude: number; longitude: number } }) => {
        console.log('📍 Real-time ride location update:', data);
        if (events.onRideUpdate) {
          // Update ride with new precise location
          const updatedRide = {
            ...data.ride,
            pickup: {
              ...data.ride.pickup,
              latitude: Number(data.location.latitude.toFixed(8)),
              longitude: Number(data.location.longitude.toFixed(8))
            }
          };
          events.onRideUpdate(updatedRide);
        }
      });

      // Real-time new ride notifications with precise coordinates and push notifications
      newSocket.on('newRideAvailable', async (data: { ride: Ride }) => {
        console.log('🚨 New ride available with real-time location:', data);
        
        // Ensure precise coordinates for new rides
        const preciseRide = {
          ...data.ride,
          pickup: data.ride.pickup ? {
            ...data.ride.pickup,
            latitude: Number(data.ride.pickup.latitude.toFixed(8)),
            longitude: Number(data.ride.pickup.longitude.toFixed(8))
          } : data.ride.pickup,
          drop: data.ride.drop ? {
            ...data.ride.drop,
            latitude: Number(data.ride.drop.latitude.toFixed(8)),
            longitude: Number(data.ride.drop.longitude.toFixed(8))
          } : data.ride.drop
        };

        // Send push notification if ride is within radius
        if (preciseRide.pickup && notificationService.isReady()) {
          const isWithinRadius = notificationService.isWithinNotificationRadius(preciseRide.pickup);
          
          if (isWithinRadius) {
            const distance = notificationService.calculateDistance(
              preciseRide.pickup.latitude,
              preciseRide.pickup.longitude,
              0, 0 // Will be calculated internally with driver location
            );

            const rideNotification: RideNotification = {
              rideId: preciseRide._id,
              patientLocation: preciseRide.pickup,
              hospitalLocation: preciseRide.drop || preciseRide.pickup,
              distance: distance / 1000, // Convert to km
              urgency: 'high', // All emergency rides are high priority
              vehicle: preciseRide.vehicle,
              estimatedTime: `${Math.ceil(distance / 1000 * 2)} min` // Rough estimate
            };

            await notificationService.sendRideNotification(rideNotification);
          }
        }

        if (events.onRideUpdate) {
          events.onRideUpdate(preciseRide);
        }
      });

      // Ride cancellation by patient
      newSocket.on('rideCancelledByPatient', (data: { ride: Ride; message: string }) => {
        console.log('Ride cancelled by patient:', data);
        handleRideCancellation(data.ride, 'patient', data.message);
      });

      // General ride notifications
      newSocket.on('rideNotification', (data: { type: string; message: string; ride?: Ride }) => {
        console.log('Ride notification:', data);
        if (data.ride) {
          handleRealTimeRideUpdate(data.ride);
        }
        if (events.onRideNotification) {
          events.onRideNotification(data);
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('🔌 Failed to initialize socket:', error);
    }
  }, [socket, handleRealTimeRideUpdate, handleRideCancellation, events]);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Reconnect socket
  const reconnectSocket = useCallback(() => {
    initializeSocket();
  }, [initializeSocket]);

  // Disconnect socket
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsSocketConnected(false);
    }
  }, [socket]);

  return {
    // State
    socket,
    isSocketConnected,
    
    // Functions
    initializeSocket,
    reconnectSocket,
    disconnectSocket,
  };
};