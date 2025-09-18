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
  const [navigationMode, setNavigationMode] = useState<'in-app' | 'external'>('external'); 
  
  const [navigationService] = useState(() => NavigationService.getInstance());

  // Load navigation preference from storage
  const loadNavigationPreference = useCallback(async () => {
    try {
      const storedMode = await AsyncStorage.getItem('navigation_mode');
      if (storedMode && (storedMode === 'in-app' || storedMode === 'external')) {
        setNavigationMode(storedMode);
      }
    } catch (error) {
      console.error('Failed to load navigation preference:', error);
    }
  }, []);

  // Save navigation preference
  const saveNavigationPreference = useCallback(async (mode: 'in-app' | 'external') => {
    try {
      await AsyncStorage.setItem('navigation_mode', mode);
      console.log('Navigation preference saved:', mode);
    } catch (error) {
      console.error('Failed to save navigation preference:', error);
    }
  }, []);

  // Toggle navigation mode
  const toggleNavigationMode = useCallback(() => {
    const newMode = navigationMode === 'in-app' ? 'external' : 'in-app';
    setNavigationMode(newMode);
    saveNavigationPreference(newMode);
  }, [navigationMode, saveNavigationPreference]);

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

      // Use hybrid navigation approach
      if (navigationMode === 'external') {
        // Launch external navigation app
        const success = await navigationService.launchExternalNavigation(
          currentLocation,
          targetDestination,
          stage
        );
        
        if (!success) {
          // Fallback to in-app navigation
          console.log('External navigation failed, falling back to in-app');
          await startInAppNavigation(currentLocation, targetDestination, stage);
        } else {
          console.log('External navigation launched successfully');
        }
      } else {
        // Use in-app navigation
        await startInAppNavigation(currentLocation, targetDestination, stage);
      }

      // Persist navigation state
      await AsyncStorage.setItem('navigation_stage', stage);
      await AsyncStorage.setItem('navigation_destination', JSON.stringify(targetDestination));
      
    } catch (error) {
      console.error('Failed to start navigation:', error);
      Alert.alert('Navigation Error', 'Failed to start navigation. Please try again.');
      setIsNavigating(false);
      setNavigationStage('idle');
    }
  }, [navigationService, navigationMode]);

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
      const coordinates = route.steps.reduce((coords, step) => {
        coords.push(step.startLocation);
        return coords;
      }, [] as Array<{ latitude: number; longitude: number }>);
      
      // Add the final destination
      if (route.steps.length > 0) {
        coordinates.push(route.steps[route.steps.length - 1].endLocation);
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
    loadNavigationPreference();
    loadPersistedNavigationState();
  }, [loadNavigationPreference, loadPersistedNavigationState]);

  return {
    // State
    routeCoords,
    destination,
    currentRoute,
    isNavigating,
    navigationStage,
    navigationMode,
    
    // Actions
    startNavigation,
    stopNavigation,
    handleStageComplete,
    toggleNavigationMode,
    saveNavigationPreference,
    loadNavigationPreference,
    
    // Manual state setters (for external updates)
    setRouteCoords,
    setDestination,
    setCurrentRoute,
    setIsNavigating,
    setNavigationStage,
    setNavigationMode,
  };
};