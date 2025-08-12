import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as s, colors } from '../../constants/tailwindStyles';
import { MaterialIcons, FontAwesome6, Fontisto, AntDesign } from '@expo/vector-icons';
import { getServerUrl } from '../../utils/network';
import { NavigationProps } from '../../types';

export default function Home({ navigation }: NavigationProps) {
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        navigation.replace('Signup');
        return;
      }

      const response = await fetch(`${getServerUrl()}/doctor/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        // Extract doctor data from the response
        const doctorData = profileData.doctor || profileData;
        setDoctorProfile(doctorData);
      } else {
        if (response.status === 401) {
          // Token might be expired, try to refresh
          const refreshToken = await AsyncStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const refreshResponse = await fetch(`${getServerUrl()}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                await AsyncStorage.setItem('access_token', refreshData.access_token);
                // Retry profile fetch with new token
                fetchDoctorProfile();
                return;
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
          
          Alert.alert('Session Expired', 'Please login again');
          handleLogout();
        } else if (response.status === 403) {
          Alert.alert('Access Denied', 'Please complete your profile first');
          navigation.replace('ProfileForm');
        } else {
          Alert.alert('Error', 'Failed to load profile');
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
            navigation.navigate('Signup' as never);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[s.flex1, s.justifyCenter, s.alignCenter, s.bgGray50]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={[s.textBase, s.mt2, s.textGray600]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[s.flex1, s.bgGray50]}>
      <Pressable style={[s.flex1]} onPress={() => setDropdownOpen(false)}>
        {/* Top Bar */}
        <View style={[s.flexRow, s.justifyBetween, s.alignCenter, s.px2, s.pb2, s.bgWhite, s.shadowSm, s.pt1, s.mx3, s.my2, s.rounded2xl, { zIndex: 2 }]}> 
          <View style={[s.flexRow, s.alignEnd]}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 50, height: 40, resizeMode: 'contain' }}
            />
            <Text style={[s.text2xl, s.fontBold, s.textEmergency600]}>InstaAid</Text>
          </View>
          <View style={[s.mt1]}>
            <TouchableOpacity 
              style={[s.flexRow, s.alignCenter, s.p2, s.bgGray50, s.roundedXl, s.shadowSm]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Fontisto name="doctor" size={22} color={colors.black} />
              <Text style={[s.textSm, s.fontSemibold, s.textBlack, s.ml2, s.mr2]} numberOfLines={1}>
                {doctorProfile?.name || 'Doctor'}
              </Text>
              <AntDesign 
                name={dropdownOpen ? "upcircle" : "downcircle"} 
                size={18} 
                color={colors.gray[700]} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown Menu rendered at root level for overlay */}
        {dropdownOpen && (
          <Pressable
            style={{
              position: 'absolute',
              top: 61, 
              right: 20,
              minWidth: 100,
              zIndex: 1000,
              elevation: 1000,
              backgroundColor: 'rgba(0,0,0,0.01)', 
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
            }}
            onPress={() => setDropdownOpen(false)}
          >
            <View style={[
              s.bgGray50, s.roundedMd, s.shadowLg, s.p2,
              { minWidth: 140, zIndex: 1001, elevation: 1001 }
            ]}>
              <TouchableOpacity 
                style={[s.flexRow, s.alignCenter, s.py1]}
                onPress={() => {
                  setDropdownOpen(false);
                  navigation.navigate('Profile' as never);
                }}
              >
                <MaterialIcons name="person-4" size={24} color={colors.primary[600]} />
                <Text style={[s.ml2, s.textBase, s.textPrimary600]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.flexRow, s.alignCenter, s.py1]}
                onPress={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
              >
                <FontAwesome6 name="door-open" size={20} color={colors.danger[600]} />
                <Text style={[s.ml2, s.textBase, s.textDanger600]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}