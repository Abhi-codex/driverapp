import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride, RideStatus, ApiResponse, RideResponse } from '../types/rider';
import { useAuthenticatedRequest } from './useAuthenticatedRequest';
import { getServerUrl } from '../utils/network';

export const useRideManagement = () => {
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
    try {
      setLoading(true);
      setError(null);
      
      const data: RideResponse = await makeAuthenticatedRequest(`${getServerUrl()}/ride/update/${rideId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (data.ride) {
        // Only show success alert for intermediate status updates, not for completion
        if (status !== RideStatus.COMPLETED) {
          Alert.alert("Success", `Ride status updated to ${status}`);
        }
        
        setAcceptedRide(data.ride);

        if (status === RideStatus.COMPLETED) {
          // Clear all ride-related state
          await completeRide();
        } else if (status === RideStatus.START) {
          setTripStarted(true);
        } else if (status === RideStatus.ARRIVED) {
          setTripStarted(true);
        }
      }

      return data.ride;
    } catch (error) {
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
    console.log('❌ Processing ride cancellation:', { ride: ride._id, cancelledBy, message });
    
    // Clear local state if this is the accepted ride
    if (acceptedRide && acceptedRide._id === ride._id) {
      await clearRideState();
      
      // Show appropriate alert based on who cancelled
      const alertTitle = cancelledBy === 'patient' ? 'Ride Cancelled by Patient' : 'Ride Cancelled';
      const alertMessage = cancelledBy === 'patient' 
        ? 'The patient has cancelled this ride. You can now accept other ride requests.'
        : message;
      
      Alert.alert(alertTitle, alertMessage, [
        { text: 'OK', onPress: () => fetchAvailableRides() }
      ]);
    }
    
    // Remove from available rides
    setAvailableRides(prev => prev.filter(r => r._id !== ride._id));
  }, [acceptedRide, fetchAvailableRides]);

  /**
   * Clear all ride-related state
   */
  const clearRideState = useCallback(async () => {
    setAcceptedRide(null);
    setTripStarted(false);
    setDestination(null);
    
    // Clear persisted data
    try {
      await AsyncStorage.removeItem('accepted_ride');
      await AsyncStorage.removeItem('trip_started');
    } catch (error) {
      console.error('Failed to clear persisted ride data:', error);
    }
  }, []);

  /**
   * Complete ride and clear state
   */
  const completeRide = useCallback(async () => {
    await clearRideState();
    
    // Refresh available rides after completion with delay to prevent re-render loops
    setTimeout(() => {
      if (!isLoadingRides.current) {
        fetchAvailableRides();
      }
    }, 500);
  }, [clearRideState, fetchAvailableRides]);

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
   * Restore ride data from AsyncStorage
   */
  const restoreRideData = useCallback(async () => {
    try {
      const [rideData, tripStartedData] = await Promise.all([
        AsyncStorage.getItem('accepted_ride'),
        AsyncStorage.getItem('trip_started')
      ]);

      if (rideData) {
        const ride = JSON.parse(rideData);
        setAcceptedRide(ride);
        
        if (ride.drop) {
          setDestination({
            latitude: ride.drop.latitude,
            longitude: ride.drop.longitude,
          });
        }
      }

      if (tripStartedData) {
        setTripStarted(JSON.parse(tripStartedData));
      }
    } catch (error) {
      console.error('Failed to restore ride data:', error);
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