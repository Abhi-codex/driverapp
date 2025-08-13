import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors, styles } from "../../constants/tailwindStyles";
import LabelInput from "../../components/LabelInput";
import { FirebasePhoneAuth } from "../../utils/firebase";

export default function DriverAuthScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (value: string) => {
    // Only allow digits and limit to 10 characters
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleanedValue);
  };

  const validatePhone = () => {
    return phoneNumber.length === 10 && /^\d{10}$/.test(phoneNumber);
  };

  const handleAuth = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (!validatePhone()) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = FirebasePhoneAuth.formatPhoneNumber(phoneNumber, '+91');
      console.log('[DRIVER AUTH] Sending OTP to:', formattedPhone);
      
      // Send OTP via Firebase (this works for both new and existing users)
      const result = await FirebasePhoneAuth.sendOTP(formattedPhone);
      
      if (result.success && result.verificationId) {
        console.log('[DRIVER AUTH] OTP sent successfully');
        router.push({
          pathname: '/screens/OtpScreen',
          params: {
            phone: formattedPhone,
            isFirebaseAuth: 'true',
            verificationId: result.verificationId,
            isSignup: 'auto', // Auto-detect if user is new or existing
            role: 'driver'
          }
        });
      } else {
        Alert.alert(
          "Error",
          result.message || "Failed to send OTP. Please try again."
        );
      }
    } catch (error) {
      console.error("Driver auth error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.flex1]} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.flex1, { backgroundColor: colors.gray[50] }]}
        contentContainerStyle={[styles.flexGrow, styles.justifyCenter]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.px5, styles.py6]}>
          {/* Header */}
          <View style={[styles.alignCenter, styles.mb6]}>
            <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <FontAwesome5 name="user-md" size={64} color={styles.textGray900.color || "#111"} />
            </View>
            <Text style={[styles.text3xl, styles.fontBold, styles.textGray900, styles.textCenter]}>
              Driver Authentication
            </Text>
            <Text style={[styles.textBase, styles.textGray600, styles.textCenter, styles.mt2]}>
              Enter your phone number to continue
            </Text>
          </View>

          {/* Phone Number Input */}
          <View style={[styles.mb6]}>
            <LabelInput
              label="Mobile Number"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="numeric"
              placeholder=""
              maxLength={10}
              editable={!loading}
              helperText={phoneNumber.length > 0 && phoneNumber.length < 10 ? 
                `Enter ${10 - phoneNumber.length} more digits` : 
                phoneNumber.length === 10 ? "Valid mobile number" : 
                "Enter 10-digit mobile number"
              }
              containerStyle={styles.mb4}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.wFull, styles.py4, styles.alignCenter, styles.roundedLg, 
                  {backgroundColor: loading || !validatePhone() ? colors.gray[300] : colors.primary[500],
                   shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
                   shadowRadius: 4, elevation: 3}]}
            onPress={handleAuth}
            disabled={loading || !validatePhone()}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[styles.textWhite, styles.textLg, styles.fontBold]}>
                Continue with Phone
              </Text>
            )}
          </TouchableOpacity>

          <View style={[styles.mt6, styles.p4, styles.rounded3xl, styles.bgGray100, styles.borderGray200, { borderWidth: 1 }]}> 
            <Text style={[styles.textSm, styles.fontMedium, styles.textGray800, styles.mb2]}>
              Driver Requirements:
            </Text>
            <Text style={[styles.textXs, styles.textGray700, styles.mb1]}>
              1. Valid EMT certification
            </Text>
            <Text style={[styles.textXs, styles.textGray700, styles.mb1]}>
              2. Ambulance vehicle registration
            </Text>
            <Text style={[styles.textXs, styles.textGray700, styles.mb1]}>
              3. Medical equipment certification
            </Text>
            <Text style={[styles.textXs, styles.textGray700]}>
              4. Background verification completed
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
