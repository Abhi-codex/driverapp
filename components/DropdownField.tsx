import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles as s, colors } from '../constants/tailwindStyles';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  enabled?: boolean;
  containerStyle?: any;
}

export default function DropdownField({
  label,
  required = false,
  value,
  onValueChange,
  options,
  enabled = true,
  containerStyle
}: DropdownFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : 'Select an option';

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  return (
    <View style={[s.mb4, containerStyle]}>
      <Text style={[s.textSm, s.fontMedium, s.textGray700, s.mb2]}>
        {label}
        {required && <Text style={[s.textEmergency600]}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[
          s.w100,
          s.px4,
          s.py3,
          s.bgWhite,
          s.border,
          s.borderGray300,
          s.roundedLg,
          s.flexRow,
          s.justifyBetween,
          s.alignCenter,
          { minHeight: 48 },
          !enabled && s.bgGray100
        ]}
        onPress={() => enabled && setModalVisible(true)}
        disabled={!enabled}
      >
        <Text style={[
          s.textBase,
          value ? s.textGray900 : s.textGray500
        ]}>
          {displayText}
        </Text>
        <MaterialIcons 
          name="keyboard-arrow-down" 
          size={24} 
          color={colors.gray[500]} 
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[s.flex1, s.justifyEnd, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Pressable style={[s.flex1]} onPress={() => setModalVisible(false)} />
          
          <View style={[
            s.bgWhite,
            { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
            { maxHeight: '70%' }
          ]}>
            <View style={[s.flexRow, s.justifyBetween, s.alignCenter, s.p4, s.borderB, s.borderGray200]}>
              <Text style={[s.textLg, s.fontBold, s.textGray800]}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={[s.maxH80]}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    s.px4,
                    s.py4,
                    s.borderB,
                    s.borderGray100,
                    option.value === value && s.bgPrimary50
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[
                    s.textBase,
                    option.value === value ? s.textPrimary700 : s.textGray900,
                    option.value === value && s.fontSemibold
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
