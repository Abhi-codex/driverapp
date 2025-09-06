import DriverDrawer from "../../components/driver/DriverDrawer";
import DriverMap from "../../components/driver/DriverMap";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, StatusBar, Text, View, TouchableOpacity, BackHandler } from "react-native";
import { runOnJS, useAnimatedGestureHandler, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, styles } from "../../constants/tailwindStyles";
import { useRiderLogic } from "../../hooks/useRiderLogic";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

const { height: screenHeight } = Dimensions.get("window");

const SNAP_POINTS = {
  MINIMIZED: screenHeight - 180,
  PARTIAL: screenHeight * 0.5,
  FULL: screenHeight * 0.1,
};

export default function DriverMapScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = useState<"MINIMIZED" | "PARTIAL" | "FULL">("MINIMIZED");
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  
  const translateY = useSharedValue(SNAP_POINTS.MINIMIZED);
  const autoExpandedRideId = useRef<string | null>(null);

  const {
    online,
    availableRides,
    acceptedRide,
    tripStarted,
    destination,
    routeCoords,
    handleAcceptRide,
    handleRejectRide,
    toggleOnline,
    updateRideStatus,
    updateDriverLocation,
    driverStats,
    
    // Navigation functions
    startNavigation,
    stopNavigation,
    handleStageComplete,
    isNavigating,
    navigationStage,
    currentRoute
  } = useRiderLogic(); // Remove driverLocation parameter to prevent continuous refresh

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

  // Handle back button protection when driver has accepted ride
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (acceptedRide) {
          handleBackWithActiveRide();
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [acceptedRide])
  );

  const handleBackWithActiveRide = () => {
    Alert.alert(
      'Active Ride',
      'You have an ongoing ride. Do you want to return to the dashboard? Your ride will remain active.',
      [
        {
          text: 'Stay on Map',
          style: 'cancel'
        },
        {
          text: 'Go to Dashboard',
          onPress: () => {
            // Navigate to dashboard but keep ride active
            router.push('/screens/DriverDashboard');
          }
        }
      ]
    );
  };

  const handleBackButtonPress = () => {
    if (acceptedRide) {
      handleBackWithActiveRide();
    } else {
      router.back();
    }
  };

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
      setLoading(true);
      console.log('🎯 Starting location initialization...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access to use the driver map.",
          [
            { text: "Cancel", style: "cancel", onPress: () => router.back() },
            { text: "Open Settings", onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        setLoading(false);
        return;
      }

      console.log('📍 Location permission granted, getting current position...');
      
      // Get initial position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      console.log('📍 Initial location set:', newRegion);
      setDriverLocation(newRegion);
      updateDriverLocation(newRegion); // Update the hook's location
      setLoading(false);

      // Start watching position with optimized settings
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced
          timeInterval: 10000, // Update every 10 seconds instead of 5
          distanceInterval: 50, // Update when moved 50 meters instead of 20
        },
        (location) => {
          const updatedRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          // Reduced logging frequency
          // console.log('📍 Location updated:', updatedRegion);
          setDriverLocation(updatedRegion);
          updateDriverLocation(updatedRegion); // Update the hook's location
        }
      );

      setLocationSubscription(subscription);
      console.log('✅ Location tracking initialized successfully');
    } 
    catch (error) {
      console.error("❌ Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please check your location settings.",
        [
          { text: "Retry", onPress: initializeLocationTracking },
          { text: "Go Back", onPress: () => router.back() }
        ]
      );
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    initializeLocationTracking();
    
    // Cleanup location subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
        console.log('🧹 Location subscription cleaned up');
      }
    };
  }, [initializeLocationTracking]);
  
  // Check online status and redirect if offline
  useEffect(() => {
    if (!loading && !online) {
      Alert.alert(
        'Offline Mode',
        'You are currently offline. Please go online to accept rides.',
        [
          { text: 'Go Back', onPress: () => router.back() },
          { 
            text: 'Go Online', 
            onPress: async () => {
              await toggleOnline();
            }
          }
        ]
      );
    }
  }, [online, loading, toggleOnline, router]);

  if (loading) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={[styles.mt4, styles.textBase, styles.textGray600]}>
          Initializing location...
        </Text>
        <Text style={[styles.mt2, styles.textSm, styles.textGray500, styles.textCenter, styles.px4]}>
          Please ensure location services are enabled for InstaAid
        </Text>
      </View>
    );
  }

  if (!driverLocation) {
    return (
      <View style={[styles.flex1, styles.justifyCenter, styles.alignCenter, styles.bgGray50]}>
        <MaterialIcons name="location-off" size={64} color={colors.gray[400]} />
        <Text style={[styles.mt4, styles.textBase, styles.textGray600]}>
          Unable to access location
        </Text>
        <TouchableOpacity 
          style={[styles.mt4, styles.bgPrimary600, styles.px5, styles.py3, styles.roundedLg]}
          onPress={initializeLocationTracking}
        >
          <Text style={[styles.textWhite, styles.fontMedium]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={[styles.flex1, styles.bgGray50, styles.pt8]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent/>
      
      {/* Back Button */}
      <View style={[styles.absolute, { top: 50, left: 20, zIndex: 1000 }]}>
        <TouchableOpacity
          style={[styles.bgWhite, styles.roundedFull, styles.p3, styles.shadow]}
          onPress={handleBackButtonPress}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {driverLocation && (
        <DriverMap
          driverLocation={driverLocation}
          destination={destination}
          acceptedRide={acceptedRide}
          routeCoords={routeCoords}
          tripStarted={tripStarted}
          onNavigationStart={startNavigation}
          onNavigationStop={stopNavigation}
          onStageComplete={handleStageComplete}
          isNavigating={isNavigating}
          navigationStage={navigationStage}
          currentRoute={currentRoute}
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
          isNavigating={isNavigating}
          navigationStage={navigationStage}
          currentRoute={currentRoute}
          onNavigationStart={startNavigation}
          onNavigationStop={stopNavigation}
          onStageComplete={handleStageComplete}
        />
      )}
    </View>
  );
}
