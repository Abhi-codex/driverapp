import React, { memo, useState, useEffect } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { styles, colors } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";

interface DriverMinimizedInfoProps {
  availableRidesCount: number;
  online: boolean;
  todaysEarnings: string;
  ongoingRide?: Ride | null;
  isNavigating?: boolean;
  navigationStage?: 'idle' | 'to_patient' | 'to_hospital';
  currentRoute?: any;
}

function DriverMinimizedInfo({
  availableRidesCount,
  ongoingRide,
  isNavigating = false,
  navigationStage = 'idle',
  currentRoute = null,
}: DriverMinimizedInfoProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');

  const currentStep = currentRoute?.steps?.[currentStepIndex];
  const totalSteps = currentRoute?.steps?.length || 0;
  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  // Calculate estimated arrival time
  useEffect(() => {
    if (currentRoute) {
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + (currentRoute.duration || 0) * 1000);
      setEstimatedArrival(arrivalTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }
  }, [currentRoute]);

  const formatDistance = (meters: string | number) => {
    const num = typeof meters === 'string' ? parseFloat(meters) : meters;
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} km`;
    }
    return `${Math.round(num)} m`;
  };

  const formatDuration = (seconds: string | number) => {
    const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
    const minutes = Math.round(num / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getManeuverIcon = (maneuver: string): "navigation" | "turn-left" | "turn-right" | "arrow-upward" | "merge" | "rotate-left" | "call-split" | "straight" => {
    switch (maneuver?.toLowerCase()) {
      case 'turn-left':
      case 'turn-slight-left':
      case 'turn-sharp-left':
        return 'turn-left';
      case 'turn-right':
      case 'turn-slight-right':
      case 'turn-sharp-right':
        return 'turn-right';
      case 'uturn-left':
      case 'uturn-right':
        return 'turn-left';
      case 'continue':
      case 'straight':
        return 'arrow-upward';
      case 'merge':
        return 'merge';
      case 'fork-left':
        return 'call-split';
      case 'fork-right':
        return 'call-split';
      case 'roundabout-left':
      case 'roundabout-right':
        return 'rotate-left';
      default:
        return 'navigation';
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };
  if (ongoingRide && ongoingRide.pickup && ongoingRide.drop) {
    // If navigating, show navigation info
    if (isNavigating && currentRoute && currentStep) {
      return (
        <View style={[styles.px4, styles.py3]}>
          <View style={[styles.flexCol, styles.justifyCenter, styles.alignCenter]}>
            {/* Navigation Header with maneuver */}
            <View style={[styles.flexRow, styles.alignCenter, styles.mb2, styles.w100]}>
              <View style={[styles.w8, styles.h8, styles.roundedFull, styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.primary[100] }]}>
                <MaterialIcons 
                  name={getManeuverIcon(currentStep.maneuver)} 
                  size={16} 
                  color={colors.primary[600]} 
                />
              </View>
              <View style={[styles.flex1, styles.ml2]}>
                <Text style={[styles.fontSemibold, styles.textGray900, styles.textSm]} numberOfLines={1}>
                  {currentStep.instruction}
                </Text>
                <Text style={[styles.textXs, styles.textGray600]}>
                  {currentStepIndex + 1}/{totalSteps} steps
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.w100, styles.mb2]}>
              <View style={[styles.flexRow, styles.justifyBetween, styles.mb1]}>
                <Text style={[styles.textXs, styles.textGray600]}>
                  {navigationStage === 'to_patient' ? 'To Patient' : 'To Hospital'}
                </Text>
                <Text style={[styles.textXs, styles.textGray600]}>
                  ETA {estimatedArrival}
                </Text>
              </View>
              <View style={[styles.h1, styles.bgGray200, styles.roundedFull, { overflow: 'hidden' }]}>
                <View 
                  style={[
                    styles.h1, 
                    styles.bgPrimary600, 
                    styles.roundedFull,
                    { width: `${progressPercent}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Navigation Controls */}
            <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.w100]}>
              {/* Step Navigation */}
              <View style={[styles.flexRow, styles.alignCenter]}>
                <TouchableOpacity
                  onPress={handlePreviousStep}
                  disabled={currentStepIndex === 0}
                  style={[
                    styles.p1, 
                    styles.roundedFull, 
                    currentStepIndex === 0 ? styles.bgGray100 : styles.bgGray200,
                    styles.mr1
                  ]}
                >
                  <MaterialIcons 
                    name="keyboard-arrow-left" 
                    size={16} 
                    color={currentStepIndex === 0 ? colors.gray[400] : colors.gray[600]} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleNextStep}
                  disabled={currentStepIndex === totalSteps - 1}
                  style={[
                    styles.p1, 
                    styles.roundedFull, 
                    currentStepIndex === totalSteps - 1 ? styles.bgGray100 : styles.bgGray200
                  ]}
                >
                  <MaterialIcons 
                    name="keyboard-arrow-right" 
                    size={16} 
                    color={currentStepIndex === totalSteps - 1 ? colors.gray[400] : colors.gray[600]} 
                  />
                </TouchableOpacity>
              </View>

              {/* Distance and completion */}
              <View style={[styles.flexRow, styles.alignCenter]}>
                <Text style={[styles.textXs, styles.textGray500]}>
                  {formatDistance(currentRoute.distance)} • {Math.round(progressPercent)}%
                </Text>
              </View>
            </View>

            {/* Swipe hint */}
            <Text style={[styles.textXs, styles.textGray400, styles.mt2]}>
              Swipe up for full directions
            </Text>
          </View>
        </View>
      );
    }

    // Regular ride info when not navigating
    if (!ongoingRide || !ongoingRide.pickup || !ongoingRide.drop) {
      // Show available rides info when no valid ride data
      return (
        <View style={[styles.px4, styles.py3]}>
          <View style={[styles.flexCol, styles.justifyCenter, styles.alignCenter]}>
            {/* Header */}
            <View style={[styles.flexRow, styles.alignCenter, styles.mb3]}>
              <View style={[styles.w8, styles.h8, styles.roundedFull, styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.gray[100] }]}>
                <MaterialCommunityIcons 
                  name="ambulance" 
                  size={16} 
                  color={colors.emergency[600]} 
                />
              </View>
              <Text style={[styles.fontSemibold, styles.textGray900, styles.textSm, styles.ml2]}>
                Emergency Requests
              </Text>
            </View>

            {/* Available count */}
            {availableRidesCount > 0 ? (
              <View style={[styles.flexRow, styles.alignCenter, styles.px3, styles.py2, styles.rounded, { backgroundColor: colors.gray[100] }]}>
                <Text style={[styles.fontSemibold, styles.textBase, styles.textGray700]}>
                  {availableRidesCount}
                </Text>
                <Text style={[styles.textSm, styles.textGray600, styles.ml1]}>
                  emergency call{availableRidesCount !== 1 ? "s" : ""} available
                </Text>
              </View>
            ) : (
              <View style={[styles.flexRow, styles.alignCenter, styles.px3, styles.py2, styles.rounded, { backgroundColor: colors.gray[100] }]}>
                <Text style={[styles.textSm, styles.textGray600]}>
                  No emergency calls at the moment
                </Text>
              </View>
            )}

            <Text style={[styles.textXs, styles.textGray400, styles.mt2]}>
              Swipe up for more details
            </Text>
          </View>
        </View>
      );
    }

    const getAmbulanceIcon = (vehicle: string) => {
      const icons = {
        'bls': 'medical-bag',
        'als': 'heart-pulse', 
        'ccs': 'hospital',
        'auto': 'car-emergency',
        'bike': 'motorbike'
      };
      return icons[vehicle as keyof typeof icons] || 'ambulance';
    };

    const getStatusColor = (status: string) => {
      const statusColors = {
        'ACCEPTED': colors.warning[600],
        'ARRIVED': colors.primary[600],
        'START': colors.medical[600],
        'COMPLETED': colors.medical[600],
        'SEARCHING': colors.emergency[600]
      };
      return statusColors[status as keyof typeof statusColors] || colors.gray[600];
    };

    const formatAddress = (address: string) => {
      const parts = address.split(',');
      return parts.length > 2 ? `${parts[0]}, ${parts[1]}` : address;
    };

    return (
      <View style={[styles.px4, styles.py3]}>
        <View style={[styles.flexCol, styles.justifyCenter, styles.alignCenter]}>
          {/* Header with ambulance icon */}
          <View style={[styles.flexRow, styles.alignCenter, styles.mb3]}>
            <View style={[styles.w8, styles.h8, styles.roundedFull, styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.gray[100] }]}>
              <MaterialCommunityIcons 
                name={getAmbulanceIcon(ongoingRide?.vehicle || 'auto') as any} 
                size={16} 
                color={colors.emergency[600]} 
              />
            </View>
            <Text style={[styles.fontSemibold, styles.textGray900, styles.textSm, styles.ml2]}>
              Emergency in Progress
            </Text>
          </View>

          {/* Route info with better spacing */}
          <View style={[styles.w100, styles.mb3]}>
            <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
              <MaterialCommunityIcons 
                name="map-marker" 
                size={12} 
                color={colors.gray[500]} 
                style={[styles.mr2]}
              />
              <Text style={[styles.textXs, styles.textGray600, styles.flex1]} numberOfLines={1}>
                {ongoingRide?.pickup?.address ? formatAddress(ongoingRide.pickup.address) : 'Pickup location'}
              </Text>
            </View>

            <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
              <MaterialCommunityIcons 
                name="hospital-building" 
                size={12} 
                color={colors.gray[500]} 
                style={[styles.mr2]}
              />
              <Text style={[styles.textXs, styles.textGray600, styles.flex1]} numberOfLines={1}>
                {ongoingRide?.drop?.address ? formatAddress(ongoingRide.drop.address) : 'Destination'}
              </Text>
            </View>
          </View>

          {/* Status and navigation hint */}
          <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.w100]}>
            <View style={[ styles.flexRow, styles.alignCenter, styles.px2, styles.py1, styles.rounded, { backgroundColor: colors.gray[100] }]}>
              <Text style={[styles.textXs, styles.fontMedium, styles.textGray700]}>
                {ongoingRide.status.charAt(0) + ongoingRide.status.slice(1).toLowerCase()}
              </Text>
            </View>
            
            <Text style={[styles.textXs, styles.textGray500]}>
              Tap for details
            </Text>
          </View>

          {/* Swipe hint */}
          <Text style={[styles.textXs, styles.textGray400, styles.mt2]}>
            Swipe up for ride details
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.px4, styles.py3]}>
      <View style={[styles.flexCol, styles.justifyCenter, styles.alignCenter]}>
        {/* Available rides header */}
        <View style={[styles.flexRow, styles.alignCenter, styles.mb3]}>
          <View style={[styles.w8, styles.h8, styles.roundedFull, styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.gray[100] }]}>
            <MaterialCommunityIcons 
              name="ambulance" 
              size={16} 
              color={colors.gray[600]} 
            />
          </View>
          <Text style={[styles.fontSemibold, styles.textGray900, styles.textSm, styles.ml2]}>
            Emergency Requests
          </Text>
        </View>

        {/* Available count */}
        {availableRidesCount > 0 ? (
          <View style={[styles.flexRow, styles.alignCenter, styles.px3, styles.py2, styles.rounded, { backgroundColor: colors.gray[100] }]}>
            <Text style={[styles.fontSemibold, styles.textBase, styles.textGray700]}>
              {availableRidesCount}
            </Text>
            <Text style={[styles.textSm, styles.textGray600, styles.ml1]}>
              emergency call{availableRidesCount !== 1 ? "s" : ""} available
            </Text>
          </View>
        ) : (
          <View style={[styles.flexRow, styles.alignCenter, styles.px3, styles.py2, styles.rounded, { backgroundColor: colors.gray[100] }]}>
            <Text style={[styles.textSm, styles.textGray600]}>
              No emergency calls at the moment
            </Text>
          </View>
        )}

        <Text style={[styles.textXs, styles.textGray400, styles.mt2]}>
          Swipe up for more details
        </Text>
      </View>
    </View>
  );
}

export default memo(DriverMinimizedInfo);
