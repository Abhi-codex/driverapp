import React from 'react';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
    </>
  );
}
