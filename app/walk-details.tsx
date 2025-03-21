import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WalkMap } from '@/components/ui/WalkMap';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useWalk } from '@/contexts/WalkContext';
import { useMarkers, Marker } from '@/contexts/MarkerContext';
import { formatDistance, formatDuration, formatDate, formatTime } from '@/utils/formatUtils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function WalkDetailScreen() {
  const { walkId } = useLocalSearchParams();
  const { walks, deleteWalk } = useWalk();
  const { markers } = useMarkers();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const accentColor = Colors[colorScheme ?? 'light'].tint;

  const [walk, setWalk] = useState(walks.find(w => w.id === walkId));
  const [walkMarkers, setWalkMarkers] = useState<Marker[]>([]);

  // Update walk if walks array changes
  useEffect(() => {
    setWalk(walks.find(w => w.id === walkId));
  }, [walks, walkId]);

  // Find markers that are close to the walk path
  useEffect(() => {
    if (walk && walk.coordinates.length > 0) {
      // Find markers near any point in the walk
      // This is a simple implementation - a production app might use a more sophisticated algorithm
      const MAX_DISTANCE = 200; // About 656 feet (200 meters)
      
      // Helper function to check if a marker is near the walk path
      const isMarkerNearWalkPath = (marker: Marker) => {
        return walk.coordinates.some(coord => {
          // Calculate rough distance (not using the Haversine formula for simplicity)
          const latDiff = Math.abs(marker.latitude - coord.latitude);
          const lonDiff = Math.abs(marker.longitude - coord.longitude);
          // Rough conversion to meters (this is an approximation)
          const latMeters = latDiff * 111111;
          const lonMeters = lonDiff * 111111 * Math.cos(coord.latitude * (Math.PI/180));
          const distance = Math.sqrt(latMeters * latMeters + lonMeters * lonMeters);
          return distance < MAX_DISTANCE;
        });
      };
      
      const nearbyMarkers = markers.filter(isMarkerNearWalkPath);
      setWalkMarkers(nearbyMarkers);
    }
  }, [walk, markers]);

  // Handle delete walk
  const handleDelete = () => {
    Alert.alert(
      'Delete Walk',
      'Are you sure you want to delete this walk? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (walk) {
              await deleteWalk(walk.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  // If walk not found
  if (!walk) {
    return (
      <>
        <Stack.Screen options={{ title: 'Walk Details', headerBackTitle: 'Back' }} />
        <ThemedView style={styles.notFoundContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color="#FF9500" />
          <ThemedText type="subtitle">Walk Not Found</ThemedText>
          <ThemedText>This walk may have been deleted or doesn't exist.</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Walk Details',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteIcon}>
              <IconSymbol
                name="trash"
                size={24}
                color={Platform.OS === 'ios' ? accentColor : '#FF3B30'}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <WalkMap
          coordinates={walk.coordinates}
          markers={walkMarkers}
          followsUserLocation={false}
          showsUserLocation={false}
          zoomEnabled={true}
          scrollEnabled={true}
        />

        <ThemedView style={styles.detailsContainer}>
          <ThemedText type="title">{formatDate(walk.date)}</ThemedText>
          
          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <IconSymbol name="clock" size={20} color={accentColor} />
              <ThemedText>Start: {formatTime(walk.startTime)}</ThemedText>
            </View>
            <View style={styles.timeItem}>
              <IconSymbol name="clock.fill" size={20} color={accentColor} />
              <ThemedText>End: {formatTime(walk.endTime)}</ThemedText>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <IconSymbol name="figure.walk" size={32} color="#34C759" />
              <ThemedText type="subtitle">{formatDistance(walk.distance)}</ThemedText>
              <ThemedText>Distance</ThemedText>
            </ThemedView>

            <ThemedView style={styles.statCard}>
              <IconSymbol name="clock.fill" size={32} color="#007AFF" />
              <ThemedText type="subtitle">{formatDuration(walk.duration)}</ThemedText>
              <ThemedText>Duration</ThemedText>
            </ThemedView>
          </View>

          <ThemedView style={styles.pathStatsContainer}>
            <ThemedText type="subtitle">Path Statistics</ThemedText>
            <View style={styles.pathStatItem}>
              <IconSymbol name="location" size={20} color={accentColor} />
              <ThemedText>Total Points: {walk.coordinates.length}</ThemedText>
            </View>
            {walk.coordinates.length > 0 && (
              <>
                <View style={styles.pathStatItem}>
                  <IconSymbol name="arrow.up.and.down" size={20} color={accentColor} />
                  <ThemedText>
                    Starting Location: {walk.coordinates[0].latitude.toFixed(6)}, {walk.coordinates[0].longitude.toFixed(6)}
                  </ThemedText>
                </View>
                <View style={styles.pathStatItem}>
                  <IconSymbol name="flag" size={20} color={accentColor} />
                  <ThemedText>
                    Ending Location: {walk.coordinates[walk.coordinates.length - 1].latitude.toFixed(6)}, {walk.coordinates[walk.coordinates.length - 1].longitude.toFixed(6)}
                  </ThemedText>
                </View>
              </>
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  deleteIcon: {
    padding: 8,
  },
  detailsContainer: {
    padding: 16,
    gap: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 8,
    gap: 8,
  },
  pathStatsContainer: {
    padding: 16,
    gap: 12,
  },
  pathStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
}); 