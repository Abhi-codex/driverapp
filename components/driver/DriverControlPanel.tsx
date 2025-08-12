import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../constants/tailwindStyles";
import { Ride, RideStatus } from "../../types/rider";

interface DriverControlPanelProps {
  online: boolean;
  distanceKm: string;
  etaMinutes: number;
  fare: number;
  acceptedRide: Ride | null;
  tripStarted: boolean;
  onToggleOnline: () => void;
  onUpdateRideStatus: (rideId: string, status: RideStatus) => void;
}

export default function DriverControlPanel({
  distanceKm,
  etaMinutes,
  fare,
  acceptedRide,
  tripStarted,
  onUpdateRideStatus,
}: DriverControlPanelProps) {
  const handleRideAction = () => {
    if (!acceptedRide) return;

    let nextStatus: RideStatus;
    let actionText: string;

    if (
      acceptedRide.status === RideStatus.START ||
      (!tripStarted && acceptedRide.status === RideStatus.SEARCHING)
    ) {
      nextStatus = RideStatus.ARRIVED;
      actionText = "Mark as Arrived";
    } else if (acceptedRide.status === RideStatus.ARRIVED) {
      nextStatus = RideStatus.COMPLETED;
      actionText = "Complete Trip";
    } else {
      nextStatus = RideStatus.START;
      actionText = "Start Trip";
    }

    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${actionText.toLowerCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          onPress: () => onUpdateRideStatus(acceptedRide._id, nextStatus),
          style: "default",
        },
      ]
    );
  };

  if (!acceptedRide) {
    return null;
  }

  return (
    <View style={[styles.mt4]}>
      <View style={[styles.bgWhite, styles.roundedXl, styles.p4, styles.border, styles.borderGray200, styles.shadowMd]}>
        <Text style={[styles.textLg, styles.fontBold, styles.textGray900, styles.mb4, styles.textCenter]}>
          🚑 Active Emergency Trip
        </Text>

        <View style={[styles.flexRow, styles.justifyBetween, styles.mb4]}>
          <View style={[styles.alignCenter, styles.flex1]}>
            <Text style={[styles.textSm, styles.textGray500]}>Distance</Text>
            <Text
              style={[styles.textLg, styles.fontBold, styles.textPrimary600]}
            >
              {distanceKm} km
            </Text>
          </View>
          <View style={[styles.alignCenter, styles.flex1]}>
            <Text style={[styles.textSm, styles.textGray500]}>ETA</Text>
            <Text
              style={[styles.textLg, styles.fontBold, styles.textSecondary600]}
            >
              {etaMinutes} min
            </Text>
          </View>
          <View style={[styles.alignCenter, styles.flex1]}>
            <Text style={[styles.textSm, styles.textGray500]}>Fare</Text>
            <Text style={[styles.textLg, styles.fontBold, styles.textGray900]}>
              ₹{fare}
            </Text>
          </View>
        </View>

        <View style={[styles.bgGray50, styles.roundedLg, styles.p3, styles.mb4, styles.alignCenter]}>
          <Text style={[styles.textSm, styles.fontMedium, styles.textGray600]}>
            {acceptedRide.status === RideStatus.START
              ? "En Route to Patient"
              : acceptedRide.status === RideStatus.ARRIVED
              ? "Arrived at Pickup Location"
              : "Ready to Start"}
          </Text>
        </View>

        <TouchableOpacity style={[acceptedRide.status === RideStatus.ARRIVED
              ? styles.bgSecondary500
              : styles.bgPrimary500,
            styles.py4, styles.roundedXl, styles.alignCenter, styles.shadowMd, ]}
          onPress={handleRideAction} activeOpacity={0.8}>
          <Text style={[styles.textWhite, styles.fontBold, styles.textBase]}>
            {acceptedRide.status === RideStatus.START
              ? "Mark as Arrived"
              : acceptedRide.status === RideStatus.ARRIVED
              ? "Complete Trip"
              : "Start Trip"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
