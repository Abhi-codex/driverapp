import React, { useState, useEffect } from 'react';
import { Platform, Text, View, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5, Fontisto } from '@expo/vector-icons';
import { colors, styles } from '../constants/tailwindStyles';
import { mapStyles } from '../constants/mapStyles';
import { mapControlThemes, mapTypeOptions } from '../constants/mapThemes';

let MapView: any;
let Marker: any;
let Polyline: any;
let Location: any;
let PROVIDER_GOOGLE: any;

// Only import react-native-maps on native platforms
if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Polyline = RNMaps.Polyline;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
    
    // Import Expo Location
    Location = require('expo-location');
  } catch (error) {
    console.log('react-native-maps or expo-location not available:', error);
  }
}

interface MapViewWrapperProps {
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  onRegionChangeComplete?: (region: any) => void;
  onMapReady?: () => void;
  onError?: (error: any) => void;
  mapType?: 'standard' | 'hybrid' | 'terrain';
  showsTraffic?: boolean;
  showsIndoors?: boolean;
  showsCompass?: boolean;
  showsMyLocationButton?: boolean;
  showsScale?: boolean;
  followsUserLocation?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  theme?: 'day' | 'night';
  showMapTypeSelector?: boolean;
  showFeatureControls?: boolean;
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  pinColor?: string;
  onPress?: () => void;
  onCalloutPress?: () => void;
  type?: 'driver' | 'patient' | 'hospital'; 
}

interface PolylineProps {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  strokeColor?: string;
  strokeWidth?: number;
}

const WebMapFallback: React.FC<MapViewWrapperProps> = ({ style, region, children, onPress }) => (
  <View 
    style={[ style, styles.bgGray100, styles.justifyCenter, styles.alignCenter,
      styles.border2, styles.borderGray300, styles.roundedLg, styles.p4]}
      onTouchEnd={onPress} >
    <Text style={[ styles.textBase, styles.textGray600, styles.textCenter, styles.fontMedium ]}>
      Map View (Web Preview)
    </Text>
    {region && (
      <Text style={[styles.textSm, styles.textGray500, styles.textCenter]}>
        Location: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
      </Text>
    )}
    {children}
  </View>
);

const WebMarkerFallback: React.FC<MarkerProps> = ({ coordinate, title, pinColor, onPress, onCalloutPress }) => (
  <View style={[ styles.absolute, styles.p2, styles.roundedLg, styles.m1, 
      { backgroundColor: pinColor || colors.danger[500], maxWidth: 200 } ]}
      onTouchEnd={onPress}>
    <Text style={[ styles.textWhite, styles.textXs, styles.fontBold, styles.textCenter ]} 
    onPress={onCalloutPress}>
      Marker: {title || 'Unknown'}
    </Text>
    <Text style={[ styles.textWhite, styles.textXs, styles.textCenter ]}>
      ({coordinate.latitude.toFixed(4)}, {coordinate.longitude.toFixed(4)})
    </Text>
  </View>
);

const WebPolylineFallback: React.FC<PolylineProps> = ({ coordinates, strokeColor }) => (
  <View style={[ styles.absolute, styles.bottom10, styles.left25, styles.right25, styles.p2,
    styles.bgWhite, styles.border2, styles.roundedLg, styles.shadowMd, 
    { borderColor: strokeColor || colors.primary[500], opacity: 0.9 }]}>
    <Text style={[ styles.textXs, styles.textGray700, styles.textCenter, styles.fontMedium]}>
      Route ({coordinates.length} points)
    </Text>
  </View>
);

