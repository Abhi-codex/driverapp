import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Animated, Text } from 'react-native';
import { styles as s } from '../constants/tailwindStyles';
import { LabelInputProps } from '../types';

export default function LabelInput({
  label,
  value,
  onChangeText,
  helperText,
  containerStyle,
  ...props
}: LabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as 'absolute',
    left: 12,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#888', '#e46a62ff'], // gray to purple
    }),
    backgroundColor: '#fff',
    paddingHorizontal: 2,
    zIndex: 2,
  };

  return (
    <View style={[{ marginTop: 15 }, containerStyle]}>
      <View style={{ position: 'relative' }}>
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          style={[
            s.textBase,
            s.p4,
            s.pt4,
            s.border,
            s.roundedXl,
            { borderColor: isFocused ? '#e46a62ff' : '#888', color: '#222', backgroundColor: '#fff', fontSize: 16 },
            props.style,
          ]}
          onFocus={e => {
            setIsFocused(true);
            props.onFocus && props.onFocus(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            props.onBlur && props.onBlur(e);
          }}
        />
      </View>
      {!!helperText && (
        <Text style={[s.textSm, s.mt0, { color: '#fff' }]}>{helperText}</Text>
      )}
    </View>
  );
}
