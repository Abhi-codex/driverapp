import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { styles as s } from '../constants/tailwindStyles';
import { MaterialIcons } from '@expo/vector-icons';
import { LabelSelectProps } from '../types';

export default function LabelSelect({
  label,
  options,
  value,
  onChange,
  multiple = false,
  helperText,
  containerStyle,
}: LabelSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value((Array.isArray(value) ? value.length : value) ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || (Array.isArray(value) ? value.length : value) ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as 'absolute',
    left: 12,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [24, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#888', '#e46a62ff'],
    }),
    backgroundColor: '#fff',
    paddingHorizontal: 2,
    zIndex: 2,
  };

  const displayValue = Array.isArray(value)
    ? value.length > 0 ? value.join(', ') : ''
    : value;

  return (
    <View style={[{ marginTop: 15 }, containerStyle]}>
      <View style={{ position: 'relative' }}>
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TouchableOpacity
          style={[
            s.px4,
            s.py4,
            s.border,
            s.roundedXl,
            s.justifyCenter,
            { borderColor: isFocused ? '#e46a62ff' : '#888', backgroundColor: '#fff', minHeight: 48 },
          ]}
          activeOpacity={0.7}
          onPress={() => { setIsFocused(true); setModalVisible(true); }}
          onBlur={() => setIsFocused(false)}
        >
          <Text style={[s.textBase, s.pr3,{ color: displayValue ? '#222' : '#888' }]}>
            {displayValue}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={28} color="#6B7280" style={{ position: 'absolute', right: 8 }} />
        </TouchableOpacity>
      </View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setModalVisible(false); setIsFocused(false); }}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => { setModalVisible(false); setIsFocused(false); }} />
        <View style={[s.bgWhite, s.p4, s.roundedMd, { margin: 24, position: 'absolute', top: 120, left: 0, right: 0, zIndex: 10 }]}> 
          <Text style={[s.textLg, s.fontBold, s.mb2]}>Select {label}</Text>
          <FlatList
            data={options}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const checked = Array.isArray(value)
                ? value.includes(item)
                : value === item;
              return (
                <TouchableOpacity
                  style={[s.flexRow, s.justifyStart, s.py2]}
                  onPress={() => {
                    if (multiple) {
                      let newValue = Array.isArray(value) ? [...value] : [];
                      if (checked) {
                        newValue = newValue.filter((v: string) => v !== item);
                      } else {
                        newValue.push(item);
                      }
                      onChange(newValue);
                    } else {
                      onChange(item);
                      setModalVisible(false);
                      setIsFocused(false);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={checked ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={checked ? '#e46a62ff' : '#9ca3af'}
                    style={[s.mr2]}
                  />
                  <Text style={[s.textBase, checked ? { color: '#e46a62ff' } : s.textGray700]}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity
            style={[s.mt4, s.px4, s.py2, { backgroundColor: '#e46a62ff' }, s.roundedFull, s.justifyCenter]}
            onPress={() => { setModalVisible(false); setIsFocused(false); }}
          >
            <Text style={[s.textWhite, s.textBase, s.fontSemibold]}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {!!helperText && (
        <Text style={[s.textSm, s.mt1, { color: '#888' }]}>{helperText}</Text>
      )}
    </View>
  );
}
