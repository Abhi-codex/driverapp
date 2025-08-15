import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { styles as s } from "../../constants/tailwindStyles";
import { verifyOtpFlow, resendOtpHelper } from "../../utils/otpManager";
import { useRouter, useLocalSearchParams } from "expo-router";

const DEBUG = __DEV__ === true;
const LoginImage = require("../../assets/images/login.png");

const OtpScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { 
    phone, 
    isFirebaseAuth = 'false', 
    verificationId 
  } = params as {
    phone: string;
    isFirebaseAuth?: string;
    verificationId?: string;
  };

  const isFirebaseAuthEnabled = isFirebaseAuth === 'true';

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [currentVerificationId, setCurrentVerificationId] = useState<
    string | undefined
  >(verificationId);
  const [lastAttemptedCode, setLastAttemptedCode] = useState<string>("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (DEBUG) {
      console.log("[OTP SCREEN] Received params:", {
        phone,
        isFirebaseAuth: isFirebaseAuthEnabled,
        verificationId,
      });
    }
    
    // Validate required params
    if (!phone) {
      console.error("[OTP SCREEN] Missing phone parameter");
      router.replace('/screens/DriverAuth');
      return;
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (!isFirebaseAuthEnabled) return;
    if (secondsLeft <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, isFirebaseAuthEnabled]);

  const resendOtp = async () =>
    resendOtpHelper({
      phone,
      loading,
      canResend,
      setError,
      setCanResend,
      setSecondsLeft,
      setCurrentVerificationId,
    });

  const handleOtpChange = (raw: string, index: number) => {
    if (error) setError(null);
    const prev = otpDigits[index];
    const cleaned = raw.replace(/\D/g, '');

    if (cleaned.length > 1) { // multi-paste
      const chars = cleaned.slice(0, 6 - index).split('');
      const nd = [...otpDigits];
      chars.forEach((c, i) => { nd[index + i] = c; });
      setOtpDigits(nd);
      console.log('[DRIVER OTP] Multi-paste OTP digits:', nd);
      const next = Math.min(index + chars.length, 5);
      if (next <= 5) inputRefs.current[next]?.focus();
      return;
    }

    if (cleaned.length === 1) { // typed a digit
      const nd = [...otpDigits];
      nd[index] = cleaned;
      setOtpDigits(nd);
      console.log('[DRIVER OTP] Single digit OTP digits:', nd);
      if (index < 5) inputRefs.current[index + 1]?.focus();
      return;
    }

    // cleaned empty -> deletion
    if (prev) { // clear current then move left
      const nd = [...otpDigits];
      nd[index] = '';
      setOtpDigits(nd);
      if (index > 0) setTimeout(() => inputRefs.current[index - 1]?.focus(), 10);
    } else if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Create a navigation adapter for the OTP manager
  const navigationAdapter = {
    reset: ({ index, routes }: { index: number; routes: { name: string }[] }) => {
      const routeName = routes[0]?.name;
      if (routeName === 'MainTabs') {
        router.replace('/navigation/MainTabs');
      }
    },
    replace: (routeName: string, params?: any) => {
      if (routeName === 'ProfileForm') {
        router.replace('/screens/DriverProfileForm');
      } else if (routeName === 'MainTabs') {
        router.replace('/navigation/MainTabs');
      }
    }
  };

  const verifyOtp = async () =>
    verifyOtpFlow({
      otpDigits,
      lastAttemptedCode,
      setLastAttemptedCode,
      isFirebaseAuth: isFirebaseAuthEnabled,
      currentVerificationId,
      phone,
      setLoading,
      setError,
      navigation: navigationAdapter as any,
    });

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      const nd = [...otpDigits];
      nd[index - 1] = '';
      setOtpDigits(nd);
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 10);
    }
  };

  return (
    <View style={[s.flex1, s.justifyCenter, s.alignCenter, s.bgGray50]}>
      {/* Header */}
      <View style={[s.alignCenter, s.mb6]}>
        <View style={[s.alignCenter, s.justifyCenter]}>
          <Image
            source={LoginImage}
            style={[s.w64, s.h64, s.roundedFull]}
            resizeMode="cover"
            accessibilityLabel="Ambulance Login Icon"
          />
        </View>
      </View>

      <Text style={[s.text2xl, s.fontSemibold, s.textCenter, s.mb2]}>
        Verify Phone
      </Text>
      <Text style={[s.textBase, s.textCenter, s.textGray600, s.mx4]}>
        We sent a 6-digit code to {phone}.       
      </Text>

      <View style={[s.flexRow, s.justifyCenter, { gap: 8 }, s.my4]}>
        {otpDigits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[s.w12, s.h14, s.text2xl, s.fontSemibold, s.textCenter, s.border, s.roundedLg, s.bgWhite,
              digit ? s.borderPrimary600 : s.borderGray300,
              { elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 },
            ]}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            autoComplete="one-time-code"
          />
        ))}
      </View>

      {error && (
        <Text style={[s.textDanger500, s.textCenter, s.mb4]}>{error}</Text>
      )}

      <View style={[s.mb4]}>
        {isFirebaseAuthEnabled && (
          <Text style={[s.textSm, s.textCenter, s.textGray500]}>
            {canResend
              ? "You can request a new code."
              : `Resend code in ${secondsLeft}s`}
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={[s.bgPrimary600, s.py3, s.px5, s.roundedLg, s.mb3, loading || 
        otpDigits.join("").length !== 6 ? s.opacity50 : null]} 
        onPress={verifyOtp} 
        disabled={loading || otpDigits.join("").length !== 6}>
        <Text style={[s.textWhite, s.textCenter, s.fontSemibold]}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>

      {isFirebaseAuthEnabled && (
        <TouchableOpacity
          onPress={resendOtp}
          disabled={!canResend || loading}
          style={[s.py2, s.mb2, !canResend ? s.opacity50 : null]}
        >
          <Text style={[s.textCenter, canResend ? s.textPrimary600 : s.textGray400, s.fontSemibold]}>
            Resend Code
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={[s.py2]}>
        <Text style={[s.textPrimary600, s.textCenter]}>
          Change Phone Number
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OtpScreen;
