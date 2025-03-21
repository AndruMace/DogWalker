import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Define types for our walk data
export type Coordinate = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export type Walk = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  distance: number; // in meters
  coordinates: Coordinate[];
};

type WalkContextType = {
  walks: Walk[];
  currentWalk: Walk | null;
  isTracking: boolean;
  startWalk: () => Promise<void>;
  stopWalk: () => Promise<void>;
  deleteWalk: (id: string) => Promise<void>;
  getWalksByDate: (date: string) => Walk[];
};

const WalkContext = createContext<WalkContextType | undefined>(undefined);

export const WalkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [currentWalk, setCurrentWalk] = useState<Walk | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  // Load walks from AsyncStorage on mount
  useEffect(() => {
    const loadWalks = async () => {
      try {
        const walksData = await AsyncStorage.getItem('walks');
        if (walksData) {
          setWalks(JSON.parse(walksData));
        }
      } catch (error) {
        console.error('Error loading walks:', error);
      }
    };

    loadWalks();
  }, []);

  // Save walks to AsyncStorage whenever they change
  useEffect(() => {
    const saveWalks = async () => {
      try {
        await AsyncStorage.setItem('walks', JSON.stringify(walks));
      } catch (error) {
        console.error('Error saving walks:', error);
      }
    };

    if (walks.length > 0) {
      saveWalks();
    }
  }, [walks]);

  // Calculate distance between two coordinates in meters using Haversine formula
  function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const earthRadius = 6371e3; // Earth's radius in meters
    const lat1Rad = (coord1.latitude * Math.PI) / 180;
    const lat2Rad = (coord2.latitude * Math.PI) / 180;
    const latDiffRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const lonDiffRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const haversineA =
      Math.sin(latDiffRad / 2) * Math.sin(latDiffRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lonDiffRad / 2) * Math.sin(lonDiffRad / 2);
    const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));

    return earthRadius * haversineC;
  }

  // Start tracking a new walk
  async function startWalk() {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    // Get current location before starting tracking
    try {
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!initialLocation || !initialLocation.coords) {
        throw new Error('Could not get current location');
      }

      // Create a new walk with initial location
      const now = new Date();
      const newWalk: Walk = {
        id: now.getTime().toString(),
        date: now.toISOString().split('T')[0],
        startTime: now.toISOString(),
        endTime: '',
        duration: 0,
        distance: 0,
        coordinates: [{
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          timestamp: initialLocation.timestamp,
        }],
      };

      setCurrentWalk(newWalk);
      setIsTracking(true);

      // Start location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // update every 5 meters
          timeInterval: 2500, // or at least every 2.5 seconds
        },
        (location) => {
          setCurrentWalk((prevWalk) => {
            if (!prevWalk) return null;

            const newCoordinate: Coordinate = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: location.timestamp,
            };

            const updatedCoordinates = [...prevWalk.coordinates, newCoordinate];
            let distance = prevWalk.distance;

            // Calculate distance if we have at least 2 coordinates
            if (updatedCoordinates.length > 1) {
              const prevCoord = updatedCoordinates[updatedCoordinates.length - 2];
              distance += calculateDistance(prevCoord, newCoordinate);
            }

            const now = new Date();
            const startTime = new Date(prevWalk.startTime);
            const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

            return {
              ...prevWalk,
              coordinates: updatedCoordinates,
              distance,
              duration,
            };
          });
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting walk:', error);
      throw error; // Re-throw the error to be handled by the component
    }
  }

  // Stop tracking the current walk
  async function stopWalk() {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }

    if (currentWalk) {
      const now = new Date();
      const completedWalk: Walk = {
        ...currentWalk,
        endTime: now.toISOString(),
      };

      setWalks((prevWalks) => [...prevWalks, completedWalk]);
      setCurrentWalk(null);
      setIsTracking(false);
    }
  }

  // Delete a walk by ID
  async function deleteWalk(id: string) {
    setWalks((prevWalks) => prevWalks.filter((walk) => walk.id !== id));
  }

  // Get walks for a specific date
  function getWalksByDate(date: string): Walk[] {
    return walks.filter((walk) => walk.date === date);
  }

  return (
    <WalkContext.Provider
      value={{
        walks,
        currentWalk,
        isTracking,
        startWalk,
        stopWalk,
        deleteWalk,
        getWalksByDate,
      }}>
      {children}
    </WalkContext.Provider>
  );
};

// Custom hook to use the walk context
export function useWalk() {
  const context = useContext(WalkContext);
  if (context === undefined) {
    throw new Error('useWalk must be used within a WalkProvider');
  }
  return context;
} 