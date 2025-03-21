import React from 'react';
import { StyleSheet, View, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WalkControlButton } from '@/components/ui/WalkControlButton';
import { WalkStatsCard } from '@/components/ui/WalkStatsCard';
import { useWalk } from '@/contexts/WalkContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { formatDistance, formatDuration } from '@/utils/formatUtils';

export default function HomeScreen() {
  const router = useRouter();
  const { walks, isTracking, startWalk } = useWalk();

  // Calculate total stats
  const totalDistance = walks.reduce((sum, walk) => sum + walk.distance, 0);
  const totalDuration = walks.reduce((sum, walk) => sum + walk.duration, 0);
  const totalWalks = walks.length;

  // Handle start walk button press
  const handleStartWalk = async () => {
    try {
      // Navigate first, then start the walk in the background
      router.push('/current-walk');
      
      // Start the walk asynchronously after navigation
      setTimeout(() => {
        startWalk().catch(error => {
          console.error('Error starting walk:', error);
        });
      }, 100);
    } catch (error) {
      console.error('Error navigating to current walk:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Image 
          source={require('@/assets/images/dog-walking.png')} 
          style={styles.headerImage}
          resizeMode="contain"
        />
        <ThemedText type="title">DogDash</ThemedText>
        <ThemedText type="subtitle">Track your walks with your furry friend</ThemedText>
      </View>

      {isTracking ? (
        <ThemedView style={styles.currentWalkCard}>
          <ThemedText type="subtitle">Walk in Progress</ThemedText>
          <ThemedText>You have an active walk. Continue tracking?</ThemedText>
          <WalkControlButton 
            type="stop"
            onPress={() => router.push('/current-walk')}
            style={styles.continueButton}
          />
        </ThemedView>
      ) : (
        <WalkControlButton
          type="start"
          onPress={handleStartWalk}
          style={styles.startButton}
        />
      )}

      <ThemedText type="subtitle" style={styles.sectionTitle}>Your Walking Stats</ThemedText>

      <View style={styles.statsGrid}>
        <ThemedView style={styles.statCard}>
          <IconSymbol name="figure.walk" size={32} color="#34C759" />
          <ThemedText type="subtitle">{totalWalks}</ThemedText>
          <ThemedText>Total Walks</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol name="map" size={32} color="#FF9500" />
          <ThemedText type="subtitle">{formatDistance(totalDistance)}</ThemedText>
          <ThemedText>Distance</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol name="clock.fill" size={32} color="#007AFF" />
          <ThemedText type="subtitle">{formatDuration(totalDuration)}</ThemedText>
          <ThemedText>Duration</ThemedText>
        </ThemedView>
      </View>

      <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Activity</ThemedText>
      
      {walks.length > 0 ? (
        walks.slice(-3).reverse().map(walk => (
          <WalkStatsCard
            key={walk.id}
            walkId={walk.id}
            distance={walk.distance}
            duration={walk.duration}
          />
        ))
      ) : (
        <ThemedView style={styles.emptyState}>
          <IconSymbol name="pawprint" size={48} color="#888" />
          <ThemedText>No walks yet. Start your first walk today!</ThemedText>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  headerImage: {
    width: 200,
    height: 160,
    marginBottom: 16,
  },
  startButton: {
    alignSelf: 'center',
    paddingHorizontal: 48,
    marginVertical: 24,
  },
  currentWalkCard: {
    marginVertical: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  continueButton: {
    marginTop: 8,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
});
