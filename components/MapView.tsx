import React from 'react';
import { Platform, Text, View } from 'react-native';
import { colors, styles } from '../constants/tailwindStyles';

let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

// Only import react-native-maps on native platforms
if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Polyline = RNMaps.Polyline;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
  } catch (error) {
    console.log('react-native-maps not available:', error);
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
  showsUserLocation?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  onRegionChangeComplete?: (region: any) => void;
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
      🗺️ Map View (Web Preview)
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
      📍 {title || 'Marker'}
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
      🛣️ Route ({coordinates.length} points)
    </Text>
  </View>
);

export const MapViewWrapper: React.FC<MapViewWrapperProps> = (props) => {
  console.log('MapViewWrapper - Platform.OS:', Platform.OS);
  
  if (Platform.OS === 'web' || !MapView) {
    console.log('MapViewWrapper - Using fallback');
    return <WebMapFallback {...props} />;
  }

  console.log('MapViewWrapper - Using native MapView');
  return (
    <MapView
      style={props.style}
      region={props.region}
      showsUserLocation={props.showsUserLocation}
      showsMyLocationButton={true}
      followsUserLocation={false}
      zoomEnabled={true}
      scrollEnabled={true}
      rotateEnabled={true}
      pitchEnabled={true}
      mapType="standard"
      provider={PROVIDER_GOOGLE}
      loadingEnabled={true}
      loadingIndicatorColor={colors.primary[600]}
      loadingBackgroundColor={colors.gray[100]}
      onPress={props.onPress}
      onRegionChangeComplete={props.onRegionChangeComplete}
    >
      {props.children}
    </MapView>
  );
};

export const MarkerWrapper: React.FC<MarkerProps> = (props) => {
  if (Platform.OS === 'web' || !Marker) {
    return <WebMarkerFallback {...props} />;
  }

  // Select icon based on type
  let iconSource;
  if (props.type === 'driver') {
    iconSource = require('../assets/images/ambulance.png');
  } else if (props.type === 'patient') {
    iconSource = require('../assets/images/person.png');
  } else if (props.type === 'hospital') {
    iconSource = require('../assets/images/hospital.png');
  }


  return (
    <Marker
      coordinate={props.coordinate}
      title={props.title}
      pinColor={props.pinColor || colors.primary[600]}
      onPress={props.onPress}
      onCalloutPress={props.onCalloutPress}
      {...(iconSource ? { image: iconSource } : {})}
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
      strokeWidth={props.strokeWidth || 4}
      lineCap="round"
      lineJoin="round"
    />
  );
};
