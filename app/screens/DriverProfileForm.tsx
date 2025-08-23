import DropdownField from '../../components/DropdownField';
import InputField from '../../components/InputField';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, styles } from '../../constants/tailwindStyles';
import { getServerUrl } from '../../utils/network';
import { DriverFormData, HospitalAffiliation } from '../../types';

type VehicleType = 'bls' | 'als' | 'ccs' | 'auto' | 'bike';
type CertificationLevel = 'EMT-Basic' | 'EMT-Intermediate' | 'EMT-Paramedic' | 'Critical Care';

export default function DriverProfileForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { access_token, user: userString } = params;
  
  // Parse user data if it exists
  let userData = {};
  try {
    if (userString && typeof userString === 'string') {
      userData = JSON.parse(userString);
    }
  } catch (e) {
    console.log('Failed to parse user data:', e);
  }

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DriverFormData>({
    name: (userData as any)?.name || '',
    email: (userData as any)?.email || '',
    vehicleType: '',
    plateNumber: '',
    model: '',
    licenseNumber: '',
    certificationLevel: '',
    hospitalAffiliation: {
      isAffiliated: false,
      hospitalName: '',
      hospitalId: '',
      hospitalAddress: '',
      employeeId: '',
    },
  });

  useEffect(() => {
    // Check if user is authenticated
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    // Try new token format first, then fall back to legacy
    let token = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('access_token');
    const role = await AsyncStorage.getItem('role');
    
    if (!token || role !== 'driver') {
      router.replace('/screens/DriverAuth');
    }
  };

  const vehicleTypes = [
    { label: 'Select Ambulance Type', value: '' },
    { label: 'BLS - Basic Life Support', value: 'bls' },
    { label: 'ALS - Advanced Life Support', value: 'als' },
    { label: 'CCS - Critical Care Support', value: 'ccs' },
    { label: 'Auto - Compact Urban Unit', value: 'auto' },
    { label: 'Bike - Emergency Response Motorcycle', value: 'bike' },
  ];

  const certificationLevels = [
    { label: 'Select Certification Level', value: '' },
    { label: 'EMT-Basic', value: 'EMT-Basic' },
    { label: 'EMT-Intermediate', value: 'EMT-Intermediate' },
    { label: 'EMT-Paramedic', value: 'EMT-Paramedic' },
    { label: 'Critical Care', value: 'Critical Care' },
  ];

  const validateForm = (): boolean => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Please enter a valid name (minimum 2 characters)');
      return false;
    }

    if (formData.email && !validateEmail(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (!formData.vehicleType) {
      Alert.alert('Validation Error', 'Please select an ambulance type');
      return false;
    }

    if (!validatePlateNumber(formData.plateNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid license plate number (3-15 characters)');
      return false;
    }

    if (!formData.model.trim()) {
      Alert.alert('Validation Error', 'Please enter the vehicle model');
      return false;
    }

    if (!formData.licenseNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter your EMT license number');
      return false;
    }

    if (!formData.certificationLevel) {
      Alert.alert('Validation Error', 'Please select your certification level');
      return false;
    }

    // Validate hospital affiliation if selected
    if (formData.hospitalAffiliation.isAffiliated) {
      if (!formData.hospitalAffiliation.hospitalName.trim()) {
        Alert.alert('Validation Error', 'Please enter hospital name');
        return false;
      }
      if (!formData.hospitalAffiliation.hospitalId.trim()) {
        Alert.alert('Validation Error', 'Please enter hospital ID');
        return false;
      }
      if (!formData.hospitalAffiliation.employeeId.trim()) {
        Alert.alert('Validation Error', 'Please enter employee ID');
        return false;
      }
    }

    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePlateNumber = (plate: string): boolean => {
    return typeof plate === 'string' && plate.length >= 3 && plate.length <= 15;
  };

  const submitProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Try new token format first, then fall back to legacy
      let token = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('access_token');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        router.replace('/screens/DriverAuth');
        return;
      }

      console.log('[PROFILE FORM] Using backend authentication token');

      const profileData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        vehicle: {
          type: formData.vehicleType,
          plateNumber: formData.plateNumber.trim().toUpperCase(),
          model: formData.model.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          certificationLevel: formData.certificationLevel,
        },
        hospitalAffiliation: formData.hospitalAffiliation.isAffiliated ? {
          isAffiliated: true,
          hospitalName: formData.hospitalAffiliation.hospitalName.trim(),
          hospitalId: formData.hospitalAffiliation.hospitalId.trim(),
          hospitalAddress: formData.hospitalAffiliation.hospitalAddress.trim(),
          employeeId: formData.hospitalAffiliation.employeeId.trim(),
          customFareFormula: formData.hospitalAffiliation.customFareFormula,
        } : {
          isAffiliated: false,
          hospitalName: '',
          hospitalId: '',
          hospitalAddress: '',
          employeeId: '',
        },
        profileCompleted: true,
        onboardingStep: 'completed'
      };

      console.log('Submitting profile data:', profileData);

      const response = await fetch(`${getServerUrl()}/driver/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      let data;
      let isJson = false;
      try {
        data = await response.json();
        isJson = true;
      } catch (e) {
        data = null;
        isJson = false;
      }
      console.log('Profile update response:', { status: response.status, data });

      if (response.ok) {
        console.log('[PROFILE FORM] Profile update successful, updating storage...');
        
        // Update storage with proper values
        await AsyncStorage.setItem("profile_complete", "true");
        await AsyncStorage.setItem('driver_profile', JSON.stringify(formData));
        
        // Also ensure profile completion is properly flagged in multiple ways
        await AsyncStorage.setItem("profile_completed", "1");
        await AsyncStorage.setItem("onboarding_complete", "true");
        
        console.log('[PROFILE FORM] Storage updated successfully');
        
        // Small delay to ensure storage is written
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('[PROFILE FORM] Navigating to MainTabs...');
        
        // Use push first, then replace to ensure navigation works
        router.push('/navigation/MainTabs');
        
        // Show success message
        setTimeout(() => {
          Alert.alert(
            'Success!',
            'Your driver profile has been completed successfully. You can now start accepting emergency calls.',
            [{ text: 'OK' }]
          );
        }, 1000);
        
      } else {
        Alert.alert('Error', isJson && data && data.message ? data.message : 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof DriverFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateHospitalAffiliation = (updates: Partial<HospitalAffiliation>) => {
    setFormData(prev => ({
      ...prev,
      hospitalAffiliation: {
        ...prev.hospitalAffiliation,
        ...updates,
      },
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.flex1]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={[styles.flex1, { backgroundColor: colors.gray[50] }]}
        contentContainerStyle={styles.flexGrow}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.px5, styles.mt5, styles.py6]}>
          {/* Header */}
          <View style={[styles.alignCenter, styles.mb6]}>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <FontAwesome5 name="user-md" size={64} color={styles.textGray900.color || "#111"} />
            </View>
            <Text style={[styles.text2xl, styles.fontBold, styles.textGray900, styles.textCenter]}>Complete Your Driver Profile</Text>
            <Text style={[styles.textSm, styles.textGray600, styles.textCenter, styles.mt2]}>Provide your details to start accepting emergency calls</Text>
          </View>

          {/* Personal Information Section */}
          <View style={[styles.mb6]}>
            <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb3]}>Personal Information</Text>

            {/* Name Input */}
            <InputField
              label="Full Name"
              required
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              editable={!loading}
            />

            {/* Email Input */}
            <InputField
              label="Email Address (Optional)"
              placeholder="Enter your email address"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Vehicle Information Section */}
          <View style={[styles.mb6]}>
            <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb3]}>Ambulance Information</Text>

            {/* Vehicle Type Picker */}
            <DropdownField
              label="Ambulance Type"
              required
              value={formData.vehicleType}
              onValueChange={(value) => updateFormData('vehicleType', value)}
              options={vehicleTypes}
              enabled={!loading}
            />

            {/* Plate Number Input */}
            <InputField
              label="License Plate Number"
              required
              placeholder="e.g., AMB1234"
              value={formData.plateNumber}
              onChangeText={(value) => updateFormData('plateNumber', value)}
              autoCapitalize="characters"
              editable={!loading}
            />

            {/* Vehicle Model Input */}
            <InputField
              label="Vehicle Model"
              required
              placeholder="e.g., Mercedes Sprinter"
              value={formData.model}
              onChangeText={(value) => updateFormData('model', value)}
              editable={!loading}
            />
          </View>

          {/* Certification Section */}
          <View style={[styles.mb6]}>
            <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb3]}>EMT Certification</Text>

            {/* License Number Input */}
            <InputField
              label="EMT License Number"
              required
              placeholder="Enter your EMT license number"
              value={formData.licenseNumber}
              onChangeText={(value) => updateFormData('licenseNumber', value)}
              editable={!loading}
            />

            {/* Certification Level Picker */}
            <DropdownField
              label="Certification Level"
              required
              value={formData.certificationLevel}
              onValueChange={(value) => updateFormData('certificationLevel', value)}
              options={certificationLevels}
              enabled={!loading}
            />
          </View>

          {/* Hospital Affiliation Section */}
          <View style={[styles.mb6]}>
            <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb3]}>Hospital Affiliation</Text>

            {/* Affiliation Toggle */}
            <View style={[styles.mb4]}>
            <Text style={[styles.textSm, styles.fontMedium, styles.textGray700, styles.mb2]}>Driver Type *</Text>
              <View style={[styles.flexRow, styles.justifyBetween]}>
                <TouchableOpacity style={[styles.flex1, styles.py3, styles.px4, styles.roundedLg,
                    styles.alignCenter, styles.mr2, styles.border, !formData.hospitalAffiliation.isAffiliated
                      ? [styles.bgBlack, styles.borderBlack] : [styles.bgWhite, styles.borderGray300]]}
                  onPress={() => updateHospitalAffiliation({ 
                    isAffiliated: false,
                    hospitalName: '',
                    hospitalId: '',
                    hospitalAddress: '',
                    employeeId: '',
                  })}
                  disabled={loading}
                >
                  <Text style={[styles.textSm, styles.fontMedium, !formData.hospitalAffiliation.isAffiliated ? styles.textWhite : styles.textGray700]}>
                    Independent Driver
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.flex1, styles.py3, styles.px4, styles.roundedLg,
                    styles.alignCenter, styles.ml2, styles.border, formData.hospitalAffiliation.isAffiliated
                      ? [styles.bgBlack, styles.borderBlack] : [styles.bgWhite, styles.borderGray300]]}
                      onPress={() => updateHospitalAffiliation({isAffiliated: true})} disabled={loading}>
                  <Text style={[styles.textSm, styles.fontMedium, formData.hospitalAffiliation.isAffiliated ? styles.textWhite : styles.textGray700]}>
                    Hospital Affiliated
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hospital Details (only if affiliated) */}
            {formData.hospitalAffiliation.isAffiliated && (
              <>
                <InputField
                  label="Hospital Name"
                  required
                  placeholder="e.g., City General Hospital"
                  value={formData.hospitalAffiliation.hospitalName}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalName: value })}
                  editable={!loading}
                />

                <InputField
                  label="Hospital ID"
                  required
                  placeholder="e.g., CGH001"
                  value={formData.hospitalAffiliation.hospitalId}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalId: value })}
                  editable={!loading}
                />

                <InputField
                  label="Hospital Address"
                  placeholder="Hospital address"
                  value={formData.hospitalAffiliation.hospitalAddress}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalAddress: value })}
                  editable={!loading}
                  multiline
                  numberOfLines={2}
                />

                <InputField
                  label="Employee ID"
                  required
                  placeholder="e.g., EMP789"
                  value={formData.hospitalAffiliation.employeeId}
                  onChangeText={(value) => updateHospitalAffiliation({ employeeId: value })}
                  editable={!loading}
                />

                <View style={[styles.p4, styles.bgGray100, styles.roundedLg, styles.mb4]}>
                    <Text style={[styles.textSm, styles.textGray700, styles.fontMedium]}>Note: Hospital-affiliated drivers will use their hospital's custom fare structure instead of the platform's standard rates.</Text>
                </View>
              </>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.wFull, styles.py4, styles.alignCenter, styles.roundedLg, styles.mb4, styles.bgBlack]}
            onPress={submitProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[styles.textWhite, styles.textLg, styles.fontBold]}>Complete Profile</Text>
            )}
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity style={[styles.alignCenter, styles.py2]} onPress={() => router.back()} disabled={loading}>
            <Text style={[styles.textSm, styles.textGray600]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
