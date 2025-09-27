import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { getServerUrl } from '../utils/network';

export const useAuthenticatedRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic error handler
  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`${context} error:`, error);
    
    let message = 'An unexpected error occurred';
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    }
    
    setError(message);
    
    // Only show alert for user-facing operations
    if (!context.includes('fetch') && !context.includes('load')) {
      Alert.alert('Error', message);
    }
  }, []);

  // Refresh auth token helper
  const refreshAuthToken = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${getServerUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      if (data.accessToken) {
        await AsyncStorage.setItem("access_token", data.accessToken);
        return true;
      }
      
      throw new Error('No access token in refresh response');
    } catch (error) {
      console.error('Failed to refresh auth token:', error);
      return false;
    }
  }, []);

  // Main authenticated request function
  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}, timeout: number = 20000, retries: number = 2) => {
    // Get access token for authentication
    const token = await AsyncStorage.getItem("access_token");
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
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
            const refreshed = await refreshAuthToken();
            if (refreshed) {
              // Retry the original request with new token
              const newToken = await AsyncStorage.getItem("access_token");
              const retryResponse = await fetch(url, {
                ...options,
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json',
                  ...options.headers,
                },
              });

              if (!retryResponse.ok) {
                throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
              }

              return await retryResponse.json();
            }
            throw new Error('Authentication failed');
          }
          
          const errorData = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorData || response.statusText}`);
        }

        return await response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error;

        if (error.name === 'AbortError') {
          if (attempt < retries) {
            console.log(`Request timeout, retrying (${attempt + 1}/${retries})...`);
            continue;
          }
          throw new Error('Request timeout - please check your connection');
        }
        
        // For non-timeout errors, don't retry
        throw error;
      }
    }

    throw lastError;
  }, [refreshAuthToken]);

  // Utility functions
  const clearError = useCallback(() => setError(null), []);

  return {
    // State
    loading,
    error,
    
    // Functions
    makeAuthenticatedRequest,
    handleApiError,
    refreshAuthToken,
    clearError,
    setLoading,
    setError,
  };
};