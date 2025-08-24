  import React, { useEffect, useState } from 'react';
  import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { styles as s, colors } from '../../constants/tailwindStyles';
  import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
  import { getServerUrl } from '../../utils/network';
  import { DriverProfile as DriverProfileType, DriverFormData, DriverStats } from '../../types';
  import DriverEditModal from '../../components/DriverEditModal';
  import { useRouter } from 'expo-router';

  // Helper: Refresh JWT access token using refresh token
  const tryRefreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return null;
      const response = await fetch(`${getServerUrl()}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);
        return data.access_token;
      }
    } catch (error) {
      console.error('[PROFILE] Token refresh failed:', error);
    }
    return null;
  };

  export default function DriverProfile() {
    const router = useRouter();
    const [driverProfile, setDriverProfile] = useState<DriverProfileType | null>(null);
    const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState<DriverFormData>({
      name: '',
      email: '',
      licenseNumber: '',
      vehicleType: '',
      plateNumber: '',
      model: '',
      certificationLevel: '',
      hospitalAffiliation: {
        isAffiliated: false,
        hospitalName: '',
        hospitalId: '',
        hospitalAddress: '',
        employeeId: '',
      }
    });

    useEffect(() => {
      fetchDriverData();
    }, []);

    const fetchDriverData = async () => {
      try {
        let token = await AsyncStorage.getItem('access_token');
        if (!token) {
          router.replace('/screens/DriverAuth');
          return;
        }

        // Fetch driver profile using JWT access token only
        let profileResponse = await fetch(`${getServerUrl()}/driver/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // If 401, try to refresh token
        if (profileResponse.status === 401) {
          const newToken = await tryRefreshToken();
          if (newToken) {
            token = newToken;
            profileResponse = await fetch(`${getServerUrl()}/driver/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
        }
      
        let profileData = null;
        if (profileResponse.ok) {
          const response = await profileResponse.json();
          profileData = response.data || response.driver || response;
          setDriverProfile(profileData);
        
          // Initialize edit form with current data
          setEditForm({
            name: profileData.name || '',
            email: profileData.email || '',
            licenseNumber: profileData.vehicle?.licenseNumber || '',
            vehicleType: profileData.vehicle?.type || '',
            plateNumber: profileData.vehicle?.plateNumber || '',
            model: profileData.vehicle?.model || '',
            certificationLevel: profileData.certificationLevel || '',
            hospitalAffiliation: profileData.hospitalAffiliation || {
              isAffiliated: false,
              hospitalName: '',
              hospitalId: '',
              hospitalAddress: '',
              employeeId: '',
            }
          });
        } else {
          console.error('[PROFILE] Failed to fetch profile:', profileResponse.status);
          // Try to get from local storage
          const storedProfile = await AsyncStorage.getItem('driver_profile');
          if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            setDriverProfile({
              name: profile.name || 'Driver Name',
              phone: '',
              rating: 0,
              totalRides: 0,
              ...profile
            });
            setEditForm(profile);
          } else {
            // Set default profile for display
            setDriverProfile({
              name: 'Driver Name',
              phone: '',
              email: '',
              rating: 0,
              totalRides: 0,
              vehicle: {
                type: 'bls' as const,
                plateNumber: '',
                model: '',
                licenseNumber: '',
                certificationLevel: 'EMT-Basic'
              },
              hospitalAffiliation: {
                isAffiliated: false,
                hospitalName: '',
                hospitalId: '',
                hospitalAddress: '',
                employeeId: '',
              }
            });
          }
        }

        // Fetch driver stats using JWT access token only
        let statsResponse = await fetch(`${getServerUrl()}/driver/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // If 401, try to refresh token
        if (statsResponse.status === 401) {
          const newToken = await tryRefreshToken();
          if (newToken) {
            token = newToken;
            statsResponse = await fetch(`${getServerUrl()}/driver/stats`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
        }

        if (statsResponse.ok) {
          const response = await statsResponse.json();
          const statsData = response.data || response;
          setDriverStats({
            totalRides: statsData.totalRides || 0,
            todayEarnings: statsData.todayEarnings || 0,
            weeklyEarnings: statsData.weeklyEarnings || 0,
            monthlyEarnings: statsData.monthlyEarnings || 0,
            rating: statsData.rating || 0,
            todayRides: statsData.todayRides || 0,
            weeklyRides: statsData.weeklyRides || 0,
            availableRidesCount: Array.isArray(statsData.availableRides) ? statsData.availableRides.length : 0
          });
        } else {
          console.error('[PROFILE] Failed to fetch stats:', statsResponse.status);
          // Set default stats
          setDriverStats({
            totalRides: 0,
            todayEarnings: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            rating: 0,
            todayRides: 0,
            weeklyRides: 0,
            availableRidesCount: 0
          });
        }

      } catch (error) {
        console.error('[PROFILE] Failed to fetch driver data:', error);
        // Try to get from local storage as fallback
        try {
          const storedProfile = await AsyncStorage.getItem('driver_profile');
          if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            setDriverProfile({
              name: profile.name || 'Driver Name',
              phone: '',
              rating: 0,
              totalRides: 0,
              ...profile
            });
            setEditForm(profile);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    const updateField = (key: string, value: any) => {
      setEditForm({ ...editForm, [key]: value });
    };

    const saveProfile = async () => {
      setSaving(true);
      try {
        let token = await AsyncStorage.getItem('access_token');
        // Use JWT access token for profile update
        const response = await fetch(`${getServerUrl()}/driver/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...editForm,
            profileCompleted: true
          })
        });
      
        if (response.ok) {
          Alert.alert('Success', 'Profile updated successfully');
          setEditModalVisible(false);
          // Save to local storage too
          await AsyncStorage.setItem('driver_profile', JSON.stringify(editForm));
          await fetchDriverData(); // Refresh profile data
        } else {
          console.error('[PROFILE] Profile update failed:', response.status);
          Alert.alert('Error', 'Failed to update profile');
        }
      } catch (error) {
        console.error('[PROFILE] Profile save error:', error);
        Alert.alert('Error', 'Network error');
      } finally {
        setSaving(false);
      }
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
      <View style={[s.flex1, s.mt8, s.bgGray50]}>
        <ScrollView style={[s.flex1]} contentContainerStyle={[s.p5]}>
          {/* Profile Header Card */}
          <View style={[s.bgWhite, s.rounded3xl, s.p6, s.mb5, s.shadow, s.alignCenter]}>
            <View style={[s.w20, s.h20, s.bgEmergency100, s.roundedFull, s.alignCenter, s.justifyCenter, s.mb4]}>
              <FontAwesome5 name="ambulance" size={40} color={colors.emergency[600]} />
            </View>
            <Text style={[s.text2xl, s.fontBold, s.textGray800, s.textCenter]}>
              {driverProfile?.name || 'Driver Name'}
            </Text>
            <View style={[s.flexRow, s.alignCenter, s.mt2, s.mb4]}>
              <MaterialIcons name="star" size={20} color="#fbbf24" />
              <Text style={[s.textLg, s.fontSemibold, s.textGray700, s.ml1]}>
                {driverStats?.rating || 0} ({driverStats?.totalRides || 0} rides)
              </Text>
            </View>
            <TouchableOpacity 
              style={[s.flexRow, s.alignCenter, s.bgPrimary600, s.px4, s.py2, s.roundedFull]}
              onPress={() => setEditModalVisible(true)}
            >
              <MaterialIcons name="edit" size={18} color="white" />
              <Text style={[s.textSm, s.fontSemibold, s.textWhite, s.ml1]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Driver Statistics */}
          <View style={[s.bgWhite, s.rounded2xl, s.p5, s.mb4, s.shadow]}>
            <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb4]}>Driver Statistics</Text>
          
            <View style={[s.flexRow, s.justifyBetween, s.mb3]}>
              <View style={[s.alignCenter]}>
                <Text style={[s.text2xl, s.fontBold, s.textPrimary600]}>{driverStats?.todayRides || 0}</Text>
                <Text style={[s.textSm, s.textGray600]}>Today's Rides</Text>
              </View>
              <View style={[s.alignCenter]}>
                <Text style={[s.text2xl, s.fontBold, s.textEmergency600]}>₹{driverStats?.todayEarnings || 0}</Text>
                <Text style={[s.textSm, s.textGray600]}>Today's Earnings</Text>
              </View>
            </View>

            <View style={[s.flexRow, s.justifyBetween, s.mb3]}>
              <View style={[s.alignCenter]}>
                <Text style={[s.text2xl, s.fontBold, s.textSecondary600]}>{driverStats?.weeklyRides || 0}</Text>
                <Text style={[s.textSm, s.textGray600]}>Weekly Rides</Text>
              </View>
              <View style={[s.alignCenter]}>
                <Text style={[s.text2xl, s.fontBold, s.textEmergency600]}>₹{driverStats?.weeklyEarnings || 0}</Text>
                <Text style={[s.textSm, s.textGray600]}>Weekly Earnings</Text>
              </View>
            </View>

            <View style={[s.flexRow, s.justifyBetween]}>
              <View style={[s.alignCenter]}>
                <Text style={[s.text2xl, s.fontBold, s.textPrimary600]}>{driverStats?.totalRides || 0}</Text>
                <Text style={[s.textSm, s.textGray600]}>Total Rides</Text>
              </View>
              <View style={[s.alignCenter]}>
                <Text style={[s.text2xl, s.fontBold, s.textEmergency600]}>₹{driverStats?.monthlyEarnings || 0}</Text>
                <Text style={[s.textSm, s.textGray600]}>Monthly Earnings</Text>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={[s.bgWhite, s.rounded2xl, s.p5, s.mb4, s.shadow]}>
            <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb4]}>Contact Information</Text>
          
            {driverProfile?.email && (
              <View style={[s.flexRow, s.alignCenter, s.mb3]}>
                <MaterialIcons name="email" size={20} color={colors.gray[600]} />
                <Text style={[s.textBase, s.textGray700, s.ml3]}>{driverProfile.email}</Text>
              </View>
            )}
          
            {driverProfile?.phone && (
              <View style={[s.flexRow, s.alignCenter, s.mb3]}>
                <MaterialIcons name="phone" size={20} color={colors.gray[600]} />
                <Text style={[s.textBase, s.textGray700, s.ml3]}>{driverProfile.phone}</Text>
              </View>
            )}
          
            {/* Hospital Affiliation Display */}
            {driverProfile?.hospitalAffiliation?.isAffiliated && (
              <>
                <View style={[s.flexRow, s.alignCenter, s.mb3]}>
                  <MaterialIcons name="local-hospital" size={20} color={colors.gray[600]} />
                  <Text style={[s.textBase, s.textGray700, s.ml3]}>{driverProfile.hospitalAffiliation.hospitalName}</Text>
                </View>
              
                {driverProfile.hospitalAffiliation.hospitalAddress && (
                  <View style={[s.flexRow, s.alignCenter, s.mb3]}>
                    <MaterialIcons name="location-on" size={20} color={colors.gray[600]} />
                    <Text style={[s.textBase, s.textGray700, s.ml3, s.flex1]}>{driverProfile.hospitalAffiliation.hospitalAddress}</Text>
                  </View>
                )}
              
                {driverProfile.hospitalAffiliation.employeeId && (
                  <View style={[s.flexRow, s.alignCenter]}>
                    <MaterialIcons name="badge" size={20} color={colors.gray[600]} />
                    <Text style={[s.textBase, s.textGray700, s.ml3]}>ID: {driverProfile.hospitalAffiliation.employeeId}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Vehicle & Certification Information */}
          <View style={[s.bgWhite, s.rounded2xl, s.p5, s.mb4, s.shadow]}>
            <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb4]}>Ambulance & Certification</Text>
          
            {driverProfile?.vehicle?.licenseNumber && (
              <View style={[s.mb4]}>
                <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>EMT License Number</Text>
                <Text style={[s.textBase, s.textGray800]}>{driverProfile.vehicle.licenseNumber}</Text>
              </View>
            )}
          
            {driverProfile?.vehicle?.certificationLevel && (
              <View style={[s.mb4]}>
                <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>Certification Level</Text>
                <View style={[s.bgEmergency100, s.px3, s.py1, s.roundedFull, s.selfStart]}>
                  <Text style={[s.textSm, s.textEmergency600]}>
                    {driverProfile.vehicle.certificationLevel}
                  </Text>
                </View>
              </View>
            )}
          
            {driverProfile?.vehicle?.type && (
              <View style={[s.mb4]}>
                <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>Ambulance Type</Text>
                <View style={[s.bgPrimary100, s.px3, s.py1, s.roundedFull, s.selfStart]}>
                  <Text style={[s.textSm, s.textPrimary700, { textTransform: 'uppercase' }]}>
                    {driverProfile.vehicle.type === 'bls' ? 'BLS - Basic Life Support' :
                     driverProfile.vehicle.type === 'als' ? 'ALS - Advanced Life Support' :
                     driverProfile.vehicle.type === 'ccs' ? 'CCS - Critical Care Support' :
                     driverProfile.vehicle.type === 'auto' ? 'Auto - Compact Urban Unit' :
                     driverProfile.vehicle.type === 'bike' ? 'Bike - Emergency Response Motorcycle' :
                     driverProfile.vehicle.type}
                  </Text>
                </View>
              </View>
            )}
          
            {driverProfile?.vehicle?.plateNumber && (
              <View style={[s.mb4]}>
                <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>License Plate</Text>
                <Text style={[s.textBase, s.textGray800]}>{driverProfile.vehicle.plateNumber}</Text>
              </View>
            )}

            {driverProfile?.vehicle?.model && (
              <View>
                <Text style={[s.textSm, s.fontSemibold, s.textGray600, s.mb1]}>Vehicle Model</Text>
                <Text style={[s.textBase, s.textGray800]}>{driverProfile.vehicle.model}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Edit Modal */}
        <DriverEditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          editForm={editForm}
          onUpdateField={updateField}
          onSave={saveProfile}
          saving={saving}
        />
      </View>
    );
  }
