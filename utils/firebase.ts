import { Alert } from 'react-native';
import auth, { PhoneAuthProvider } from '@react-native-firebase/auth';
import { getServerUrl } from './network';
import FirebaseConfirmationStore from './firebaseConfirmationStore';

const DEBUG = __DEV__ === true;

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
      if (DEBUG) console.log('[OTP] start signInWithPhoneNumber', phoneNumber);
      
      // Use the correct React Native Firebase method
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      
      if (DEBUG) console.log('[OTP] confirmation obtained', { verificationId: confirmation.verificationId });
      
      // Store the confirmation object for later use
      FirebaseConfirmationStore.store(confirmation.verificationId, confirmation);
      
      return { 
        success: true, 
        verificationId: confirmation.verificationId
      };
    } catch (error: any) {
      if (DEBUG) console.error('[OTP] signInWithPhoneNumber error', error);
      let errorMessage = 'Failed to start verification.';
      if (error.code === 'auth/too-many-requests') errorMessage = 'Too many requests. Try later.';
      if (error.code === 'auth/invalid-phone-number') errorMessage = 'Invalid phone number.';
      if (error.code === 'auth/invalid-recaptcha-token') errorMessage = 'ReCAPTCHA verification failed. Please try again.';
      if (error.code === 'auth/web-context-cancelled') errorMessage = 'Verification cancelled. Please try again.';
      if (error.code === 'auth/network-request-failed') errorMessage = 'Network error. Please check your connection.';
      Alert.alert('Error', errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  static async verifyOTPWithVerificationId(verificationId: string, code: string): Promise<{ success: boolean; idToken?: string; message?: string }> {
    try {
      if (DEBUG) console.log('[OTP] verifying with verificationId:', verificationId);
      
      // Try to get the stored confirmation object first (preferred method)
      const confirmation = FirebaseConfirmationStore.get(verificationId);
      
      if (confirmation && typeof confirmation.confirm === 'function') {
        if (DEBUG) console.log('[OTP] using stored confirmation object');
        const userCred = await confirmation.confirm(code);
        
        // Clean up stored confirmation
        FirebaseConfirmationStore.remove(verificationId);
        
        // Get a fresh ID token immediately after verification
        const idToken = await userCred.user.getIdToken(true);
        if (DEBUG) console.log('[OTP] Got fresh ID token after verification');
        
        return { success: true, idToken };
      } else {
        // Fallback to credential method if confirmation object not available
        if (DEBUG) console.log('[OTP] using credential fallback method');
        const credential = PhoneAuthProvider.credential(verificationId, code);
        const userCred = await auth().signInWithCredential(credential);
        
        // Get a fresh ID token immediately after verification
        const idToken = await userCred.user.getIdToken(true);
        if (DEBUG) console.log('[OTP] Got fresh ID token after verification (fallback)');
        
        return { success: true, idToken };
      }
    } catch (error: any) {
      if (DEBUG) console.warn('[OTP] code verification error', error);
      
      // Clean up stored confirmation on error
      FirebaseConfirmationStore.remove(verificationId);
      
      let errorMessage = 'Invalid code. Please try again.';
      if (error.code === 'auth/invalid-verification-code') errorMessage = 'Incorrect code.';
      if (error.code === 'auth/code-expired') errorMessage = 'Code expired. Request a new one.';
      if (error.code === 'auth/invalid-verification-id') errorMessage = 'Invalid verification session. Please try again.';
      if (error.code === 'auth/session-expired') errorMessage = 'Session expired. Please request a new code.';
      return { success: false, message: errorMessage };
    }
  }

  static async getFreshIdToken(): Promise<string | null> {
    try {
      const currentUser = auth().currentUser;
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
    const user = auth().currentUser;
    if (user) {
      return { uid: user.uid, phoneNumber: user.phoneNumber, email: user.email, displayName: user.displayName };
    }
    return null;
  }

  static async signOut(): Promise<void> {
    try {
      await auth().signOut();
      // Clear any stored confirmations
      FirebaseConfirmationStore.clear();
      if (DEBUG) console.log('[AUTH] signed out and cleared confirmations');
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
