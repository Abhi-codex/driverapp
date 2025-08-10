import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerUrl } from './network';
import { FirebasePhoneAuth } from './firebase';
import type { StackNavigationProp } from '@react-navigation/stack';

const DEBUG = __DEV__ === true;

export interface VerifyOtpParams {
  otpDigits: string[];
  lastAttemptedCode: string;
  setLastAttemptedCode: (c: string) => void;
  isFirebaseAuth: boolean;
  currentVerificationId?: string;
  phone: string;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  navigation: StackNavigationProp<any>;
}

export async function verifyOtpFlow({
  otpDigits,
  lastAttemptedCode,
  setLastAttemptedCode,
  isFirebaseAuth,
  currentVerificationId,
  phone,
  setLoading,
  setError,
  navigation,
}: VerifyOtpParams) {
  const otp = otpDigits.join('');
  if (otp.length !== 6) return;
  if (otp === lastAttemptedCode) return; // prevent duplicate attempts until digit changes
  setLastAttemptedCode(otp);
  setLoading(true);
  setError(null);
  try {
    if (isFirebaseAuth && currentVerificationId) {
      if (DEBUG) console.log('[OTP FLOW] firebase verification start');
      const verificationResult = await FirebasePhoneAuth.verifyOTPWithVerificationId(currentVerificationId, otp);
      if (!verificationResult.success || !verificationResult.idToken) {
        setError(verificationResult.message || 'Invalid OTP. Please try again.');
        return;
      }
      if (DEBUG) console.log('[OTP FLOW] backend auth');
      const authResult = await FirebasePhoneAuth.authenticateWithBackend(
        verificationResult.idToken,
        'doctor'
      );
      if (!authResult.success) {
        setError(authResult.message || 'Backend authentication failed');
        return;
      }
      if (!authResult.access_token) {
        setError('No access token received from backend');
        return;
      }
      await AsyncStorage.setItem('access_token', authResult.access_token);
      if (authResult.refresh_token) {
        await AsyncStorage.setItem('refresh_token', authResult.refresh_token);
      }
      await new Promise(r => setTimeout(r, 300));
      // Profile check
      let navigateTo: 'MainTabs' | 'ProfileForm' = 'ProfileForm';
      try {
        const profileRes = await fetch(getServerUrl() + '/doctor/profile', {
          headers: { 'Authorization': `Bearer ${authResult.access_token}`, 'Content-Type': 'application/json' }
        });
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          const doctor = profileJson.doctor || profileJson;
            const complete = !!(doctor && doctor.name && doctor.specialties && doctor.specialties.length > 0);
          if (complete) navigateTo = 'MainTabs';
        }
      } catch {}
      if (navigateTo === 'MainTabs') {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        navigation.replace('ProfileForm', { phone, isFirebaseAuth: true, access_token: authResult.access_token });
      }
      return;
    }
    // Legacy fallback
    if (DEBUG) console.log('[OTP FLOW] legacy verification');
    const res = await fetch(getServerUrl() + '/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      await AsyncStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) await AsyncStorage.setItem('refresh_token', data.refresh_token);
      await new Promise(r => setTimeout(r, 300));
      try {
        const profileRes = await fetch(getServerUrl() + '/doctor/profile', {
          headers: { 'Authorization': `Bearer ${data.access_token}`, 'Content-Type': 'application/json' }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const doctor = profileData.doctor || profileData;
          if (doctor && doctor.name && doctor.specialties && doctor.specialties.length > 0) {
            navigation.replace('MainTabs');
            return;
          }
        }
      } catch {}
      navigation.replace('ProfileForm', { access_token: data.access_token, user: data.user });
    } else {
      setError(data.message || 'Invalid OTP');
    }
  } catch (err: any) {
    if (DEBUG) console.error('[OTP FLOW] error', err);
    setError(`Authentication failed: ${err?.message || 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
}

export interface ResendParams {
  phone: string;
  loading: boolean;
  canResend: boolean;
  setError: (v: string | null) => void;
  setCanResend: (v: boolean) => void;
  setSecondsLeft: (v: number) => void;
  setCurrentVerificationId: (v?: string) => void;
}

export async function resendOtpHelper({ phone, loading, canResend, setError, setCanResend, setSecondsLeft, setCurrentVerificationId }: ResendParams) {
  if (!canResend || loading) return;
  setError(null);
  setCanResend(false);
  setSecondsLeft(60);
  const result = await FirebasePhoneAuth.sendOTP(phone);
  if (result.success && result.verificationId) {
    setCurrentVerificationId(result.verificationId);
  } else {
    setError('Failed to resend OTP.');
  }
}
