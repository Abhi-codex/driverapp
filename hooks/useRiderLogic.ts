import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthenticatedRequest } from './useAuthenticatedRequest';
import { useSocketConnection } from './useSocketConnection';
import { useDriverProfile } from './useDriverProfile';
import { useNavigation } from './useNavigation';
import { useRideManagement } from './useRideManagement';
import { getServerUrl } from '../utils/network';
import notificationService from '../utils/notificationService';
import RideNotificationManager from '../utils/rideNotificationManager';

export const useRiderLogic = () => {
  // Initialize all modular hooks
  const { makeAuthenticatedRequest, handleApiError } = useAuthenticatedRequest();
  
  const rideUpdateHandlerRef = useRef<(ride: any) => void>(() => {});
  const rideCancelledHandlerRef = useRef<(ride: any, cancelledBy: string, message: string) => void>(() => {});
  const rideNotificationHandlerRef = useRef<(data: any) => void>(() => {});

  const {
    isSocketConnected,
    connectSocket,
    disconnectSocket,
    reconnectSocket,
    subscribeToRide,
    unsubscribeFromRide
  } = useSocketConnection({
    // Delegate to refs so the real handlers can be wired later
    onRideUpdate: (ride) => rideUpdateHandlerRef.current(ride),
    onRideCancelled: (ride, cancelledBy, message) => rideCancelledHandlerRef.current(ride, cancelledBy, message),
    onRideNotification: (data) => rideNotificationHandlerRef.current(data),
  });

  const {
    driverProfile,
    driverStats,
    online,
    isInitialized,
    fetchDriverProfile,
    fetchDriverStats,
    fetchDriverRideHistory,
    toggleOnline,
    updateVehicleInfo,
  } = useDriverProfile();

  const {
    isNavigating,
    navigationStage,
    currentRoute,
    navigationMode,
    destination,
    startNavigation,
    stopNavigation,
    toggleNavigationMode,
    saveNavigationPreference,
    setNavigationStage,
    routeCoords,
    setRouteCoords
  } = useNavigation();

  const {
    availableRides,
    acceptedRide,
    tripStarted,
    loading: rideLoading,
    error,
    fetchAvailableRides,
    handleAcceptRide,
    updateRideStatus,
    handleRejectRide,
    canCancelRide,
    cancelRide,
    handleRideCancellation,
    updateRideInList,
    setAcceptedRide,
    setTripStarted,
  } = useRideManagement({
    subscribeToRide,
    unsubscribeFromRide,
    stopNavigation,
  });

  // Wire the handlers from useRideManagement into the refs used by the socket hook
  useEffect(() => {
    (rideUpdateHandlerRef as any).current = (ride: any) => updateRideInList(ride);
    (rideCancelledHandlerRef as any).current = (ride: any, cancelledBy: string, message: string) => handleRideCancellation(ride, cancelledBy, message);
    (rideNotificationHandlerRef as any).current = (data: any) => {
      // Keep existing notification behavior
      switch (data.type) {
        case 'ride_accepted':
          Alert.alert('Ride Accepted', data.message);
          break;
        case 'pickup_completed':
          Alert.alert('Patient Picked Up', data.message);
          break;
        case 'dropoff_completed':
          Alert.alert('Ride Completed', data.message);
          break;
        case 'ride_cancelled_by_patient':
        case 'ride_cancelled_by_driver':
          Alert.alert('Ride Cancelled', data.message);
          break;
        default:
          Alert.alert('Ride Update', data.message);
      }
    };
  }, [updateRideInList, handleRideCancellation]);

  // Local state 
  // Additional state
  const [currentDriverLocation, setCurrentDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  // Ref to track if real-time sync is active
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Enhanced driver location update with notification service integration
  const updateDriverLocation = useCallback((location: { latitude: number; longitude: number } | null) => {
    setCurrentDriverLocation(location);
    
    // Update notification service with current location for proximity calculations
    if (location && notificationService.isReady()) {
      notificationService.updateDriverLocation(location);
    }
  }, []);

  // Track which rides we've already notified the driver about in this session
  const notifiedRidesRef = useRef<Set<string>>(new Set());
  const notificationManagerRef = useRef<any | null>(null);

  // Initialize notification service and register push token with backend (if available)
  useEffect(() => {
    let mounted = true;

    const initNotifications = async () => {
      try {
        const ok = await notificationService.initialize();
        if (!mounted) return;

        if (ok && driverProfile?._id) {
          // Notifications initialized; registration with backend happens below if needed
          console.log('Notification service initialized for driver:', driverProfile._id);
        }
      } catch (err) {
        console.warn('Notification initialization failed (continuing without remote push):', err);
      }
    };

    initNotifications();

    // initialize RideNotificationManager with AsyncStorage wrapper
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const manager = new RideNotificationManager(notificationService, {
          getItem: AsyncStorage.getItem,
          setItem: AsyncStorage.setItem,
        });
        await manager.init();
        notificationManagerRef.current = manager;
      } catch (err) {
        console.warn('Failed to initialize RideNotificationManager:', err);
      }
    })();

    return () => { mounted = false; };
  }, [driverProfile?._id]);
  // Ensure socket connects once when driver initializes and disconnects on unmount
  const socketInitializedRef = useRef(false);
  useEffect(() => {
    if (isInitialized && driverProfile?._id && !socketInitializedRef.current) {
      socketInitializedRef.current = true;
      console.log('📡 Initializing socket connection because driver is initialized');
      connectSocket();
    }
  }, [isInitialized, driverProfile?._id, connectSocket]);

  // Disconnect only when the component unmounts
  useEffect(() => {
    return () => {
      console.log('📡 useRiderLogic unmount - disconnecting socket');
      disconnectSocket();
    };
  }, [disconnectSocket]);

  // Auto-refresh mechanism for real-time ride sync
  useEffect(() => {
    if (online && !acceptedRide && !syncIntervalRef.current) {
      fetchAvailableRides(currentDriverLocation || undefined);
      
      syncIntervalRef.current = setInterval(() => {
        if (online && !acceptedRide) {
          fetchAvailableRides(currentDriverLocation || undefined);
        }
      }, 15000);
    } else if ((!online || acceptedRide) && syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [online, acceptedRide?._id]);

  useEffect(() => {
  // Monitor accepted ride for status changes (polling fallback)
    
    let rideStatusInterval: any = null;

    if (acceptedRide?._id && !['DROPOFF_COMPLETE', 'COMPLETED', 'CANCELLED', 'completed', 'cancelled', 'CANCELED'].includes(acceptedRide.status)) {
      console.log('🔍 Starting ride status monitoring for ride:', acceptedRide._id, 'current status:', acceptedRide.status);
      
      const checkRideStatus = async () => {
        try {
          const response = await makeAuthenticatedRequest(`${getServerUrl()}/ride/${acceptedRide._id}`);
          const rideFromResponse: any = response?.ride 
            ?? response?.data?.ride 
            ?? (response?.data && response.data._id ? response.data : undefined) 
            ?? (response && response._id ? response : undefined);


          if (rideFromResponse && (rideFromResponse.status === 'CANCELLED' || rideFromResponse.status === 'cancelled' || rideFromResponse.status === 'CANCELED')) {
            if (rideStatusInterval) {
              clearInterval(rideStatusInterval);
              rideStatusInterval = null;
            }
            const cancelledBy = rideFromResponse?.cancellation?.cancelledBy || 'patient';
            const reason = rideFromResponse?.cancellation?.cancelReason || rideFromResponse?.cancellation?.reason || 'No reason provided';

            await handleRideCancellation(rideFromResponse, cancelledBy, reason);
            
          } else if (rideFromResponse && rideFromResponse.status === 'ARRIVED') {
            // Show arrival notification
            try {
              const notificationService = (await import('../utils/notificationService')).default;
              if (notificationService.isReady()) {
                const location = response.ride.drop?.address || 'the destination';
                await notificationService.sendArrivalNotification(rideFromResponse._id, location);
              }
            } catch (error) {
              console.error('Failed to send arrival notification:', error);
            }
            
            // Update local ride status
            updateRideInList(rideFromResponse);
            
          } else if (rideFromResponse && rideFromResponse.status !== acceptedRide.status) {
            console.log('🔍 Ride status changed from', acceptedRide.status, 'to', rideFromResponse.status);
            updateRideInList(rideFromResponse);
          } else {
            // no-op: status unchanged
          }
        } catch (error) {
          console.error('Failed to check ride status:', error);
        }
      };
      
      // Check ride status every 10 seconds instead of 3 to reduce backend load
      rideStatusInterval = setInterval(checkRideStatus, 10000);
      checkRideStatus();
    }

    return () => {
      if (rideStatusInterval) {
        clearInterval(rideStatusInterval);
      }
    };
  }, [acceptedRide?._id, acceptedRide?.status, makeAuthenticatedRequest, handleRideCancellation, updateRideInList]);

  // Watch for new available rides and send a local notification once per ride (per app session)
  useEffect(() => {
    const run = async () => {
      try {
        const mgr = notificationManagerRef.current;
        if (!mgr) return;
        await mgr.handleAvailableRides(availableRides, currentDriverLocation);
      } catch (err) {
        console.error('Error running RideNotificationManager for available rides', err);
      }
    };
    run();
  }, [availableRides, currentDriverLocation]);
  
  const handleStageComplete = useCallback(async (stage: 'patient_pickup' | 'hospital_arrival') => {
    if (!acceptedRide || !currentDriverLocation) {
      Alert.alert('Error', 'Missing ride or location information');
      return;
    }

    try {
      if (stage === 'patient_pickup') {
        // Update ride status to PICKUP_COMPLETE (patient picked up)
        await updateRideStatus(acceptedRide._id, 'PICKUP_COMPLETE' as any);

        // Start navigation to hospital
        const hospitalDestination = {
          latitude: acceptedRide.drop.latitude,
          longitude: acceptedRide.drop.longitude,
        };

        setNavigationStage('to_hospital');
        await startNavigation(hospitalDestination, 'to_hospital', currentDriverLocation);

        Alert.alert(
          'Patient Picked Up Successfully!',
          'Navigation to the hospital has started. Please deliver the patient safely.',
          [
            {
              text: 'Continue to Hospital',
              onPress: () => {}
            }
          ]
        );
        
      } else if (stage === 'hospital_arrival') {
        await updateRideStatus(acceptedRide._id, 'DROPOFF_COMPLETE' as any);
        stopNavigation();
        
        Alert.alert('Arrived at Hospital', 'You have arrived at the hospital. Please confirm trip completion.', [
          {
            text: 'OK',
            onPress: () => {}
          }
        ]);
      }
    } catch (error) {
      console.error('Stage completion error:', error);
      handleApiError(error, `Complete ${stage}`);
    }
  }, [
    acceptedRide, 
    currentDriverLocation, 
    updateRideStatus,
    startNavigation, 
    stopNavigation, 
    handleApiError,
    setTripStarted,
    setAcceptedRide
  ]);


  const checkAuthState = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      
      if (token) {
        // Test token validity with a simple request
        await makeAuthenticatedRequest(`${getServerUrl()}/driver/profile`);
      } else {
        Alert.alert('Not Logged In', 'Please login first to see available rides');
        if (online) {
          await toggleOnline();
        }
      }
    } catch (error) {
      if (online) {
        await toggleOnline();
      }
    }
  }, [makeAuthenticatedRequest, online, toggleOnline]);

  const clearPersistedRide = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('accepted_ride');
      await AsyncStorage.removeItem('trip_started');
      await AsyncStorage.removeItem('navigation_stage');
    } catch (error) {
      console.error('Failed to clear persisted ride data:', error);
    }
  }, []);

  useEffect(() => {
    fetchDriverProfile();
    fetchDriverStats();
  }, [fetchDriverProfile, fetchDriverStats]);

  // Wire socket-provided rideNotification events into the manager as well
  useEffect(() => {
    // Replace the shallow ref handler defined earlier to also forward to manager
    const originalRef = rideNotificationHandlerRef.current;
    (rideNotificationHandlerRef as any).current = async (data: any) => {
      try {
        // Preserve existing behavior (alerts)
        originalRef(data);

        const mgr = notificationManagerRef.current;
        if (mgr) {
          await mgr.handleSocketNotification(data, currentDriverLocation);
        }
      } catch (err) {
        console.error('Error handling socket rideNotification via manager', err);
      }
    };

    return () => {
      // restore previous handler if needed
      (rideNotificationHandlerRef as any).current = originalRef;
    };
  }, [currentDriverLocation]);

  // Clean return interface without legacy code
  return {
    // State
    routeCoords,
    destination,
    tripStarted,
    online,
    isInitialized,
    availableRides,
    acceptedRide,
    driverStats,
    driverProfile,
    rideLoading,
    error,
    
    // Navigation state
    isNavigating,
    navigationStage,
    currentRoute,
    navigationMode,
    
    // Socket state
    isSocketConnected,
    
    // Actions
    handleAcceptRide,
    updateRideStatus,
    handleRejectRide,
    toggleOnline,
    checkAuthState,
    fetchDriverStats,
    fetchDriverProfile,
    fetchDriverRideHistory,
    updateVehicleInfo,
    updateDriverLocation: updateDriverLocation,
    
    // Cancel ride functions
    canCancelRide,
    cancelRide,
    
    // Navigation actions
    startNavigation,
    stopNavigation,
    handleStageComplete,
    toggleNavigationMode,
    saveNavigationPreference,
    
    // Utilities
    clearError: () => {
      console.log('Clearing errors...');
    },
    refreshData: () => {
      fetchDriverProfile();
      fetchDriverStats();
      if (online && !acceptedRide) {
        fetchAvailableRides(currentDriverLocation || undefined);
      }
    },
    
    // Socket utilities
    reconnectSocket,
    
    // Direct access to hook functions
    fetchAvailableRides: (location?: any) => fetchAvailableRides(location),
  };
};