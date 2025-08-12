import LabelInput from '../../../components/LabelInput';
import LabelSelect from '../../../components/LabelSelect';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors, styles } from '../../../constants/tailwindStyles';
import { getServerUrl } from '../../../utils/network';

type VehicleType = 'bls' | 'als' | 'ccs' | 'auto' | 'bike';
type CertificationLevel = 'EMT-Basic' | 'EMT-Intermediate' | 'EMT-Paramedic' | 'Critical Care';

interface HospitalAffiliation {
  isAffiliated: boolean;
  hospitalName: string;
  hospitalId: string;
  hospitalAddress: string;
  employeeId: string;
  customFareFormula?: {
    baseFare: number;
    perKmRate: number;
    minimumFare: number;
  };
}

interface DriverProfile {
  name: string;
  email: string;
  vehicleType: VehicleType | '';
  plateNumber: string;
  model: string;
  licenseNumber: string;
  certificationLevel: CertificationLevel | '';
  hospitalAffiliation: HospitalAffiliation;
}

export default function DriverProfileSetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DriverProfile>({
    name: '',
    email: '',
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
    const token = await AsyncStorage.getItem('access_token');
    const role = await AsyncStorage.getItem('role');
    
    if (!token || role !== 'driver') {
      router.replace('/driver/login');
    }
  };

  const vehicleTypes = [
    'BLS - Basic Life Support',
    'ALS - Advanced Life Support', 
    'CCS - Critical Care Support',
    'Auto - Compact Urban Unit',
    'Bike - Emergency Response Motorcycle',
  ];

  const certificationLevels = [
    'EMT-Basic',
    'EMT-Intermediate', 
    'EMT-Paramedic',
    'Critical Care',
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        router.replace('/driver/login');
        return;
      }

      const getVehicleTypeValue = (displayValue: string): string => {
        const mapping: { [key: string]: string } = {
          'BLS - Basic Life Support': 'bls',
          'ALS - Advanced Life Support': 'als',
          'CCS - Critical Care Support': 'ccs',
          'Auto - Compact Urban Unit': 'auto',
          'Bike - Emergency Response Motorcycle': 'bike'
        };
        return mapping[displayValue] || displayValue;
      };

      const profileData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        vehicle: {
          type: getVehicleTypeValue(formData.vehicleType),
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
      console.log('Profile update response:', data);

      if (response.ok) {
        await AsyncStorage.setItem("profile_complete", "true");
        Alert.alert(
          'Success!',
          'Your driver profile has been completed successfully. You can now start accepting emergency calls.',
          [
            {
              text: 'Go to Dashboard',
              onPress: () => router.replace('/driver/dashboard'),
            },
          ]
        );
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

  const updateFormData = (field: keyof DriverProfile, value: string) => {
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
            <LabelInput
              label="Full Name *"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              editable={!loading}
            />

            {/* Email Input */}
            <LabelInput
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
            <LabelSelect
              label="Ambulance Type *"
              value={formData.vehicleType}
              onChange={(value) => updateFormData('vehicleType', value as string)}
              options={vehicleTypes}
            />

            {/* Plate Number Input */}
            <LabelInput
              label="License Plate Number *"
              placeholder="e.g., AMB1234"
              value={formData.plateNumber}
              onChangeText={(value) => updateFormData('plateNumber', value)}
              autoCapitalize="characters"
              editable={!loading}
            />

            {/* Vehicle Model Input */}
            <LabelInput
              label="Vehicle Model *"
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
            <LabelInput
              label="EMT License Number *"
              placeholder="Enter your EMT license number"
              value={formData.licenseNumber}
              onChangeText={(value) => updateFormData('licenseNumber', value)}
              editable={!loading}
            />

            {/* Certification Level Picker */}
            <LabelSelect
              label="Certification Level *"
              value={formData.certificationLevel}
              onChange={(value) => updateFormData('certificationLevel', value as string)}
              options={certificationLevels}
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
                <LabelInput
                  label="Hospital Name *"
                  placeholder="e.g., City General Hospital"
                  value={formData.hospitalAffiliation.hospitalName}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalName: value })}
                  editable={!loading}
                />

                <LabelInput
                  label="Hospital ID *"
                  placeholder="e.g., CGH001"
                  value={formData.hospitalAffiliation.hospitalId}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalId: value })}
                  editable={!loading}
                />

                <LabelInput
                  label="Hospital Address"
                  placeholder="Hospital address"
                  value={formData.hospitalAffiliation.hospitalAddress}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalAddress: value })}
                  editable={!loading}
                  multiline
                  numberOfLines={2}
                />

                <LabelInput
                  label="Employee ID *"
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
            onPress={handleSubmit}
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
