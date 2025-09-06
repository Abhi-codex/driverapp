import { styles } from '../../constants/tailwindStyles';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface DriveProps {
  isOnline: boolean;
  availableRidesCount?: number;
  hasActiveRide?: boolean;
  isTrip?: boolean;
  onPress: () => void;
}

const Drive: React.FC<DriveProps> = ({ isOnline, availableRidesCount = 0, hasActiveRide = false, isTrip = false, onPress }) => {
  const getButtonText = () => {
    if (hasActiveRide) {
      return isTrip ? 'Continue to Hospital' : 'Go to Patient';
    }
    return isOnline ? 'Start Driving' : 'Go Online First';
  };

  const getButtonSubtext = () => {
    if (hasActiveRide) {
      return isTrip 
        ? 'You have a patient onboard. Navigate to hospital.' 
        : 'You have an accepted ride. Navigate to patient pickup.';
    }
    return isOnline
      ? 'Go to map view and start accepting ride requests'
      : 'You must be online to accept emergency calls';
  };

  const getButtonColor = () => {
    if (hasActiveRide) {
      return isTrip ? styles.bgSecondary600 : styles.bgPrimary600;
    }
    return styles.bgEmergency500;
  };

  return (
    <TouchableOpacity
      style={[
        getButtonColor(), 
        styles.rounded2xl, 
        styles.p6, 
        styles.shadow, 
        styles.mb6, 
        styles.alignCenter, 
        (!isOnline && !hasActiveRide) ? styles.opacity75 : styles.opacity100
      ]}
      onPress={onPress}
      disabled={!isOnline && !hasActiveRide}
      activeOpacity={0.80}
    >
      <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
        {hasActiveRide && (
          <MaterialIcons 
            name={isTrip ? "local-hospital" : "person-pin-circle"} 
            size={32} 
            color="white" 
            style={styles.mr2}
          />
        )}
        <Text style={[styles.text2xl, styles.fontBold, styles.textWhite]}>
          {getButtonText()}
        </Text>
      </View>
      
      <Text style={[styles.textSm, styles.textWhite, styles.textCenter]}>
        {getButtonSubtext()}
      </Text>
      
      {hasActiveRide && (
        <View style={[styles.mt3, styles.px4, styles.py2, styles.bgWhite, styles.roundedLg, { opacity: 0.9 }]}>
          <Text style={[styles.textSm, styles.fontMedium, styles.textGray800, styles.textCenter]}>
            {isTrip ? '🚨 PATIENT ONBOARD' : '📍 RIDE ACCEPTED'}
          </Text>
        </View>
      )}
      
      {!hasActiveRide && isOnline && (
        <View style={[styles.mt2, styles.flexRow, styles.alignCenter, styles.justifyCenter]}> 
          <Text style={[styles.textLg, styles.textWhite, styles.mr1]}>
            {availableRidesCount}
          </Text>
          <Text style={[styles.textLg, styles.textWhite]}>emergency call{availableRidesCount !== 1 ? 's' : ''} available</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Drive;
