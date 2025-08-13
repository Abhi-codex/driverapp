import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { styles as s, colors } from '../constants/tailwindStyles';

interface InputFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: any;
}

export default function InputField({
  label,
  required = false,
  value,
  onChangeText,
  containerStyle,
  ...textInputProps
}: InputFieldProps) {
  return (
    <View style={[s.mb4, containerStyle]}>
      <Text style={[s.textSm, s.fontMedium, s.textGray700, s.mb2]}>
        {label}
        {required && <Text style={[s.textEmergency600]}> *</Text>}
      </Text>
      <TextInput
        style={[
          s.w100,
          s.px4,
          s.py3,
          s.bgWhite,
          s.border,
          s.borderGray300,
          s.roundedLg,
          s.textBase,
          s.textGray900,
          { minHeight: textInputProps.multiline ? 80 : 48 }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.gray[500]}
        {...textInputProps}
      />
    </View>
  );
}
