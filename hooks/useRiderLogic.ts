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
    socket,
    isSocketConnected,
    reconnectSocket
  } = useSocketConnection({
    onRideUpdate: (ride) => updateRideInList(ride),
    onRideCancelled: (ride, cancelledBy, message) => handleRideCancellation(ride, cancelledBy, message),
  });

  const {
    driverProfile,
    driverStats,
    online,
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
    saveNavigationPreference
  } = useNavigation();

  const {
    availableRides,
    acceptedRide,
    tripStarted,
    loading,
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
  } = useRideManagement();

  // Local state 
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  // Additional state
  const [currentDriverLocation, setCurrentDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Enhanced driver location update with notification service integration
  const updateDriverLocation = useCallback((location: { latitude: number; longitude: number } | null) => {
    setCurrentDriverLocation(location);
    
    // Update notification service with current location for proximity calculations
    if (location && notificationService.isReady()) {
      notificationService.updateDriverLocation(location);
    }
  }, []);
  
  // Auto-refresh mechanism for real-time marker sync (enhanced from old working code)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (online && !acceptedRide) {
      console.log('Driver went online - setting up real-time ride sync');
      
      // Fetch rides immediately when going online
      fetchAvailableRides(currentDriverLocation || undefined);
      
      // Set up real-time auto-refresh every 5 seconds for accurate marker sync
      interval = setInterval(() => {
        if (online && !acceptedRide) {
          console.log('Real-time sync: Auto-refreshing available rides...');
          fetchAvailableRides(currentDriverLocation || undefined);
        }
      }, 5000); // Increased frequency from 10s to 5s for real-time feel
    } else if (!online && interval) {
      console.log('Driver went offline - clearing real-time sync');
      clearInterval(interval);
      interval = null;
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [online, acceptedRide?._id, fetchAvailableRides, currentDriverLocation]);

  /**
   * Enhanced stage completion with navigation integration
   */
  const handleStageComplete = useCallback(async (stage: 'patient_pickup' | 'hospital_arrival') => {
    if (!acceptedRide || !currentDriverLocation) {
      Alert.alert('Error', 'Missing ride or location information');
      return;
    }

    try {
      if (stage === 'patient_pickup') {
        // Update ride status to START
        await updateRideStatus(acceptedRide._id, 'START' as any);
        
        // Start navigation to hospital
        const hospitalDestination = {
          latitude: acceptedRide.drop.latitude,
          longitude: acceptedRide.drop.longitude,
        };
        
        await startNavigation(hospitalDestination, 'to_hospital', currentDriverLocation);
        
        Alert.alert('Success', 'Patient picked up! Navigating to hospital.');
        
      } else if (stage === 'hospital_arrival') {
        // Complete the ride
        await updateRideStatus(acceptedRide._id, 'COMPLETED' as any);
        
        // Clear navigation state
        stopNavigation();
        
        // Clear persisted ride data
        await clearPersistedRide();
        
        Alert.alert('Trip Completed', 'Ride has been completed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Additional cleanup to ensure dashboard state is correct
              setTripStarted(false);
              setAcceptedRide(null);
              setRouteCoords([]);
            }
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
   * Clear persisted ride data (legacy function)
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
    availableRides,
    acceptedRide,
    driverStats,
    driverProfile,
    loading,
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