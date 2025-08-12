import { styles, colors} from '../../constants/tailwindStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface WelcomeHeaderProps {
  driverName?: string;
  onProfilePress?: () => void;
  isOnline?: boolean;
  toggleOnlineStatus?: () => void;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  driverName = "Driver",
  onProfilePress,
  isOnline = false,
  toggleOnlineStatus,
}) => {
  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  
  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good evening";
  }

  return (
    <View style={[styles.bgEmergency100, styles.rounded3xl, styles.px5, styles.py6, styles.mb3, styles.shadowSm, { position: 'relative' }]}> 
      {/* Edit Profile button */}
      <TouchableOpacity style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }} onPress={onProfilePress}>
        <MaterialCommunityIcons name="circle-edit-outline" size={32} color={colors.black} />
      </TouchableOpacity>

      <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
        {/* Large doctor icon */}
        <MaterialCommunityIcons name="doctor" size={64} color={colors.black} />
      </View>
      <Text style={[styles.text2xl, styles.fontBold, styles.textGray900, styles.textCenter]}>
        {greeting}, {driverName}
      </Text>
      <Text style={[styles.textSm, styles.textGray600, styles.textCenter]}>
        Manage rides and track your stats here.
      </Text>
      <View style={[styles.flexRow, styles.alignCenter, styles.justifyCenter]}> 
        <Text style={[styles.textBase, styles.fontMedium, isOnline ? styles.textEmergency600 : styles.textGray600, { marginRight: 6 }]}>
          {isOnline ? "CURRENTLY ONLINE" : "CURRENTLY OFFLINE"}
        </Text>
        {/* Toggle button for online/offline */}
        <TouchableOpacity onPress={toggleOnlineStatus}>
          <MaterialCommunityIcons name={isOnline ? "toggle-switch-outline" : "toggle-switch-off-outline"} size={45} color={isOnline ? colors.emergency[500] : colors.gray[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
