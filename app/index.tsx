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
      // Small delay to prevent race conditions with profile completion
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if OTP verification is in progress - if so, don't interfere
      const otpInProgress = await AsyncStorage.getItem('otp_verification_in_progress');
      if (otpInProgress === 'true') {
        console.log('[INDEX] OTP verification in progress, skipping auth check');
        return;
      }
      
      const [accessToken, role, profileComplete] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('role'),
        AsyncStorage.getItem('profile_complete')
      ]);

      console.log('[INDEX] Auth check:', { 
        hasAccessToken: !!accessToken, 
        role, 
        profileComplete
      });

      // Give a moment for splash screen
      setTimeout(() => {
        if (accessToken && role === 'driver') {
          if (profileComplete === 'true') {
            // User is authenticated and profile is complete
            console.log('[INDEX] Redirecting to MainTabs - profile complete');
            router.replace('/navigation/MainTabs');
          } else {
            // User is authenticated but profile needs completion
            console.log('[INDEX] Redirecting to DriverProfileForm - profile incomplete');
            router.replace('/screens/DriverProfileForm');
          }
        } else {
          // User not authenticated, go to login
          console.log('[INDEX] Redirecting to DriverAuth - not authenticated');
          router.replace('/screens/DriverAuth');
        }
        setIsLoading(false);
      }, 800); // Reduced delay
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
