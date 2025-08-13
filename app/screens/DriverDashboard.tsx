import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles as s, colors } from '../../constants/tailwindStyles';
import { MaterialIcons } from '@expo/vector-icons';

export default function DriverDashboard() {
  const router = useRouter();
  const [driverName, setDriverName] = useState('Driver');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const role = await AsyncStorage.getItem('role');
      
      if (!token || role !== 'driver') {
        router.replace('/screens/DriverAuth');
        return;
      }

      // Try to get driver name from stored profile or use default
      const storedProfile = await AsyncStorage.getItem('driver_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setDriverName(profile.name || 'Driver');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/screens/DriverAuth');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'access_token',
              'refresh_token',
              'firebase_id_token',
              'role',
              'driver_profile'
            ]);
            router.replace('/screens/DriverAuth');
          }
        }
      ]
    );
  };

  const navigateToProfile = () => {
    router.push('/screens/DriverProfile');
  };

  return (
    <View style={[s.flex1, s.bgGray50]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header with user info */}
      <View style={[s.flexRow, s.justifyBetween, s.alignCenter, s.p5, s.bgWhite, s.shadow]}>
        <Text style={[s.textXl, s.fontBold, s.textGray800]}>Dashboard</Text>
        
        <View style={[s.flexRow, s.alignCenter]}>
          <TouchableOpacity 
            onPress={navigateToProfile}
            style={[s.flexRow, s.alignCenter, s.bgPrimary100, s.px3, s.py2, s.roundedFull, s.mr3]}
          >
            <MaterialIcons name="person" size={20} color={colors.primary[600]} />
            <Text style={[s.textSm, s.fontSemibold, s.textPrimary700, s.ml1]}>{driverName}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleLogout}
            style={[s.p2, s.bgGray100, s.roundedFull]}
          >
            <MaterialIcons name="logout" size={20} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content area - simplified for now */}
      <View style={[s.flex1, s.justifyCenter, s.alignCenter, s.p6]}>
        <View style={[s.bgWhite, s.rounded3xl, s.p6, s.shadow, s.alignCenter]}>
          <MaterialIcons name="dashboard" size={80} color={colors.primary[600]} />
          <Text style={[s.text2xl, s.fontBold, s.textGray800, s.mt4, s.textCenter]}>
            Driver Dashboard
          </Text>
          <Text style={[s.textBase, s.textGray600, s.mt2, s.textCenter]}>
            Dashboard content coming soon...
          </Text>
          
          <TouchableOpacity 
            onPress={navigateToProfile}
            style={[s.bgPrimary600, s.px5, s.py3, s.roundedXl, s.mt6]}
          >
            <Text style={[s.textBase, s.fontSemibold, s.textWhite]}>
              View Profile & Stats
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
