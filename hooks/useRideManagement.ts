import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride, RideStatus, ApiResponse, RideResponse } from '../types/rider';
import { useAuthenticatedRequest } from './useAuthenticatedRequest';
import { getServerUrl } from '../utils/network';

export const useRideManagement = (socketFunctions?: {
  subscribeToRide?: (rideId: string) => void;
  unsubscribeFromRide?: (rideId: string) => void;
  stopNavigation?: () => void;
}) => {
  // Ride states
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [acceptedRide, setAcceptedRide] = useState<Ride | null>(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRides = useRef(false);

  // Get dependencies
  const { makeAuthenticatedRequest, handleApiError } = useAuthenticatedRequest();

  /**
   * Restore ride data from AsyncStorage
   */
  const restoreRideData = useCallback(async () => {
    try {
      console.log('🔄 Restoring ride data from AsyncStorage...');
      const [rideData, tripStartedData] = await Promise.all([
        AsyncStorage.getItem('accepted_ride'),
        AsyncStorage.getItem('trip_started')
      ]);

      if (rideData) {
        const ride = JSON.parse(rideData);
        console.log('✅ Restored accepted ride:', ride._id);
        setAcceptedRide(ride);
        
        if (ride.drop) {
          setDestination({
            latitude: ride.drop.latitude,
            longitude: ride.drop.longitude,
          });
          console.log('✅ Restored destination from ride');
        }
      } else {
        console.log('ℹ️ No accepted ride found in storage');
      }

      if (tripStartedData) {
        const tripStartedStatus = JSON.parse(tripStartedData);
        setTripStarted(tripStartedStatus);
        console.log('✅ Restored trip status:', tripStartedStatus);
      }
    } catch (error) {
      console.error('❌ Failed to restore ride data:', error);
    }
  }, []);

  // Initialize ride data from AsyncStorage on mount
  useEffect(() => {
    const initializeRideData = async () => {
      console.log('🔄 Initializing ride management hook...');
      await restoreRideData();
    };
    
    initializeRideData();
  }, [restoreRideData]); // Run once on mount

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  /**
   * Fetch available rides from the backend with optional location filtering
   */
  const fetchAvailableRides = useCallback(async (
    currentDriverLocation?: { latitude: number; longitude: number }
  ) => {
    if (isLoadingRides.current) {
      console.log('Already loading rides, skipping fetch');
      return;
    }

    try {
      isLoadingRides.current = true;
      setError(null);
      
      console.log('Fetching available rides...');
      console.log('Driver location for filtering:', currentDriverLocation);
      
      const data: RideResponse = await makeAuthenticatedRequest(
        `${getServerUrl()}/ride/driverrides`
      );
      
      if (data.rides && Array.isArray(data.rides)) {
        const searchingRides = data.rides.filter((ride: Ride) => ride.status === RideStatus.SEARCHING);
        console.log(`Received ${data.rides.length} total rides, ${searchingRides.length} searching rides`);

        // Filter by 10km radius if currentDriverLocation is available, and skip invalid coordinates
        let filteredRides = searchingRides;
        if (currentDriverLocation && 
            typeof currentDriverLocation.latitude === 'number' && 
            typeof currentDriverLocation.longitude === 'number') {
          
          filteredRides = searchingRides.filter(ride => {
            // Validate ride coordinates - using old working validation logic
            if (!ride.pickup ||
                typeof ride.pickup.latitude !== 'number' ||
                typeof ride.pickup.longitude !== 'number' ||
                Math.abs(ride.pickup.latitude) > 90 ||
                Math.abs(ride.pickup.longitude) > 180 ||
                ride.pickup.latitude === 0 ||
                ride.pickup.longitude === 0) {
              console.log('Skipping ride with invalid coordinates:', ride._id);
              return false;
            }

            try {
              const distance = calculateDistance(
                currentDriverLocation.latitude,
                currentDriverLocation.longitude,
                ride.pickup.latitude,
                ride.pickup.longitude
              );
              const isWithinRadius = distance <= 10;
              
              if (!isWithinRadius) {
                console.log(`Ride ${ride._id} filtered out - ${distance.toFixed(2)}km away`);
              }
              
              return isWithinRadius;
            } catch (error) {
              console.error('Error calculating distance for ride:', ride._id, error);
              return false;
            }
          });

          console.log(`Filtered to ${filteredRides.length} rides within 10km radius`);
        }

        setAvailableRides(filteredRides);
      } else {
        console.log('No rides data received');
        setAvailableRides([]);
      }
    } catch (error) {
      console.error('Error fetching available rides:', error);
      handleApiError(error, 'Fetch available rides');
      setAvailableRides([]);
    } finally {
      isLoadingRides.current = false;
    }
  }, [makeAuthenticatedRequest, handleApiError, calculateDistance]);

  /**
   * Accept a ride request
   */
  const handleAcceptRide = useCallback(async (
    rideId: string, 
    driverLocation?: { latitude: number; longitude: number },
    onRouteCalculated?: (origin: any, destination: any) => Promise<void>
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const data: RideResponse = await makeAuthenticatedRequest(`${getServerUrl()}/ride/accept/${rideId}`, {
        method: 'PATCH',
      });
      
      if (data.ride) {
        Alert.alert("Success", "Emergency call accepted successfully!");
        setAcceptedRide(data.ride);
        setAvailableRides([]);
        setTripStarted(false);
        
        // Subscribe to ride updates via Socket.IO
        if (socketFunctions?.subscribeToRide) {
          socketFunctions.subscribeToRide(data.ride._id);
        }
        
        // Persist the accepted ride to storage
        await persistRide(data.ride, false);
        
        const dropLocation = {
          latitude: data.ride.drop.latitude,
          longitude: data.ride.drop.longitude,
        };
        setDestination(dropLocation);
        
        // Calculate route if driver location and callback provided
        if (driverLocation && onRouteCalculated) {
          await onRouteCalculated(driverLocation, dropLocation);
        }
      }
      
      return data.ride;
    } catch (error) {
      handleApiError(error, 'Accept ride');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  /**
   * Update ride status (START, ARRIVED, COMPLETED, etc.)
   */
  const updateRideStatus = useCallback(async (rideId: string, status: RideStatus) => {
    console.log('🚀 updateRideStatus called with:', { rideId, status });
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Updating ride ${rideId} status to: ${status}`);
      
      const data: RideResponse = await makeAuthenticatedRequest(`${getServerUrl()}/ride/update/${rideId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      console.log('📡 Network request completed, response:', data);

      if (data.ride) {
        console.log(`✅ Ride status updated successfully to: ${status}`);
        console.log(`📊 Ride data received:`, { id: data.ride._id, status: data.ride.status });
        
        // Only show success alert for intermediate status updates, not for completion
        if (status !== RideStatus.COMPLETED) {
          Alert.alert("Success", `Ride status updated to ${status}`);
        }
        
        setAcceptedRide(data.ride);

        if (status === RideStatus.COMPLETED) {
          console.log('🎯 Status is COMPLETED, calling completeRide()');
          // Clear all ride-related state
          await completeRide();
        } else if (status === RideStatus.START) {
          setTripStarted(true);
          // Persist updated ride and trip status
          await persistRide(data.ride, true);
        } else if (status === RideStatus.ARRIVED) {
          setTripStarted(true);
          // Persist updated ride and trip status
          await persistRide(data.ride, true);
        } else {
          // Persist updated ride with current trip status
          await persistRide(data.ride, tripStarted);
        }
      }

      return data.ride;
    } catch (error) {
      console.error(`❌ Failed to update ride status to ${status}:`, error);
      handleApiError(error, 'Update ride status');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  /**
   * Reject a ride request (local only, no API call)
   */
  const handleRejectRide = useCallback((rideId: string) => {
    setAvailableRides(prev => prev.filter(r => r._id !== rideId));
    // Optionally, you could call an API endpoint to notify backend about rejection
  }, []);

  /**
   * Check if a ride can be cancelled and get cancellation details
   */
  const canCancelRide = useCallback(async (rideId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data: ApiResponse<{
        canCancel: boolean;
        cancellationFee: number;
        message: string;
      }> = await makeAuthenticatedRequest(
        `${getServerUrl()}/ride/${rideId}/can-cancel`
      );
      
      return data.data;
    } catch (error) {
      handleApiError(error, 'Check cancellation eligibility');
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  /**
   * Cancel a ride with reason
   */
  const cancelRide = useCallback(async (rideId: string, reason: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const data: ApiResponse<{ ride: Ride }> = await makeAuthenticatedRequest(
        `${getServerUrl()}/ride/${rideId}/cancel`,
        {
          method: 'PUT',
          body: JSON.stringify({ reason }),
        }
      );
      
      if (data.data?.ride) {
        // Update local state if this is the accepted ride
        if (acceptedRide && acceptedRide._id === rideId) {
          await clearRideState();
          
          Alert.alert(
            'Ride Cancelled', 
            'The ride has been cancelled successfully. The patient has been notified.',
            [{ text: 'OK', onPress: () => fetchAvailableRides() }]
          );
        }
      }
    } catch (error) {
      handleApiError(error, 'Cancel ride');
      throw error; // Re-throw to allow UI error handling
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError, acceptedRide, fetchAvailableRides]);

  /**
   * Handle ride cancellation from real-time updates
   */
  const handleRideCancellation = useCallback(async (
    ride: Ride, 
    cancelledBy: string, 
    message: string
  ) => {
    console.log('🚨 ========= RIDE CANCELLATION HANDLER CALLED =========');
    console.log('❌ Processing ride cancellation:', { 
      rideId: ride._id, 
      cancelledBy, 
      message,
      currentAcceptedRide: acceptedRide?._id 
    });
    
    // Clear local state if this is the accepted ride
    if (acceptedRide && acceptedRide._id === ride._id) {
      console.log('✅ This is the accepted ride - processing cancellation');
      
      // Unsubscribe from ride updates
      if (socketFunctions?.unsubscribeFromRide) {
        socketFunctions.unsubscribeFromRide(ride._id);
      }
      
      // Send immediate push notification if app is in background
      try {
        console.log('🔔 Attempting to send cancellation notification...');
        const notificationService = (await import('../utils/notificationService')).default;
        console.log('🔔 Notification service imported, ready:', notificationService.isReady());
        
        if (notificationService.isReady()) {
          await notificationService.sendCancellationNotification(
            ride._id,
            cancelledBy,
            message
          );
          console.log('🔔 Cancellation notification sent successfully');
        } else {
          console.warn('🔔 Notification service not ready');
        }
      } catch (error) {
        console.error('❌ Failed to send cancellation notification:', error);
      }
      
      console.log('🧹 Clearing ride state...');
      await clearRideState();
      
      // Enhanced alert with more details and actions
      const alertTitle = cancelledBy === 'patient' ? '🚫 Ride Cancelled by Patient' : '❌ Ride Cancelled';
      const alertMessage = cancelledBy === 'patient' 
        ? `The patient has cancelled this emergency ride.\n\nReason: ${message}\n\nYou can now accept other ride requests.`
        : `Ride has been cancelled.\n\nReason: ${message}`;
      
      console.log('🚨 Showing cancellation alert:', { alertTitle, alertMessage });
      Alert.alert(
        alertTitle, 
        alertMessage, 
        [
          { 
            text: 'View Available Rides', 
            onPress: () => {
              console.log('👤 User chose to view available rides');
              fetchAvailableRides();
            }
          },
          { 
            text: 'OK', 
            style: 'default',
            onPress: () => {
              console.log('👤 User acknowledged cancellation');
            }
          }
        ]
      );
    } else {
      console.log('ℹ️ This is not the accepted ride - just removing from available rides list');
    }
    
    // Remove from available rides
    console.log('🗑️ Removing ride from available rides list');
    setAvailableRides(prev => prev.filter(r => r._id !== ride._id));
    console.log('🚨 ========= RIDE CANCELLATION HANDLER COMPLETED =========');
  }, [acceptedRide, fetchAvailableRides]);

  /**
   * Clear all ride-related state
   */
  const clearRideState = useCallback(async () => {
    console.log('🧹 Clearing ride state...');
    setAcceptedRide(null);
    setTripStarted(false);
    setDestination(null);
    
    // Clear persisted data
    try {
      await AsyncStorage.removeItem('accepted_ride');
      await AsyncStorage.removeItem('trip_started');
      console.log('🧹 Cleared persisted ride data from AsyncStorage');
    } catch (error) {
      console.error('Failed to clear persisted ride data:', error);
    }
  }, []);

  /**
   * Complete ride and clear state
   */
  const completeRide = useCallback(async () => {
    console.log('🎯 completeRide() called - starting ride completion process');
    // Unsubscribe from ride updates before clearing state
    if (socketFunctions?.unsubscribeFromRide && acceptedRide?._id) {
      console.log('📡 Unsubscribing from ride:', acceptedRide._id);
      socketFunctions.unsubscribeFromRide(acceptedRide._id);
    }

    // Stop navigation if active
    if (socketFunctions?.stopNavigation) {
      console.log('🧭 Stopping navigation');
      socketFunctions.stopNavigation();
    }

    console.log('🧹 Clearing ride state');
    await clearRideState();
    console.log('✅ Ride completion process finished');
    
    // Refresh available rides after completion with delay to prevent re-render loops
    setTimeout(() => {
      if (!isLoadingRides.current) {
        fetchAvailableRides();
      }
    }, 500);
  }, [socketFunctions, clearRideState, fetchAvailableRides]);

  /**
   * Persist ride data to AsyncStorage
   */
  const persistRide = useCallback(async (ride: Ride, tripStarted: boolean) => {
    try {
      await AsyncStorage.setItem('accepted_ride', JSON.stringify(ride));
      await AsyncStorage.setItem('trip_started', JSON.stringify(tripStarted));
    } catch (error) {
      console.error('Failed to persist ride data:', error);
    }
  }, []);

  /**
   * Update ride list with real-time changes
   */
  const updateRideInList = useCallback((updatedRide: Ride) => {
    setAvailableRides(prev => {
      const existingIndex = prev.findIndex(r => r._id === updatedRide._id);
      
      if (existingIndex >= 0) {
        // Update existing ride
        const updated = [...prev];
        updated[existingIndex] = updatedRide;
        return updated;
      } else {
        // Add new ride if it doesn't exist
        return [...prev, updatedRide];
      }
    });

    // If this is the accepted ride, update it
    if (acceptedRide && acceptedRide._id === updatedRide._id) {
      setAcceptedRide(updatedRide);
      // Persist the updated accepted ride
      persistRide(updatedRide, tripStarted);
    }
  }, [acceptedRide]);

  /**
   * Remove ride from list (for completed/cancelled rides)
   */
  const removeRideFromList = useCallback((rideId: string) => {
    setAvailableRides(prev => prev.filter(r => r._id !== rideId));
  }, []);

  return {
    // State
    availableRides,
    acceptedRide,
    tripStarted,
    destination,
    loading,
    error,

    // Ride operations
    fetchAvailableRides,
    handleAcceptRide,
    updateRideStatus,
    handleRejectRide,
    canCancelRide,
    cancelRide,
    handleRideCancellation,

    // State management
    clearRideState,
    completeRide,
    persistRide,
    restoreRideData,

    // Real-time updates
    updateRideInList,
    removeRideFromList,

    // Setters for external updates
    setAcceptedRide,
    setTripStarted,
    setDestination,
    setAvailableRides,
  };
};