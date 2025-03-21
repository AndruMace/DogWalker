import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { MarkerType } from '@/contexts/MarkerContext';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';

type MarkerControlsProps = {
  onSelectMarker: (type: MarkerType) => void;
  selectedMarkerType: MarkerType | null;
};

// Emoji and color for each marker type
const MARKER_CONFIG = {
  trashcan: { emoji: '🗑️', label: 'Trash Can', color: '#34C759' },
  poop: { emoji: '💩', label: 'Poop', color: '#AF52DE' },
  pee: { emoji: '💦', label: 'Pee', color: '#FF9500' },
};

export const MarkerControls: React.FC<MarkerControlsProps> = ({
  onSelectMarker,
  selectedMarkerType,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Add Marker</Text>
      <View style={styles.buttonContainer}>
        {Object.entries(MARKER_CONFIG).map(([type, config]) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.markerButton,
              { backgroundColor: config.color },
              selectedMarkerType === type && styles.selectedButton,
            ]}
            onPress={() => onSelectMarker(type as MarkerType)}
          >
            <Text style={styles.emoji}>{config.emoji}</Text>
            <Text style={styles.label}>{config.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
}); 