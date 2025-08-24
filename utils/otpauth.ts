import { getServerUrl } from './network';

const DEBUG = __DEV__ === true;

export interface OTPResult {
  success: boolean;
  message: string;
  phone?: string;
  otp?: string;
  expiresIn?: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: any;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  profile?: any;
}

export class OTPAuth {
  
  // Send OTP to phone number
  static async sendOTP(phoneNumber: string, role: 'driver' | 'patient' | 'doctor' = 'driver'): Promise<OTPResult> {
    try {
      if (DEBUG) console.log('[BACKEND OTP] Sending OTP to:', phoneNumber, 'role:', role);

      const response = await fetch(`${getServerUrl()}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          role: role
        }),
      });

      const data = await response.json();
      
      if (DEBUG) {
        console.log('[BACKEND OTP] Send OTP response:', {
          success: data.success,
          message: data.message,
          hasOTP: !!data.otp,
          phone: data.phone
        });
      }

      // Show OTP in both development and production for now
      if (data.otp) {
        console.log('[BACKEND OTP] 🔑 OTP for testing:', data.otp);
      }

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'OTP sent successfully',
          phone: data.phone,
          otp: data.otp, // Only available in development
          expiresIn: data.expiresIn
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to send OTP'
        };
      }
    } catch (error: any) {
      if (DEBUG) console.error('[BACKEND OTP] Send OTP error:', error);
      return {
        success: false,
        message: `Network error: ${error.message || 'Failed to connect to server'}`
      };
    }
  }
  // Verify OTP code
  static async verifyOTP(phoneNumber: string, otp: string): Promise<AuthResult> {
    try {
      if (DEBUG) console.log('[BACKEND OTP] Verifying OTP for:', phoneNumber);

      const response = await fetch(`${getServerUrl()}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: otp
        }),
      });

      const data = await response.json();
      
      if (DEBUG) {
        console.log('[BACKEND OTP] Verify OTP response:', {
          success: data.success,
          message: data.message,
          hasUser: !!data.user,
          hasTokens: !!data.tokens,
          userRole: data.user?.role
        });
      }

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'OTP verified successfully',
          user: data.user,
          tokens: data.tokens,
          profile: data.profile
        };
      } else {
        return {
          success: false,
          message: data.message || 'Invalid OTP'
        };
      }
    } catch (error: any) {
      if (DEBUG) console.error('[BACKEND OTP] Verify OTP error:', error);
      return {
        success: false,
        message: `Network error: ${error.message || 'Failed to connect to server'}`
      };
    }
  }

  // Make authenticated API request
  static async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    try {
      const accessToken = await AsyncStorage.default.getItem('access_token');
      
      if (!accessToken) {
        throw new Error('No access token found');
      }

      return fetch(`${getServerUrl()}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      if (DEBUG) console.error('[BACKEND OTP] Authenticated request error:', error);
      throw error;
    }
  }

  // Format phone number for backend
  static formatPhoneNumber(phoneNumber: string, countryCode: string = '+91'): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
      return `${countryCode}${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    try {
      const accessToken = await AsyncStorage.default.getItem('access_token');
      return !!accessToken;
    } catch (error) {
      return false;
    }
  }

  // Sign out user
  static async signOut(): Promise<void> {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    try {
      await AsyncStorage.default.multiRemove([
        'accessToken',
        'refreshToken',
        'access_token',
        'refresh_token',
        'role',
        'profile_complete'
      ]);
      
      if (DEBUG) console.log('[BACKEND OTP] User signed out successfully');
    } catch (error) {
      if (DEBUG) console.error('[BACKEND OTP] Sign out error:', error);
      throw error;
    }
  }
}

export default OTPAuth;