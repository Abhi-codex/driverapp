import React from "react";
import { Dimensions, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { styles } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";
import DriverDrawerContent from "./DriverDrawerContent";
import DriverMinimizedInfo from "./DriverMinimizedInfo";

const { height: screenHeight } = Dimensions.get("window");

interface DriverDrawerProps {
  translateY: any;
  currentSnapPoint: "MINIMIZED" | "PARTIAL" | "FULL";
  gestureHandler: any;
  acceptedRide: Ride | null;
  availableRides: Ride[];
  online: boolean;
  driverLocation: any;
  destination: any;
  tripStarted: boolean;
  loading: boolean;
  onAcceptRide: (rideId: string) => void;
  onRejectRide: (rideId: string) => void;
  onToggleOnline: () => void;
  onUpdateRideStatus: (rideId: string, status: any) => void;
  distanceKm: string;
  etaMinutes: number;
  fare: number;
  
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

export default function DriverDrawer({
  translateY,
  currentSnapPoint,
  gestureHandler,
  acceptedRide,
  availableRides,
  online,
  driverLocation,
  destination,
  tripStarted,
  loading,
  onAcceptRide,
  onRejectRide,
  onToggleOnline,
  onUpdateRideStatus,
  distanceKm,
  etaMinutes,
  fare,
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
}: DriverDrawerProps) {
  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleStyle = useAnimatedStyle(() => {
    const SNAP_POINTS = {
      MINIMIZED: screenHeight - 180,
      PARTIAL: screenHeight * 0.5,
      FULL: screenHeight * 0.1,
    };

    const opacity = interpolate(
      translateY.value,
      [SNAP_POINTS.FULL, SNAP_POINTS.PARTIAL, SNAP_POINTS.MINIMIZED],
      [0.3, 0.6, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[ styles.absolute, styles.left1, styles.right1, styles.bgWhite, styles.rounded2xl, 
          styles.shadowLg, styles.roundedTl3xl, styles.roundedTr3xl,
          { height: screenHeight, top: 0, zIndex: 100 }, drawerStyle ]}>
        <Animated.View
          style={[ styles.alignCenter, styles.py3, styles.borderB1, styles.borderGray100, handleStyle ]}>
          <View
            style={[styles.w12, styles.h1, styles.bgGray300, styles.rounded]}
          />
        </Animated.View>

        {currentSnapPoint === "MINIMIZED" ? (
          <DriverMinimizedInfo
            availableRidesCount={availableRides.length}
            online={online}
            todaysEarnings="125"
            ongoingRide={acceptedRide}
            isNavigating={isNavigating}
            navigationStage={navigationStage}
            currentRoute={currentRoute}
          />
        ) : (
          <View style={[styles.flex1, styles.relative]}>
            <DriverDrawerContent
              currentSnapPoint={currentSnapPoint}
              acceptedRide={acceptedRide}
              availableRides={availableRides}
              online={online}
              driverLocation={driverLocation}
              destination={destination}
              tripStarted={tripStarted}
              loading={loading}
              onAcceptRide={onAcceptRide}
              onRejectRide={onRejectRide}
              onToggleOnline={onToggleOnline}
              onUpdateRideStatus={onUpdateRideStatus}
              distanceKm={distanceKm}
              etaMinutes={etaMinutes}
              fare={fare}
              isNavigating={isNavigating}
              navigationStage={navigationStage}
              currentRoute={currentRoute}
              navigationMode={navigationMode}
              onNavigationStart={onNavigationStart}
              onNavigationStop={onNavigationStop}
              onStageComplete={onStageComplete}
              onToggleNavigationMode={onToggleNavigationMode}
              onCancelRide={onCancelRide}
              onCheckCanCancel={onCheckCanCancel}
            />
          </View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
}
