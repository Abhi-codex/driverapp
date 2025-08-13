import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles as s } from '../constants/tailwindStyles';
import { colors } from '../constants/tailwindStyles';

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [accessToken, role, profileComplete] = await Promise.all([
        AsyncStorage.getItem('access_token'),
        AsyncStorage.getItem('role'),
        AsyncStorage.getItem('profile_complete')
      ]);

      // Give a moment for splash screen
      setTimeout(() => {
        if (accessToken && role === 'driver') {
          if (profileComplete === 'true') {
            // User is authenticated and profile is complete
            router.replace('/navigation/MainTabs');
          } else {
            // User is authenticated but profile needs completion
            router.replace('/screens/DriverProfile');
          }
        } else {
          // User not authenticated, go to login
          router.replace('/screens/DriverAuth');
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, go to login
      router.replace('/screens/DriverAuth');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[s.flex1, s.justifyCenter, s.alignCenter, s.bgWhite]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return null;
}
