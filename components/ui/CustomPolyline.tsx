import React, { memo } from 'react';
import { Polyline } from 'react-native-maps';

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

  // With Apple Maps, we can use a single Polyline for the entire path
  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
};

export default memo(CustomPolyline); 