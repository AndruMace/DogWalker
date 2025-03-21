import React, { useMemo } from 'react';
import { StyleSheet, Dimensions, View, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Coordinate } from '@/contexts/WalkContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import CustomPolyline from './CustomPolyline';
import { Marker as MarkerType } from '@/contexts/MarkerContext';

type WalkMapProps = {
  coordinates: Coordinate[];
  markers?: MarkerType[];
  followsUserLocation?: boolean;
  showsUserLocation?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  onPress?: (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
};

// Emoji map for marker types
const MARKER_EMOJI = {
  trashcan: '🗑️',
  poop: '💩',
  pee: '💦'
};

export const WalkMap: React.FC<WalkMapProps> = ({
  coordinates,
  markers = [],
  followsUserLocation = true,
  showsUserLocation = true,
  zoomEnabled = true,
  scrollEnabled = true,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Only show map if there are coordinates
  if (!coordinates.length) {
    return null;
  }

  // Get the latest coordinate for the map center
  const initialRegion = useMemo(() => ({
    latitude: coordinates[coordinates.length - 1].latitude,
    longitude: coordinates[coordinates.length - 1].longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  }), [coordinates]);

  // Format coordinates for the polyline component
  const routeCoordinates = useMemo(() => coordinates.map(coord => ({
    latitude: coord.latitude,
    longitude: coord.longitude,
  })), [coordinates]);

  // Get start and end coordinates for markers
  const startCoord = coordinates[0];
  const endCoord = coordinates[coordinates.length - 1];
  
  // Check if we have different start and end points
  const hasDifferentStartAndEnd = 
    startCoord && 
    endCoord && 
    (startCoord.latitude !== endCoord.latitude || 
     startCoord.longitude !== endCoord.longitude);

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      followsUserLocation={followsUserLocation}
      showsCompass={true}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      mapType="standard"
      userInterfaceStyle={isDark ? 'dark' : 'light'}
      onPress={onPress}>
      
      {routeCoordinates.length >= 2 && (
        <CustomPolyline
          coordinates={routeCoordinates}
          strokeWidth={4}
          strokeColor="#007AFF"
        />
      )}
      
      {startCoord && (
        <Marker
          coordinate={{
            latitude: startCoord.latitude,
            longitude: startCoord.longitude,
          }}
          title="Start"
          pinColor="green"
        />
      )}
      
      {hasDifferentStartAndEnd && (
        <Marker
          coordinate={{
            latitude: endCoord.latitude,
            longitude: endCoord.longitude,
          }}
          title="Current"
          pinColor="red"
        />
      )}

      {/* Display custom markers with emojis */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}
        >
          <View style={styles.markerContainer}>
            <Text style={styles.markerEmoji}>{MARKER_EMOJI[marker.type]}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerEmoji: {
    fontSize: 30,
  },
}); 