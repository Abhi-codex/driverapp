import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ApiResponse, Driver, DriverStats } from '../types/rider';
import { getServerUrl } from '../utils/network';
import { useAuthenticatedRequest } from './useAuthenticatedRequest';
import notificationService from '../utils/notificationService';

export const useDriverProfile = () => {
  const [online, setOnline] = useState(false);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [driverStats, setDriverStats] = useState<DriverStats>({
    totalRides: 0,
    todayRides: 0,
    todayEarnings: 0,
    weeklyRides: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    rating: 0
  });

  const { makeAuthenticatedRequest, handleApiError, setLoading } = useAuthenticatedRequest();

  // Fetch driver profile
  const fetchDriverProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data: ApiResponse<{ profile: Driver }> = await makeAuthenticatedRequest(
        `${getServerUrl()}/driver/profile`
      );
      
      if (data.data?.profile) {
        setDriverProfile(data.data.profile);
        setOnline(data.data.profile.isOnline);
        
        // Store profile for offline access
        await AsyncStorage.setItem('driver_profile', JSON.stringify(data.data.profile));
      }
    } catch (error) {
      handleApiError(error, 'Fetch driver profile');
      
      // Try to load from cache on error
      try {
        const cachedProfile = await AsyncStorage.getItem('driver_profile');
        if (cachedProfile) {
          const profile = JSON.parse(cachedProfile);
          setDriverProfile(profile);
          setOnline(profile.isOnline || false);
        }
      } catch (cacheError) {
        console.error('Failed to load cached profile:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest, handleApiError, setLoading]);

  // Fetch driver statistics
  const fetchDriverStats = useCallback(async () => {
    try {
      const data: ApiResponse<{ stats: DriverStats }> = await makeAuthenticatedRequest(
        `${getServerUrl()}/driver/stats`
      );
      
      if (data.data?.stats) {
        setDriverStats(data.data.stats);
      }
    } catch (error) {
      handleApiError(error, 'Fetch driver stats');
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  // Update online status
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    try {
      console.log(`Updating online status to: ${isOnline}`);
      
      await makeAuthenticatedRequest(`${getServerUrl()}/driver/online-status`, {
        method: 'PUT',
        body: JSON.stringify({ isOnline }),
      });
      
      console.log('Online status updated successfully');
      
      // Update local profile state
      setDriverProfile(prevProfile => {
        if (prevProfile) {
          const updatedProfile = { ...prevProfile, isOnline };
          
          // Update cached profile
          AsyncStorage.setItem('driver_profile', JSON.stringify(updatedProfile))
            .catch(err => console.error('Failed to cache updated profile:', err));
          
          return updatedProfile;
        }
        return prevProfile;
      });
      
      // Also update the online state directly
      setOnline(isOnline);
      
      // Register push token with backend when going online
      if (isOnline && notificationService.isReady() && driverProfile?._id) {
        try {
          const tokenRegistered = await notificationService.registerTokenWithBackend(
            driverProfile._id,
            getServerUrl()
          );
          if (tokenRegistered) {
            console.log('Push token registered with backend successfully');
          } else {
            console.warn('Failed to register push token with backend');
          }
        } catch (error) {
          console.error('Error registering push token:', error);
        }
      }
    } catch (error) {
      console.error('Failed to update online status:', error);
      handleApiError(error, 'Update online status');
      throw error; // Re-throw to allow calling component to handle
    }
  }, [makeAuthenticatedRequest, handleApiError]);

  // Toggle online status
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

  // Update vehicle information
  const updateVehicleInfo = useCallback(async (vehicleData: any) => {
    try {
      setLoading(true);
      
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
  }, [makeAuthenticatedRequest, handleApiError, driverProfile, setLoading]);

  // Fetch driver ride history
  const fetchDriverRideHistory = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      
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
  }, [makeAuthenticatedRequest, handleApiError, setLoading]);

  // Check authentication state
  const checkAuthState = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      
      if (token) {
        // Test token validity with a simple request
        await makeAuthenticatedRequest(`${getServerUrl()}/driver/profile`);
      } else {
        Alert.alert('Not Logged In', 'Please login first to see available rides');
        setOnline(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setOnline(false);
    }
  }, [makeAuthenticatedRequest]);

  // Load initial data
  useEffect(() => {
    fetchDriverProfile();
    fetchDriverStats();
  }, [fetchDriverProfile, fetchDriverStats]);

  return {
    // State
    online,
    driverProfile,
    driverStats,
    
    // Actions
    fetchDriverProfile,
    fetchDriverStats,
    updateOnlineStatus,
    toggleOnline,
    updateVehicleInfo,
    fetchDriverRideHistory,
    checkAuthState,
    
    // Manual state setters (for external updates)
    setOnline,
    setDriverProfile,
    setDriverStats,
  };
};