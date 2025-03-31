import React, { memo } from 'react';
import { Polyline } from 'react-native-maps';
import { Platform } from 'react-native';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type CustomPolylineProps = {
  coordinates: Coordinate[];
  strokeWidth?: number;
  strokeColor?: string;
};

const CustomPolyline: React.FC<CustomPolylineProps> = ({
  coordinates,
  strokeWidth = 4,
  strokeColor = '#007AFF',
}) => {
  // Don't render if we don't have enough coordinates
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  // Platform-specific implementation
  if (Platform.OS === 'ios') {
    // With Apple Maps, we can use a single Polyline for the entire path
    return (
      <Polyline
        coordinates={coordinates}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  } else {
    // For Android/Google Maps
    return (
      <Polyline
        coordinates={coordinates}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        geodesic={true}
      />
    );
  }
};

export default memo(CustomPolyline); 