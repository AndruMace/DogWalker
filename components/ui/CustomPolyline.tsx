import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';

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

  return (
    <>
      {coordinates.map((coord, index) => {
        // Skip the first coordinate as we need pairs
        if (index === 0) return null;
        
        const prevCoord = coordinates[index - 1];
        
        return (
          <Polyline
            key={`line-${index}`}
            coordinates={[prevCoord, coord]}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      })}
    </>
  );
};

export default memo(CustomPolyline); 