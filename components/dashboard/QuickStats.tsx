import { styles } from '../../constants/tailwindStyles';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface QuickStatsProps {
  todayRides: number;
  totalRides: number;
  rating: number;
  todayEarnings: number;
  onStatsPress?: () => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  todayRides,
  todayEarnings,
  onStatsPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onStatsPress}
      activeOpacity={0.92}
      style={[styles.bgEmergency100, styles.rounded2xl, styles.p4, styles.shadow, styles.mb3, styles.alignCenter]}
    >
      <View style={{ position: 'absolute', top: 12, left: 16 }}>
        <Text style={[styles.textXs, styles.p2, styles.bgEmergency200, styles.rounded3xl, styles.fontExtraBold, styles.textEmergency600, styles.textCenter, styles.mb2]}>
          TODAY
        </Text>
      </View>
      <View style={[styles.flexRow, styles.justifyBetween, { gap: 64 }, styles.mb2]}>
        <View style={[styles.alignCenter]}> 
          <Text style={[styles.text4xl, styles.fontBold, styles.textEmergency600]}>{todayRides}</Text>
          <Text style={[styles.textSm, styles.textGray600, styles.mt1, styles.textCenter]}>Rides</Text>
        </View>
        <View style={[styles.alignCenter]}> 
          <Text style={[styles.text4xl, styles.fontBold, styles.textEmergency600]}>₹ {todayEarnings}</Text>
          <Text style={[styles.textSm, styles.textGray600, styles.mt1, styles.textCenter]}>Earnings</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
