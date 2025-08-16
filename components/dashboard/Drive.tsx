import { styles } from '../../constants/tailwindStyles';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface DriveProps {
  isOnline: boolean;
  availableRidesCount?: number;
  onPress: () => void;
}

const Drive: React.FC<DriveProps> = ({ isOnline, availableRidesCount = 0, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.bgGray200, styles.rounded2xl, styles.p6, styles.shadow, styles.mb6, styles.alignCenter, !isOnline ? styles.opacity75 : styles.opacity100]}
      onPress={onPress}
      disabled={!isOnline}
      activeOpacity={0.80}
    >
      <Text style={[styles.text2xl, styles.fontBold, styles.textBlack]}>
        {isOnline ? 'Start Driving' : 'Go Online First'}
      </Text>
      <Text style={[styles.textSm, styles.textBlack, styles.textCenter]}>
        {isOnline
          ? 'Go to map view and start accepting ride requests'
          : 'You must be online to accept emergency calls'}
      </Text>
      {isOnline && (
        <View style={[styles.mt1, styles.flexRow, styles.alignCenter, styles.justifyCenter]}> 
          <Text style={[styles.textLg, styles.textBlack, styles.mr1]}>
            {availableRidesCount}
          </Text>
          <Text style={[styles.textLg, styles.textBlack]}>emergency call{availableRidesCount !== 1 ? 's' : ''} available</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Drive;
