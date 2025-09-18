import React, { useState, useCallback, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { styles, colors } from "../../constants/tailwindStyles";
import { Ride, DriverStats } from "../../types/rider";
import AcceptedRideInfo from "./AcceptedRideInfo";
import AvailableRidesList from "./AvailableRidesList";
import NoRidesAvailable from "./NoRidesAvailable";
import DriverControlPanel from "./DriverControlPanel";
import DriverQuickStats from "./DriverQuickStats";
import NavigationModeToggle from "./NavigationModeToggle";

interface DriverDrawerContentProps {
  currentSnapPoint: "MINIMIZED" | "PARTIAL" | "FULL";
  acceptedRide: Ride | null;
  availableRides: Ride[];
  online: boolean;
  driverLocation: any;
  destination: any;
  tripStarted: boolean;
  onAcceptRide: (rideId: string) => void;
  onRejectRide: (rideId: string) => void;
  onToggleOnline: () => void;
  onUpdateRideStatus: (rideId: string, status: any) => void;
  distanceKm: string;
  etaMinutes: number;
  fare: number;
  driverStats?: DriverStats;
  
  // Navigation props
  isNavigating?: boolean;
  navigationStage?: 'idle' | 'to_patient' | 'to_hospital';
  currentRoute?: any;
  navigationMode?: 'in-app' | 'external';
  onNavigationStart?: (destination: { latitude: number; longitude: number }, stage: 'to_patient' | 'to_hospital') => void;
  onNavigationStop?: () => void;
  onStageComplete?: (stage: 'pickup' | 'dropoff') => void;
  onToggleNavigationMode?: () => void;
  
  // Cancel ride props
  onCancelRide?: (rideId: string, reason: string) => Promise<void>;
  onCheckCanCancel?: (rideId: string) => Promise<any>;
}

export default function DriverDrawerContent({
  currentSnapPoint,
  acceptedRide,
  availableRides,
  online,
  driverLocation,
  onAcceptRide,
  onRejectRide,
  onToggleOnline,
  onUpdateRideStatus,
  tripStarted,
  distanceKm,
  etaMinutes,
  fare,
  driverStats,
  isNavigating = false,
  navigationStage = 'idle',
  currentRoute = null,
  navigationMode = 'external',
  onNavigationStart,
  onNavigationStop,
  onStageComplete,
  onToggleNavigationMode,
  onCancelRide,
  onCheckCanCancel,
}: DriverDrawerContentProps) {
  // Navigation state management
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState('--:--');

  // Calculate progress based on current step
  const totalSteps = currentRoute?.steps?.length || 0;
  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;
  const currentStep = currentRoute?.steps?.[currentStepIndex];

  // Handle cancel ride
  const handleCancelRide = useCallback(async () => {
    if (!acceptedRide || !onCancelRide || !onCheckCanCancel) return;

    try {
      // First check if cancellation is allowed
      const canCancelResult = await onCheckCanCancel(acceptedRide._id);
      
      if (!canCancelResult?.canCancel) {
        Alert.alert(
          'Cannot Cancel',
          canCancelResult?.message || 'This ride cannot be cancelled at this time.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show cancellation options
      Alert.alert(
        'Cancel Ride',
        `Are you sure you want to cancel this ride?${canCancelResult.cancellationFee > 0 ? `\n\nNote: Patient will be charged ₹${canCancelResult.cancellationFee} cancellation fee.` : ''}`,
        [
          { text: 'Keep Ride', style: 'cancel' },
          {
            text: 'Cancel Ride',
            style: 'destructive',
            onPress: () => showCancelReasonDialog()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check cancellation eligibility');
    }
  }, [acceptedRide, onCancelRide, onCheckCanCancel]);

  // Show cancel reason dialog
  const showCancelReasonDialog = useCallback(() => {
    if (!acceptedRide || !onCancelRide) return;

    Alert.alert(
      'Cancel Reason',
      'Please select a reason for cancellation:',
      [
        { text: 'Emergency resolved', onPress: () => processCancellation('Emergency resolved by patient') },
        { text: 'Unable to reach location', onPress: () => processCancellation('Driver unable to reach pickup location') },
        { text: 'Vehicle breakdown', onPress: () => processCancellation('Vehicle breakdown - technical issue') },
        { text: 'Other reason', onPress: () => processCancellation('Other - driver initiated cancellation') },
        { text: 'Back', style: 'cancel' }
      ]
    );
  }, [acceptedRide, onCancelRide]);

  // Process the cancellation
  const processCancellation = useCallback(async (reason: string) => {
    if (!acceptedRide || !onCancelRide) return;

    try {
      await onCancelRide(acceptedRide._id, reason);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel ride. Please try again.');
    }
  }, [acceptedRide, onCancelRide]);

  // Format distance for display
  const formatDistance = useCallback((distance: string | number) => {
    const num = typeof distance === 'string' ? parseFloat(distance) : distance;
    if (num < 1000) {
      return `${Math.round(num)}m`;
    }
    return `${(num / 1000).toFixed(1)}km`;
  }, []);

  // Format duration for display
  const formatDuration = useCallback((duration: string | number) => {
    const seconds = typeof duration === 'string' ? parseFloat(duration) : duration;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }, []);

  // Get maneuver icon
  const getManeuverIcon = useCallback((maneuver: string): "navigation" | "turn-left" | "turn-right" | "arrow-upward" | "merge" | "rotate-left" | "rotate-right" | "call-split" | "directions-boat" | "train" => {
    const maneuverMap: { [key: string]: "navigation" | "turn-left" | "turn-right" | "arrow-upward" | "merge" | "rotate-left" | "rotate-right" | "call-split" | "directions-boat" | "train" } = {
      'turn-left': 'turn-left',
      'turn-right': 'turn-right',
      'turn-slight-left': 'turn-left', 
      'turn-slight-right': 'turn-right',
      'turn-sharp-left': 'turn-left',
      'turn-sharp-right': 'turn-right',
      'uturn-left': 'turn-left',
      'uturn-right': 'turn-right', 
      'straight': 'arrow-upward',
      'keep-left': 'merge',
      'keep-right': 'merge',
      'merge': 'merge',
      'roundabout-left': 'rotate-left',
      'roundabout-right': 'rotate-right',
      'exit-roundabout': 'rotate-right',
      'fork-left': 'call-split',
      'fork-right': 'call-split',
      'ramp-left': 'turn-left',
      'ramp-right': 'turn-right',
      'ferry': 'directions-boat',
      'ferry-train': 'train',
    };
    return maneuverMap[maneuver?.toLowerCase()] || 'navigation';
  }, []);

  // Step navigation handlers
  const handlePreviousStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  // Update estimated arrival when route changes
  useEffect(() => {
    if (currentRoute?.duration) {
      const now = new Date();
      const minutes = Math.round(currentRoute.duration / 60); // Convert seconds to minutes
      const arrival = new Date(now.getTime() + minutes * 60000);
      setEstimatedArrival(arrival.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }));
    }
  }, [currentRoute]);

  // Reset step index when route changes
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [currentRoute]);

  const stats = driverStats || {
    totalRides: 0,
    todayRides: 0,
    todayEarnings: 0,
    weeklyRides: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    rating: 0,
  };
  return (
    <ScrollView
      style={[styles.flex1, styles.px4]}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      bounces={true}
      keyboardShouldPersistTaps="handled"
    >
      {acceptedRide ? (
        <View style={[styles.py4]}>
          {/* Show navigation content if navigating */}
          {isNavigating && currentRoute && currentStep ? (
            <View>
              {/* Navigation Header with Current Step */}
              <View style={[styles.mb4, styles.p4, styles.roundedLg, { backgroundColor: colors.primary[50] }]}>
                <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb3]}>
                  <View style={[styles.flexRow, styles.alignCenter]}>
                    <View style={[styles.w10, styles.h10, styles.roundedFull, styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.primary[100] }]}>
                      <MaterialIcons 
                        name={getManeuverIcon(currentStep.maneuver)} 
                        size={20} 
                        color={colors.primary[600]} 
                      />
                    </View>
                    <View style={[styles.ml3, styles.flex1]}>
                      <Text style={[styles.textLg, styles.fontSemibold, styles.textGray900]} numberOfLines={2}>
                        {currentStep.instruction}
                      </Text>
                      <Text style={[styles.textSm, styles.textGray600]}>
                        Step {currentStepIndex + 1} of {totalSteps}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={[styles.mb3]}>
                  <View style={[styles.flexRow, styles.justifyBetween, styles.mb2]}>
                    <Text style={[styles.textSm, styles.textGray600]}>
                      {navigationStage === 'to_patient' ? 'To Patient' : 'To Hospital'}
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
                      {Math.round(progressPercent)}% complete
                    </Text>
                    <Text style={[styles.textXs, styles.textGray500]}>
                      {formatDistance(currentRoute.distance)} • {formatDuration(currentRoute.duration)}
                    </Text>
                  </View>
                </View>

                {/* Step Navigation Controls */}
                <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb3]}>
                  <View style={[styles.flexRow, styles.alignCenter]}>
                    <TouchableOpacity
                      onPress={handlePreviousStep}
                      disabled={currentStepIndex === 0}
                      style={[
                        styles.p2, 
                        styles.roundedLg, 
                        styles.mr2,
                        currentStepIndex === 0 ? styles.bgGray100 : styles.bgGray200,
                        styles.alignCenter,
                        styles.justifyCenter,
                        { minWidth: 36 }
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
                        styles.roundedLg,
                        currentStepIndex === totalSteps - 1 ? styles.bgGray100 : styles.bgGray200,
                        styles.alignCenter,
                        styles.justifyCenter,
                        { minWidth: 36 }
                      ]}
                    >
                      <MaterialIcons 
                        name="keyboard-arrow-right" 
                        size={20} 
                        color={currentStepIndex === totalSteps - 1 ? colors.gray[400] : colors.gray[600]} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Distance info */}
                  <Text style={[styles.textSm, styles.textGray600]}>
                    {currentStep.distance && formatDistance(currentStep.distance)}
                  </Text>
                </View>

                {/* Navigation Controls */}
                <View style={[styles.flexRow, styles.gap2]}>
                  <TouchableOpacity
                    onPress={onNavigationStop}
                    style={[styles.flex1, styles.py3, styles.px3, styles.roundedLg, styles.alignCenter, { backgroundColor: colors.gray[100] }]}
                  >
                    <Text style={[styles.fontMedium, styles.textGray700, styles.textSm]}>
                      Stop
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => onStageComplete && onStageComplete(navigationStage === 'to_patient' ? 'pickup' : 'dropoff')}
                    style={[styles.flex2, styles.py3, styles.px4, styles.roundedLg, styles.alignCenter, { backgroundColor: colors.primary[600] }]}
                  >
                    <Text style={[styles.fontMedium, styles.textWhite, styles.textSm]}>
                      {navigationStage === 'to_patient' ? 'Pickup Complete' : 'Dropoff Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Turn by turn instructions list */}
              {currentRoute.steps && currentRoute.steps.length > 0 && (
                <View style={[styles.mb4, styles.flex1]}>
                  <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.mb3]}>
                    All Directions ({totalSteps} steps)
                  </Text>
                  <ScrollView 
                    style={[{ 
                      maxHeight: currentSnapPoint === "FULL" ? 500 : 350, 
                      minHeight: 200 
                    }]} 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {currentRoute.steps.map((step: any, index: number) => (
                      <TouchableOpacity 
                        key={index} 
                        onPress={() => setCurrentStepIndex(index)}
                        style={[
                          styles.flexRow, 
                          styles.p2, 
                          styles.mb1, 
                          styles.roundedLg, 
                          { backgroundColor: index === currentStepIndex ? colors.primary[100] : colors.gray[50] }
                        ]}
                      >
                        <View style={[
                          styles.w8, 
                          styles.h8, 
                          styles.roundedFull, 
                          styles.alignCenter, 
                          styles.justifyCenter, 
                          styles.mr3, 
                          { backgroundColor: index === currentStepIndex ? colors.primary[200] : colors.gray[200] }
                        ]}>
                          <Text style={[
                            styles.textXs, 
                            styles.fontBold, 
                            index === currentStepIndex ? styles.textPrimary700 : styles.textGray600
                          ]}>
                            {index + 1}
                          </Text>
                        </View>
                        <View style={[styles.flex1]}>
                          <Text style={[
                            styles.textSm, 
                            index === currentStepIndex ? styles.textGray900 : styles.textGray700
                          ]} numberOfLines={2}>
                            {step.instruction}
                          </Text>
                          {step.distance && (
                            <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>
                              {formatDistance(step.distance)}
                            </Text>
                          )}
                        </View>
                        {index === currentStepIndex && (
                          <View style={[styles.alignCenter, styles.justifyCenter, styles.ml2]}>
                            <MaterialIcons name="my-location" size={16} color={colors.primary[600]} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            // Show navigation controls if ride accepted but not navigating
            acceptedRide && onNavigationStart && !isNavigating && (
              <View style={[styles.mb4, styles.p4, styles.roundedLg, { backgroundColor: colors.gray[50] }]}>
                <View style={[styles.flexRow, styles.alignCenter, styles.justifyBetween, styles.mb3]}>
                  <View style={[styles.flexRow, styles.alignCenter]}>
                    <View style={[styles.w10, styles.h10, styles.roundedFull, styles.alignCenter, styles.justifyCenter, { backgroundColor: colors.gray[100] }]}>
                      <MaterialCommunityIcons name="navigation-outline" size={20} color={colors.gray[600]} />
                    </View>
                    <Text style={[styles.textBase, styles.fontSemibold, styles.textGray900, styles.ml3]}>
                      Navigation Available
                    </Text>
                  </View>
                </View>

                {/* Navigation Mode Toggle */}
                {onToggleNavigationMode && (
                  <NavigationModeToggle
                    navigationMode={navigationMode}
                    onToggle={onToggleNavigationMode}
                  />
                )}

                <TouchableOpacity
                  onPress={() => {
                    const destination = navigationStage === 'to_patient' || !tripStarted 
                      ? acceptedRide.pickup 
                      : acceptedRide.drop;
                    const stage = navigationStage === 'to_patient' || !tripStarted ? 'to_patient' : 'to_hospital';
                    onNavigationStart(destination, stage);
                  }}
                  style={[styles.w100, styles.py3, styles.px4, styles.roundedLg, styles.alignCenter, { backgroundColor: colors.primary[600] }]}
                >
                  <Text style={[styles.fontMedium, styles.textWhite, styles.textSm]}>
                    Start Navigation
                  </Text>
                </TouchableOpacity>

                {/* Cancel Ride Button */}
                {onCancelRide && (
                  <TouchableOpacity
                    onPress={handleCancelRide}
                    style={[
                      styles.w100, 
                      styles.py3, 
                      styles.px4, 
                      styles.roundedLg, 
                      styles.alignCenter, 
                      styles.mt2,
                      { backgroundColor: colors.danger[600], borderWidth: 1, borderColor: colors.danger[500] }
                    ]}
                  >
                    <View style={[styles.flexRow, styles.alignCenter]}>
                      <MaterialCommunityIcons 
                        name="close-circle" 
                        size={16} 
                        color="white" 
                        style={styles.mr1} 
                      />
                      <Text style={[styles.fontMedium, styles.textWhite, styles.textSm]}>
                        Cancel Ride
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )
          )}
          
          <AcceptedRideInfo acceptedRide={acceptedRide} driverLocation={driverLocation} />
        </View>
      ) : (
        <View style={[styles.py4]}>
          <DriverQuickStats
            availableRidesCount={availableRides.length}
            rating={stats.rating.toFixed(1)}
            todaysEarnings={stats.todayEarnings.toString()}
          />

          <View>
            {availableRides.length > 0 ? (
              <AvailableRidesList
                online={online}
                acceptedRide={acceptedRide}
                availableRides={availableRides}
                driverLocation={driverLocation}
                onAcceptRide={(rideId: string) => onAcceptRide(rideId)}
                onRejectRide={onRejectRide}
              />
            ) : (
              <NoRidesAvailable />
            )}
          </View>

          {currentSnapPoint === "FULL" && (
            <View style={[styles.mt6]}>
              <DriverControlPanel
                online={online}
                distanceKm={distanceKm}
                etaMinutes={etaMinutes}
                fare={fare}
                acceptedRide={acceptedRide}
                tripStarted={tripStarted}
                onToggleOnline={onToggleOnline}
                onUpdateRideStatus={onUpdateRideStatus}
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
