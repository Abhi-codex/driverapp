import { Alert, Platform } from 'react-native';
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
   * Start navigation to a destination using in-app navigation (calculate route)
   */
  public async startNavigation(
    destination: { latitude: number; longitude: number },
    options: NavigationOptions = {}
  ): Promise<void> {
    try {
      // Use in-app route calculation instead of launching external navigation apps
      // If driver origin not available here, callers should calculate the route and set state
      // We'll attempt to set a placeholder currentRoute if possible
      // For backwards compatibility, don't throw here; simply mark navigating state
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
  // External navigation support removed. All navigation should use in-app routing.

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
      // Opening external navigation settings is intentionally disabled.
      // Provide a user-facing message instead.
      Alert.alert(
        'Navigation Settings',
        'In-app navigation is used by InstaAid. To adjust map app settings, please use your device settings.'
      );
    } catch (error) {
      console.error('Failed to open navigation settings:', error);
      Alert.alert(
        'Settings',
        'Please check your device settings to ensure location permissions are granted.'
      );
    }
  }
  // showNavigationOptions removed to enforce in-app navigation only

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
