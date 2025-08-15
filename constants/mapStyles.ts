// Enhanced map style configurations with comprehensive styling
export const mapStyles = {
  day: [
    // Overall map background - bright and clean
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }] // Pure white background
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#2d3748' }] // Dark gray text
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }, { weight: 2 }] // White text stroke
    },
    
    // Landscape styling with natural greenery
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f0f9f0' }] // Very light green tint instead of gray
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#e8f5e8' }] // Light green for natural areas
    },
    {
      featureType: 'landscape.natural.landcover',
      elementType: 'geometry',
      stylers: [{ color: '#d4edda' }] // Slightly more green for land cover
    },
    {
      featureType: 'landscape.natural.terrain',
      elementType: 'geometry',
      stylers: [{ color: '#c3e6cb' }] // Green tint for terrain
    },
    
    // Road styling - clean white with gray borders
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }] // Pure white roads
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#e2e8f0' }, { weight: 1 }] // Light gray road borders
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#374151' }] // Dark gray road labels
    },
    
    // Highway styling
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }] // White highways
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#d1d5db' }, { weight: 2 }] // Medium gray highway borders
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#1f2937' }] // Darker text for highways
    },
    
    // Arterial roads
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#e5e7eb' }, { weight: 1 }]
    },
    
    // Local roads
    {
      featureType: 'road.local',
      elementType: 'geometry',
      stylers: [{ color: '#fefefe' }] // Slightly off-white for local roads
    },
    {
      featureType: 'road.local',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#f3f4f6' }, { weight: 0.5 }]
    },
    
    // Water styling - clear blue
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#3b82f6' }] // Clean blue
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#1e40af' }] // Darker blue text
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }, { weight: 2 }]
    },
    
    // Parks and green spaces - enhanced with more natural greens
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#dcfce7' }] // Light green for parks
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#166534' }] // Dark green text
    },
    
    // Natural features and vegetation
    {
      featureType: 'landscape.natural.vegetation',
      elementType: 'geometry',
      stylers: [{ color: '#bbf7d0' }] // Light green for vegetation
    },
    {
      featureType: 'poi.attraction',
      elementType: 'geometry',
      stylers: [{ color: '#d1fae5' }] // Light green for attractions/nature spots
    },
    
    // Golf courses and recreational areas
    {
      featureType: 'poi.sports_complex',
      elementType: 'geometry',
      stylers: [{ color: '#a7f3d0' }] // Medium light green for sports areas
    },
    
    // Forests and wooded areas
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ color: '#bbf7d0' }] // Slightly more saturated green for park fills
    },
    
    // Buildings
    {
      featureType: 'poi.business',
      elementType: 'geometry',
      stylers: [{ color: '#f8fafc' }] // Light gray buildings
    },
    {
      featureType: 'poi.business',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#475569' }] // Medium gray text
    },
    
    // Medical facilities
    {
      featureType: 'poi.medical',
      elementType: 'geometry',
      stylers: [{ color: '#fef2f2' }] // Light red background
    },
    {
      featureType: 'poi.medical',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#b91c1c' }] // Red text
    },
    
    // Additional greenery and natural features
    {
      featureType: 'poi.government',
      elementType: 'geometry',
      stylers: [{ color: '#f0fdf4' }] // Very light green for government areas (often have gardens)
    },
    {
      featureType: 'poi.place_of_worship',
      elementType: 'geometry',
      stylers: [{ color: '#f7fee7' }] // Light green-yellow for religious places (often landscaped)
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [{ color: '#e5e7eb' }] // Light gray for transit lines
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry.fill',
      stylers: [{ color: '#f3f4f6' }] // Very light gray fill
    },
    
    // Schools and education
    {
      featureType: 'poi.school',
      elementType: 'geometry',
      stylers: [{ color: '#fef3c7' }] // Light yellow
    },
    {
      featureType: 'poi.school',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#92400e' }] // Dark yellow text
    },
    
    // Transit stations
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [{ color: '#ede9fe' }] // Light purple
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#5b21b6' }] // Purple text
    },
    
    // Administrative boundaries
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#d1d5db' }, { weight: 1 }] // Light gray borders
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#111827' }] // Very dark text for localities
    }
  ],
  
  night: [
    // Overall dark theme background
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#374151' }] // Dark gray background
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f9fafb' }] // Light gray text
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1f2937' }, { weight: 2 }] // Dark gray text stroke
    },
    
    // Landscape styling for dark mode
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#4b5563' }] // Medium dark gray
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#6b7280' }] // Lighter gray for natural areas
    },
    
    // Road styling - lighter gray roads
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#9ca3af' }] // Light gray roads
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#6b7280' }, { weight: 1 }] // Medium gray borders
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3f4f6' }] // Light text on roads
    },
    
    // Highway styling for dark mode
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#d1d5db' }] // Lighter gray highways
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#9ca3af' }, { weight: 2 }] // Medium gray highway borders
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }] // White text for highways
    },
    
    // Arterial roads
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: '#9ca3af' }]
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#6b7280' }, { weight: 1 }]
    },
    
    // Local roads
    {
      featureType: 'road.local',
      elementType: 'geometry',
      stylers: [{ color: '#8b949e' }] // Slightly different gray for local roads
    },
    {
      featureType: 'road.local',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#6b7280' }, { weight: 0.5 }]
    },
    
    // Water styling - darker blue
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#1e40af' }] // Darker blue for night
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#93c5fd' }] // Light blue text
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1e40af' }, { weight: 2 }]
    },
    
    // Parks and green spaces - darker
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#064e3b' }] // Dark green
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#a7f3d0' }] // Light green text
    },
    
    // Buildings in dark mode
    {
      featureType: 'poi.business',
      elementType: 'geometry',
      stylers: [{ color: '#374151' }] // Dark gray buildings
    },
    {
      featureType: 'poi.business',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d1d5db' }] // Light gray text
    },
    
    // Medical facilities in dark mode
    {
      featureType: 'poi.medical',
      elementType: 'geometry',
      stylers: [{ color: '#7f1d1d' }] // Dark red background
    },
    {
      featureType: 'poi.medical',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#fca5a5' }] // Light red text
    },
    
    // Schools and education in dark mode
    {
      featureType: 'poi.school',
      elementType: 'geometry',
      stylers: [{ color: '#78350f' }] // Dark yellow
    },
    {
      featureType: 'poi.school',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#fde68a' }] // Light yellow text
    },
    
    // Transit stations in dark mode
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [{ color: '#581c87' }] // Dark purple
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#c4b5fd' }] // Light purple text
    },
    
    // Administrative boundaries in dark mode
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#6b7280' }, { weight: 1 }] // Medium gray borders
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }] // White text for localities
    }
  ]
};
