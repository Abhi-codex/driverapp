import React from "react";
import { Text, View } from "react-native";
import { styles } from "../../constants/tailwindStyles";

interface DriverQuickStatsProps {
  availableRidesCount: number;
  rating?: string;
  todaysEarnings: string;
}

export default function DriverQuickStats({
  availableRidesCount,
  rating,
  todaysEarnings,
}: DriverQuickStatsProps) {
  return (
    <View style={[styles.flexRow, styles.justifyBetween, styles.mb4]}>
      {/* Available Rides Tile */}
      <View style={[styles.flex1, styles.bgGray100, styles.roundedLg, styles.p3, styles.mr2, styles.shadowSm]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
          <Text style={[styles.textXs, styles.textGray600, styles.fontMedium]}>
            Emergency Calls
          </Text>
        </View>
        <Text style={[styles.textLg, styles.fontBold, styles.textGray800]}>
          {availableRidesCount}
        </Text>
        <Text style={[styles.textXs, styles.textGray500]}>
          Available now
        </Text>
      </View>

      {/* Rating Tile */}
      <View style={[styles.flex1, styles.bgGray100, styles.roundedLg, styles.p3, styles.mr2, styles.shadowSm]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
          <Text style={[styles.textXs, styles.textGray600, styles.fontMedium]}>
            Rating
          </Text>
        </View>
        <Text style={[styles.textLg, styles.fontBold, styles.textGray800]}>
          {rating || "N/A"}
        </Text>
        <Text style={[styles.textXs, styles.textGray500]}>
          Driver score
        </Text>
      </View>

      {/* Earnings Tile */}
      <View style={[styles.flex1, styles.bgGray100, styles.roundedLg, styles.p3, styles.shadowSm]}>
        <View style={[styles.flexRow, styles.alignCenter, styles.mb2]}>
          <Text style={[styles.textXs, styles.textGray600, styles.fontMedium]}>
            Today's Earnings
          </Text>
        </View>
        <Text style={[styles.textLg, styles.fontBold, styles.textGray800]}>
          ₹{todaysEarnings}
        </Text>
        <Text style={[styles.textXs, styles.textGray500]}>
          Total earned
        </Text>
      </View>
    </View>
  );
}
