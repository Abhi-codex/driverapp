import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { styles as s } from "../../constants/tailwindStyles";
import { FirebasePhoneAuth } from "../../utils/firebase";
import { getServerUrl } from "../../utils/network";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    verificationId, 
    isSignup = 'false',
    role = 'driver'
  } = params as {
    phone: string;
    isFirebaseAuth?: string;
    verificationId?: string;
    isSignup?: string;
    role?: 'driver' | 'doctor' | 'patient';
  };

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

  const isFirebaseAuthEnabled = isFirebaseAuth === 'true';
  const isSignupFlow = isSignup === 'true';

  useEffect(() => {
    if (DEBUG) {
      console.log("[OTP SCREEN] Received params:", {
        phone,
        isFirebaseAuth: isFirebaseAuthEnabled,
        verificationId,
        isSignup: isSignupFlow,
        role,
        allParams: params
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

  const resendOtp = async () => {
    if (!canResend || loading) return;
    setError(null);
    setCanResend(false);
    setSecondsLeft(60);
    
    try {
      const result = await FirebasePhoneAuth.sendOTP(phone);
      if (result.success && result.verificationId) {
        setCurrentVerificationId(result.verificationId);
      } else {
        setError('Failed to resend OTP.');
      }
    } catch (error) {
      setError('Failed to resend OTP.');
    }
  };

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

  const verifyOtp = async () => {
    const otp = otpDigits.join('');
    console.log('[DRIVER OTP] Verify button clicked, OTP:', otp, 'Length:', otp.length);
    if (otp.length !== 6) {
      console.log('[DRIVER OTP] OTP length not 6, returning');
      return;
    }
    if (otp === lastAttemptedCode) {
      console.log('[DRIVER OTP] Same OTP attempted, returning');
      return;
    }
    
    setLastAttemptedCode(otp);
    setLoading(true);
    setError(null);
    
    try {
      console.log('[DRIVER OTP] Firebase auth enabled:', isFirebaseAuthEnabled);
      console.log('[DRIVER OTP] Current verification ID:', currentVerificationId ? 'Present' : 'Missing');
      
      if (isFirebaseAuthEnabled && currentVerificationId) {
        if (DEBUG) console.log('[DRIVER OTP] Firebase verification start');
        
        // Verify OTP with Firebase
        const verificationResult = await FirebasePhoneAuth.verifyOTPWithVerificationId(currentVerificationId, otp);
        if (!verificationResult.success || !verificationResult.idToken) {
          setError(verificationResult.message || 'Invalid OTP. Please try again.');
          return;
        }
        
        if (DEBUG) console.log('[DRIVER OTP] Backend auth with driver role');
        
        // Authenticate with backend using driver role
        const authResult = await FirebasePhoneAuth.authenticateWithBackend(
          verificationResult.idToken,
          'driver'
        );
        
        if (!authResult.success) {
          setError(authResult.message || 'Backend authentication failed');
          return;
        }
        
        if (!authResult.access_token) {
          setError('No access token received from backend');
          return;
        }
        
        // Store tokens and role
        await AsyncStorage.setItem('access_token', authResult.access_token);
        await AsyncStorage.setItem('firebase_id_token', verificationResult.idToken);
        if (authResult.refresh_token) {
          await AsyncStorage.setItem('refresh_token', authResult.refresh_token);
        }
        await AsyncStorage.setItem('role', 'driver');
        
        // Short delay for better UX
        await new Promise(r => setTimeout(r, 300));
        
        // Check if profile is complete
        try {
          const profileRes = await fetch(`${getServerUrl()}/driver/profile`, {
            headers: { 
              'Authorization': `Bearer ${authResult.access_token}`, 
              'Content-Type': 'application/json' 
            }
          });
          
          if (profileRes.ok) {
            const profileJson = await profileRes.json();
            const driver = profileJson.driver || profileJson.data;
            
            // Check multiple indicators of profile completion
            const isComplete = !!(driver && (
              driver.profileCompleted === true || 
              (driver.name && driver.vehicle && driver.vehicle.type && driver.vehicle.plateNumber)
            ));
            
            if (isComplete) {
              await AsyncStorage.setItem('profile_complete', 'true');
              console.log('[DRIVER OTP] Existing user with complete profile, redirecting to dashboard');
              router.replace('/navigation/MainTabs');
              return;
            } else {
              console.log('[DRIVER OTP] Existing user with incomplete profile, redirecting to profile form');
              router.replace({
                pathname: '/screens/DriverProfileForm',
                params: {
                  access_token: authResult.access_token,
                  user: JSON.stringify(authResult.user || {})
                }
              });
              return;
            }
          } else if (profileRes.status === 404) {
            // User doesn't exist, this is a new user
            console.log('[DRIVER OTP] New user detected, redirecting to profile form');
            router.replace({
              pathname: '/screens/DriverProfileForm',
              params: {
                access_token: authResult.access_token,
                user: JSON.stringify(authResult.user || {})
              }
            });
            return;
          }
        } catch (profileError) {
          console.warn('[DRIVER OTP] Profile check failed:', profileError);
          // On error, default to profile form to be safe
          router.replace({
            pathname: '/screens/DriverProfileForm',
            params: {
              access_token: authResult.access_token,
              user: JSON.stringify(authResult.user || {})
            }
          });
          return;
        }
        return;
      } else {
        // Handle case when Firebase auth is not enabled or verification ID is missing
        console.log('[DRIVER OTP] Firebase auth not enabled or verification ID missing');
        if (!isFirebaseAuthEnabled) {
          setError('Firebase authentication is not enabled');
        } else if (!currentVerificationId) {
          setError('Verification ID is missing. Please try sending OTP again.');
        }
        return;
      }
      
      // Fallback for non-Firebase auth (if needed)
      setError('Firebase authentication is required for driver registration');
      
    } catch (err: any) {
      if (DEBUG) console.error('[DRIVER OTP] error', err);
      setError(`Authentication failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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
        {isFirebaseAuth && (
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
        onPress={async () => {
          console.log('[DRIVER OTP] Button pressed, OTP digits:', otpDigits);
          console.log('[DRIVER OTP] Button disabled state:', loading || otpDigits.join("").length !== 6);
          try {
            await verifyOtp();
          } catch (error) {
            console.error('[DRIVER OTP] Error in button handler:', error);
          }
        }}
        disabled={loading || otpDigits.join("").length !== 6}>
        <Text style={[s.textWhite, s.textCenter, s.fontSemibold]}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>

      {isFirebaseAuth && (
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
