import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiResponse, Driver, DriverStats, Ride, RideResponse, RideStatus } from '../types/rider';
import { getServerUrl } from '../utils/network';
import NavigationService, { RouteInfo } from '../utils/navigationService';

export const useRiderLogic = () => {
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [online, setOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [acceptedRide, setAcceptedRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store current driver location in the hook
  const [currentDriverLocation, setCurrentDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Navigation states
  const [navigationService] = useState(() => NavigationService.getInstance());
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStage, setNavigationStage] = useState<'idle' | 'to_patient' | 'to_hospital'>('idle');
  
  // Driver statistics and profile data with proper types
  const [driverStats, setDriverStats] = useState<DriverStats>({
    totalRides: 0,
    todayRides: 0,
    todayEarnings: 0,
    weeklyRides: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    rating: 0
  });
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);

  // Auto-refresh intervals
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  // Use ref to track loading state to avoid circular dependencies
  const isLoadingRides = useRef(false);
  const onlineStatusSet = useRef(false);

  useEffect(() => {
    fetchDriverProfile();
    fetchDriverStats();
    loadPersistedRide(); 
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (online && !acceptedRide) {
      // Only fetch if we're not already loading and don't have an interval running
      if (!isLoadingRides.current && !refreshInterval) {
        // Fetch rides first
        fetchAvailableRides();
        
        // Update online status only if not already set
        if (!onlineStatusSet.current) {
          updateOnlineStatus(true);
          onlineStatusSet.current = true;
        }
        
        // Set up auto-refresh for available rides every 10 seconds
        const interval = setInterval(() => {
          if (online && !acceptedRide && !isLoadingRides.current) {
            fetchAvailableRides();
          }
        }, 10000);
        
        setRefreshInterval(interval);
        
        // Return cleanup function for this branch
        cleanup = () => {
          clearInterval(interval);
        };
      }
    } else if (!online && onlineStatusSet.current) {
      // Update online status
      updateOnlineStatus(false);
      onlineStatusSet.current = false;
      
      // Clear interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
    
    // Return the cleanup function
    return cleanup;
  }, [online, acceptedRide?._id]); // Use acceptedRide?._id instead of acceptedRide object to prevent object reference changes

  const handleApiError = useCallback((error: any, context: string) => {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      setError('Connection failed. Check your network and server.');
      Alert.alert(
        'Connection Error', 
        'Cannot connect to server. Please check your network connection.'
      );
    } else if (error.message?.includes('401')) {
      setError('Authentication failed. Please login again.');
      Alert.alert('Authentication Error', 'Please login again');
    } else {
      setError(`${context} failed`);
      Alert.alert('Error', `${context} failed. Please try again.`);
    }
  }, []);

  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}, timeout: number = 10000) => {
    // Get access token for authentication
    const token = await AsyncStorage.getItem("access_token");
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          await refreshAuthToken();
          throw new Error('Authentication failed');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle specific network errors
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - server may be starting up');
      }
      
      if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        throw new Error('Network error - server may be unavailable');
      }
      
      throw error;
    }
  }, []);

  const refreshAuthToken = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await fetch(`${getServerUrl()}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem("access_token", data.access_token);
        await AsyncStorage.setItem("refresh_token", data.refresh_token);
        return true;
      }
    } catch (error) {
      Alert.alert('Session Expired', 'Please login again');
    }
    return false;
  }, []);

  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    try {
      console.log(`🔄 Updating online status to: ${isOnline}`);
      
      await makeAuthenticatedRequest(`${getServerUrl()}/driver/online-status`, {
        method: 'PUT',
        body: JSON.stringify({ isOnline }),
      });
      
      console.log('✅ Online status updated successfully');
      
      // Update local profile state using functional update to avoid dependency
      setDriverProfile(prevProfile => {
        if (prevProfile) {
          return { ...prevProfile, isOnline };
        }
        return prevProfile;
      });
    } catch (error) {
      console.error('❌ Failed to update online status:', error);
      handleApiError(error, 'Update online status');
    }
  }, [makeAuthenticatedRequest, handleApiError]); // Remove driverProfile dependency

  // Helper to calculate distance between two lat/lng points in km
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Accept driverLocation as a dependency and use it for filtering
  const fetchAvailableRides = useCallback(async () => {
    if (isLoadingRides.current) {
      return;
    }
    try {
      isLoadingRides.current = true;
      setError(null);
      // Reduced logging frequency
      // console.log('🔄 Fetching available rides...');

      const data: RideResponse = await makeAuthenticatedRequest(`${getServerUrl()}/ride/driverrides`);

      if (data.rides && Array.isArray(data.rides)) {
        const searchingRides = data.rides.filter((ride: Ride) => ride.status === RideStatus.SEARCHING);
        // console.log(`📋 Found ${searchingRides.length} searching rides`);

        // Filter by 10km radius if currentDriverLocation is available, and skip invalid coordinates
        let filteredRides = searchingRides;
        // console.log('📍 Driver location for filtering:', currentDriverLocation);
        if (currentDriverLocation && typeof currentDriverLocation.latitude === 'number' && typeof currentDriverLocation.longitude === 'number') {
          filteredRides = searchingRides.filter((ride: Ride) => {
            if (!ride.pickup ||
                typeof ride.pickup.latitude !== 'number' ||
                typeof ride.pickup.longitude !== 'number' ||
                // skip if coordinates are 0 or out of valid range
                Math.abs(ride.pickup.latitude) > 90 ||
                Math.abs(ride.pickup.longitude) > 180 ||
                ride.pickup.latitude === 0 ||
                ride.pickup.longitude === 0
            ) {
              console.warn('⚠️ Skipping ride due to invalid pickup coordinates:', ride._id);
              return false;
            }
            const dist = getDistanceFromLatLonInKm(
              currentDriverLocation.latitude,
              currentDriverLocation.longitude,
              ride.pickup.latitude,
              ride.pickup.longitude
            );
            // console.log(`📏 Distance to ride ${ride._id}: ${dist.toFixed(2)}km`);
            if (dist > 10) {
              // Optionally log rides out of range for debugging
              // console.info('Ride out of 10km range:', ride, 'Distance:', dist);
            }
            return dist <= 10;
          });
        }
        // console.log(`✅ Filtered rides (within 10km): ${filteredRides.length}`);
        setAvailableRides(filteredRides);
      } else {
        // console.log('📋 No rides data received');
        setAvailableRides([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch available rides:', error);
      handleApiError(error, 'Fetch available rides');
      setAvailableRides([]);
    } finally {
      isLoadingRides.current = false;
    }
  }, [makeAuthenticatedRequest, handleApiError]); // Remove currentDriverLocation from dependencies

  const decodePolyline = (t: string) => {
    let points = [], index = 0, lat = 0, lng = 0;
    while (index < t.length) {
      let b, shift = 0, result = 0;
      do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; }
      while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = result = 0;
      do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; }
      while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const fetchRoute = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not configured, using straight line route');
        const coords = [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ];
        setRouteCoords(coords);
        return;
      }
      
      const directionsUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
      
      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude
            }
          }
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        polylineQuality: 'HIGH_QUALITY',
        polylineEncoding: 'ENCODED_POLYLINE'
      };
      
      console.log('Fetching driver route from new Routes API:', directionsUrl);
      
      const response = await fetch(directionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      console.log('Driver Routes API response:', data);
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        if (route.polyline && route.polyline.encodedPolyline) {
          console.log('Decoding driver route polyline with', route.polyline.encodedPolyline.length, 'characters');
          const points = decodePolyline(route.polyline.encodedPolyline);
          console.log('Decoded', points.length, 'driver route points');
          setRouteCoords(points);
        } else {
          console.warn('No polyline in driver route, using fallback');
          const coords = [
            { latitude: origin.latitude, longitude: origin.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ];
          setRouteCoords(coords);
        }
      } else {
        console.error('Driver Routes API error:', data.error || 'No routes found');
        // Fallback to simple straight line route
        const coords = [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ];
        setRouteCoords(coords);
      }
    } catch (error) {
      console.error('Error fetching driver route:', error);
      Alert.alert('Navigation Error', 'Could not fetch route. Using direct path.');
      // Fallback to simple straight line route
      const coords = [
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ];
      setRouteCoords(coords);
    }
  };

  const fetchDriverStats = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Fetching driver stats...');
      
      const data: ApiResponse<DriverStats> = await makeAuthenticatedRequest(`${getServerUrl()}/driver/stats`);
      
      if (data.data) {
        setDriverStats(data.data);
        console.log('✅ Driver stats fetched successfully:', data.data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch driver stats:', error);
      
      // Don't show error alerts for server startup issues
      const errorMessage = error.message || '';
      if (errorMessage.includes('timeout') || errorMessage.includes('starting up') || errorMessage.includes('unavailable')) {
        console.log('📡 Server may be starting up, will retry later...');
        setError('Server connecting...');
        // Don't call handleApiError for these cases
      } else {
        handleApiError(error, 'Fetch driver statistics');
      }
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  const fetchDriverProfile = useCallback(async () => {
    try {
      setError(null);
      const data: ApiResponse<Driver> = await makeAuthenticatedRequest(`${getServerUrl()}/driver/profile`);
      
      if (data.data) {
        setDriverProfile(data.data);
        // Only sync online state if it's different to prevent re-render loops
        const backendOnlineStatus = data.data.isOnline;
        setOnline(prevOnline => {
          if (prevOnline !== backendOnlineStatus) {
            return backendOnlineStatus;
          }
          return prevOnline;
        });
      }
    } catch (error) {
      handleApiError(error, 'Fetch driver profile');
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  const handleAcceptRide = useCallback(async (rideId: string, driverLocation: any) => {
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
        
        if (driverLocation) {
          await fetchRoute(driverLocation, dropLocation);
        }
        
        // Refresh stats after accepting a ride
        fetchDriverStats();
      }
    } catch (error) {
      handleApiError(error, 'Accept ride');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError, fetchDriverStats]);

  const updateRideStatus = useCallback(async (rideId: string, status: RideStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      const data: RideResponse = await makeAuthenticatedRequest(`${getServerUrl()}/ride/update/${rideId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (data.ride) {
        Alert.alert("Success", `Ride status updated to ${status}`);
        setAcceptedRide(data.ride);

        if (status === RideStatus.COMPLETED) {
          setAcceptedRide(null);
          setDestination(null);
          setRouteCoords([]);
          setTripStarted(false);
          
          // Refresh everything after completion with delay to prevent re-render loops
          setTimeout(() => {
            if (!isLoadingRides.current) {
              fetchAvailableRides();
            }
          }, 500);
          fetchDriverStats();
        } else if (status === RideStatus.START) {
          setTripStarted(true);
        } else if (status === RideStatus.ARRIVED) {
          setTripStarted(true);
        }
      }
    } catch (error) {
      handleApiError(error, 'Update ride status');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError, fetchDriverStats]);

  const handleRejectRide = useCallback((rideId: string) => {
    setAvailableRides(prev => prev.filter(r => r._id !== rideId));
    // Optionally, you could call an API endpoint to notify backend about rejection
  }, []);

  const checkAuthState = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      
      if (token) {
        // Test token validity with a simple request
        await makeAuthenticatedRequest(`${getServerUrl()}/driver/profile`);
      } else {
        Alert.alert('Not Logged In', 'Please login first to see available rides');
        // Use functional update to prevent dependency issues
        setOnline(prevOnline => prevOnline ? false : prevOnline);
      }
    } catch (error) {
      // Use functional update to prevent dependency issues
      setOnline(prevOnline => prevOnline ? false : prevOnline);
    }
  }, [makeAuthenticatedRequest]);

  const toggleOnline = useCallback(async () => {
    const newOnlineState = !online;
    
    try {
      // Update backend first
      await updateOnlineStatus(newOnlineState);
      
      // Update local state only if backend update succeeds
      setOnline(newOnlineState);
      
      if (newOnlineState) {
        // Check auth state after going online
        try {
          const token = await AsyncStorage.getItem("access_token");
          if (token) {
            await makeAuthenticatedRequest(`${getServerUrl()}/driver/profile`);
          }
        } catch (error) {
          console.warn('Auth check failed after going online:', error);
        }
      }
    } catch (error) {
      // If backend update fails, don't change local state
      console.error('Failed to update online status:', error);
      handleApiError(error, 'Update online status');
    }
  }, [online, updateOnlineStatus, makeAuthenticatedRequest, handleApiError]);

  // Add method to get driver's ride history
  const fetchDriverRideHistory = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await makeAuthenticatedRequest(
        `${getServerUrl()}/driver/rides?page=${page}&limit=${limit}`
      );
      
      return data;
    } catch (error) {
      handleApiError(error, 'Fetch ride history');
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  // Add method to update vehicle information
  const updateVehicleInfo = useCallback(async (vehicleData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const data: ApiResponse<{ vehicle: any }> = await makeAuthenticatedRequest(
        `${getServerUrl()}/driver/vehicle`, 
        {
          method: 'PUT',
          body: JSON.stringify(vehicleData),
        }
      );
      
      if (data.data && driverProfile) {
        setDriverProfile({
          ...driverProfile,
          vehicle: data.data.vehicle
        });
        Alert.alert('Success', 'Vehicle information updated successfully');
      }
    } catch (error) {
      handleApiError(error, 'Update vehicle information');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError, driverProfile]);

  // Ride persistence functions
  const persistRide = useCallback(async (ride: Ride, started: boolean = false) => {
    try {
      await AsyncStorage.setItem('accepted_ride', JSON.stringify(ride));
      await AsyncStorage.setItem('trip_started', JSON.stringify(started));
      console.log('✅ Ride persisted to storage');
    } catch (error) {
      console.error('❌ Failed to persist ride:', error);
    }
  }, []);

  const loadPersistedRide = useCallback(async () => {
    try {
      const rideData = await AsyncStorage.getItem('accepted_ride');
      const tripData = await AsyncStorage.getItem('trip_started');
      
      if (rideData) {
        const ride = JSON.parse(rideData);
        const started = tripData ? JSON.parse(tripData) : false;
        
        setAcceptedRide(ride);
        setTripStarted(started);
        console.log('✅ Loaded persisted ride:', ride._id);
      }
    } catch (error) {
      console.error('❌ Failed to load persisted ride:', error);
    }
  }, []);

  const clearPersistedRide = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('accepted_ride');
      await AsyncStorage.removeItem('trip_started');
      console.log('✅ Cleared persisted ride');
    } catch (error) {
      console.error('❌ Failed to clear persisted ride:', error);
    }
  }, []);

  // Navigation functions
  const startNavigation = useCallback(async (
    destination: { latitude: number; longitude: number },
    stage: 'to_patient' | 'to_hospital'
  ) => {
    if (!currentDriverLocation) {
      throw new Error('Driver location not available');
    }

    try {
      setLoading(true);
      setNavigationStage(stage);
      
      // Calculate route and get polyline coordinates
      const routeInfo = await navigationService.startEmergencyNavigation(
        acceptedRide!,
        currentDriverLocation,
        stage
      );

      // Decode polyline and set route coordinates for map display
      const coords = decodePolyline(routeInfo.polyline);
      setRouteCoords(coords);
      setDestination(destination);
      setCurrentRoute(routeInfo);
      setIsNavigating(true);

      return routeInfo;
    } catch (error) {
      console.error('Navigation start error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentDriverLocation, acceptedRide, navigationService]);

  const stopNavigation = useCallback(() => {
    navigationService.stopNavigation();
    setIsNavigating(false);
    setNavigationStage('idle');
    setCurrentRoute(null);
    setRouteCoords([]);
    setDestination(null);
  }, [navigationService]);

  const handleStageComplete = useCallback(async (stage: 'pickup' | 'dropoff') => {
    try {
      if (stage === 'pickup' && acceptedRide) {
        // Update ride status to 'START' and start trip
        await updateRideStatus(acceptedRide._id, RideStatus.START);
        setTripStarted(true);
        setNavigationStage('to_hospital');
        
        // Persist the updated trip state
        await persistRide(acceptedRide, true);
        
        // Auto-start navigation to hospital if driver location is available
        if (currentDriverLocation && acceptedRide.drop) {
          await startNavigation(acceptedRide.drop, 'to_hospital');
        }
      } else if (stage === 'dropoff' && acceptedRide) {
        // Complete the ride
        await updateRideStatus(acceptedRide._id, RideStatus.COMPLETED);
        setTripStarted(false);
        setAcceptedRide(null);
        stopNavigation();
        
        // Clear persisted ride data
        await clearPersistedRide();
        
        Alert.alert('Trip Completed', 'Ride has been completed successfully!');
      }
    } catch (error) {
      console.error('Stage completion error:', error);
      handleApiError(error, `Complete ${stage}`);
    }
  }, [acceptedRide, updateRideStatus, currentDriverLocation, startNavigation, stopNavigation, handleApiError, persistRide, clearPersistedRide]);

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
    updateDriverLocation: setCurrentDriverLocation,
    
    // Navigation actions
    startNavigation,
    stopNavigation,
    handleStageComplete,
    
    // Utilities
    clearError: () => setError(null),
    refreshData: () => {
      fetchDriverProfile();
      fetchDriverStats();
      if (online && !acceptedRide) {
        fetchAvailableRides();
      }
    }
  };
};
