import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, SafeAreaView, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useMarkers, MarkerType } from '@/contexts/MarkerContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Emoji and labels for different marker types
const MARKER_DISPLAY = {
  trashcan: { emoji: '🗑️', label: 'Trash Can' },
  poop: { emoji: '💩', label: 'Poop' },
  pee: { emoji: '💦', label: 'Pee' },
};

export default function MarkersScreen() {
  const { markers, removeMarker } = useMarkers();

  // No markers message
  if (markers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol name="mappin.slash" size={64} color="#8E8E93" />
          <ThemedText type="title">No Markers Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            Add markers during walks to track trash cans and your dog's bathroom spots.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="title">Your Markers</ThemedText>
        <ThemedText type="subtitle">
          {markers.length} marker{markers.length !== 1 ? 's' : ''} saved
        </ThemedText>
      </ThemedView>

      <FlatList
        data={markers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ThemedView style={styles.markerCard}>
            <View style={styles.markerInfo}>
              <View style={styles.emojiContainer}>
                <ThemedText style={styles.emoji}>
                  {MARKER_DISPLAY[item.type].emoji}
                </ThemedText>
              </View>
              <View style={styles.markerDetails}>
                <ThemedText type="subtitle">
                  {MARKER_DISPLAY[item.type].label}
                </ThemedText>
                <ThemedText style={styles.dateText}>
                  Added on {new Date(item.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeMarker(item.id)}
            >
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </ThemedView>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  headerContainer: {
    padding: 16,
    gap: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  markerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  markerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    marginRight: 12,
  },
  emoji: {
    fontSize: 32,
  },
  markerDetails: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
    opacity: 0.7,
  },
}); 