import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/tailwindStyles';
import DriverDashboard from '../screens/DriverDashboard';
import DriverMap from '../screens/DriverMap';
import DriverProfile from '../screens/DriverProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DriverDashboard} />
    </Stack.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={DriverMap} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={DriverProfile} />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 75,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ 
                  width: 24, 
                  height: 3, 
                  backgroundColor: colors.primary[600], 
                  borderRadius: 2, 
                  marginBottom: 5 
                }} />
              )}
              <Feather name="home" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ 
                  width: 24, 
                  height: 3, 
                  backgroundColor: colors.primary[600], 
                  borderRadius: 2, 
                  marginBottom: 5 
                }} />
              )}
              <Feather name="map" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ 
                  width: 24, 
                  height: 3, 
                  backgroundColor: colors.primary[600], 
                  borderRadius: 2, 
                  marginBottom: 5 
                }} />
              )}
              <Feather name="user" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}