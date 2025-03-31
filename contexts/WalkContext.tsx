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

// Note: The task is now defined at the app root level in _layout.tsx
// This ensures it's available when the app starts

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
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Check and request location permissions on mount
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      try {
        console.log('Checking location permissions...');
        
        // Check current foreground permissions
        const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
        console.log('Current foreground permission status:', foregroundStatus);
        
        let foregroundGranted = foregroundStatus === 'granted';
        
        // If not granted, request foreground permissions
        if (!foregroundGranted) {
          console.log('Requesting foreground permissions...');
          const { status: newForegroundStatus } = await Location.requestForegroundPermissionsAsync();
          console.log('New foreground permission status:', newForegroundStatus);
          foregroundGranted = newForegroundStatus === 'granted';
        }

        if (!foregroundGranted) {
          console.warn('Foreground location permission denied');
          return;
        }

        let backgroundGranted = true;
        
        // For background tracking, we need different permissions on iOS and Android
        if (Platform.OS === 'ios') {
          const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
          console.log('Current iOS background permission status:', backgroundStatus);
          
          if (backgroundStatus !== 'granted') {
            console.log('Requesting iOS background permissions...');
            const { status: newBackgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            console.log('New iOS background permission status:', newBackgroundStatus);
            backgroundGranted = newBackgroundStatus === 'granted';
          }
        } else if (Platform.OS === 'android') {
          const apiLevel = Platform.Version;
          if (apiLevel >= 29) {
            const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
            console.log('Current Android background permission status:', backgroundStatus);
            
            if (backgroundStatus !== 'granted') {
              console.log('Requesting Android background permissions...');
              const { status: newBackgroundStatus } = await Location.requestBackgroundPermissionsAsync();
              console.log('New Android background permission status:', newBackgroundStatus);
              backgroundGranted = newBackgroundStatus === 'granted';
            }
          }
        }

        if (!backgroundGranted) {
          console.warn('Background location permission denied');
          // We'll still set permissions as granted for foreground tracking
        }

        console.log('Setting permissions as granted');
        setPermissionsGranted(true);
      } catch (error) {
        console.error('Error checking/requesting permissions:', error);
      }
    };

    checkAndRequestPermissions();
  }, []);

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

  // Check if TaskManager is properly defined on mount
  useEffect(() => {
    const checkTaskDefinition = async () => {
      // Check if task is defined
      const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
      console.log('Is background location task defined:', isTaskDefined);
      
      if (!isTaskDefined) {
        console.warn('Task is not defined properly. This may cause tracking issues.');
      }
    };
    
    checkTaskDefinition();
  }, []);

  // Start background location tracking
  const startBackgroundLocationTracking = async () => {
    console.log('Starting background location tracking...');
    
    // Always define the task directly before starting it to ensure it's properly registered
    if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
      console.log('Task not defined, defining it now...');
      TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
        if (error) {
          console.error('Error in background location task:', error);
          return;
        }
        if (data) {
          // Get the location data
          const { locations } = data as { locations: Location.LocationObject[] };
          console.log(`Received ${locations?.length || 0} location updates in task`);
          
          if (locations && locations.length > 0) {
            // Get the last location
            const location = locations[locations.length - 1];
            console.log('New location in task:', {
              lat: location.coords.latitude.toFixed(6),
              lng: location.coords.longitude.toFixed(6),
              accuracy: location.coords.accuracy?.toFixed(1) || 'unknown',
              timestamp: new Date(location.timestamp).toLocaleTimeString(),
            });
            
            try {
              // Get the current walk from storage
              const walkData = await AsyncStorage.getItem('currentWalk');
              if (!walkData) {
                console.warn('No current walk found in storage, ignoring update');
                return;
              }
              
              const currentWalk: Walk = JSON.parse(walkData);
              console.log(`Current walk has ${currentWalk.coordinates.length} coordinates`);
              
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
                console.log(`Added distance: ${newDistance.toFixed(2)} meters`);
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
              
              console.log(`Updated walk in task: ${updatedWalk.coordinates.length} coords, ${updatedWalk.distance.toFixed(2)}m, ${updatedWalk.duration}s`);
              
              // Save updated walk back to AsyncStorage
              await AsyncStorage.setItem('currentWalk', JSON.stringify(updatedWalk));
              
              // Emit event to update UI
              DeviceEventEmitter.emit(LOCATION_UPDATE_EVENT, updatedWalk);
            } catch (error) {
              console.error('Error processing background location:', error);
            }
          } else {
            console.warn('Received location update with no locations');
          }
        } else {
          console.warn('Received data is null or undefined');
        }
      });
      console.log('Task defined successfully');
    } else {
      console.log('Task already defined');
    }
    
    // Check if the task is already running
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
      .catch((error) => {
        console.warn('Failed to check if location task is running:', error);
        return false;
      });
      
    if (hasStarted) {
      // Stop existing task before starting a new one
      console.log('Stopping previous location task before restarting');
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .catch(error => console.warn('Failed to stop previous location task:', error));
    }
    
    // Configure the background task with platform-specific settings
    const locationOptions: Location.LocationTaskOptions = {
      accuracy: Location.Accuracy.High,
      distanceInterval: 1, // minimum distance (in meters) between updates
      timeInterval: 1000, // minimum time (in ms) between updates
      // Android-specific foreground service configuration
      foregroundService: {
        notificationTitle: "DogDash is tracking your walk",
        notificationBody: "Keep your phone with you to record your walk path accurately.",
        notificationColor: "#34C759",
      },
      // iOS-specific configuration
      activityType: Location.ActivityType.Fitness,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      deferredUpdatesInterval: 1000, // Get updates at most every second
      deferredUpdatesDistance: 1, // Get updates when moved at least 1 meter
    };
    
    // Start the background task
    console.log('Starting location updates task');
    try {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, locationOptions);
      console.log('Successfully started location updates task');
      
      // Also start foreground updates as a fallback
      startForegroundLocationTracking();
    } catch (error) {
      console.error('Failed to start location updates task, falling back to foreground only:', error);
      // Fall back to foreground tracking only
      startForegroundLocationTracking();
    }
  };

  // Start foreground location tracking as a fallback
  const startForegroundLocationTracking = async () => {
    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 1,
        timeInterval: 1000,
      },
      async (location) => {
        console.log('Received foreground location update');
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
          
          // Create updated walk
          const updatedWalk: Walk = {
            ...currentWalk,
            date: currentWalk.date || getLocalDateString(now),
            coordinates: updatedCoordinates,
            distance,
            duration,
          };
          
          // Save updated walk back to AsyncStorage
          await AsyncStorage.setItem('currentWalk', JSON.stringify(updatedWalk));
          
          // Update UI
          DeviceEventEmitter.emit(LOCATION_UPDATE_EVENT, updatedWalk);
        } catch (error) {
          console.error('Error processing foreground location:', error);
        }
      }
    );
    
    // Remember the subscription so we can clean it up later
    setLocationSubscription(locationSubscription);
  };

  // Start tracking a new walk
  async function startWalk() {
    try {
      console.log('Starting walk, permissions granted:', permissionsGranted);
      
      // Double check permissions before starting
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      console.log('Current foreground permission status:', foregroundStatus);
      
      if (foregroundStatus !== 'granted') {
        throw new Error('Location permissions not granted. Please enable location services in your device settings.');
      }

      // Get initial high-accuracy location
      console.log('Getting initial location...');
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).catch(error => {
        console.warn('Failed to get initial location:', error);
        return null;
      });
      
      // If we couldn't get an initial location, throw an error
      if (!initialLocation) {
        throw new Error('Unable to get initial location. Please ensure location services are enabled and try again.');
      }

      // Create a new walk with initial location
      const now = new Date();
      const formattedDate = getLocalDateString(now);
      
      const newWalk: Walk = {
        id: now.getTime().toString(),
        date: formattedDate,
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

      console.log('Created new walk with initial location:', {
        lat: initialLocation.coords.latitude.toFixed(6),
        lng: initialLocation.coords.longitude.toFixed(6)
      });

      // Update state right away for responsive UI
      setCurrentWalk(newWalk);
      setIsTracking(true);

      // Save walk to AsyncStorage before starting background tracking
      await AsyncStorage.setItem('currentWalk', JSON.stringify(newWalk));

      // Start background location tracking
      await startBackgroundLocationTracking();
      
      console.log('Walk started successfully');
      
    } catch (error) {
      console.error('Error starting walk:', error);
      // Reset state if walk failed to start
      setCurrentWalk(null);
      setIsTracking(false);
      await AsyncStorage.removeItem('currentWalk').catch(() => {});
      throw error;
    }
  }

  // Stop tracking the current walk
  async function stopWalk() {
    try {
      console.log('Stopping walk...');
      
      // Stop background location tracking
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .catch(() => false);
        
      if (hasStarted) {
        console.log('Stopping location updates task');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
          .catch(error => {
            console.warn('Failed to stop location updates:', error);
          });
      } else {
        console.log('No active location updates task to stop');
      }
      
      // Stop foreground location tracking
      if (locationSubscription) {
        console.log('Removing foreground location subscription');
        locationSubscription.remove();
        setLocationSubscription(null);
      } else {
        console.log('No foreground location subscription to remove');
      }

      if (currentWalk) {
        const now = new Date();
                
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
        
        console.log(`Completed walk: ${completedWalk.coordinates.length} coords, ${completedWalk.distance.toFixed(2)}m, ${completedWalk.duration}s`);
        
        // Make a copy of walks and add the new one
        const updatedWalks = [...walks, completedWalk];
        setWalks(updatedWalks);
        
        // Also save walks to AsyncStorage directly to ensure it's saved
        try {
          await AsyncStorage.setItem('walks', JSON.stringify(updatedWalks));
        } catch (error) {
          console.error('Error saving walks to AsyncStorage:', error);
        }
        
        // Clear the current walk
        setCurrentWalk(null);
        setIsTracking(false);
        
        // Clear the current walk from AsyncStorage
        await AsyncStorage.removeItem('currentWalk');
        console.log('Walk stopped and saved successfully');
      } else {
        console.warn('No current walk to stop');
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