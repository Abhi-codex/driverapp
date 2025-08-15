import React, { useState, useEffect } from 'react';
import { Platform, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors, styles } from '../constants/tailwindStyles';

let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;
let MAP_TYPES: any = {};

// Only import react-native-maps on native platforms
if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Polyline = RNMaps.Polyline;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
    MAP_TYPES = {
      STANDARD: 'standard',
      HYBRID: 'hybrid',
      TERRAIN: 'terrain',
    };
  } catch (error) {
    console.log('react-native-maps not available:', error);
  }
}

// Simplified map type options (removed satellite, kept professional icons)
export const mapTypeOptions = [
  { key: 'standard', label: 'Standard', iconType: 'MaterialIcons', iconName: 'map' },
  { key: 'hybrid', label: 'Hybrid', iconType: 'MaterialIcons', iconName: 'satellite' },
  { key: 'terrain', label: 'Terrain', iconType: 'FontAwesome5', iconName: 'mountain' },
];

// Enhanced map style configurations for different themes (lighter night theme)
export const mapStyles = {
  day: [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#333333' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#4285f4' }]
    }
  ],
  night: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#4a5568' }] // Lighter gray instead of very dark
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#2d3748' }] // Medium gray
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#e2e8f0' }] // Light gray text
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f7fafc' }] // Very light text
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#cbd5e0' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#2f855a' }] // Lighter green
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ae6b4' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#718096' }] // Lighter road color
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#4a5568' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#e2e8f0' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#a0aec0' }] // Much lighter highway
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#718096' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f7fafc' }]
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#4a5568' }]
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#cbd5e0' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#2b6cb0' }] // Lighter blue water
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#bee3f8' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#2b6cb0' }]
    }
  ],
};

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
  // Enhanced map features
  mapType?: 'standard' | 'hybrid' | 'terrain';
  showsTraffic?: boolean;
  showsBuildings?: boolean;
  showsIndoors?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  showsPointsOfInterest?: boolean;
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
  showsBuildings: boolean;
  onBuildingsToggle: () => void;
  showsPointsOfInterest: boolean;
  onPOIToggle: () => void;
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
  showsBuildings,
  onBuildingsToggle,
  showsPointsOfInterest,
  onPOIToggle,
  theme,
  onThemeChange,
  isVisible,
  onToggle,
}) => (
  <View style={[styles.absolute, { top: 16, right: 16, zIndex: 50 }]}>
    {/* Toggle Button */}
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.bgWhite, styles.roundedFull, styles.shadowLg, styles.p3, styles.mb2,
        { elevation: 5 }
      ]}
    >
      <MaterialIcons 
        name={isVisible ? "close" : "settings"} 
        size={24} 
        color={colors.primary[600]} 
      />
    </TouchableOpacity>

    {/* Controls Panel - Only show when visible */}
    {isVisible && (
      <>
        {/* Map Type Selector */}
        <View style={[styles.bgWhite, styles.roundedLg, styles.shadowLg, styles.p3, styles.mb2]}>
          <Text style={[styles.textSm, styles.fontBold, styles.textGray700, styles.mb3, styles.textCenter]}>
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
                    ? { backgroundColor: colors.primary[500] }
                    : { backgroundColor: colors.gray[100] }
                ]}
              >
                <View style={[styles.alignCenter]}>
                  {renderIcon(
                    option.iconType, 
                    option.iconName, 
                    20,
                    currentMapType === option.key ? colors.white : colors.gray[700]
                  )}
                  <Text style={[
                    styles.textXs, styles.textCenter, styles.mt1,
                    currentMapType === option.key ? styles.textWhite : styles.textGray700
                  ]}>
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Theme Selector */}
        <View style={[styles.bgWhite, styles.roundedLg, styles.shadowLg, styles.p3, styles.mb2]}>
          <Text style={[styles.textSm, styles.fontBold, styles.textGray700, styles.mb3, styles.textCenter]}>
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
                    ? { backgroundColor: colors.primary[500] }
                    : { backgroundColor: colors.gray[100] }
                ]}
              >
                <View style={[styles.alignCenter]}>
                  {renderIcon(
                    option.iconType, 
                    option.iconName, 
                    20,
                    theme === option.key ? colors.white : colors.gray[700]
                  )}
                  <Text style={[
                    styles.textXs, styles.textCenter, styles.mt1,
                    theme === option.key ? styles.textWhite : styles.textGray700
                  ]}>
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feature Controls */}
        <View style={[styles.bgWhite, styles.roundedLg, styles.shadowLg, styles.p3]}>
          <Text style={[styles.textSm, styles.fontBold, styles.textGray700, styles.mb3, styles.textCenter]}>
            Features
          </Text>
          
          <TouchableOpacity
            onPress={onTrafficToggle}
            style={[
              styles.flexRow, styles.alignCenter, styles.p2, styles.roundedMd, styles.mb2,
              showsTraffic ? { backgroundColor: colors.medical[100] } : { backgroundColor: colors.gray[50] }
            ]}
          >
            <MaterialIcons 
              name="traffic" 
              size={18} 
              color={showsTraffic ? colors.medical[600] : colors.gray[500]} 
              style={styles.mr2}
            />
            <Text style={[
              styles.textSm, styles.fontMedium,
              showsTraffic ? { color: colors.medical[700] } : styles.textGray600
            ]}>
              Traffic
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBuildingsToggle}
            style={[
              styles.flexRow, styles.alignCenter, styles.p2, styles.roundedMd, styles.mb2,
              showsBuildings ? { backgroundColor: colors.primary[100] } : { backgroundColor: colors.gray[50] }
            ]}
          >
            <MaterialIcons 
              name="location-city" 
              size={18} 
              color={showsBuildings ? colors.primary[600] : colors.gray[500]} 
              style={styles.mr2}
            />
            <Text style={[
              styles.textSm, styles.fontMedium,
              showsBuildings ? { color: colors.primary[700] } : styles.textGray600
            ]}>
              Buildings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPOIToggle}
            style={[
              styles.flexRow, styles.alignCenter, styles.p2, styles.roundedMd,
              showsPointsOfInterest ? { backgroundColor: colors.secondary[100] } : { backgroundColor: colors.gray[50] }
            ]}
          >
            <MaterialIcons 
              name="place" 
              size={18} 
              color={showsPointsOfInterest ? colors.secondary[600] : colors.gray[500]} 
              style={styles.mr2}
            />
            <Text style={[
              styles.textSm, styles.fontMedium,
              showsPointsOfInterest ? { color: colors.secondary[700] } : styles.textGray600
            ]}>
              Points of Interest
            </Text>
          </TouchableOpacity>
        </View>
      </>
    )}
  </View>
);

