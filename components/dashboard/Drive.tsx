import { styles, colors } from '../../constants/tailwindStyles';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface DriveProps {
  isOnline: boolean;
  availableRidesCount?: number;
  hasActiveRide?: boolean;
  isTrip?: boolean;
  isSocketConnected?: boolean;
  acceptedRide?: any;
  onPress: () => void;
}

const Drive: React.FC<DriveProps> = ({ 
  isOnline, 
  availableRidesCount = 0, 
  hasActiveRide = false, 
  isTrip = false, 
  isSocketConnected = false,
  acceptedRide,
  onPress 
}) => {
  // Calculate effective active ride status, excluding completed rides
  const effectiveHasActiveRide = hasActiveRide && acceptedRide && 
    !(acceptedRide.status === 'COMPLETED' || acceptedRide.status === 'DROPOFF_COMPLETE');
  const getButtonText = () => {
    if (effectiveHasActiveRide) {
      // Check if ride is cancelled
      if (acceptedRide?.status === 'CANCELLED') {
        return 'Ride Cancelled';
      }
      return isTrip ? 'Continue to Hospital' : 'Go to Patient';
    }
    if (hasActiveRide && (acceptedRide?.status === 'COMPLETED' || acceptedRide?.status === 'DROPOFF_COMPLETE')) {
      return 'Ride Completed';
    }
    return isOnline ? 'Start Driving' : 'Go Online First';
  };

  const getButtonSubtext = () => {
    if (effectiveHasActiveRide) {
      return isTrip 
        ? 'You have a patient onboard. Navigate to hospital.' 
        : 'You have an accepted ride. Navigate to patient pickup.';
    }
    if (hasActiveRide && (acceptedRide?.status === 'COMPLETED' || acceptedRide?.status === 'DROPOFF_COMPLETE')) {
      return 'Ride has been completed successfully';
    }
    if (hasActiveRide && acceptedRide?.status === 'CANCELLED') {
      const cancelledBy = acceptedRide?.cancellation?.cancelledBy;
      const reason = acceptedRide?.cancellation?.cancelReason;
      return cancelledBy === 'patient' 
        ? `Cancelled by patient${reason ? `: ${reason}` : ''}` 
        : `Cancelled${reason ? `: ${reason}` : ''}`;
    }
    return isOnline
      ? 'Go to map view and start accepting ride requests'
      : 'You must be online to accept emergency calls';
  };

  const getButtonColor = () => {
    if (effectiveHasActiveRide) {
      return isTrip ? styles.bgSecondary600 : styles.bgPrimary600;
    }
    if (hasActiveRide && (acceptedRide?.status === 'COMPLETED' || acceptedRide?.status === 'DROPOFF_COMPLETE')) {
      return { backgroundColor: colors.medical[500] }; // Green for completed rides
    }
    if (hasActiveRide && acceptedRide?.status === 'CANCELLED') {
      return styles.bgGray500; // Grey for cancelled rides
    }
    return styles.bgEmergency500;
  };

  return (
    <>
      {/* Real-time connection status indicator */}
      {isOnline && (
        <View style={[styles.flexRow, styles.alignCenter, styles.justifyCenter, styles.mb3]}>
          <View 
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#10B981',
              marginRight: 8
            }}
          />
        </View>
      )}
      
      <TouchableOpacity
      style={[
        getButtonColor(), 
        styles.rounded2xl, 
        styles.p6, 
        styles.shadow, 
        styles.mb6, 
        styles.alignCenter, 
        (!isOnline && !effectiveHasActiveRide) ? styles.opacity75 : styles.opacity100
      ]}
      onPress={onPress}
      disabled={!isOnline && !effectiveHasActiveRide}
      activeOpacity={0.80}
    >
      <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
        {effectiveHasActiveRide && (
          <MaterialIcons 
            name={isTrip ? "local-hospital" : "person-pin-circle"} 
            size={32} 
            color="white" 
            style={styles.mr2}
          />
        )}
        {hasActiveRide && (acceptedRide?.status === 'COMPLETED' || acceptedRide?.status === 'DROPOFF_COMPLETE') && (
          <MaterialIcons 
            name="check-circle" 
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
      
      {effectiveHasActiveRide && (
        <View style={[styles.mt3, styles.px4, styles.py2, styles.bgWhite, styles.roundedLg, { opacity: 0.9 }]}>
          <Text style={[styles.textSm, styles.fontMedium, styles.textGray800, styles.textCenter]}>
            {isTrip ? 'PATIENT ONBOARD' : 'RIDE ACCEPTED'}
          </Text>
        </View>
      )}
      
      {hasActiveRide && (acceptedRide?.status === 'COMPLETED' || acceptedRide?.status === 'DROPOFF_COMPLETE') && (
        <View style={[styles.mt3, styles.px4, styles.py2, styles.bgWhite, styles.roundedLg, { opacity: 0.9 }]}>
          <Text style={[styles.textSm, styles.fontMedium, styles.textGray800, styles.textCenter]}>
            RIDE COMPLETED
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
    </>
  );
};

export default Drive;
