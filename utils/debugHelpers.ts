 // Debug helper - Clear all stored tokens to force fresh authentication
 // Run this in the app console to reset authentication state
 
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAuthTokens = async () => {
  try {
    await AsyncStorage.multiRemove([
      'access_token',
      'refresh_token', 
      'role',
      'profile_complete'
    ]);
    console.log('All authentication tokens cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    return false;
  }
};

// Usage: import and call clearAuthTokens() to reset app state
