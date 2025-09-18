import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles, colors } from '../../constants/tailwindStyles';

interface NavigationModeToggleProps {
  navigationMode: 'in-app' | 'external';
  onToggle: () => void;
  disabled?: boolean;
}

export const NavigationModeToggle: React.FC<NavigationModeToggleProps> = ({
  navigationMode,
  onToggle,
  disabled = false
}) => {
  const isExternal = navigationMode === 'external';
  
  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      style={[
        styles.flexRow,
        styles.alignCenter,
        styles.justifyBetween,
        styles.p3,
        styles.mb2,
        styles.roundedLg,
        { backgroundColor: colors.gray[50] },
        disabled && { opacity: 0.5 }
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.flexRow, styles.alignCenter, styles.flex1]}>
        <View 
          style={[
            styles.w8, 
            styles.h8, 
            styles.roundedFull, 
            styles.alignCenter, 
            styles.justifyCenter, 
            styles.mr3,
            { backgroundColor: isExternal ? colors.medical[100] : colors.primary[100] }
          ]}
        >
          <MaterialIcons 
            name={isExternal ? "launch" : "map"} 
            size={16} 
            color={isExternal ? colors.medical[600] : colors.primary[600]} 
          />
        </View>
        
        <View style={[styles.flex1]}>
          <Text style={[styles.fontMedium, styles.textGray900, styles.textSm]}>
            Navigation Mode
          </Text>
          <Text style={[styles.textXs, styles.textGray600]}>
            {isExternal 
              ? 'External (Google Maps/Apple Maps)' 
              : 'In-App (InstaAid Navigation)'
            }
          </Text>
        </View>
      </View>
      
      <View style={[styles.flexRow, styles.alignCenter]}>
        <View 
          style={[
            styles.w12,
            styles.h6,
            styles.roundedFull,
            styles.justifyCenter,
            { backgroundColor: isExternal ? colors.medical[200] : colors.gray[300] }
          ]}
        >
          <View 
            style={[
              styles.w5,
              styles.h5,
              styles.roundedFull,
              styles.bgWhite,
              styles.shadow,
              {
                marginLeft: isExternal ? 'auto' : 2,
                marginRight: isExternal ? 2 : 'auto',
              }
            ]}
          />
        </View>
        
        <MaterialIcons 
          name="chevron-right" 
          size={16} 
          color={colors.gray[400]} 
          style={[styles.ml2]}
        />
      </View>
    </TouchableOpacity>
  );
};

export default NavigationModeToggle;
