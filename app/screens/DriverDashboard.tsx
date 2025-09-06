import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { styles as s, colors } from '../../constants/tailwindStyles';
import { MaterialIcons } from '@expo/vector-icons';
import { useRiderLogic } from '../../hooks/useRiderLogic';
import { WelcomeHeader } from '../../components/dashboard/WelcomeHeader';
import Drive from '../../components/dashboard/Drive';

export default function DriverDashboard() {
  const router = useRouter();
  const [driverName, setDriverName] = useState('Driver');
  const [showMenu, setShowMenu] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { 
    online, 
    toggleOnline, 
    availableRides, 
    fetchDriverStats,
    acceptedRide,
    tripStarted
  } = useRiderLogic();

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle back button - close app instead of navigating back to auth
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true; // Prevent default behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );

  // Refresh driver profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only reload if profile hasn't been loaded yet
      if (!profileLoaded) {
        loadDriverProfile();
      } else {
        // If already loaded, just refresh from AsyncStorage (fast)
        refreshProfileFromStorage();
      }
    }, [profileLoaded])
  );

  const refreshProfileFromStorage = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('driver_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setDriverName(profile.name || 'Driver');
      }
    } catch (error) {
      console.log('Failed to refresh profile from storage:', error);
    }
  };

  // Fetch stats when component mounts or when online status changes
  useEffect(() => {
    if (online) {
      // Add a small delay and retry mechanism for stats
      const fetchStatsWithRetry = async () => {
        try {
          await fetchDriverStats();
        } catch (error) {
          console.log('Stats fetch failed, retrying in 3 seconds...');
          setTimeout(() => {
            fetchDriverStats().catch(err => 
              console.log('Stats retry failed, will try again later:', err.message)
            );
          }, 3000);
        }
      };
      
      fetchStatsWithRetry();
    }
  }, [online, fetchDriverStats]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const role = await AsyncStorage.getItem('role');
      
      if (!token || role !== 'driver') {
        router.replace('/screens/DriverAuth');
        return;
      }

      // Try to get driver name from stored profile or fetch from server
      await loadDriverProfile();
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/screens/DriverAuth');
    }
  };

  const loadDriverProfile = async () => {
    try {
      // First try to get from AsyncStorage
      const storedProfile = await AsyncStorage.getItem('driver_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        console.log('Loaded profile from storage:', profile);
        setDriverName(profile.name || 'Driver');
        setProfileLoaded(true);
        return;
      }

      // If not in storage, try to fetch from server with timeout and retry logic
      console.log('No profile in storage, fetching from server...');
      await fetchProfileFromServer();
    } catch (error) {
      console.error('Failed to load driver profile:', error);
      setDriverName('Driver'); // Fallback
      setProfileLoaded(true);
    }
  };

  const fetchProfileFromServer = async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        setDriverName('Driver');
        setProfileLoaded(true);
        return;
      }

      const { getServerUrl } = await import('../../utils/network');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        let profileResponse = await fetch(`${getServerUrl()}/driver/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (profileResponse.ok) {
          const response = await profileResponse.json();
          const profileData = response.data || response.driver || response;
          console.log('Fetched profile from server:', profileData);
          
          // Save to AsyncStorage for future use
          await AsyncStorage.setItem('driver_profile', JSON.stringify(profileData));
          setDriverName(profileData.name || 'Driver');
          setProfileLoaded(true);
        } else {
          throw new Error(`Server responded with status: ${profileResponse.status}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.log('Request timed out');
        } else {
          console.log('Fetch error:', fetchError.message);
        }
        
        // Retry logic for server wake-up
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${(retryCount + 1) * 2} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            fetchProfileFromServer(retryCount + 1);
          }, (retryCount + 1) * 2000); // 2s, 4s delays
        } else {
          console.log('Max retries reached, using fallback');
          setDriverName('Driver');
          setProfileLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfileFromServer:', error);
      setDriverName('Driver');
      setProfileLoaded(true);
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
              'role',
              'driver_profile'
            ]);
            router.replace('/screens/DriverAuth');
          }
        }
      ]
    );
  };

  // Toggle the small dropdown menu anchored to the driver name
  const toggleMenu = () => setShowMenu((v) => !v);

  // Close menu helper (useful if we later add outside click handling)
  const closeMenu = () => setShowMenu(false);

  // Handle navigation to map - check if online first
  const handleNavigateToMap = () => {
    if (!online) {
      Alert.alert(
        'Go Online',
        'You need to be online to access the map and accept emergency calls. Would you like to go online now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Online',
            onPress: async () => {
              await toggleOnline(); // This will set online to true
              // Navigate after a brief delay to ensure state updates
              setTimeout(() => {
                router.push('/screens/DriverMap');
              }, 100);
            }
          }
        ]
      );
    } else {
      router.push('/screens/DriverMap');
    }
  };

  return (
    <View style={[s.flex1, s.pt4, s.bgGray50]}>
      <StatusBar barStyle="dark-content" />
      {/* Header with user info */}
      <View style={[s.flexRow, s.justifyBetween, s.alignCenter, s.p5]}>
        <Text style={[s.text3xl, s.fontBold, s.textPrimary600]}>InstaAid</Text>
        
        <View style={[s.flexRow, s.alignCenter]}> 
          {/* Name button with anchored dropdown menu */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={toggleMenu}
              style={[s.flexRow, s.alignCenter, s.bgPrimary100, s.px3, s.py2, s.roundedFull]}
            >
              <MaterialIcons name="person" size={20} color={colors.primary[600]} />
              <Text style={[s.textSm, s.fontSemibold, s.textPrimary700, s.ml1]}>{driverName}</Text>
            </TouchableOpacity>

            {showMenu && (
              <View
                style={[
                  { position: 'absolute', top: 44, right: 0, minWidth: 140 },
                  s.bgWhite,
                  s.roundedLg,
                  s.shadow,
                  { zIndex: 999 }
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  style={[s.px4, s.py3]}
                >
                  <Text style={[s.textBase, s.textGray800]}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Main content area with WelcomeHeader and Drive component */}
      <View style={[s.flex1, s.px4]}>
        {/* Welcome Header with online status toggle */}
        <WelcomeHeader 
          driverName={driverName}
          onProfilePress={() => router.push('/screens/DriverProfile')}
          isOnline={online}
          toggleOnlineStatus={toggleOnline}
        />
        
        {/* Drive Component */}
        <Drive 
          isOnline={online}
          availableRidesCount={availableRides.length}
          hasActiveRide={!!acceptedRide}
          isTrip={tripStarted}
          onPress={handleNavigateToMap}
        />
      </View>
    </View>
  );
}
