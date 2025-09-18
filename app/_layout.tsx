import React, { useEffect } from 'react';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert } from 'react-native';
import notificationService from '../utils/notificationService';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  useEffect(() => {
    // Initialize notification service
    const initializeNotifications = async () => {
      try {
        console.log('🔔 Initializing notifications in RootLayout...');
        const initialized = await notificationService.initialize();
        
        if (initialized) {
          console.log('🔔 Notification service initialized successfully');
          
          // Set up notification listeners
          const notificationListener = notificationService.onNotificationReceived((notification) => {
            console.log('🔔 Notification received while app is open:', notification);
            // Handle notification while app is running
          });

          const responseListener = notificationService.onNotificationResponse((response) => {
            console.log('🔔 Notification tapped:', response);
            
            // Handle notification tap - navigate to ride details
            const rideData = response.notification.request.content.data;
            if (rideData?.type === 'ride_request' && rideData?.rideId) {
              // TODO: Navigate to ride details or map
              Alert.alert(
                'Emergency Request',
                `Opening ride request ${rideData.rideId}`,
                [{ text: 'OK' }]
              );
            }
          });

          // Cleanup function
          return () => {
            notificationListener.remove();
            responseListener.remove();
          };
        } else {
          console.warn('🔔 Failed to initialize notification service');
        }
      } catch (error) {
        console.error('🔔 Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="screens/DriverAuth" />
        <Stack.Screen name="screens/OtpScreen" />
        <Stack.Screen name="screens/DriverProfile" />
        <Stack.Screen name="screens/DriverDashboard" />
        <Stack.Screen name="screens/DriverMap" />
        <Stack.Screen name="navigation/MainTabs" />
      </Stack>
    </GestureHandlerRootView>
  );
}
