import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import NavigationService, { RouteInfo } from '../utils/navigationService';

export const useNavigation = () => {
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStage, setNavigationStage] = useState<'idle' | 'to_patient' | 'to_hospital'>('idle');

  const [navigationService] = useState(() => NavigationService.getInstance());

  // Start navigation
  const startNavigation = useCallback(async (
    targetDestination: { latitude: number; longitude: number },
    stage: 'to_patient' | 'to_hospital',
    currentLocation: { latitude: number; longitude: number }
  ) => {
    try {
      console.log('Starting navigation to:', targetDestination, 'Stage:', stage);
      
      if (!currentLocation) {
        Alert.alert('Location Error', 'Current location is required for navigation');
        return;
      }

      setDestination(targetDestination);
      setNavigationStage(stage);
      setIsNavigating(true);

      // Always use in-app navigation
      await startInAppNavigation(currentLocation, targetDestination, stage);

      // Persist navigation state
      await AsyncStorage.setItem('navigation_stage', stage);
      await AsyncStorage.setItem('navigation_destination', JSON.stringify(targetDestination));
      
    } catch (error) {
      console.error('Failed to start navigation:', error);
      Alert.alert('Navigation Error', 'Failed to start navigation. Please try again.');
      setIsNavigating(false);
      setNavigationStage('idle');
    }
  }, [navigationService]);

  // Start in-app navigation
  const startInAppNavigation = useCallback(async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    stage: 'to_patient' | 'to_hospital'
  ) => {
    try {
      console.log('Starting in-app navigation');
      
      const route = await navigationService.calculateRoute(origin, destination);
      if (!route) {
        throw new Error('Failed to get route information');
      }

      setCurrentRoute(route);
      
      // Extract coordinates from route steps
      let coordinates = route.steps.reduce((coords, step) => {
        if (step && step.startLocation) coords.push(step.startLocation);
        return coords;
      }, [] as Array<{ latitude: number; longitude: number }>);

      // Add the final destination if available
      if (route.steps.length > 0 && route.steps[route.steps.length - 1].endLocation) {
        coordinates.push(route.steps[route.steps.length - 1].endLocation);
      }

      // If steps didn't yield coordinates, fall back to decoding the overview polyline
      if ((!coordinates || coordinates.length === 0) && route.polyline) {
        try {
          const decoded = decodePolyline(route.polyline);
          if (decoded && decoded.length > 0) {
            coordinates = decoded;
          }
        } catch (err) {
          console.warn('Failed to decode overview polyline', err);
        }
      }

      setRouteCoords(coordinates);
      
      console.log('In-app navigation route calculated:', {
        distance: route.distance,
        duration: route.duration,
        steps: route.steps?.length || 0
      });
      
    } catch (error) {
      console.error('Failed to start in-app navigation:', error);
      throw error;
    }
  }, [navigationService]);

  // Decode an encoded polyline string (Google polyline algorithm)
  const decodePolyline = (encoded: string) => {
    if (!encoded) return [] as Array<{ latitude: number; longitude: number }>;
    const coords: Array<{ latitude: number; longitude: number }> = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return coords;
  };

  // Stop navigation
  const stopNavigation = useCallback(async () => {
    try {
      console.log('Stopping navigation');
      
      setIsNavigating(false);
      setNavigationStage('idle');
      setCurrentRoute(null);
      setRouteCoords([]);
      setDestination(null);
      
      // Clear persisted navigation state
      await AsyncStorage.multiRemove([
        'navigation_stage',
        'navigation_destination'
      ]);
      
      console.log('Navigation stopped and state cleared');
    } catch (error) {
      console.error('Failed to stop navigation:', error);
    }
  }, []);

  // Handle stage completion (pickup/dropoff)
  const handleStageComplete = useCallback(async (stage: 'pickup' | 'dropoff') => {
    try {
      console.log('Stage completed:', stage);
      
      if (stage === 'pickup') {
        // Transition from to_patient to to_hospital
        setNavigationStage('to_hospital');
        await AsyncStorage.setItem('navigation_stage', 'to_hospital');
        
        // Stop current navigation, new navigation will be started by the ride management
        await stopNavigation();
        
        Alert.alert(
          'Patient Picked Up',
          'Great! You have picked up the patient. Navigation to hospital will start automatically.',
          [{ text: 'Continue' }]
        );
      } else if (stage === 'dropoff') {
        // Complete the entire ride
        await stopNavigation();
        
        Alert.alert(
          'Ride Completed',
          'Patient has been safely delivered to the hospital.',
          [{ text: 'Complete Ride' }]
        );
      }
    } catch (error) {
      console.error('Failed to handle stage completion:', error);
    }
  }, [stopNavigation]);

  // Load persisted navigation state
  const loadPersistedNavigationState = useCallback(async () => {
    try {
      const [stage, destinationStr] = await Promise.all([
        AsyncStorage.getItem('navigation_stage'),
        AsyncStorage.getItem('navigation_destination')
      ]);
      
      if (stage && destinationStr) {
        const destination = JSON.parse(destinationStr);
        setNavigationStage(stage as 'idle' | 'to_patient' | 'to_hospital');
        setDestination(destination);
        
        // Don't automatically resume navigation, just restore state
        console.log('Restored navigation state:', { stage, destination });
      }
    } catch (error) {
      console.error('Failed to load persisted navigation state:', error);
    }
  }, []);

  // Initialize navigation preferences and state
  useEffect(() => {
    loadPersistedNavigationState();
  }, [loadPersistedNavigationState]);

  return {
    // State
    routeCoords,
    destination,
    currentRoute,
    isNavigating,
    navigationStage,
    navigationMode: 'in-app',
    
    // Actions
    startNavigation,
    stopNavigation,
    handleStageComplete,
    // Provide a noop toggle to preserve API surface
    toggleNavigationMode: () => {
      console.log('Navigation mode is fixed to in-app');
    },
    saveNavigationPreference: async (_mode: any) => {},
    
    // Manual state setters (for external updates)
    setRouteCoords,
    setDestination,
    setCurrentRoute,
    setIsNavigating,
    setNavigationStage,
    setNavigationMode: (_v:any) => {},
  };
};