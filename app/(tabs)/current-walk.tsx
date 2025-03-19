import React, { useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WalkMap } from '@/components/ui/WalkMap';
import { WalkStatsCard } from '@/components/ui/WalkStatsCard';
import { WalkControlButton } from '@/components/ui/WalkControlButton';
import { useWalk } from '@/contexts/WalkContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function CurrentWalkScreen() {
  const router = useRouter();
  const { currentWalk, isTracking, startWalk, stopWalk } = useWalk();
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Check if we need to request permission
  useEffect(() => {
    const checkPermissions = async () => {
      if (!isTracking) {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationPermissionDenied(true);
        }
      }
    };

    checkPermissions();
  }, [isTracking]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isTracking) {
        // Prevent going back if tracking (to avoid accidental navigation away)
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isTracking]);

  const handleStartWalk = async () => {
    setIsLoading(true);
    try {
      await startWalk();
    } catch (error) {
      console.error('Error starting walk:', error);
      setLocationPermissionDenied(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopWalk = async () => {
    setIsLoading(true);
    try {
      await stopWalk();
      router.push('/history');
    } catch (error) {
      console.error('Error stopping walk:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If we don't have location permission, show a message
  if (locationPermissionDenied) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.permissionContainer}>
          <IconSymbol name="location.slash" size={64} color="#FF3B30" />
          <ThemedText type="subtitle">Location Permission Required</ThemedText>
          <ThemedText style={styles.permissionText}>
            Please enable location services in your device settings to track your walks.
          </ThemedText>
          <WalkControlButton
            type="start"
            onPress={handleStartWalk}
            style={styles.retryButton}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isTracking && currentWalk ? (
        <>
          <ThemedView style={styles.headerContainer}>
            <ThemedText type="title">Current Walk</ThemedText>
            <WalkStatsCard
              distance={currentWalk.distance}
              duration={currentWalk.duration}
              isLive={true}
            />
          </ThemedView>

          <View style={styles.mapContainer}>
            {currentWalk.coordinates && currentWalk.coordinates.length > 0 ? (
              <WalkMap
                coordinates={currentWalk.coordinates}
                followsUserLocation={true}
                showsUserLocation={true}
              />
            ) : (
              <ThemedView style={styles.acquiringLocationContainer}>
                <ThemedText>Acquiring location...</ThemedText>
              </ThemedView>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <WalkControlButton
              type="stop"
              onPress={handleStopWalk}
              isLoading={isLoading}
            />
          </View>
        </>
      ) : (
        <ThemedView style={styles.emptyStateContainer}>
          <IconSymbol name="figure.walk" size={64} color="#34C759" />
          <ThemedText type="title">Start a Walk</ThemedText>
          <ThemedText style={styles.emptyStateText}>
            Tap the button below to start tracking your walk with your dog.
          </ThemedText>
          <WalkControlButton
            type="start"
            onPress={handleStartWalk}
            isLoading={isLoading}
            style={styles.startButton}
          />
        </ThemedView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    padding: 16,
    gap: 16,
  },
  mapContainer: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: '80%',
  },
  startButton: {
    paddingHorizontal: 48,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: '80%',
  },
  retryButton: {
    marginTop: 16,
  },
  acquiringLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 