import { styles } from '../../constants/tailwindStyles';
import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  style?: ViewStyle;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  style,
}) => {
  return (
    <View style={[styles.bgEmergency100, styles.rounded2xl, styles.px4, styles.py2, styles.shadowSm, style]}> 
      <View style={[styles.alignStart, styles.mb2]}> 
        <Text style={[styles.text2xl, styles.fontBold, styles.textEmergency600, styles.mb1]}>{value}</Text>
        <Text style={[styles.textSm, styles.fontMedium, styles.textGray900]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.textXs, styles.textGray500, styles.mt1]}>{subtitle}</Text>
        )}
      </View>
    </View>
  );
};
