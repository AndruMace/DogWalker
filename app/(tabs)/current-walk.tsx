import React, { useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar, BackHandler, Dimensions, Alert, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { WalkMap } from '@/components/ui/WalkMap';
import { WalkStatsCard } from '@/components/ui/WalkStatsCard';
import { WalkControlButton } from '@/components/ui/WalkControlButton';
import { useWalk } from '@/contexts/WalkContext';
import { useMarkers, MarkerType } from '@/contexts/MarkerContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MarkerControls } from '@/components/ui/MarkerControls';

// Get screen dimensions
const { height: screenHeight } = Dimensions.get('window');

export default function CurrentWalkScreen() {
  const router = useRouter();
  const { currentWalk, isTracking, startWalk, stopWalk } = useWalk();
  const { markers, addMarker } = useMarkers();
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState<MarkerType | null>(null);
  const [showMarkerControls, setShowMarkerControls] = useState(false);

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
      // No need to wait for permission checks and location to start - it will be handled automatically
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting walk:', error);
      setLocationPermissionDenied(true);
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

  const handleSelectMarkerType = (type: MarkerType) => {
    if (selectedMarkerType === type) {
      // If the same type is selected, deselect it
      setSelectedMarkerType(null);
    } else {
      // Otherwise select the new type
      setSelectedMarkerType(type);
      // Hide the marker controls panel
      setShowMarkerControls(false);
      Alert.alert(
        'Add Marker',
        `Tap on the map to place a ${type} marker.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleMapPress = (event: any) => {
    if (selectedMarkerType && isTracking) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      
      addMarker({
        type: selectedMarkerType,
        latitude,
        longitude,
      });
      
      // Reset the selection after adding
      setSelectedMarkerType(null);
      
      Alert.alert(
        'Marker Added',
        `Successfully added a ${selectedMarkerType} marker.`,
        [{ text: 'OK' }]
      );
    }
  };

  const toggleMarkerControls = () => {
    setShowMarkerControls(!showMarkerControls);
    setSelectedMarkerType(null);
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.activeWalkContainer}
        >
          <View style={styles.contentContainer}>
            <ThemedView style={styles.headerContainer}>
              <ThemedText type="title">Current Walk</ThemedText>
              <WalkStatsCard
                distance={currentWalk.distance}
                duration={currentWalk.duration}
                isLive={true}
                isLoading={isLoading}
              />
            </ThemedView>

            <View style={styles.mapContainer}>
              {currentWalk.coordinates && currentWalk.coordinates.length > 0 ? (
                <>
                  <WalkMap
                    coordinates={currentWalk.coordinates}
                    markers={markers}
                    followsUserLocation={true}
                    showsUserLocation={true}
                    onPress={handleMapPress}
                  />
                  
                  {/* Marker button */}
                  <TouchableOpacity
                    style={[
                      styles.markerToggleButton,
                      showMarkerControls && styles.markerToggleButtonActive
                    ]}
                    onPress={toggleMarkerControls}
                  >
                    <IconSymbol name="mappin.circle.fill" size={24} color="white" />
                  </TouchableOpacity>
                  
                  {/* Marker controls */}
                  {showMarkerControls && (
                    <MarkerControls
                      selectedMarkerType={selectedMarkerType}
                      onSelectMarker={handleSelectMarkerType}
                    />
                  )}
                </>
              ) : (
                <ThemedView style={styles.acquiringLocationContainer}>
                  <ActivityIndicator size="large" color="#34C759" />
                  <ThemedText style={styles.acquiringText}>Acquiring precise location...</ThemedText>
                  <ThemedText style={styles.acquiringSubtext}>
                    Getting an accurate location fix for the start of your walk. This helps ensure accurate distance tracking.
                  </ThemedText>
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
          </View>
        </KeyboardAvoidingView>
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
  activeWalkContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    // justifyContent: 'flex-start',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80,
  },
  headerContainer: {
    padding: 16,
    gap: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    maxHeight: screenHeight * 0.5,
    marginHorizontal: 8,
  },
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 64,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
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
    padding: 16,
    gap: 8,
  },
  acquiringText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  acquiringSubtext: {
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 4,
  },
  markerToggleButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 4,
  },
  markerToggleButtonActive: {
    backgroundColor: '#34C759',
  },
}); 