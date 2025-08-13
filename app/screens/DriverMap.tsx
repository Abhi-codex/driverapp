import DriverDrawer from "../../components/driver/DriverDrawer";
import DriverMap from "../../components/driver/DriverMap";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, StatusBar, Text, View } from "react-native";
import { runOnJS, useAnimatedGestureHandler, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, styles } from "../../constants/tailwindStyles";
import { useRiderLogic } from "../../hooks/useRiderLogic";

const { height: screenHeight } = Dimensions.get("window");

const SNAP_POINTS = {
  MINIMIZED: screenHeight - 180,
  PARTIAL: screenHeight * 0.5,
  FULL: screenHeight * 0.1,
};

export default function DriverMapScreen() {
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = useState<"MINIMIZED" | "PARTIAL" | "FULL">("MINIMIZED");
  
  const translateY = useSharedValue(SNAP_POINTS.MINIMIZED);
  const autoExpandedRideId = useRef<string | null>(null);

  const {
    online,
    availableRides,
    acceptedRide,
    tripStarted,
    destination,
    handleAcceptRide,
    handleRejectRide,
    toggleOnline,
    updateRideStatus,
    driverStats,
  } = useRiderLogic();

  // Auto-expand drawer when ride is accepted
  useEffect(() => {
    if (acceptedRide?._id && autoExpandedRideId.current !== acceptedRide._id) {
      translateY.value = withSpring(SNAP_POINTS.PARTIAL, {
        damping: 20,
        stiffness: 90,
      });
      setCurrentSnapPoint("PARTIAL");
      autoExpandedRideId.current = acceptedRide._id;
    } 
    else if (!acceptedRide?._id) {
      autoExpandedRideId.current = null;
    }
  }, [acceptedRide?._id]);

  const gestureHandler = useAnimatedGestureHandler({ 
    onStart: (_, context: any) => { context.startY = translateY.value; },
    onActive: (event, context) => { translateY.value = context.startY + event.translationY; },
    onEnd: (event) => { 
      const { velocityY } = event;
      let destSnapPoint = SNAP_POINTS.MINIMIZED;
      const currentY = translateY.value;

      if (currentY < SNAP_POINTS.FULL + 100) {
        destSnapPoint = SNAP_POINTS.FULL;
        runOnJS(setCurrentSnapPoint)("FULL");
      } 

      else if (currentY < SNAP_POINTS.PARTIAL + 100) {
        if (velocityY < -500) {
          destSnapPoint = SNAP_POINTS.FULL;
          runOnJS(setCurrentSnapPoint)("FULL");
        } 
        else if (velocityY > 500) {
          destSnapPoint = SNAP_POINTS.MINIMIZED;
          runOnJS(setCurrentSnapPoint)("MINIMIZED");
        } 
        else {
          destSnapPoint = SNAP_POINTS.PARTIAL;
          runOnJS(setCurrentSnapPoint)("PARTIAL");
        }
      } 
      
      else {
        if (velocityY < -500) {
          destSnapPoint = SNAP_POINTS.PARTIAL;
          runOnJS(setCurrentSnapPoint)("PARTIAL");
        } 
        else {
          destSnapPoint = SNAP_POINTS.MINIMIZED;
          runOnJS(setCurrentSnapPoint)("MINIMIZED");
        }
      }

      translateY.value = withSpring(destSnapPoint, {
        damping: 20,
        stiffness: 90,
      });
    },
  });

  const [routeDetails, setRouteDetails] = useState({
    distanceKm: "0",
    etaMinutes: 0
  });
  
  useEffect(() => {
    if (!driverLocation || !destination || !acceptedRide) {
      setRouteDetails({ distanceKm: "0", etaMinutes: 0 });
      return;
    }
    
    // Simple distance calculation for fallback
    const origin = { latitude: driverLocation.latitude, longitude: driverLocation.longitude };
    const dest = { latitude: destination.latitude, longitude: destination.longitude };
    
    // Calculate distance using Haversine formula (simplified)
    const R = 6371; // Earth's radius in kilometers
    const dLat = (dest.latitude - origin.latitude) * Math.PI / 180;
    const dLon = (dest.longitude - origin.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(origin.latitude * Math.PI / 180) * Math.cos(dest.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const fallbackDistance = R * c;
    
    const fallbackDistanceKm = fallbackDistance.toFixed(2);
    const fallbackEtaMinutes = Math.ceil(parseFloat(fallbackDistanceKm) / 0.666);
    
    setRouteDetails({ distanceKm: fallbackDistanceKm, etaMinutes: fallbackEtaMinutes });
  }, 
  [ driverLocation?.latitude, driverLocation?.longitude, destination?.latitude, destination?.longitude, acceptedRide?._id ]);
  
  // Use the values from state
  const distanceKm = routeDetails.distanceKm;
  const etaMinutes = routeDetails.etaMinutes;
  
  // Calculate fare based on distance
  const fare = driverLocation && destination 
    ? Math.ceil(parseFloat(distanceKm) * 15) 
    : 0;
  // Memoize location initialization to prevent re-runs
  const initializeLocationTracking = React.useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access to use the driver map.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        setLoading(false);
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 10,
        },
        (location) => {
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setDriverLocation(newRegion);
        }
      );

      return () => subscription.remove();
    } 
    catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please check your location settings."
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeLocationTracking();
  }, [initializeLocationTracking]);

  if (loading) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={[styles.mt4, styles.textBase, styles.textGray600]}>
          Initializing location...
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.flex1, styles.bgGray50, styles.pt8]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent/>
      {driverLocation && (
        <DriverMap
          driverLocation={driverLocation}
          destination={destination}
          acceptedRide={acceptedRide}
          routeCoords={[]}
        />
      )}

      {driverLocation && (
        <DriverDrawer
          translateY={translateY}
          currentSnapPoint={currentSnapPoint}
          gestureHandler={gestureHandler}
          acceptedRide={acceptedRide}
          availableRides={availableRides}
          online={online}
          driverLocation={driverLocation}
          destination={destination}
          tripStarted={tripStarted}
          onAcceptRide={(rideId) => handleAcceptRide(rideId, driverLocation)}
          onRejectRide={handleRejectRide}
          onToggleOnline={toggleOnline}
          onUpdateRideStatus={updateRideStatus}
          distanceKm={distanceKm}
          etaMinutes={etaMinutes}
          fare={fare}
        />
      )}
    </View>
  );
}
