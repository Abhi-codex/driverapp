import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, styles } from '../../constants/tailwindStyles';
import { Ride } from '../../types/rider';

interface NavigationState {
  stage: 'idle' | 'to_patient' | 'to_hospital' | 'completed';
  isNavigating: boolean;
  estimatedTime: number | null;
  distance: number | null;
  currentStep: string | null;
}

interface NavigationControlsProps {
  acceptedRide: Ride | null;
  driverLocation: { latitude: number; longitude: number } | null;
  onNavigationStart: (destination: { latitude: number; longitude: number }, stage: 'to_patient' | 'to_hospital') => void;
  onNavigationStop: () => void;
  onStageComplete: (stage: 'pickup' | 'dropoff') => void;
  tripStarted: boolean;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  acceptedRide,
  driverLocation,
  onNavigationStart,
  onNavigationStop,
  onStageComplete,
  tripStarted
}) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    stage: 'idle',
    isNavigating: false,
    estimatedTime: null,
    distance: null,
    currentStep: null
  });

  const [voiceGuidanceEnabled, setVoiceGuidanceEnabled] = useState(true);

  // Determine current navigation stage based on trip state
  useEffect(() => {
    if (!acceptedRide) {
      setNavigationState(prev => ({ ...prev, stage: 'idle' }));
      return;
    }

    if (!tripStarted) {
      setNavigationState(prev => ({ ...prev, stage: 'to_patient' }));
    } else {
      setNavigationState(prev => ({ ...prev, stage: 'to_hospital' }));
    }
  }, [acceptedRide, tripStarted]);

  const startNavigation = useCallback(async () => {
    if (!acceptedRide || !driverLocation) {
      Alert.alert('Error', 'Unable to start navigation. Missing ride or location data.');
      return;
    }

    const destination = navigationState.stage === 'to_patient' 
      ? acceptedRide.pickup 
      : acceptedRide.drop;

    if (!destination) {
      Alert.alert('Error', 'Destination not available.');
      return;
    }

    try {
      setNavigationState(prev => ({ ...prev, isNavigating: true }));
      
      // Start in-app navigation (no external apps)
      if (navigationState.stage === 'to_patient' || navigationState.stage === 'to_hospital') {
        onNavigationStart(destination, navigationState.stage);
      }
      
      Alert.alert(
        'Navigation Started', 
        `In-app navigation to ${navigationState.stage === 'to_patient' ? 'patient pickup' : 'hospital'} started`
      );
    } catch (error) {
      console.error('Navigation start error:', error);
      setNavigationState(prev => ({ ...prev, isNavigating: false }));
      Alert.alert('Error', 'Failed to start navigation. Please try again.');
    }
  }, [acceptedRide, driverLocation, navigationState.stage, onNavigationStart]);

  const stopNavigation = useCallback(() => {
    setNavigationState(prev => ({ 
      ...prev, 
      isNavigating: false,
      estimatedTime: null,
      distance: null,
      currentStep: null
    }));
    onNavigationStop();
    
    Alert.alert('Navigation Stopped', 'You can restart navigation anytime.');
  }, [onNavigationStop]);

  const handleStageCompletion = () => {
    if (navigationState.stage === 'to_patient') {
      Alert.alert(
        'Patient Pickup',
        'Have you picked up the patient?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Start Trip', 
            onPress: () => {
              onStageComplete('pickup');
              setNavigationState(prev => ({ ...prev, stage: 'to_hospital', isNavigating: false }));
            }
          }
        ]
      );
    } else if (navigationState.stage === 'to_hospital') {
      Alert.alert(
        'Hospital Arrival',
        'Have you reached the hospital?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Complete Trip', 
            onPress: () => {
              onStageComplete('dropoff');
              setNavigationState(prev => ({ ...prev, stage: 'completed', isNavigating: false }));
            }
          }
        ]
      );
    }
  };

  const getNavigationTitle = () => {
    switch (navigationState.stage) {
      case 'to_patient':
        return 'Navigate to Patient';
      case 'to_hospital':
        return 'Navigate to Hospital';
      case 'completed':
        return 'Trip Completed';
      default:
        return 'Start Navigation';
    }
  };

  const getNavigationIcon = () => {
    if (navigationState.isNavigating) {
      return 'navigation';
    }
    return navigationState.stage === 'to_patient' ? 'person-pin-circle' : 'local-hospital';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (!acceptedRide || navigationState.stage === 'idle') {
    return null;
  }

  return (
    <View style={[
      styles.absolute, 
      { bottom: 16, left: 16, right: 16 }, 
      styles.bgWhite, 
      styles.roundedXl, 
      styles.shadowLg,
      { zIndex: 1000 }
    ]}>
      {/* Navigation Header */}
      <View style={[styles.p4, styles.borderB, styles.borderGray200]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween]}>
          <View style={[styles.flexRow, styles.alignCenter]}>
            <MaterialIcons 
              name={getNavigationIcon()} 
              size={24} 
              color={navigationState.isNavigating ? colors.primary[600] : colors.gray[600]} 
            />
            <Text style={[styles.textLg, styles.fontSemibold, styles.ml2]}>
              {getNavigationTitle()}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setVoiceGuidanceEnabled(!voiceGuidanceEnabled)}
            style={[styles.p2, styles.roundedFull]}
          >
            <Ionicons 
              name={voiceGuidanceEnabled ? 'volume-high' : 'volume-mute'} 
              size={20} 
              color={voiceGuidanceEnabled ? colors.primary[600] : colors.gray[400]} 
            />
          </TouchableOpacity>
        </View>

        {/* Route Information */}
        {navigationState.estimatedTime && navigationState.distance && (
          <View style={[styles.flexRow, styles.alignCenter, styles.mt2]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.mr4]}>
              <MaterialIcons name="schedule" size={16} color={colors.gray[500]} />
              <Text style={[styles.textSm, styles.textGray600, styles.ml1]}>
                {formatTime(navigationState.estimatedTime)}
              </Text>
            </View>
            <View style={[styles.flexRow, styles.alignCenter]}>
              <MaterialIcons name="straighten" size={16} color={colors.gray[500]} />
              <Text style={[styles.textSm, styles.textGray600, styles.ml1]}>
                {formatDistance(navigationState.distance)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Current Navigation Step */}
      {navigationState.currentStep && navigationState.isNavigating && (
        <View style={[styles.px4, styles.py3, styles.bgGray50]}>
          <Text style={[styles.textSm, styles.fontMedium, styles.textGray800]}>
            Next: {navigationState.currentStep}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={[styles.p4]}>
        <View style={[styles.flexRow, { gap: 8 }]}>
          {navigationState.isNavigating ? (
            <>
              <TouchableOpacity
                onPress={stopNavigation}
                style={[
                  styles.flex1,
                  styles.py3,
                  styles.px4,
                  styles.roundedLg,
                  styles.border,
                  styles.borderGray300,
                  styles.alignCenter
                ]}
              >
                <Text style={[styles.fontMedium, styles.textGray700]}>
                  Stop Navigation
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleStageCompletion}
                style={[
                  styles.flex1,
                  styles.py3,
                  styles.px4,
                  styles.roundedLg,
                  styles.bgPrimary600,
                  styles.alignCenter
                ]}
              >
                <Text style={[styles.fontMedium, styles.textWhite]}>
                  {navigationState.stage === 'to_patient' ? 'Pickup Complete' : 'Dropoff Complete'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={startNavigation}
              style={[
                styles.flex1,
                styles.py3,
                styles.px4,
                styles.roundedLg,
                styles.bgPrimary600,
                styles.alignCenter
              ]}
            >
              <Text style={[styles.fontMedium, styles.textWhite]}>
                Start Navigation
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default NavigationControls;
