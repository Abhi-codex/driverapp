import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';

const PUSH_TOKEN_KEY = 'pushToken';
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export interface RideNotification {
  rideId: string;
  patientLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  hospitalLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distance: number;
  urgency: 'high' | 'medium' | 'low';
  estimatedTime?: string;
  vehicle?: string;
}

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;
  private driverLocation: { latitude: number; longitude: number } | null = null;
  private notificationRadius = 10000; // 10km default radius

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing NotificationService...');
      
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('🔔 Push notifications only work on physical devices');
        return false;
      }

      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('🔔 Notification permissions denied');
        return false;
      }

      // Try to get push token (optional - don't fail if it doesn't work)
      try {
        await this.registerForPushNotifications();
      } catch (tokenError) {
        console.warn('🔔 Push token generation failed, but continuing with local notifications:', tokenError);
        // Continue without push token - local notifications will still work
      }

      // Set up background tasks
      await this.setupBackgroundTasks();

      this.isInitialized = true;
      console.log('🔔 NotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('🔔 Failed to initialize NotificationService:', error);
      return false;
    }
  }

  /**
   * Request notification permissions from user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('🔔 Notification permission not granted');
        return false;
      }

      // Request background location permission for proximity detection
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('🔔 Background location permission not granted');
      }

      return true;
    } catch (error) {
      console.error('🔔 Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check for existing token
      const existingToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (existingToken) {
        this.pushToken = existingToken;
        console.log('🔔 Using existing push token:', existingToken.substring(0, 20) + '...');
        return existingToken;
      }

      // Generate new token using Expo's push service only 
      console.log('🔔 Generating Expo push token...');
      const token = await Notifications.getExpoPushTokenAsync();

      this.pushToken = token.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
      
      console.log('🔔 Generated Expo push token successfully:', token.data.substring(0, 20) + '...');
      return token.data;
    } catch (error) {
      console.warn('🔔 Push token generation failed (continuing without remote push):', error.message);
      
      // For development, we'll continue without push token
      // Local notifications will still work for testing
      console.log('🔔 Continuing with local-only notifications for development/testing');
      return null;
    }
  }

  /**
   * Send push token to backend for ride notifications
   */
  async registerTokenWithBackend(driverId: string, baseURL: string): Promise<boolean> {
    try {
      if (!this.pushToken) {
        console.warn('🔔 No push token available for backend registration');
        return false;
      }

      const response = await fetch(`${baseURL}/driver/register-push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          pushToken: this.pushToken,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('🔔 Push token registered with backend successfully');
        return true;
      } else {
        console.error('🔔 Failed to register push token with backend:', response.status);
        return false;
      }
    } catch (error) {
      console.error('🔔 Error registering token with backend:', error);
      return false;
    }
  }

  /**
   * Setup background tasks for monitoring ride requests
   */
  async setupBackgroundTasks(): Promise<void> {
    try {
      // Define background task
      TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
        if (error) {
          console.error('🔔 Background task error:', error);
          return;
        }

        console.log('🔔 Background notification task executed');
        // This will be handled by the backend push notifications
        // The task mainly keeps the app eligible for background processing
      });

      // Check if background fetch is available and register
      const isAvailable = await BackgroundFetch.getStatusAsync();
      if (isAvailable === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
          minimumInterval: 60000, // 1 minute minimum
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('🔔 Background tasks registered successfully');
      } else {
        console.log('🔔 Background fetch not available, skipping background task registration');
      }
    } catch (error) {
      console.warn('🔔 Background task setup failed (continuing without background tasks):', error);
      // Continue without background tasks - main functionality will still work
    }
  }

  /**
   * Update driver's current location for proximity calculations
   */
  updateDriverLocation(location: { latitude: number; longitude: number }): void {
    this.driverLocation = location;
  }

  /**
   * Set the notification radius (in meters)
   */
  setNotificationRadius(radius: number): void {
    this.notificationRadius = radius;
  }

  /**
   * Send local notification for immediate ride request
   */
  async sendRideNotification(rideData: RideNotification): Promise<void> {
    try {
      const urgencyConfig = {
        high: {
          priority: Notifications.AndroidNotificationPriority.MAX,
          sound: 'default',
          vibrate: [0, 250, 250, 250],
          color: '#DC2626', // Red
        },
        medium: {
          priority: Notifications.AndroidNotificationPriority.HIGH,
          sound: 'default',
          vibrate: [0, 250],
          color: '#F59E0B', // Amber
        },
        low: {
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          sound: 'default',
          vibrate: [0, 100],
          color: '#10B981', // Green
        },
      };

      const config = urgencyConfig[rideData.urgency];
      const urgencyText = rideData.urgency.charAt(0).toUpperCase() + rideData.urgency.slice(1);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 ${urgencyText} Priority Emergency Request`,
          body: `New ride request ${rideData.distance.toFixed(1)}km away${rideData.estimatedTime ? ` • ETA: ${rideData.estimatedTime}` : ''}`,
          data: {
            rideId: rideData.rideId,
            type: 'ride_request',
            patientLocation: rideData.patientLocation,
            hospitalLocation: rideData.hospitalLocation,
            distance: rideData.distance,
            urgency: rideData.urgency,
          },
          sound: config.sound,
          priority: config.priority,
          color: config.color,
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log(`🔔 Sent ${rideData.urgency} priority ride notification for ride:`, rideData.rideId);
    } catch (error) {
      console.error('🔔 Error sending ride notification:', error);
    }
  }

  /**
   * Send local notification for ride cancellation
   */
  async sendCancellationNotification(rideId: string, cancelledBy: string, reason?: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '❌ Ride Cancelled',
          body: reason 
            ? `Ride ${rideId.slice(-8)} cancelled by ${cancelledBy}. Reason: ${reason}`
            : `Ride ${rideId.slice(-8)} was cancelled by ${cancelledBy}.`,
          data: {
            rideId,
            type: 'ride_cancellation',
            cancelledBy,
            reason,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          color: '#EF4444', // Red color for cancellation
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log(`🔔 Sent cancellation notification for ride:`, rideId);
    } catch (error) {
      console.error('🔔 Error sending cancellation notification:', error);
    }
  }

  /**
   * Send local notification for ambulance arrival
   */
  async sendArrivalNotification(rideId: string, location: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚑 Ambulance Has Arrived',
          body: `Your ambulance has arrived at ${location}`,
          data: {
            rideId,
            type: 'ambulance_arrived',
            location,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          color: '#10B981', // Green color for arrival
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log(`🔔 Sent arrival notification for ride:`, rideId);
    } catch (error) {
      console.error('🔔 Error sending arrival notification:', error);
    }
  }

  /**
   * Handle notification received while app is running
   */
  onNotificationReceived(callback: (notification: Notifications.Notification) => void): Notifications.EventSubscription {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    return subscription;
  }

  /**
   * Handle notification tapped/opened
   */
  onNotificationResponse(callback: (response: Notifications.NotificationResponse) => void): Notifications.EventSubscription {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return subscription;
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setBadgeCountAsync(0);
      console.log('🔔 Cleared all notifications');
    } catch (error) {
      console.error('🔔 Error clearing notifications:', error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if a ride is within notification radius
   */
  isWithinNotificationRadius(rideLocation: { latitude: number; longitude: number }): boolean {
    if (!this.driverLocation) {
      return false;
    }

    const distance = this.calculateDistance(
      this.driverLocation.latitude,
      this.driverLocation.longitude,
      rideLocation.latitude,
      rideLocation.longitude
    );

    return distance <= this.notificationRadius;
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;