// Map Controls Component with toggle visibility
interface MapControlsProps {
  currentMapType: string;
  onMapTypeChange: (type: string) => void;
  showsTraffic: boolean;
  onTrafficToggle: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

// Helper function to render icons
const renderIcon = (iconType: string, iconName: string, size: number = 18, color: string = colors.gray[700]) => {
  if (iconType === 'MaterialIcons') {
    return <MaterialIcons name={iconName as any} size={size} color={color} />;
  } else if (iconType === 'Ionicons') {
    return <Ionicons name={iconName as any} size={size} color={color} />;
  } else if (iconType === 'FontAwesome5') {
    return <FontAwesome5 name={iconName} size={size} color={color} />;
  }
  return null;
};

const MapControls: React.FC<MapControlsProps> = ({
  currentMapType,
  onMapTypeChange,
  showsTraffic,
  onTrafficToggle,
  theme,
  onThemeChange,
  isVisible,
  onToggle,
}) => {
  // Get current theme colors
  const currentTheme = theme === 'night' ? mapControlThemes.dark : mapControlThemes.light;
  
  return (
    <View style={[styles.absolute, { top: 16, right: 16, zIndex: 50 }]}>
      {/* Toggle Button */}
      <TouchableOpacity
        onPress={onToggle}
        style={[
          styles.roundedFull, styles.shadowSm, styles.p2, styles.mb2,
          { backgroundColor: currentTheme.toggleButton, elevation: 5, borderWidth: 1, borderColor: currentTheme.border }
        ]}
      >
        <Fontisto 
          name={isVisible ? "close" : "player-settings"} 
          size={24} 
          color={currentTheme.textSecondary} 
        />
      </TouchableOpacity>

      {/* Controls Panel - Only show when visible */}
      {isVisible && (
        <>
          {/* Map Type Selector */}
          <View style={[
            styles.roundedLg, styles.shadowLg, styles.p3, styles.mb2,
            { backgroundColor: currentTheme.panelBackground, borderWidth: 1, borderColor: currentTheme.border }
          ]}>
            <Text style={[
              styles.textSm, styles.fontBold, styles.mb3, styles.textCenter,
              { color: currentTheme.textPrimary }
            ]}>
              Map Type
            </Text>
            <View style={[styles.flexRow, styles.justifyCenter]}>
              {mapTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => onMapTypeChange(option.key)}
                  style={[
                    styles.p2, styles.mx1, styles.roundedMd, { minWidth: 50 },
                    currentMapType === option.key 
                      ? { backgroundColor: currentTheme.buttonActive }
                      : { backgroundColor: currentTheme.buttonInactive }
                  ]}
                >
                  <View style={[styles.alignCenter]}>
                    {renderIcon(
                      option.iconType, 
                      option.iconName, 
                      20,
                      currentMapType === option.key ? currentTheme.buttonActiveText : currentTheme.buttonInactiveText
                    )}
                    <Text style={[
                      styles.textXs, styles.textCenter, styles.mt1,
                      { color: currentMapType === option.key ? currentTheme.buttonActiveText : currentTheme.buttonInactiveText }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Theme Selector */}
          <View style={[
            styles.roundedLg, styles.shadowLg, styles.p3, styles.mb2,
            { backgroundColor: currentTheme.panelBackground, borderWidth: 1, borderColor: currentTheme.border }
          ]}>
            <Text style={[
              styles.textSm, styles.fontBold, styles.mb3, styles.textCenter,
              { color: currentTheme.textPrimary }
            ]}>
              Theme
            </Text>
            <View style={[styles.flexRow, styles.justifyCenter]}>
              {[
                { key: 'day', iconType: 'Ionicons', iconName: 'sunny', label: 'Day' },
                { key: 'night', iconType: 'Ionicons', iconName: 'moon', label: 'Night' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => onThemeChange(option.key)}
                  style={[
                    styles.p2, styles.mx1, styles.roundedMd, { minWidth: 60 },
                    theme === option.key 
                      ? { backgroundColor: currentTheme.buttonActive }
                      : { backgroundColor: currentTheme.buttonInactive }
                  ]}
                >
                  <View style={[styles.alignCenter]}>
                    {renderIcon(
                      option.iconType, 
                      option.iconName, 
                      20,
                      theme === option.key ? currentTheme.buttonActiveText : currentTheme.buttonInactiveText
                    )}
                    <Text style={[
                      styles.textXs, styles.textCenter, styles.mt1,
                      { color: theme === option.key ? currentTheme.buttonActiveText : currentTheme.buttonInactiveText }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={onTrafficToggle}
                style={[
                  styles.p2, styles.mx1, styles.roundedMd, { minWidth: 60 },
                  showsTraffic 
                    ? { backgroundColor: currentTheme.buttonActive }
                    : { backgroundColor: currentTheme.buttonInactive }
                ]}
              >
                <View style={[styles.alignCenter]}>
                  <MaterialIcons 
                    name="traffic" 
                    size={20} 
                    color={showsTraffic ? currentTheme.buttonActiveText : currentTheme.buttonInactiveText}
                  />
                  <Text style={[
                    styles.textXs, styles.textCenter, styles.mt1,
                    { color: showsTraffic ? currentTheme.buttonActiveText : currentTheme.buttonInactiveText }
                  ]}>
                    Traffic
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export const MapViewWrapper: React.FC<MapViewWrapperProps> = (props) => {
  // State for enhanced map features
  const [mapType, setMapType] = useState<'standard' | 'hybrid' | 'terrain'>(props.mapType || 'standard');
  const [showsTraffic, setShowsTraffic] = useState(props.showsTraffic || false);
  const [theme, setTheme] = useState<'day' | 'night'>(props.theme || 'day');
  const [currentStyle, setCurrentStyle] = useState<any[]>([]);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [mapRef, setMapRef] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Set theme styles
  useEffect(() => {
    if (theme === 'night') {
      setCurrentStyle(mapStyles.night);
    } else {
      setCurrentStyle(mapStyles.day);
    }
    // Force re-render by updating key
    setForceUpdate(prev => prev + 1);
  }, [theme]);

  // Handler functions with proper typing
  const handleMapTypeChange = (type: string) => {
    setMapType(type as 'standard' | 'hybrid' | 'terrain');
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'day' | 'night');
  };

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  // Get current theme colors for custom buttons
  const currentTheme = theme === 'night' ? mapControlThemes.dark : mapControlThemes.light;

  // Handle compass button press
  const handleCompassPress = () => {
    if (mapRef) {
      // Reset map bearing to north (0 degrees) without changing location
      mapRef.animateCamera({
        heading: 0, // North
        pitch: 0,
        zoom: mapRef._lastKnownZoom || 15,
      });
    }
  };

  // Handle my location button press
  const handleMyLocationPress = async () => {
    setIsLocating(true); // Show immediate feedback
    
    try {
      if (Location) {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required to show your current location.');
          setIsLocating(false);
          return;
        }

        // Try to get last known location first for speed
        let location;
        try {
          location = await Location.getLastKnownPositionAsync({
            maxAge: 30000, // Use cached location if less than 30 seconds old
          });
        } catch (error) {
          console.log('No cached location available');
        }

        // If no cached location or it's too old, get current location with balanced accuracy
        if (!location) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Faster than High accuracy
            timeout: 5000, // 5 second timeout for quick response
          });
        }

        if (mapRef && location?.coords) {
          mapRef.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500); // Faster animation (500ms instead of 1000ms)
        }
      } else if (props.region && mapRef) {
        // Fallback to animating to the current region
        mapRef.animateToRegion({
          latitude: props.region.latitude,
          longitude: props.region.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    } catch (error) {
      console.log('Location error:', error);
      
      // Quick fallback to current region without showing alert for faster UX
      if (props.region && mapRef) {
        mapRef.animateToRegion({
          latitude: props.region.latitude,
          longitude: props.region.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    } finally {
      setIsLocating(false); // Hide loading state
    }
  };

  if (Platform.OS === 'web' || !MapView) {
    return <WebMapFallback {...props} />;
  }
  
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <MapView
        ref={(ref) => setMapRef(ref)}
        key={`map-${theme}-${forceUpdate}`}
        provider={PROVIDER_GOOGLE}
        style={[{ flex: 1, height: '100%', width: '100%' }, props.style]}
        region={props.region}
        initialRegion={props.initialRegion}
        mapType={mapType as any}
        customMapStyle={currentStyle}
        showsUserLocation={props.showsUserLocation !== false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={props.showsScale !== false}
        showsTraffic={showsTraffic}
        showsIndoors={props.showsIndoors !== false}
        followsUserLocation={props.followsUserLocation || false}
        zoomEnabled={props.zoomEnabled !== false}
        scrollEnabled={props.scrollEnabled !== false}
        rotateEnabled={props.rotateEnabled !== false}
        pitchEnabled={props.pitchEnabled !== false}
        zoomTapEnabled={true}
        zoomControlEnabled={true}
        mapPadding={{
          top: 80,
          right: controlsVisible ? 180 : 20,
          bottom: 50,
          left: 20,
        }}
        maxZoomLevel={20}
        minZoomLevel={3}
        compassOffset={{ x: -20, y: 80 }}
        toolbarEnabled={false}
        onPress={props.onPress}
        onRegionChangeComplete={props.onRegionChangeComplete}
        onMapReady={props.onMapReady}
        onError={props.onError}
        onMapLoaded={() => {
          console.log('Enhanced Google Maps loaded successfully');
        }}
      >
        {props.children}
      </MapView>

      {/* Map Controls Overlay */}
      {(props.showMapTypeSelector !== false || props.showFeatureControls !== false) && (
        <MapControls
          currentMapType={mapType}
          onMapTypeChange={handleMapTypeChange}
          showsTraffic={showsTraffic}
          onTrafficToggle={() => setShowsTraffic(!showsTraffic)}
          theme={theme}
          onThemeChange={handleThemeChange}
          isVisible={controlsVisible}
          onToggle={toggleControls}
        />
      )}

      {/* Custom Compass and Location Buttons */}
      <View style={[styles.absolute, { top: 68, right: 16, zIndex: 30 }]}>
        {/* Compass Button */}
        {props.showsCompass !== false && (
          <TouchableOpacity
            onPress={handleCompassPress}
            style={[
              styles.roundedFull, styles.shadowSm, styles.p2, styles.mb2,
              { backgroundColor: currentTheme.toggleButton, elevation: 5, borderWidth: 1, borderColor: currentTheme.border }
            ]}
          >
            <MaterialIcons 
              name="explore" 
              size={24} 
              color={currentTheme.textSecondary} 
            />
          </TouchableOpacity>
        )}

        {/* My Location Button */}
        {props.showsMyLocationButton !== false && (
          <TouchableOpacity
            onPress={handleMyLocationPress}
            style={[
              styles.roundedFull, styles.shadowSm, styles.p2, styles.mb2,
              { 
                backgroundColor: isLocating ? currentTheme.buttonActive : currentTheme.toggleButton, 
                elevation: 5, 
                borderWidth: 1, 
                borderColor: currentTheme.border 
              }
            ]}
            disabled={isLocating}
          >
            <MaterialIcons 
              name={isLocating ? "gps-fixed" : "my-location"} 
              size={24} 
              color={isLocating ? currentTheme.buttonActiveText : currentTheme.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Enhanced Status Bar for dark themes */}
      {theme === 'night' && (
        <StatusBar barStyle="light-content" backgroundColor="#202024ff" />
      )}
    </View>
  );
};

export const MarkerWrapper: React.FC<MarkerProps> = (props) => {
  if (Platform.OS === 'web' || !Marker) {
    return <WebMarkerFallback {...props} />;
  }

  // Enhanced marker configuration based on type
  let markerConfig: any = {
    coordinate: props.coordinate,
    title: props.title,
    pinColor: props.pinColor || colors.primary[600],
    onPress: props.onPress,
    onCalloutPress: props.onCalloutPress,
  };

  // Custom icons and styling based on marker type
  if (props.type === 'driver') {
    markerConfig = {
      ...markerConfig,
      image: require('../assets/images/ambulance.png'),
      anchor: { x: 0.5, y: 0.5 },
      centerOffset: { x: 0, y: -20 },
      zIndex: 1000,
      rotation: 0,
      flat: false,
    };
  } else if (props.type === 'patient') {
    markerConfig = {
      ...markerConfig,
      image: require('../assets/images/person.png'),
      anchor: { x: 0.5, y: 1 },
      centerOffset: { x: 0, y: -10 },
      zIndex: 900,
      pinColor: colors.emergency[500],
    };
  } else if (props.type === 'hospital') {
    markerConfig = {
      ...markerConfig,
      image: require('../assets/images/hospital.png'),
      anchor: { x: 0.5, y: 1 },
      centerOffset: { x: 0, y: -15 },
      zIndex: 800,
      pinColor: colors.medical[500],
    };
  }

  return (
    <Marker
      {...markerConfig}
      // Enhanced marker properties
      tracksViewChanges={false} // Optimize performance
      stopPropagation={false}
      opacity={0.9}
      // Custom callout styling
      calloutOffset={{ x: -8, y: 28 }}
      calloutAnchor={{ x: 0.5, y: 0.4 }}
    />
  );
};

export const PolylineWrapper: React.FC<PolylineProps> = (props) => {
  if (Platform.OS === 'web' || !Polyline) {
    return <WebPolylineFallback {...props} />;
  }
  
  return (
    <Polyline
      coordinates={props.coordinates}
      strokeColor={props.strokeColor || colors.primary[600]}
      strokeWidth={props.strokeWidth || 5}
      lineCap="round"
      lineJoin="round"
      // Enhanced polyline properties
      miterLimit={10}
      geodesic={true}
      zIndex={100}
      tappable={true}
      // Dynamic styling for better visibility
      strokeColors={[
        colors.primary[400],
        colors.primary[500],
        colors.primary[600],
        colors.primary[700],
      ]}
      // Gradient pattern for route
      lineDashPattern={[0]}
      fillColor="transparent"
    />
  );
};

// Enhanced Circle component for geofencing or range indicators
interface CircleProps {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  zIndex?: number;
}

const CircleWrapper: React.FC<CircleProps> = (props) => {
  let Circle: any;
  
  if (Platform.OS !== 'web') {
    try {
      Circle = require('react-native-maps').Circle;
    } catch (error) {
      console.log('Circle not available:', error);
      return null;
    }
  }

  if (Platform.OS === 'web' || !Circle) {
    return (
      <View style={[styles.absolute, styles.p2, styles.roundedFull, styles.border2, 
        { borderColor: props.strokeColor || colors.primary[500], 
          backgroundColor: props.fillColor || 'transparent',
          opacity: 0.3 }]}>
        <Text style={[styles.textXs, styles.textCenter]}>
          Range: {Math.round(props.radius)}m
        </Text>
      </View>
    );
  }

  return (
    <Circle
      center={props.center}
      radius={props.radius}
      fillColor={props.fillColor || 'rgba(59, 130, 246, 0.2)'}
      strokeColor={props.strokeColor || colors.primary[500]}
      strokeWidth={props.strokeWidth || 2}
      zIndex={props.zIndex || 50}
    />
  );
};

export { CircleWrapper };