export const MapViewWrapper: React.FC<MapViewWrapperProps> = (props) => {
  // State for enhanced map features
  const [mapType, setMapType] = useState<'standard' | 'hybrid' | 'terrain'>(props.mapType || 'standard');
  const [showsTraffic, setShowsTraffic] = useState(props.showsTraffic || false);
  const [showsBuildings, setShowsBuildings] = useState(props.showsBuildings !== false);
  const [showsPointsOfInterest, setShowsPointsOfInterest] = useState(props.showsPointsOfInterest || false);
  const [theme, setTheme] = useState<'day' | 'night'>(props.theme || 'day');
  const [currentStyle, setCurrentStyle] = useState<any[]>([]);
  const [controlsVisible, setControlsVisible] = useState(false);

  // Set theme styles
  useEffect(() => {
    if (theme === 'night') {
      setCurrentStyle(mapStyles.night);
    } else {
      setCurrentStyle(mapStyles.day);
    }
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

  if (Platform.OS === 'web' || !MapView) {
    return <WebMapFallback {...props} />;
  }
  
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={[{ flex: 1, height: '100%', width: '100%' }, props.style]}
        region={props.region}
        initialRegion={props.initialRegion}
        mapType={mapType as any}
        customMapStyle={currentStyle}
        showsUserLocation={props.showsUserLocation !== false}
        showsMyLocationButton={props.showsCompass !== false}
        showsCompass={props.showsCompass !== false}
        showsScale={props.showsScale !== false}
        showsBuildings={showsBuildings}
        showsTraffic={showsTraffic}
        showsIndoors={props.showsIndoors !== false}
        showsPointsOfInterest={showsPointsOfInterest}
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
          showsBuildings={showsBuildings}
          onBuildingsToggle={() => setShowsBuildings(!showsBuildings)}
          showsPointsOfInterest={showsPointsOfInterest}
          onPOIToggle={() => setShowsPointsOfInterest(!showsPointsOfInterest)}
          theme={theme}
          onThemeChange={handleThemeChange}
          isVisible={controlsVisible}
          onToggle={toggleControls}
        />
      )}

      {/* Enhanced Status Bar for dark themes */}
      {theme === 'night' && (
        <StatusBar barStyle="light-content" backgroundColor="#4a5568" />
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
