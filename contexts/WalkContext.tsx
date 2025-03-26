import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform, DeviceEventEmitter } from 'react-native';
import { getLocalDateString, debugDateInfo } from '@/utils/formatUtils';

// Define a background task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Define event name for location updates
const LOCATION_UPDATE_EVENT = 'location-update';

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

// Register the background task outside of component
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
  if (error) {
    console.error('Error in background location task:', error);
    return;
  }
  if (data) {
    // Get the location data
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      // Get the last location
      const location = locations[locations.length - 1];
      
      try {
        // Get the current walk from storage
        const walkData = await AsyncStorage.getItem('currentWalk');
        if (!walkData) return;
        
        const currentWalk: Walk = JSON.parse(walkData);
        
        // Create a new coordinate
        const newCoordinate: Coordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        };
        
        // Update walk with new coordinate
        const updatedCoordinates = [...currentWalk.coordinates, newCoordinate];
        let distance = currentWalk.distance;
        
        // Calculate distance if we have at least 2 coordinates
        if (updatedCoordinates.length > 1) {
          const prevCoord = updatedCoordinates[updatedCoordinates.length - 2];
          const newDistance = calculateDistance(prevCoord, newCoordinate);
          distance += newDistance;
        }
        
        const now = new Date();
        const startTime = new Date(currentWalk.startTime);
        const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // Create updated walk - ensure date is using local time if needed
        const updatedWalk: Walk = {
          ...currentWalk,
          // If date isn't set for some reason, set it using local time
          date: currentWalk.date || getLocalDateString(now),
          coordinates: updatedCoordinates,
          distance,
          duration,
        };
        
        // Save updated walk back to AsyncStorage
        await AsyncStorage.setItem('currentWalk', JSON.stringify(updatedWalk));
        
        // Emit event to update UI
        DeviceEventEmitter.emit(LOCATION_UPDATE_EVENT, updatedWalk);
      } catch (error) {
        console.error('Error processing background location:', error);
      }
    }
  }
});

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

