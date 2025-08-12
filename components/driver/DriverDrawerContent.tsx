import React from "react";
import { ScrollView, View } from "react-native";
import { styles } from "../../constants/tailwindStyles";
import { Ride, DriverStats } from "../../types/rider";
import AcceptedRideInfo from "./AcceptedRideInfo";
import AvailableRidesList from "./AvailableRidesList";
import NoRidesAvailable from "./NoRidesAvailable";
import DriverControlPanel from "./DriverControlPanel";
import DriverQuickStats from "./DriverQuickStats";

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
}: DriverDrawerContentProps) {
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
