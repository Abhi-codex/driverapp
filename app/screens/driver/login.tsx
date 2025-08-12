import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import LabelInput from "../../components/Input";
import { colors, styles } from "../../constants/TailwindStyles";
import { getServerUrl } from "../../utils/network";

export default function DriverLoginScreen() {
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

  const handleDriverLogin = async () => {
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
      const formattedPhone = "+91" + phoneNumber;

      const response = await fetch(`${getServerUrl()}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          role: "driver",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("access_token", data.access_token);
        await AsyncStorage.setItem("refresh_token", data.refresh_token);
        await AsyncStorage.setItem("role", "driver");
        await AsyncStorage.setItem("user_id", data.user._id);

        const isProfileComplete = data.user.name && 
                                 data.user.vehicle && 
                                 data.user.vehicle.type && 
                                 data.user.vehicle.plateNumber && 
                                 data.user.vehicle.licenseNumber;

        if (isProfileComplete) {
          await AsyncStorage.setItem("profile_complete", "true");
          Alert.alert("Success", "Login successful!", [
            {
              text: "Continue",
              onPress: () => router.replace("/driver/dashboard"),
            },
          ]);
        } else {
          await AsyncStorage.removeItem("profile_complete");
          Alert.alert(
            "Welcome!",
            data.message === "User created successfully"
              ? "Please complete your driver profile to start accepting rides."
              : "Please complete your profile information to continue.",
            [
              {
                text: "Complete Profile",
                onPress: () => router.replace("/driver/profile" as any),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          "Login Failed",
          data.message || "Unable to login. Please try again."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex1]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[styles.flex1, { backgroundColor: colors.gray[50] }]}
        contentContainerStyle={[styles.flexGrow, styles.justifyCenter]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.px5, styles.py6]}>
          {/* Header */}
          <View style={[styles.alignCenter, styles.mb6]}>
            <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 20,}}>
                <FontAwesome5 name="user-md" size={64} color={styles.textGray900.color || "#111"} />
            </View>
            <Text style={[styles.text3xl, styles.fontBold, styles.textGray900, styles.textCenter]}>
              Driver Portal
            </Text>
            <Text style={[styles.textBase, styles.textGray600, styles.textCenter, styles.mt2]}>
              Login to start accepting emergency calls
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
                phoneNumber.length === 10 ? "✓ Valid mobile number" : 
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
            onPress={handleDriverLogin}
            disabled={loading || !validatePhone()}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[styles.textWhite, styles.textLg, styles.fontBold]}>
                Continue as Driver
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

          <TouchableOpacity
            style={[styles.alignCenter, styles.mt6]}
            onPress={() => router.replace("/patient/login")}
            disabled={loading}
          >
            <Text style={[styles.textSm, styles.textGray600]}>
              Not a driver?{" "}
              <Text style={[styles.textPrimary500, styles.fontMedium]}>
                Book an Ambulance
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
