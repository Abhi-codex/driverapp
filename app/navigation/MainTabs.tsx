import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import {  Feather} from '@expo/vector-icons';
import { colors } from '../../constants/tailwindStyles';
import Home from '../screens/Home';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={Home} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {paddingBottom: 3, paddingTop: 5, height: 70},
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600', marginTop: 2},
        tabBarIconStyle: {marginBottom: 2},
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{ width: 20, height: 3, backgroundColor: '#000', borderRadius: 2, marginBottom: 5 }} />
              )}
              <Feather name="home" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}