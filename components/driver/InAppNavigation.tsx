import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, styles } from '../../constants/tailwindStyles';
import { RouteInfo } from '../../utils/navigationService';

interface InAppNavigationProps {
  routeInfo: RouteInfo | null;
  currentLocation: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  isNavigating: boolean;
  onStopNavigation: () => void;
  onStageComplete: () => void;
  stageName: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const InAppNavigation: React.FC<InAppNavigationProps> = ({
  routeInfo,
  currentLocation,
  destination,
  isNavigating,
  onStopNavigation,
  onStageComplete,
  stageName
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToStep, setDistanceToStep] = useState<number | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [animatedHeight] = useState(new Animated.Value(200));

  const currentStep = routeInfo?.steps[currentStepIndex];
  const totalSteps = routeInfo?.steps.length || 0;
  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  // Calculate distance to current navigation step
  useEffect(() => {
    if (currentLocation && currentStep) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        currentStep.endLocation.latitude,
        currentStep.endLocation.longitude
      );
      setDistanceToStep(distance);

      // Auto-advance to next step if very close to current step end point
      if (distance < 20 && currentStepIndex < totalSteps - 1) { // 20 meters threshold
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  }, [currentLocation, currentStep, currentStepIndex, totalSteps]);

  // Calculate estimated arrival time
  useEffect(() => {
    if (routeInfo) {
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + routeInfo.duration * 1000);
      setEstimatedArrival(arrivalTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }
  }, [routeInfo]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver.toLowerCase()) {
      case 'turn-left':
      case 'turn-slight-left':
        return 'turn-left';
      case 'turn-right':
      case 'turn-slight-right':
        return 'turn-right';
      case 'turn-sharp-left':
        return 'turn-sharp-left';
      case 'turn-sharp-right':
        return 'turn-sharp-right';
      case 'uturn-left':
      case 'uturn-right':
        return 'u-turn-left';
      case 'straight':
      case 'continue':
        return 'straight';
      case 'ramp-left':
        return 'ramp-left';
      case 'ramp-right':
        return 'ramp-right';
      case 'merge':
        return 'merge';
      case 'fork-left':
      case 'fork-right':
        return 'call-split';
      case 'roundabout-left':
      case 'roundabout-right':
        return 'rotate-left';
      default:
        return 'navigation';
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 80 : 200,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isNavigating || !routeInfo || !currentStep) {
    return null;
  }

  return (
    <Animated.View style={[
      styles.absolute,
      { top: 40, left: 0, right: 0, zIndex: 1000 },
      styles.bgWhite,
      styles.shadowLg,
      styles.rounded2xl,
      styles.mx2,
      { height: animatedHeight, elevation: 20 }
    ]}>
      {/* Compact Header (Always Visible) */}
      <View style={[styles.px4, styles.py3, styles.flexRow, styles.alignCenter, styles.justifyBetween]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.flex1]}>
          <View style={[styles.p2, styles.roundedFull, styles.bgPrimary100, styles.mr3]}>
            <MaterialIcons 
              name={getManeuverIcon(currentStep.maneuver)} 
              size={24} 
              color={colors.primary[600]} 
            />
          </View>
          
          <View style={[styles.flex1]}>
            <Text style={[styles.textBase, styles.fontSemibold, styles.textGray800]} numberOfLines={1}>
              {currentStep.instruction}
            </Text>
            <View style={[styles.flexRow, styles.alignCenter, styles.mt1]}>
              {distanceToStep && (
                <Text style={[styles.textSm, styles.textGray600, styles.mr3]}>
                  in {formatDistance(distanceToStep)}
                </Text>
              )}
              <Text style={[styles.textSm, styles.textGray600]}>
                {currentStepIndex + 1}/{totalSteps}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={toggleExpanded}
          style={[styles.p2, styles.roundedFull]}
        >
          <MaterialIcons 
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={24} 
            color={colors.gray[600]} 
          />
        </TouchableOpacity>
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={[styles.px4, styles.pb4]}>
          {/* Progress Bar */}
          <View style={[styles.mb4]}>
            <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
              <Text style={[styles.textSm, styles.fontMedium, styles.textGray700]}>
                To {stageName}
              </Text>
              <Text style={[styles.textSm, styles.textGray600]}>
                ETA {estimatedArrival}
              </Text>
            </View>
            <View style={[styles.h2, styles.bgGray200, styles.roundedFull, { overflow: 'hidden' }]}>
              <View 
                style={[
                  styles.h2, 
                  styles.bgPrimary600, 
                  styles.roundedFull,
                  { width: `${progressPercent}%` }
                ]} 
              />
            </View>
            <View style={[styles.flexRow, styles.justifyBetween, styles.mt1]}>
              <Text style={[styles.textXs, styles.textGray500]}>
                {routeInfo ? formatDistance(routeInfo.distance) : ''}
              </Text>
              <Text style={[styles.textXs, styles.textGray500]}>
                {Math.round(progressPercent)}% complete
              </Text>
            </View>
          </View>

          {/* Navigation Controls */}
          <View style={[styles.flexRow, styles.justifyBetween, styles.alignCenter]}>
            {/* Step Navigation */}
            <View style={[styles.flexRow, styles.alignCenter]}>
              <TouchableOpacity
                onPress={handlePreviousStep}
                disabled={currentStepIndex === 0}
                style={[
                  styles.p2, 
                  styles.roundedFull, 
                  currentStepIndex === 0 ? styles.bgGray100 : styles.bgGray200,
                  styles.mr2
                ]}
              >
                <MaterialIcons 
                  name="keyboard-arrow-left" 
                  size={20} 
                  color={currentStepIndex === 0 ? colors.gray[400] : colors.gray[600]} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleNextStep}
                disabled={currentStepIndex === totalSteps - 1}
                style={[
                  styles.p2, 
                  styles.roundedFull, 
                  currentStepIndex === totalSteps - 1 ? styles.bgGray100 : styles.bgGray200
                ]}
              >
                <MaterialIcons 
                  name="keyboard-arrow-right" 
                  size={20} 
                  color={currentStepIndex === totalSteps - 1 ? colors.gray[400] : colors.gray[600]} 
                />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={[styles.flexRow, { gap: 8 }]}>
              <TouchableOpacity
                onPress={onStopNavigation}
                style={[
                  styles.px3,
                  styles.py2,
                  styles.roundedMd,
                  styles.border,
                  styles.borderGray300
                ]}
              >
                <Text style={[styles.textSm, styles.fontMedium, styles.textGray700]}>
                  Stop
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onStageComplete}
                style={[
                  styles.px3,
                  styles.py2,
                  styles.roundedMd,
                  styles.bgPrimary600
                ]}
              >
                <Text style={[styles.textSm, styles.fontMedium, styles.textWhite]}>
                  Arrived
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

export default InAppNavigation;
