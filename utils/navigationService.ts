import { Alert, Linking, Platform } from 'react-native';
import { Ride } from '../types/rider';

export interface NavigationOptions {
  mode?: 'driving' | 'walking' | 'transit';
  preferHighways?: boolean;
  avoidTolls?: boolean;
  voiceGuidance?: boolean;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
  steps: NavigationStep[];
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  maneuver: string;
}

export class NavigationService {
  private static instance: NavigationService;
  private apiKey: string;
  private isNavigating: boolean = false;
  private currentRoute: RouteInfo | null = null;

  private constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Calculate route between two points using Google Directions API
   */
  public async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: NavigationOptions = {}
  ): Promise<RouteInfo> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: options.mode || 'driving',
        units: 'metric',
        language: 'en',
        key: this.apiKey
      });

      if (options.avoidTolls) {
        params.append('avoid', 'tolls');
      }
      if (options.preferHighways) {
        params.append('route_preference', 'highways');
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(data.error_message || `Directions API error: ${data.status}`);
      }

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found');
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      const steps: NavigationStep[] = leg.steps.map((step: any) => ({
        instruction: this.cleanHtmlInstructions(step.html_instructions),
        distance: step.distance.value,
        duration: step.duration.value,
        startLocation: {
          latitude: step.start_location.lat,
          longitude: step.start_location.lng
        },
        endLocation: {
          latitude: step.end_location.lat,
          longitude: step.end_location.lng
        },
        maneuver: step.maneuver || 'straight'
      }));

      const routeInfo: RouteInfo = {
        distance: leg.distance.value,
        duration: leg.duration.value,
        polyline: route.overview_polyline.points,
        steps
      };

      this.currentRoute = routeInfo;
      return routeInfo;
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error;
    }
  }

  /**
   * Start navigation to a destination using the device's native navigation app
   */
  public async startNavigation(
    destination: { latitude: number; longitude: number },
    options: NavigationOptions = {}
  ): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await this.startIOSNavigation(destination, undefined, options);
      } else {
        await this.startAndroidNavigation(destination, undefined, options);
      }
      this.isNavigating = true;
    } catch (error) {
      console.error('Navigation start error:', error);
      throw error;
    }
  }

  /**
   * Start smart navigation for emergency ride workflow (In-App Only)
   */
  public async startEmergencyNavigation(
    ride: Ride,
    driverLocation: { latitude: number; longitude: number },
    stage: 'to_patient' | 'to_hospital'
  ): Promise<RouteInfo> {
    const destination = stage === 'to_patient' ? ride.pickup : ride.drop;
    
    if (!destination) {
      throw new Error(`${stage === 'to_patient' ? 'Pickup' : 'Drop'} location not available`);
    }

    // Calculate route for in-app navigation display
    const routeInfo = await this.calculateRoute(driverLocation, destination, {
      mode: 'driving',
      preferHighways: true, // Prefer highways for emergency situations
      voiceGuidance: true
    });

    // Set navigation state but don't open external apps
    this.isNavigating = true;
    this.currentRoute = routeInfo;

    return routeInfo;
  }

  /**
   * Start iOS navigation using Apple Maps or Google Maps
   */
  private async startIOSNavigation(
    destination: { latitude: number; longitude: number },
    origin?: { latitude: number; longitude: number },
    options: NavigationOptions = {}
  ): Promise<void> {
    const { latitude, longitude } = destination;
    
    // Try Google Maps first if installed
    let googleMapsUrl: string;
    if (origin) {
      googleMapsUrl = `comgooglemaps://?saddr=${origin.latitude},${origin.longitude}&daddr=${latitude},${longitude}&directionsmode=driving`;
    } else {
      googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
    }
    const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
    
    if (canOpenGoogleMaps) {
      await Linking.openURL(googleMapsUrl);
      return;
    }

    // Fallback to Apple Maps
    const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
    const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
    
    if (canOpenAppleMaps) {
      await Linking.openURL(appleMapsUrl);
      return;
    }

    throw new Error('No navigation app available');
  }

  /**
   * Start Android navigation using Google Maps
   */
  private async startAndroidNavigation(
    destination: { latitude: number; longitude: number },
    origin?: { latitude: number; longitude: number },
    options: NavigationOptions = {}
  ): Promise<void> {
    const { latitude, longitude } = destination;
    
    // Try Google Maps navigation intent
    let googleMapsUrl: string;
    if (origin) {
      // Use directions API format with origin and destination
      googleMapsUrl = `https://www.google.com/maps/dir/${origin.latitude},${origin.longitude}/${latitude},${longitude}`;
    } else {
      googleMapsUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;
    }
    const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
    
    if (canOpenGoogleMaps) {
      await Linking.openURL(googleMapsUrl);
      return;
    }

    // Fallback to web Google Maps
    const webGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const canOpenWebMaps = await Linking.canOpenURL(webGoogleMapsUrl);
    
    if (canOpenWebMaps) {
      await Linking.openURL(webGoogleMapsUrl);
      return;
    }

    throw new Error('No navigation app available');
  }

  /**
   * Launch external navigation (Google Maps/Apple Maps)
   */
  public async launchExternalNavigation(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    stage: 'to_patient' | 'to_hospital'
  ): Promise<boolean> {
    try {
      console.log(`🚀 Launching external navigation for ${stage}`);
      console.log('📍 Origin coordinates:', origin);
      console.log('📍 Destination coordinates:', destination);
      
      // Validate coordinates before launching navigation
      if (!destination || typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
        throw new Error('Invalid destination coordinates');
      }
      
      if (Platform.OS === 'ios') {
        await this.startIOSNavigation(destination, origin);
      } else {
        await this.startAndroidNavigation(destination, origin);
      }
      
      // Show return reminder with destination coordinates
      setTimeout(() => {
        Alert.alert(
          'Navigation Started',
          `External navigation opened for ${stage === 'to_patient' ? 'patient pickup' : 'hospital delivery'}.\n\nDestination: ${destination.latitude.toFixed(6)}, ${destination.longitude.toFixed(6)}\n\nPlease return to InstaAid when you reach your destination.`,
          [
            { 
              text: 'OK',
              onPress: () => console.log('User acknowledged external navigation')
            }
          ]
        );
      }, 1500);
      
      return true;
    } catch (error) {
      console.error('External navigation failed:', error);
      Alert.alert(
        'Navigation Error',
        'Could not open external navigation app. Please check if Google Maps or Apple Maps is installed.',
        [
          { text: 'Try Again', onPress: () => this.showNavigationOptions(destination) },
          { text: 'Cancel' }
        ]
      );
      return false;
    }
  }

  /**
   * Stop current navigation
   */
  public stopNavigation(): void {
    this.isNavigating = false;
    this.currentRoute = null;
  }

  /**
   * Check if currently navigating
   */
  public getNavigationStatus(): boolean {
    return this.isNavigating;
  }

  /**
   * Get current route information
   */
  public getCurrentRoute(): RouteInfo | null {
    return this.currentRoute;
  }

  /**
   * Open navigation settings or permissions
   */
  public async openNavigationSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openURL('package:com.google.android.apps.maps');
      }
    } catch (error) {
      console.error('Failed to open navigation settings:', error);
      Alert.alert(
        'Settings',
        'Please check your device settings to ensure navigation apps are installed and permissions are granted.'
      );
    }
  }

  /**
   * Show navigation options to user
   */
  public showNavigationOptions(destination: { latitude: number; longitude: number }): void {
    const { latitude, longitude } = destination;
    
    Alert.alert(
      'Choose Navigation App',
      'Select your preferred navigation app:',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.OS === 'ios'
              ? `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`
              : `google.navigation:q=${latitude},${longitude}&mode=d`;
            
            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                // Fallback to web
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`);
              }
            });
          }
        },
        ...(Platform.OS === 'ios' ? [{
          text: 'Apple Maps',
          onPress: () => {
            Linking.openURL(`http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`);
          }
        }] : []),
        {
          text: 'Waze',
          onPress: () => {
            const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
            Linking.canOpenURL(wazeUrl).then((supported) => {
              if (supported) {
                Linking.openURL(wazeUrl);
              } else {
                Alert.alert('Waze Not Installed', 'Waze app is not installed on your device.');
              }
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  /**
   * Clean HTML instructions from Google Directions API
   */
  private cleanHtmlInstructions(htmlInstructions: string): string {
    return htmlInstructions
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Format distance for display
   */
  public static formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }

  /**
   * Format duration for display
   */
  public static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Calculate estimated arrival time
   */
  public static getEstimatedArrival(durationSeconds: number): string {
    const now = new Date();
    const arrival = new Date(now.getTime() + durationSeconds * 1000);
    return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export default NavigationService;
