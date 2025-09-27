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

export const useRiderLogic = () => {
  // Initialize all modular hooks
  const { makeAuthenticatedRequest, handleApiError } = useAuthenticatedRequest();
  
  const {
    isSocketConnected,
    connectSocket,
    disconnectSocket,
    reconnectSocket,
    subscribeToRide,
    unsubscribeFromRide
  } = useSocketConnection({
    onRideUpdate: (ride) => updateRideInList(ride),
    onRideCancelled: (ride, cancelledBy, message) => handleRideCancellation(ride, cancelledBy, message),
    onRideNotification: (data) => {
      console.log('📡 Ride notification:', data);
      // Handle different notification types
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
    }
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
    setNavigationStage
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

  // Local state 
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
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

  useEffect(() => {
    // Socket connections disabled - using HTTP polling instead
  }, [driverProfile?._id, isInitialized, connectSocket, disconnectSocket]);
  
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

  /**
   * Monitor accepted ride status for patient cancellations
   */
  useEffect(() => {
    let rideStatusInterval: any = null;

    if (acceptedRide?._id && !['DROPOFF_COMPLETE', 'COMPLETED', 'CANCELLED', 'completed', 'cancelled', 'CANCELED'].includes(acceptedRide.status)) {
      const checkRideStatus = async () => {
        try {
          const response = await makeAuthenticatedRequest(`${getServerUrl()}/ride/${acceptedRide._id}`);
          
          if (response.status === 'CANCELLED' || response.status === 'cancelled' || response.status === 'CANCELED') {
            if (rideStatusInterval) {
              clearInterval(rideStatusInterval);
              rideStatusInterval = null;
            }
            
            const cancelledBy = response.cancellation?.cancelledBy || 'patient';
            const reason = response.cancellation?.cancelReason || response.cancellation?.reason || 'No reason provided';
            
            await handleRideCancellation(response, cancelledBy, reason);
            
          } else if (response.status === 'ARRIVED') {
            // Show arrival notification
            try {
              const notificationService = (await import('../utils/notificationService')).default;
              if (notificationService.isReady()) {
                const location = response.drop?.address || 'the destination';
                await notificationService.sendArrivalNotification(response._id, location);
              }
            } catch (error) {
              console.error('Failed to send arrival notification:', error);
            }
            
            // Update local ride status
            updateRideInList(response);
            
          } else if (response.status !== acceptedRide.status) {
            updateRideInList(response);
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

  /**
   * Enhanced stage completion with proper pickup verification
   */
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

  /**
   * Check authentication state
   */
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

  /**
   * Clear persisted ride data
   */
  const clearPersistedRide = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('accepted_ride');
      await AsyncStorage.removeItem('trip_started');
      await AsyncStorage.removeItem('navigation_stage');
    } catch (error) {
      console.error('Failed to clear persisted ride data:', error);
    }
  }, []);

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    fetchDriverProfile();
    fetchDriverStats();
  }, [fetchDriverProfile, fetchDriverStats]);

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