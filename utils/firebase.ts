import { Alert } from 'react-native';
import { getAuth, PhoneAuthProvider } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { getServerUrl } from './network';

let authInstance: any;
try {
  authInstance = getAuth(getApp());
} catch (error) {
  console.log('[Firebase] Error getting auth instance:', error);
}

const DEBUG = __DEV__ === true;

// Configure Firebase Auth settings for production
if (authInstance && authInstance.settings) {
  try {
    // For production builds, we need to allow reCAPTCHA but handle it properly
    authInstance.settings.appVerificationDisabledForTesting = false;
    // Set a timeout for verification
    authInstance.settings.forceRecaptchaFlowForTesting = false;
  } catch (error) {
    console.log('[Firebase] Could not configure app verification settings:', error);
  }
}

export interface FirebaseUser {
  uid: string;
  phoneNumber: string | null;
  email: string | null;
  displayName: string | null;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: any;
  access_token?: string;
  refresh_token?: string;
}

export class FirebasePhoneAuth {
  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; verificationId?: string; message?: string }> {
    try {
      if (DEBUG) console.log('[OTP] start verifyPhoneNumber', phoneNumber);
      
      // The second parameter (true) forces a reCAPTCHA verification if the
      // automatic verification fails. This is crucial for production builds
      // where Play Integrity might not be configured perfectly.
      const verificationId = await authInstance.verifyPhoneNumber(phoneNumber, true);

      if (DEBUG) console.log('[OTP] verificationId obtained:', verificationId);
      return { success: true, verificationId: verificationId };

    } catch (error: any) {
      if (DEBUG) console.error('[OTP] verifyPhoneNumber error', error);
      
      // Provide a more specific error message for this common issue.
      if (error.code === 'auth/missing-client-identifier') {
        Alert.alert(
          'Authentication Error',
          'Could not verify your phone number. Please ensure you have the latest version of the app and that Google Play Services is up to date.'
        );
        return { success: false, message: 'Request is missing a valid app identifier. Check SHA-1 and Play Integrity settings.' };
      }
      
      return { success: false, message: error.message || 'Failed to send OTP' };
    }
  }

  static async verifyOTPWithVerificationId(verificationId: string, code: string): Promise<{ success: boolean; idToken?: string; message?: string }> {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCred = await authInstance.signInWithCredential(credential);
      
      // Get a fresh ID token immediately after verification
      const idToken = await userCred.user.getIdToken(true); // Force refresh to get fresh token
      if (DEBUG) console.log('[OTP] Got fresh ID token after verification');
      
      return { success: true, idToken };
    } catch (error: any) {
      if (DEBUG) console.warn('[OTP] manual code verification error', error);
      let errorMessage = 'Invalid code. Please try again.';
      if (error.code === 'auth/invalid-verification-code') errorMessage = 'Incorrect code.';
      if (error.code === 'auth/code-expired') errorMessage = 'Code expired. Request a new one.';
      return { success: false, message: errorMessage };
    }
  }

  static async getFreshIdToken(): Promise<string | null> {
    try {
      const currentUser = authInstance.currentUser;
      if (currentUser) {
        const freshToken = await currentUser.getIdToken(true); // Force refresh
        if (DEBUG) console.log('[AUTH] Fresh ID token obtained');
        return freshToken;
      }
      return null;
    } catch (error) {
      if (DEBUG) console.error('[AUTH] Failed to get fresh ID token:', error);
      return null;
    }
  }

  static async authenticateWithBackend(idToken: string, role: 'doctor' | 'patient' | 'driver' = 'doctor'): Promise<AuthResult> {
    try {
      if (DEBUG) console.log('[AUTH] backend auth start', { url: getServerUrl(), role, idTokenLen: idToken.length });

      const response = await fetch(`${getServerUrl()}/firebase/verify-firebase-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role })
      });

      if (DEBUG) console.log('[AUTH] response status', response.status);
      const data = await response.json();
      if (DEBUG) console.log('[AUTH] body keys', Object.keys(data));

      if (response.ok) {
        if (DEBUG) console.log('[AUTH] success');
        let accessToken = data.access_token || data.accessToken || data.tokens?.accessToken;
        let refreshToken = data.refresh_token || data.refreshToken || data.tokens?.refreshToken;
        if (DEBUG) console.log('[AUTH] tokens flags', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

        if (!accessToken) {
          if (DEBUG) console.warn('[AUTH] missing access token, inspecting shape');
          if (data.result) {
            accessToken = data.result.access_token || data.result.accessToken;
            refreshToken = data.result.refresh_token || data.result.refreshToken;
          }
          if (!accessToken) {
            return { success: false, message: 'No access token received from backend' };
          }
        }
        return { success: true, message: 'Authentication successful', access_token: accessToken, refresh_token: refreshToken, user: data.user };
      } else {
        if (DEBUG) console.warn('[AUTH] failure body', data);
        
        // Handle specific token expiration errors
        if (response.status === 401 || response.status === 500) {
          if (data.message && (
            data.message.includes('expired') || 
            data.message.includes('id-token-expired') ||
            data.message.includes('Firebase ID token has expired')
          )) {
            return { success: false, message: 'Authentication session expired. Please try again.' };
          }
        }
        
        return { success: false, message: data.message || 'Backend authentication failed' };
      }
    } catch (error: any) {
      if (DEBUG) console.error('[AUTH] network error', error);
      return { success: false, message: `Network error: ${error.message}` };
    }
  }

  static getCurrentUser(): FirebaseUser | null {
    const user = authInstance.currentUser;
    if (user) {
      return { uid: user.uid, phoneNumber: user.phoneNumber, email: user.email, displayName: user.displayName };
    }
    return null;
  }

  static async signOut(): Promise<void> {
    try {
      await authInstance.signOut();
      if (DEBUG) console.log('[AUTH] signed out');
    } catch (error) {
      if (DEBUG) console.warn('[AUTH] sign out error', error);
    }
  }

  static formatPhoneNumber(phoneNumber: string, countryCode: string = '+91'): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
      return `${countryCode}${cleaned}`;
    }
    return `+${cleaned}`;
  }
}

export default FirebasePhoneAuth;
