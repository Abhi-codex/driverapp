import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";
import { MapViewWrapper as MapView, MarkerWrapper as Marker, PolylineWrapper as Polyline, CircleWrapper as Circle } from "../MapView";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteInfo } from '../../utils/navigationService';

interface DriverMapProps {
  driverLocation: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  acceptedRide: Ride | null;
  destination: { latitude: number; longitude: number } | null;
  routeCoords: Array<{ latitude: number; longitude: number }>;
  online?: boolean;
  availableRides?: Ride[];
  isSearching?: boolean;
  tripStarted?: boolean;
  
  // Navigation props
  onNavigationStart?: (destination: { latitude: number; longitude: number }, stage: 'to_patient' | 'to_hospital') => void;
  onNavigationStop?: () => void;
  onStageComplete?: (stage: 'pickup' | 'dropoff') => void;
  
  // In-app navigation props
  isNavigating?: boolean;
  navigationStage?: 'idle' | 'to_patient' | 'to_hospital';
  currentRoute?: RouteInfo | null;
}

function DriverMap({
  driverLocation,
  acceptedRide,
  routeCoords,
  online = true,
  availableRides = [],
  tripStarted = false,
  onNavigationStart,
  onNavigationStop,
  onStageComplete,
  isNavigating = false,
  navigationStage = 'idle',
  currentRoute = null
}: DriverMapProps) {

  const mountedRef = useRef(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const mapRef = useRef<any>(null);
  
  // Enhanced route visualization states
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [followUserLocation, setFollowUserLocation] = useState(true);
  
  useEffect(() => {
    // Show fallback after 5 seconds if map hasn't loaded
    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        console.log('🗺️ Map loading timeout, showing fallback');
        setShowFallback(true);
      }
    }, 5000);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
    };
  }, [mapLoaded]);

  // Stable memoized values with higher precision to prevent re-renders
  const stableDriverLocation = useMemo(() => {
    if (!driverLocation) return null;
    return {
      latitude: Number(driverLocation.latitude.toFixed(8)), // 8 decimal places ≈ 1.1m accuracy
      longitude: Number(driverLocation.longitude.toFixed(8))
    };
  }, [
    driverLocation ? Math.round(driverLocation.latitude * 100000000) : 0, // 8 decimal precision
    driverLocation ? Math.round(driverLocation.longitude * 100000000) : 0
  ]);

  const stableAvailableRides = useMemo(() => {
    if (!availableRides || availableRides.length === 0) return [];
    return availableRides
      .filter(ride => ride?._id && ride?.pickup && ride?.drop)
      .map(ride => ({
        _id: ride._id,
        pickup: {
          latitude: Number(ride.pickup.latitude.toFixed(8)), // Higher precision for patient markers
          longitude: Number(ride.pickup.longitude.toFixed(8))
        },
        drop: {
          latitude: Number(ride.drop.latitude.toFixed(8)), // Higher precision for hospital markers
          longitude: Number(ride.drop.longitude.toFixed(8))
        },
        vehicle: ride.vehicle
      }));
  }, [
    availableRides?.length || 0,
    // Create stable string dependency using JSON.stringify on IDs only
    JSON.stringify(availableRides?.map(r => r._id).sort() || [])
  ]);

  const stableAcceptedRide = useMemo(() => {
    if (!acceptedRide) return null;
    return {
      _id: acceptedRide._id,
      pickup: acceptedRide.pickup ? {
        latitude: Number(acceptedRide.pickup.latitude.toFixed(8)), // Higher precision for accepted ride
        longitude: Number(acceptedRide.pickup.longitude.toFixed(8))
      } : null,
      drop: acceptedRide.drop ? {
        latitude: Number(acceptedRide.drop.latitude.toFixed(8)), // Higher precision for hospital
        longitude: Number(acceptedRide.drop.longitude.toFixed(8))
      } : null
    };
  }, [
    acceptedRide?._id || '',
    acceptedRide?.pickup ? Math.round(acceptedRide.pickup.latitude * 100000000) : 0, // 8 decimal precision
    acceptedRide?.pickup ? Math.round(acceptedRide.pickup.longitude * 100000000) : 0
  ]);

  // Enhanced map region calculation for better route viewing
  const mapRegion = useMemo(() => {
    if (!stableDriverLocation) {
      return {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    // If navigating and have route coords, fit the entire route
    if (isNavigating && routeCoords.length > 0) {
      const latitudes = routeCoords.map(coord => coord.latitude);
      const longitudes = routeCoords.map(coord => coord.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const deltaLat = (maxLat - minLat) * 1.3; // Add 30% padding
      const deltaLng = (maxLng - minLng) * 1.3;
      
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(deltaLat, 0.01),
        longitudeDelta: Math.max(deltaLng, 0.01),
      };
    }

    // Default to driver location with reasonable zoom
    return {
      latitude: stableDriverLocation.latitude,
      longitude: stableDriverLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [stableDriverLocation, isNavigating, routeCoords]);

  // Calculate route segments for enhanced visualization
  const routeSegments = useMemo(() => {
    if (!currentRoute?.steps || !isNavigating) return [];
    
    const segments: Array<{
      coordinates: Array<{ latitude: number; longitude: number }>;
      color: string;
      isCurrentSegment: boolean;
      stepIndex: number;
    }> = [];

    currentRoute.steps.forEach((step: any, index: number) => {
      const stepCoords = [
        step.startLocation,
        step.endLocation
      ];
      
      segments.push({
        coordinates: stepCoords,
        color: index <= currentStepIndex ? colors.primary[600] : colors.gray[400],
        isCurrentSegment: index === currentStepIndex,
        stepIndex: index
      });
    });

    return segments;
  }, [currentRoute, currentStepIndex, isNavigating]);

  // Get maneuver marker positions for turn indicators
  const turnMarkers = useMemo(() => {
    if (!currentRoute?.steps || !isNavigating) return [];
    
    return currentRoute.steps
      .map((step: any, index: number) => ({
        coordinate: step.startLocation,
        maneuver: step.maneuver,
        instruction: step.instruction,
        isCurrentStep: index === currentStepIndex,
        isPastStep: index < currentStepIndex,
        stepIndex: index
      }))
      .filter((marker: any, index: number) => 
        // Show current step, next few steps, and major turns
        index >= currentStepIndex && index <= currentStepIndex + 3
      );
  }, [currentRoute, currentStepIndex, isNavigating]);

  // Helper function to get maneuver icons
  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver?.toLowerCase()) {
      case 'turn-left':
        return 'arrow-left';
      case 'turn-right':
        return 'arrow-right';
      case 'turn-slight-left':
        return 'arrow-top-left';
      case 'turn-slight-right':
        return 'arrow-top-right';
      case 'turn-sharp-left':
        return 'arrow-bottom-left';
      case 'turn-sharp-right':
        return 'arrow-bottom-right';
      case 'uturn-left':
      case 'uturn-right':
        return 'arrow-u-up-left';
      case 'continue':
      case 'straight':
        return 'arrow-up';
      case 'merge':
        return 'merge';
      case 'ramp-left':
        return 'exit-run';
      case 'ramp-right':
        return 'exit-run';
      case 'fork-left':
      case 'fork-right':
        return 'source-fork';
      case 'roundabout-left':
      case 'roundabout-right':
        return 'circle-outline';
      default:
        return 'navigation';
    }
  };

  // Don't render anything if driver location is not available
  if (!mapRegion || !stableDriverLocation) {
    return (
      <View style={[styles.flex1, styles.alignCenter, styles.justifyCenter, styles.bgGray100]}>
        <Text style={[styles.textBase, styles.textGray600]}>
          Waiting for location...
        </Text>
      </View>
    );
  }

  if (showFallback) {
    return (
      <View style={[styles.flex1, styles.alignCenter, styles.justifyCenter, styles.bgGray100]}>
        <MaterialIcons name="map" size={64} color={colors.gray[400]} />
        <Text style={[styles.textLg, styles.textGray600, styles.mt4, styles.fontMedium]}>
          Map Loading Issue
        </Text>
        <Text style={[styles.textSm, styles.textGray500, styles.textCenter, styles.mt2, styles.px4]}>
          The map is taking longer than expected to load. This might be due to network issues or Google Maps configuration.
        </Text>
        <View style={[styles.mt4, styles.bgWhite, styles.p4, styles.roundedLg, styles.mx4]}>
          <Text style={[styles.textXs, styles.textGray600]}>
            Location: {stableDriverLocation?.latitude.toFixed(4)}, {stableDriverLocation?.longitude.toFixed(4)}
          </Text>
          <Text style={[styles.textXs, styles.textGray600]}>
            Rides nearby: {stableAvailableRides.length}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.mt4, styles.bgPrimary600, styles.px4, styles.py2, styles.roundedLg]}
          onPress={() => {
            setShowFallback(false);
            setMapLoaded(false);
          }}
        >
          <Text style={[styles.textWhite, styles.fontMedium]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Function to recenter map on user location
  const recenterOnUserLocation = () => {
    if (stableDriverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: stableDriverLocation.latitude,
        longitude: stableDriverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      setFollowUserLocation(true);
    }
  };

  return (
    <View style={[styles.flex1]}>
      <MapView
        ref={mapRef}
        style={[styles.flex1]}
        region={mapRegion}
        showsUserLocation={true}
        followsUserLocation={followUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsTraffic={isNavigating}
        loadingEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        onMapReady={() => {
          console.log('🗺️ DriverMap - Map is ready!');
          setMapLoaded(true);
        }}
        onError={(error) => {
          console.error('🗺️ DriverMap - Map error:', error);
          setShowFallback(true);
        }}
      >
        {/* Driver's current location marker */}
        {stableDriverLocation && (
          <Marker
            coordinate={stableDriverLocation}
            title="Your Location"
            pinColor={colors.primary[600]}
            type="driver"
          />
        )}

        {/* Accepted ride markers and route */}
        {stableAcceptedRide?.pickup && stableAcceptedRide?.drop && (
          <>
            {/* Pickup location marker */}
            <Marker
              coordinate={stableAcceptedRide.pickup}
              title="Patient Pickup"
              pinColor={colors.danger[600]}
              type="patient"
            />

            {/* Drop location marker */}
            <Marker
              coordinate={stableAcceptedRide.drop}
              title="Hospital"
              pinColor={colors.medical[600]}
              type="hospital"
            />

            {/* Enhanced route visualization */}
            {routeCoords.length > 0 && (
              <>
                {/* Main route polyline */}
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={colors.primary[600]}
                  strokeWidth={6}
                />
                
                {/* Route segments with progress indication */}
                {routeSegments.map((segment, index) => (
                  <Polyline
                    key={`segment-${index}`}
                    coordinates={segment.coordinates}
                    strokeColor={segment.color}
                    strokeWidth={segment.isCurrentSegment ? 8 : 4}
                    lineDashPattern={segment.isCurrentSegment ? [0] : [5, 5]}
                  />
                ))}
              </>
            )}
            
            {/* Turn indicators and maneuver markers */}
            {turnMarkers.map((marker) => (
              <Marker
                key={`turn-${marker.stepIndex}`}
                coordinate={marker.coordinate}
                title={marker.instruction}
              >
                <View style={{
                  backgroundColor: marker.isCurrentStep ? colors.primary[600] : colors.gray[600],
                  borderRadius: 15,
                  width: 30,
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: 'white'
                }}>
                  <MaterialCommunityIcons
                    name={getManeuverIcon(marker.maneuver)}
                    size={16}
                    color="white"
                  />
                </View>
              </Marker>
            ))}
          </>
        )}

        {!stableAcceptedRide && online && stableAvailableRides.map((ride, index) => (
          <Marker
            key={ride._id}
            coordinate={ride.pickup}
            title={`Emergency Request ${index + 1}`}
            pinColor={colors.danger[400]}
            type="patient"
          />
        ))}
      </MapView>
      
      {/* Floating recenter button (Google Maps style) */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 20,
          bottom: 120,
          backgroundColor: 'white',
          borderRadius: 25,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: colors.gray[200]
        }}
        onPress={recenterOnUserLocation}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color={followUserLocation ? colors.primary[600] : colors.gray[600]}
        />
      </TouchableOpacity>
      
      {/* Speed indicator (if navigating) */}
      {isNavigating && (
        <View style={{
          position: 'absolute',
          left: 20,
          bottom: 120,
          backgroundColor: 'white',
          borderRadius: 15,
          paddingHorizontal: 12,
          paddingVertical: 8,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          borderWidth: 1,
          borderColor: colors.gray[200]
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="speedometer"
              size={16}
              color={colors.primary[600]}
            />
            <Text style={[styles.textSm, styles.fontMedium, styles.ml1]}>
              GPS Ready
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default memo(DriverMap);