export const WalkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [currentWalk, setCurrentWalk] = useState<Walk | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  // Listen for location updates
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      LOCATION_UPDATE_EVENT,
      (updatedWalk: Walk) => {
        setCurrentWalk(updatedWalk);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Load walks from AsyncStorage on mount
  useEffect(() => {
    const loadWalks = async () => {
      try {
        const walksData = await AsyncStorage.getItem('walks');
        if (walksData) {
          const loadedWalks = JSON.parse(walksData);
          
          // Check if we need to fix dates in existing walks
          const fixedWalks = loadedWalks.map((walk: Walk) => {
            // Check if walk has an ISO startTime
            if (walk.startTime) {
              const walkDate = new Date(walk.startTime);
              const correctDate = getLocalDateString(walkDate);
              
              // If dates don't match, update with correct local date
              if (walk.date !== correctDate) {
                return {
                  ...walk,
                  date: correctDate
                };
              }
            }
            return walk;
          });
          
          // Only save back if we made changes
          const needToSave = JSON.stringify(fixedWalks) !== walksData;
          if (needToSave) {
            await AsyncStorage.setItem('walks', JSON.stringify(fixedWalks));
          }
          
          setWalks(fixedWalks);
        }
        
        // Check if there's an active walk in progress
        const currentWalkData = await AsyncStorage.getItem('currentWalk');
        if (currentWalkData) {
          const savedCurrentWalk = JSON.parse(currentWalkData);
          setCurrentWalk(savedCurrentWalk);
          setIsTracking(true);
          
          // Resume location tracking
          startBackgroundLocationTracking();
        }
      } catch (error) {
        console.error('Error loading walks:', error);
      }
    };

    loadWalks();
    
    // Cleanup on unmount
    return () => {
      if (isTracking) {
        Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
          .catch(error => console.warn('Failed to stop location updates:', error));
      }
    };
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
  
  // Save current walk to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCurrentWalk = async () => {
      if (currentWalk) {
        try {
          await AsyncStorage.setItem('currentWalk', JSON.stringify(currentWalk));
        } catch (error) {
          console.error('Error saving current walk:', error);
        }
      } else {
        try {
          await AsyncStorage.removeItem('currentWalk');
        } catch (error) {
          console.error('Error removing current walk:', error);
        }
      }
    };
    
    saveCurrentWalk();
  }, [currentWalk]);

  // Start background location tracking
  const startBackgroundLocationTracking = async () => {
    // Request background location permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Permission to access location was denied');
    }
    
    // For iOS, we need to request additional permissions for background tracking
    if (Platform.OS === 'ios') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        throw new Error('Permission to access background location was denied');
      }
    }
    
    // Check if the task is already defined and running
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
      .catch(() => false);
      
    if (hasStarted) {
      // Stop existing task before starting a new one
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .catch(error => console.warn('Failed to stop previous location task:', error));
    }
    
    // Start the background task
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 1, // minimum distance (in meters) between updates
      timeInterval: 1000, // minimum time (in ms) between updates
      foregroundService: {
        notificationTitle: "DogDash is tracking your walk",
        notificationBody: "Keep your phone with you to record your walk path accurately.",
        notificationColor: "#34C759",
      },
      // This is crucial for background tracking on iOS
      activityType: Location.ActivityType.Fitness,
      showsBackgroundLocationIndicator: true,
      // Make sure to specify we want background updates
      pausesUpdatesAutomatically: false,
    });
  };

  // Start tracking a new walk
  async function startWalk() {
    try {
      // Create a new walk with initial location
      const now = new Date();
      
      // Debug date information to diagnose timezone issues
      // debugDateInfo(now, 'startWalk');
      
      const formattedDate = getLocalDateString(now);
      
      const newWalk: Walk = {
        id: now.getTime().toString(),
        date: formattedDate, // Use utility function for consistent local date formatting
        startTime: now.toISOString(),
        endTime: '',
        duration: 0,
        distance: 0,
        coordinates: [],
      };

      // Update state right away for responsive UI
      setCurrentWalk(newWalk);
      setIsTracking(true);
      
      // Get initial high-accuracy location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).catch(error => {
        console.warn('Failed to get initial location:', error);
        return null;
      });
      
      // If we got an initial location, add it to the walk
      if (initialLocation) {
        setCurrentWalk(prevWalk => {
          if (!prevWalk) return null;
          
          return {
            ...prevWalk,
            coordinates: [{
              latitude: initialLocation.coords.latitude,
              longitude: initialLocation.coords.longitude,
              timestamp: initialLocation.timestamp,
            }],
          };
        });
      }

      // Start background location tracking
      await startBackgroundLocationTracking();
      
    } catch (error) {
      console.error('Error starting walk:', error);
      throw error;
    }
  }

  // Stop tracking the current walk
  async function stopWalk() {
    try {
      // Stop background location tracking
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .catch(() => false);
        
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
      
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }

      if (currentWalk) {
        const now = new Date();
        // debugDateInfo(now, 'stopWalk');
                
        // Check if the walk spans midnight by comparing start date and current date
        const walkDate = currentWalk.date;
        const currentDate = getLocalDateString(now);
        
        if (walkDate !== currentDate) {
          console.log(`Walk spans midnight! Started on ${walkDate}, ending on ${currentDate}`);
        }
        
        const completedWalk: Walk = {
          ...currentWalk,
          endTime: now.toISOString(),
        };
        
        setWalks((prevWalks) => [...prevWalks, completedWalk]);
        setCurrentWalk(null);
        setIsTracking(false);
        
        // Clear the current walk from AsyncStorage
        await AsyncStorage.removeItem('currentWalk');
      }
    } catch (error) {
      console.error('Error stopping walk:', error);
      throw error;
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