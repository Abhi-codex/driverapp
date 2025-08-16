import React, { memo } from "react";
import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styles, colors } from "../../constants/tailwindStyles";
import { Ride } from "../../types/rider";

interface DriverMinimizedInfoProps {
  availableRidesCount: number;
  online: boolean;
  todaysEarnings: string;
  ongoingRide?: Ride | null;
}

function DriverMinimizedInfo({
  availableRidesCount,
  ongoingRide,
}: DriverMinimizedInfoProps) {
  if (ongoingRide) {
    const getAmbulanceIcon = (vehicle: string) => {
      const icons = {
        'bls': 'medical-bag',
        'als': 'heart-pulse', 
        'ccs': 'hospital',
        'auto': 'car-emergency',
        'bike': 'motorbike'
      };
      return icons[vehicle as keyof typeof icons] || 'ambulance';
    };

    const getStatusColor = (status: string) => {
      const statusColors = {
        'ACCEPTED': colors.warning[600],
        'ARRIVED': colors.primary[600],
        'START': colors.medical[600],
        'COMPLETED': colors.medical[600],
        'SEARCHING': colors.emergency[600]
      };
      return statusColors[status as keyof typeof statusColors] || colors.gray[600];
    };

    const formatAddress = (address: string) => {
      const parts = address.split(',');
      return parts.length > 2 ? `${parts[0]}, ${parts[1]}` : address;
    };

    return (
      <View style={[styles.px4, styles.py3]}>
        <View style={[styles.flexCol, styles.justifyCenter, styles.alignCenter]}>
          {/* Header with ambulance icon */}
          <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
            <MaterialCommunityIcons 
              name={getAmbulanceIcon(ongoingRide.vehicle) as any} 
              size={20} 
              color={colors.emergency[600]} 
              style={[styles.mr2]}
            />
            <Text style={[styles.fontBold, styles.textGray900, styles.textBase]}>
              Emergency in Progress
            </Text>
          </View>

          {/* Route info */}
          <View style={[styles.flexRow, styles.alignCenter, styles.mb1]}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={14} 
              color={colors.primary[600]} 
              style={[styles.mr1]}
            />
            <Text style={[styles.textSm, styles.textGray700, styles.flex1]} numberOfLines={1}>
              {formatAddress(ongoingRide.pickup.address)}
            </Text>
          </View>

          <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
            <MaterialCommunityIcons 
              name="hospital-building" 
              size={14} 
              color={colors.medical[600]} 
              style={[styles.mr1]}
            />
            <Text style={[styles.textSm, styles.textGray700, styles.flex1]} numberOfLines={1}>
              {formatAddress(ongoingRide.drop.address)}
            </Text>
          </View>

          {/* Status badge */}
          <View style={[ styles.flexRow, styles.alignCenter, styles.px3, styles.py1, styles.rounded,
            { backgroundColor: getStatusColor(ongoingRide.status) + '20' }]}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={12} 
              color={getStatusColor(ongoingRide.status)}
              style={[styles.mr1]}
            />
            <Text style={[
              styles.textXs, 
              styles.fontSemibold,
              { color: getStatusColor(ongoingRide.status) }
            ]}>
              {ongoingRide.status.charAt(0) + ongoingRide.status.slice(1).toLowerCase()}
            </Text>
          </View>

          {/* Swipe hint */}
          <Text style={[styles.textXs, styles.textGray500, styles.mt2]}>
            Swipe up for ride details
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.px4, styles.py3]}>
      <View style={[styles.flexCol, styles.justifyCenter, styles.alignCenter]}>
        {/* Available count */}
        {availableRidesCount > 0 ? (
          <View style={[ styles.flexRow, styles.alignCenter, styles.px3, styles.py2, styles.rounded,
            { backgroundColor: colors.emergency[100] }]}>
            <Text style={[styles.fontBold, styles.textLg, { color: colors.emergency[600] }]}>
              {availableRidesCount}
            </Text>
            <Text style={[styles.textBase, styles.textGray700, styles.ml1]}>
              emergency call{availableRidesCount !== 1 ? "s" : ""} available
            </Text>
          </View>
        ) : (
          <View style={[ styles.flexRow, styles.alignCenter, styles.px3, styles.py2, styles.rounded]}>
            <Text style={[styles.textBase, styles.textGray600]}>
              No emergency requests available at the moment.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(DriverMinimizedInfo);
