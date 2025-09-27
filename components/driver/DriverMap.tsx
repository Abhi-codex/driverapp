import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";
import {
  MapViewWrapper as MapView,
  MarkerWrapper as Marker,
  PolylineWrapper as Polyline,
} from "../MapView";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteInfo } from "../../utils/navigationService";

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
  onNavigationStart?: (
    destination: { latitude: number; longitude: number },
    stage: "to_patient" | "to_hospital"
  ) => void;
  onNavigationStop?: () => void;
  onStageComplete?: (stage: "pickup" | "dropoff") => void;

  // In-app navigation props
  isNavigating?: boolean;
  navigationStage?: "idle" | "to_patient" | "to_hospital";
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
  navigationStage = "idle",
  currentRoute = null,
}: DriverMapProps) {
  const mountedRef = useRef(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const mapRef = useRef<any>(null);
  const miniMapRef = useRef<any>(null);
  const prevLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [heading, setHeading] = useState<number>(0);

  // Enhanced route visualization states
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [followUserLocation, setFollowUserLocation] = useState(true);

  useEffect(() => {
    // Show fallback after 5 seconds if map hasn't loaded
    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        console.log("🗺️ Map loading timeout, showing fallback");
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
      longitude: Number(driverLocation.longitude.toFixed(8)),
    };
  }, [
    driverLocation ? Math.round(driverLocation.latitude * 100000000) : 0, // 8 decimal precision
    driverLocation ? Math.round(driverLocation.longitude * 100000000) : 0,
  ]);

  const stableAvailableRides = useMemo(() => {
    if (!availableRides || availableRides.length === 0) {
      console.log("📍 DriverMap: No available rides");
      return [];
    }

    const filteredRides = availableRides
      .filter((ride) => ride?._id && ride?.pickup && ride?.drop)
      .map((ride) => ({
        _id: ride._id,
        pickup: {
          latitude: Number(ride.pickup.latitude.toFixed(8)), // Higher precision for patient markers
          longitude: Number(ride.pickup.longitude.toFixed(8)),
        },
        drop: {
          latitude: Number(ride.drop.latitude.toFixed(8)), // Higher precision for hospital markers
          longitude: Number(ride.drop.longitude.toFixed(8)),
        },
        vehicle: ride.vehicle,
      }));

    console.log("📍 DriverMap: Updated available rides for markers", {
      total: availableRides.length,
      validRides: filteredRides.length,
      rideIds: filteredRides.map((r) => r._id),
    });

    return filteredRides;
  }, [
    availableRides?.length || 0,
    // Create stable string dependency using JSON.stringify on IDs only
    JSON.stringify(availableRides?.map((r) => r._id).sort() || []),
  ]);

  const stableAcceptedRide = useMemo(() => {
    if (!acceptedRide) return null;
    return {
      _id: acceptedRide._id,
      pickup: acceptedRide.pickup
        ? {
            latitude: Number(acceptedRide.pickup.latitude.toFixed(8)), // Higher precision for accepted ride
            longitude: Number(acceptedRide.pickup.longitude.toFixed(8)),
          }
        : null,
      drop: acceptedRide.drop
        ? {
            latitude: Number(acceptedRide.drop.latitude.toFixed(8)), // Higher precision for hospital
            longitude: Number(acceptedRide.drop.longitude.toFixed(8)),
          }
        : null,
    };
  }, [acceptedRide]);

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
      const latitudes = routeCoords.map((coord) => coord.latitude);
      const longitudes = routeCoords.map((coord) => coord.longitude);

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
      const stepCoords = [step.startLocation, step.endLocation];

      segments.push({
        coordinates: stepCoords,
        color:
          index <= currentStepIndex ? colors.primary[600] : colors.gray[400],
        isCurrentSegment: index === currentStepIndex,
        stepIndex: index,
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
        stepIndex: index,
      }))
      .filter(
        (marker: any, index: number) =>
          // Show current step, next few steps, and major turns
          index >= currentStepIndex && index <= currentStepIndex + 3
      );
  }, [currentRoute, currentStepIndex, isNavigating]);

  // Helper function to get maneuver icons
  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver?.toLowerCase()) {
      case "turn-left":
        return "arrow-left";
      case "turn-right":
        return "arrow-right";
      case "turn-slight-left":
        return "arrow-top-left";
      case "turn-slight-right":
        return "arrow-top-right";
      case "turn-sharp-left":
        return "arrow-bottom-left";
      case "turn-sharp-right":
        return "arrow-bottom-right";
      case "uturn-left":
      case "uturn-right":
        return "arrow-u-up-left";
      case "continue":
      case "straight":
        return "arrow-up";
      case "merge":
        return "merge";
      case "ramp-left":
        return "exit-run";
      case "ramp-right":
        return "exit-run";
      case "fork-left":
      case "fork-right":
        return "source-fork";
      case "roundabout-left":
      case "roundabout-right":
        return "circle-outline";
      default:
        return "navigation";
    }
  };

  // Don't render anything if driver location is not available
  if (!mapRegion || !stableDriverLocation) {
    return (
      <View
        style={[
          styles.flex1,
          styles.alignCenter,
          styles.justifyCenter,
          styles.bgGray100,
        ]}
      >
        <Text style={[styles.textBase, styles.textGray600]}>
          Waiting for location...
        </Text>
      </View>
    );
  }

  if (showFallback) {
    return (
      <View
        style={[
          styles.flex1,
          styles.alignCenter,
          styles.justifyCenter,
          styles.bgGray100,
        ]}
      >
        <MaterialIcons name="map" size={64} color={colors.gray[400]} />
        <Text
          style={[
            styles.textLg,
            styles.textGray600,
            styles.mt4,
            styles.fontMedium,
          ]}
        >
          Map Loading Issue
        </Text>
        <Text
          style={[
            styles.textSm,
            styles.textGray500,
            styles.textCenter,
            styles.mt2,
            styles.px4,
          ]}
        >
          The map is taking longer than expected to load. This might be due to
          network issues or Google Maps configuration.
        </Text>
        <View
          style={[
            styles.mt4,
            styles.bgWhite,
            styles.p4,
            styles.roundedLg,
            styles.mx4,
          ]}
        >
          <Text style={[styles.textXs, styles.textGray600]}>
            Location: {stableDriverLocation?.latitude.toFixed(4)},{" "}
            {stableDriverLocation?.longitude.toFixed(4)}
          </Text>
          <Text style={[styles.textXs, styles.textGray600]}>
            Rides nearby: {stableAvailableRides.length}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.mt4,
            styles.bgPrimary600,
            styles.px4,
            styles.py2,
            styles.roundedLg,
          ]}
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
      mapRef.current.animateToRegion(
        {
          latitude: stableDriverLocation.latitude,
          longitude: stableDriverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
      setFollowUserLocation(true);
    }
  };

  // Aggressive follow: when navigating and followUserLocation is true, always animate
  // the main map to center on the driver's latest location with a tight zoom.
  useEffect(() => {
    if (
      !isNavigating ||
      !stableDriverLocation ||
      !mapRef.current ||
      !followUserLocation
    )
      return;

    try {
      // Bias center slightly toward the next route point or destination so the driver
      // stays visually central while the road ahead is visible (Google Maps-like behavior)
      const bias = 0.28; // 0 = driver exactly centered, 1 = center at destination

      let targetLat = stableDriverLocation.latitude;
      let targetLng = stableDriverLocation.longitude;

      // Determine a point to bias towards: prefer next route coordinate, then destinationCoord
      const nextPoint =
        routeCoords && routeCoords.length > 0 ? routeCoords[0] : null;
      const biasTarget = nextPoint || destinationCoord || null;

      if (biasTarget) {
        targetLat =
          stableDriverLocation.latitude +
          (biasTarget.latitude - stableDriverLocation.latitude) * bias;
        targetLng =
          stableDriverLocation.longitude +
          (biasTarget.longitude - stableDriverLocation.longitude) * bias;
      }

      // compute heading from previous location -> current location
      try {
        const prev = prevLocationRef.current;
        if (prev && stableDriverLocation) {
          const bearing = getBearing(
            prev.latitude,
            prev.longitude,
            stableDriverLocation.latitude,
            stableDriverLocation.longitude
          );
          setHeading(bearing);

          // animate camera with heading if available
          if (mapRef.current.animateCamera) {
            mapRef.current.animateCamera(
              {
                center: { latitude: targetLat, longitude: targetLng },
                heading: bearing,
                pitch: 45,
                zoom: undefined,
              },
              { duration: 300 }
            );
          } else {
            // fallback
            mapRef.current.animateToRegion(
              {
                latitude: targetLat,
                longitude: targetLng,
                latitudeDelta: 0.005, // tighter zoom
                longitudeDelta: 0.005,
              },
              300
            );
          }
        } else {
          // no previous location - simple animate
          mapRef.current.animateToRegion(
            {
              latitude: targetLat,
              longitude: targetLng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            300
          );
        }
      } catch (err) {
        console.warn("DriverMap: animateToRegion/animateCamera failed", err);
      }
    } catch (err) {
      console.warn("DriverMap: animateToRegion failed", err);
    }
  }, [stableDriverLocation, isNavigating, followUserLocation]);

  // Update prevLocationRef after camera animation (keep latest known)
  useEffect(() => {
    if (stableDriverLocation) prevLocationRef.current = stableDriverLocation;
  }, [stableDriverLocation]);

  // Helper: calculate bearing between two lat/lng points in degrees
  const getBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const λ1 = toRad(lon1);
    const λ2 = toRad(lon2);

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    const bearing = (toDeg(θ) + 360) % 360;
    return Math.round(bearing);
  };

  // Compute the current navigation destination coordinate (patient or hospital)
  const destinationCoord = useMemo(() => {
    if (!stableAcceptedRide) return null;
    if (navigationStage === "to_patient" && stableAcceptedRide.pickup)
      return stableAcceptedRide.pickup;
    if (navigationStage === "to_hospital" && stableAcceptedRide.drop)
      return stableAcceptedRide.drop;
    // fallback to drop then pickup
    return stableAcceptedRide.drop || stableAcceptedRide.pickup || null;
  }, [stableAcceptedRide, navigationStage]);

  // Keep the map view focused on the driver and destination while navigating.
  // We use fitToCoordinates to ensure both the driver's location and the destination are visible.
  useEffect(() => {
    try {
      if (!isNavigating || !mapRef.current) return;

      // prefer destinationCoord if available, otherwise use routeCoords endpoints
      const coordsToFit: Array<{ latitude: number; longitude: number }> = [];

      if (destinationCoord) {
        coordsToFit.push(destinationCoord);
      }

      if (routeCoords && routeCoords.length > 0) {
        coordsToFit.push(routeCoords[0]);
        coordsToFit.push(routeCoords[routeCoords.length - 1]);
      }
      if (coordsToFit.length >= 1 && mapRef.current.fitToCoordinates) {
        mapRef.current.fitToCoordinates(coordsToFit, {
          edgePadding: { top: 20, right: 100, bottom: 200, left: 100 },
          animated: true,
        });
        setFollowUserLocation(true);
      }
    } catch (err) {
      console.warn("DriverMap: fitToCoordinates failed", err);
    }
  }, [isNavigating, routeCoords, destinationCoord]);

  // Ensure the mini-map inset fits the full API route when route changes
  useEffect(() => {
    if (!miniMapRef.current) return;
    try {
      if (
        routeCoords &&
        routeCoords.length > 1 &&
        miniMapRef.current.fitToCoordinates
      ) {
        miniMapRef.current.fitToCoordinates(routeCoords, {
          edgePadding: { top: 8, right: 8, bottom: 8, left: 8 },
          animated: false,
        });
        return;
      }

      if (
        destinationCoord &&
        stableDriverLocation &&
        miniMapRef.current.fitToCoordinates
      ) {
        miniMapRef.current.fitToCoordinates(
          [stableDriverLocation, destinationCoord],
          {
            edgePadding: { top: 8, right: 8, bottom: 8, left: 8 },
            animated: false,
          }
        );
      }
    } catch (err) {}
  }, [miniMapRef, routeCoords, destinationCoord, stableDriverLocation]);

  return (
    <View style={[styles.flex1]}>
      <MapView
        ref={mapRef}
        style={[styles.flex1]}
        {...(!isNavigating ? { region: mapRegion } : {})}
        // Hide the built-in map controls for a cleaner driving UI
        showMapTypeSelector={false}
        showFeatureControls={false}
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
          console.log("🗺️ DriverMap - Map is ready!");
          setMapLoaded(true);
        }}
        onError={(error) => {
          console.error("🗺️ DriverMap - Map error:", error);
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
            rotation={heading}
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

            {/* Fallback: if navigating but we don't have routeCoords yet, draw a straight
                polyline between driver and destination so drivers can see the intended path */}
            {isNavigating &&
              routeCoords.length === 0 &&
              destinationCoord &&
              stableDriverLocation && (
                <Polyline
                  coordinates={[stableDriverLocation, destinationCoord]}
                  strokeColor={colors.primary[400]}
                  strokeWidth={4}
                  lineDashPattern={[6, 6]}
                />
              )}

            {/* Turn indicators and maneuver markers */}
            {turnMarkers.map((marker) => (
              <Marker
                key={`turn-${marker.stepIndex}`}
                coordinate={marker.coordinate}
                title={marker.instruction}
              >
                <View
                  style={{
                    backgroundColor: marker.isCurrentStep
                      ? colors.primary[600]
                      : colors.gray[600],
                    borderRadius: 15,
                    width: 30,
                    height: 30,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "white",
                  }}
                >
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

        {!stableAcceptedRide &&
          online &&
          stableAvailableRides.map((ride, index) => (
            <Marker
              key={ride._id}
              coordinate={ride.pickup}
              title={`Emergency Request ${index + 1}`}
              pinColor={colors.danger[400]}
              type="patient"
            />
          ))}
      </MapView>

      {/* Mini-map inset: non-interactive preview showing destination + driver while navigating */}
      {isNavigating && destinationCoord && stableDriverLocation && (
        <View
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 140,
            height: 120,
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.12)",
            backgroundColor: "white",
          }}
          pointerEvents="none"
        >
          <MapView
            ref={miniMapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude:
                (stableDriverLocation.latitude + destinationCoord.latitude) / 2,
              longitude:
                (stableDriverLocation.longitude + destinationCoord.longitude) /
                2,
              latitudeDelta: Math.max(
                Math.abs(
                  stableDriverLocation.latitude - destinationCoord.latitude
                ) * 1.5,
                0.01
              ),
              longitudeDelta: Math.max(
                Math.abs(
                  stableDriverLocation.longitude - destinationCoord.longitude
                ) * 1.5,
                0.01
              ),
            }}
            showsUserLocation={false}
            showsCompass={false}
            showsScale={false}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {/* driver marker */}
            <Marker
              coordinate={stableDriverLocation}
              title="You"
              pinColor={colors.primary[600]}
              type="driver"
              rotation={heading}
            />
            {/* destination marker - show hospital for to_hospital stage */}
            <Marker
              coordinate={destinationCoord}
              title={
                navigationStage === "to_hospital" ? "Hospital" : "Destination"
              }
              pinColor={
                navigationStage === "to_hospital"
                  ? colors.medical[600]
                  : colors.danger[600]
              }
              type={navigationStage === "to_hospital" ? "hospital" : "patient"}
            />

            {/* Render the full API route in the mini-map when available; otherwise fallback */}
            {routeCoords && routeCoords.length > 0 ? (
              <Polyline
                coordinates={routeCoords}
                strokeColor={colors.primary[600]}
                strokeWidth={4}
              />
            ) : (
              <Polyline
                coordinates={[stableDriverLocation, destinationCoord]}
                strokeColor={colors.primary[400]}
                strokeWidth={3}
                lineDashPattern={[4, 4]}
              />
            )}
          </MapView>
        </View>
      )}
    </View>
  );
}

export default memo(DriverMap);
