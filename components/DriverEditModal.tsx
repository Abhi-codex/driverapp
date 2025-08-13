import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { styles as s, colors } from '../constants/tailwindStyles';
import { MaterialIcons } from '@expo/vector-icons';
import { DriverFormData } from '../types';
import InputField from './InputField';
import DropdownField from './DropdownField';

const { height: screenHeight } = Dimensions.get('window');

const vehicleTypesList = [
  { label: 'BLS - Basic Life Support', value: 'bls' },
  { label: 'ALS - Advanced Life Support', value: 'als' },
  { label: 'CCS - Critical Care Support', value: 'ccs' },
  { label: 'Auto - Compact Urban Unit', value: 'auto' },
  { label: 'Bike - Emergency Response Motorcycle', value: 'bike' },
];

const certificationLevels = [
  { label: 'EMT-Basic', value: 'EMT-Basic' },
  { label: 'EMT-Intermediate', value: 'EMT-Intermediate' },
  { label: 'EMT-Paramedic', value: 'EMT-Paramedic' },
  { label: 'Critical Care', value: 'Critical Care' },
];

interface DriverEditModalProps {
  visible: boolean;
  onClose: () => void;
  editForm: DriverFormData;
  onUpdateField: (key: string, value: any) => void;
  onSave: () => void;
  saving: boolean;
}

export default function DriverEditModal({
  visible,
  onClose,
  editForm,
  onUpdateField,
  onSave,
  saving
}: DriverEditModalProps) {
  const updateHospitalAffiliation = (updates: any) => {
    onUpdateField('hospitalAffiliation', {
      ...editForm.hospitalAffiliation,
      ...updates,
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[s.flex1, s.justifyEnd, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Pressable style={[s.flex1]} onPress={onClose} />
        
        <View style={[
          s.bgWhite, 
          { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          { maxHeight: screenHeight * 0.9, minHeight: screenHeight * 0.7 }
        ]}>
          {/* Modal Header */}
          <View style={[s.flexRow, s.justifyBetween, s.alignCenter, s.p5, { borderBottomWidth: 1, borderBottomColor: colors.gray[200] }]}>
            <Text style={[s.textXl, s.fontBold, s.textGray800]}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[s.flex1]} contentContainerStyle={[s.px5, { paddingBottom: 20 }]}>
            {/* Personal Information */}
            <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb3, s.mt4]}>Personal Information</Text>
            
            <InputField
              label="Full Name"
              required
              value={editForm.name}
              onChangeText={(text) => onUpdateField('name', text)}
            />

            <InputField
              label="Email Address"
              value={editForm.email}
              onChangeText={(text) => onUpdateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Vehicle Information */}
            <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb3, s.mt4]}>Ambulance Information</Text>

            <DropdownField
              label="Ambulance Type"
              required
              value={editForm.vehicleType}
              onValueChange={(value) => onUpdateField('vehicleType', value)}
              options={vehicleTypesList}
            />

            <InputField
              label="License Plate Number"
              required
              value={editForm.plateNumber}
              onChangeText={(text) => onUpdateField('plateNumber', text)}
              autoCapitalize="characters"
            />

            <InputField
              label="Vehicle Model"
              required
              value={editForm.model}
              onChangeText={(text) => onUpdateField('model', text)}
            />

            {/* Certification */}
            <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb3, s.mt4]}>EMT Certification</Text>

            <InputField
              label="EMT License Number"
              required
              value={editForm.licenseNumber}
              onChangeText={(text) => onUpdateField('licenseNumber', text)}
            />

            <DropdownField
              label="Certification Level"
              required
              value={editForm.certificationLevel}
              onValueChange={(value) => onUpdateField('certificationLevel', value)}
              options={certificationLevels}
            />

            {/* Hospital Affiliation */}
            <Text style={[s.textLg, s.fontBold, s.textGray800, s.mb3, s.mt4]}>Hospital Affiliation</Text>

            <View style={[s.mb4]}>
              <Text style={[s.textSm, s.fontMedium, s.textGray700, s.mb2]}>Driver Type</Text>
              <View style={[s.flexRow, s.justifyBetween]}>
                <TouchableOpacity 
                  style={[
                    s.flex1, s.py3, s.px4, s.roundedLg, s.alignCenter, s.mr2, s.border,
                    !editForm.hospitalAffiliation.isAffiliated
                      ? [s.bgPrimary600, s.borderPrimary600] 
                      : [s.bgWhite, s.borderGray300]
                  ]}
                  onPress={() => updateHospitalAffiliation({ 
                    isAffiliated: false,
                    hospitalName: '',
                    hospitalId: '',
                    hospitalAddress: '',
                    employeeId: '',
                  })}
                >
                  <Text style={[
                    s.textSm, s.fontMedium, 
                    !editForm.hospitalAffiliation.isAffiliated ? s.textWhite : s.textGray700
                  ]}>
                    Independent Driver
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    s.flex1, s.py3, s.px4, s.roundedLg, s.alignCenter, s.ml2, s.border,
                    editForm.hospitalAffiliation.isAffiliated
                      ? [s.bgPrimary600, s.borderPrimary600] 
                      : [s.bgWhite, s.borderGray300]
                  ]}
                  onPress={() => updateHospitalAffiliation({ isAffiliated: true })}
                >
                  <Text style={[
                    s.textSm, s.fontMedium, 
                    editForm.hospitalAffiliation.isAffiliated ? s.textWhite : s.textGray700
                  ]}>
                    Hospital Affiliated
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hospital Details (only if affiliated) */}
            {editForm.hospitalAffiliation.isAffiliated && (
              <>
                <InputField
                  label="Hospital Name"
                  required
                  value={editForm.hospitalAffiliation.hospitalName}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalName: value })}
                />

                <InputField
                  label="Hospital ID"
                  required
                  value={editForm.hospitalAffiliation.hospitalId}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalId: value })}
                />

                <InputField
                  label="Hospital Address"
                  value={editForm.hospitalAffiliation.hospitalAddress}
                  onChangeText={(value) => updateHospitalAffiliation({ hospitalAddress: value })}
                  multiline
                  numberOfLines={2}
                />

                <InputField
                  label="Employee ID"
                  required
                  value={editForm.hospitalAffiliation.employeeId}
                  onChangeText={(value) => updateHospitalAffiliation({ employeeId: value })}
                />
              </>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                s.bgPrimary600, 
                s.py4, 
                s.roundedXl, 
                s.alignCenter,
                s.mt6,
                saving && s.opacity50
              ]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[s.textBase, s.fontSemibold, s.textWhite]}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
