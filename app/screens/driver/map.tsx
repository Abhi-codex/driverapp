import DriverDrawer from "@/components/driver/DriverDrawer";
import DriverMap from "@/components/driver/DriverMap";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, StatusBar, Text, View } from "react-native";
import { runOnJS, useAnimatedGestureHandler, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, styles } from "../../constants/TailwindStyles";
import { useRiderLogic } from "../../hooks/useRiderLogic";
import { useRideSearching } from "../../hooks/useRideSearching";
import { getFallbackDistance, LatLng } from "../../utils/directions";

const { height: screenHeight } = Dimensions.get("window");

const SNAP_POINTS = {
  MINIMIZED: screenHeight - 180,
  PARTIAL: screenHeight * 0.5,
  FULL: screenHeight * 0.1,
};

export default function DriverMapScreen() {
  const [driverLocation, setDriverLocation] = useState<{latitude: number; longitude: number;
    latitudeDelta: number; longitudeDelta: number; } | null>(null);
  const [loading, setLoading] = useState(true);

  const translateY = useSharedValue(SNAP_POINTS.MINIMIZED);
  const [currentSnapPoint, setCurrentSnapPoint] = useState< "MINIMIZED" | "PARTIAL" | "FULL" >("MINIMIZED");
  
  const autoExpandedRideId = useRef<string | null>(null);
  
  // Pass driverLocation to useRiderLogic for correct ride filtering
  const { routeCoords, destination, tripStarted, online, availableRides, acceptedRide,
    handleAcceptRide, updateRideStatus, handleRejectRide, toggleOnline } = useRiderLogic(driverLocation ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude } : undefined);

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

  const { isSearching } = useRideSearching({ online, acceptedRide, availableRides });

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
    
      const origin: LatLng = { latitude: driverLocation.latitude, longitude: driverLocation.longitude };
      const dest: LatLng = { latitude: destination.latitude, longitude: destination.longitude };
      
      const fallbackDistance = getFallbackDistance(origin, dest);
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
          "We need location access to help you navigate to patients and show your position on the map.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Request Again", onPress: () => setLoading(false) },
          ]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setDriverLocation(region);
      setLoading(false);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          const newRegion = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
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

      <View style={[styles.flex1]}>
        {driverLocation && (
          <DriverMap
            driverLocation={driverLocation}
            acceptedRide={acceptedRide}
            destination={destination}
            routeCoords={routeCoords}
            online={online}
            availableRides={availableRides}
            isSearching={isSearching}
          />
        )}
      </View>

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
        onAcceptRide={(rideId: string) => {
          if (!driverLocation) {
            Alert.alert('Error', 'Driver location not available. Please wait for GPS to initialize.');
            return;
          }
          
          handleAcceptRide(rideId, driverLocation);
        }}
        onRejectRide={handleRejectRide}
        onToggleOnline={toggleOnline}
        onUpdateRideStatus={updateRideStatus}
        distanceKm={distanceKm}
        etaMinutes={etaMinutes}
        fare={fare}
      />
    </View>
  );
}
