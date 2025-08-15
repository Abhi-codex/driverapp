import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";
import { MapViewWrapper as MapView, MarkerWrapper as Marker, PolylineWrapper as Polyline } from "../MapView";
import { MaterialIcons } from '@expo/vector-icons';

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
}

function DriverMap({
  driverLocation,
  acceptedRide,
  routeCoords,
  online = true,
  availableRides = [],
}: DriverMapProps) {

  const mountedRef = useRef(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  
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

  // Stable memoized values to prevent re-renders
  const stableDriverLocation = useMemo(() => {
    if (!driverLocation) return null;
    return {
      latitude: Number(driverLocation.latitude.toFixed(6)),
      longitude: Number(driverLocation.longitude.toFixed(6))
    };
  }, [
    driverLocation ? Math.round(driverLocation.latitude * 1000000) : 0,
    driverLocation ? Math.round(driverLocation.longitude * 1000000) : 0
  ]);

  const stableAvailableRides = useMemo(() => {
    if (!availableRides || availableRides.length === 0) return [];
    return availableRides
      .filter(ride => ride?._id && ride?.pickup && ride?.drop)
      .map(ride => ({
        _id: ride._id,
        pickup: {
          latitude: Number(ride.pickup.latitude.toFixed(6)),
          longitude: Number(ride.pickup.longitude.toFixed(6))
        },
        drop: {
          latitude: Number(ride.drop.latitude.toFixed(6)),
          longitude: Number(ride.drop.longitude.toFixed(6))
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
        latitude: Number(acceptedRide.pickup.latitude.toFixed(6)),
        longitude: Number(acceptedRide.pickup.longitude.toFixed(6))
      } : null,
      drop: acceptedRide.drop ? {
        latitude: Number(acceptedRide.drop.latitude.toFixed(6)),
        longitude: Number(acceptedRide.drop.longitude.toFixed(6))
      } : null
    };
  }, [
    acceptedRide?._id || '',
    acceptedRide?.pickup ? Math.round(acceptedRide.pickup.latitude * 1000000) : 0,
    acceptedRide?.pickup ? Math.round(acceptedRide.pickup.longitude * 1000000) : 0
  ]);

  // Memoized map region to prevent unnecessary re-renders
  const mapRegion = useMemo(() => {
    if (!driverLocation) return null;
    return {
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
      latitudeDelta: driverLocation.latitudeDelta,
      longitudeDelta: driverLocation.longitudeDelta
    };
  }, [
    driverLocation ? Math.round(driverLocation.latitude * 100000) : 0,
    driverLocation ? Math.round(driverLocation.longitude * 100000) : 0,
  ]);

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

  return (
    <View style={[styles.flex1]}>
      <MapView
        style={[styles.flex1]}
        region={mapRegion}
        showsUserLocation={true}
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

            {/* Route polyline */}
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={colors.primary[600]}
                strokeWidth={4}
              />
            )}
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
    </View>
  );
}

export default memo(DriverMap);
