import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define marker types
export type MarkerType = 'trashcan' | 'poop' | 'pee';

// Define marker data structure
export interface Marker {
  id: string;
  type: MarkerType;
  latitude: number;
  longitude: number;
  createdAt: string; // ISO date string
}

// Context type definition
type MarkerContextType = {
  markers: Marker[];
  addMarker: (markerData: Omit<Marker, 'id' | 'createdAt'>) => Promise<void>;
  removeMarker: (id: string) => Promise<void>;
  getMarkersNearby: (latitude: number, longitude: number, radiusInMeters: number) => Marker[];
};

// Create the context
const MarkerContext = createContext<MarkerContextType | undefined>(undefined);

// Calculate distance between coordinates in meters using Haversine formula
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const earthRadius = 6371e3; // Earth's radius in meters
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const latDiffRad = ((lat2 - lat1) * Math.PI) / 180;
  const lonDiffRad = ((lon2 - lon1) * Math.PI) / 180;

  const haversineA =
    Math.sin(latDiffRad / 2) * Math.sin(latDiffRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lonDiffRad / 2) * Math.sin(lonDiffRad / 2);
  const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));

  return earthRadius * haversineC;
}

// Provider component
export const MarkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markers, setMarkers] = useState<Marker[]>([]);

  // Load markers from AsyncStorage on mount
  useEffect(() => {
    const loadMarkers = async () => {
      try {
        const markersData = await AsyncStorage.getItem('markers');
        if (markersData) {
          setMarkers(JSON.parse(markersData));
        }
      } catch (error) {
        console.error('Error loading markers:', error);
      }
    };

    loadMarkers();
  }, []);

  // Save markers to AsyncStorage whenever they change
  useEffect(() => {
    const saveMarkers = async () => {
      try {
        await AsyncStorage.setItem('markers', JSON.stringify(markers));
      } catch (error) {
        console.error('Error saving markers:', error);
      }
    };

    if (markers.length > 0) {
      saveMarkers();
    }
  }, [markers]);

  // Add a new marker
  const addMarker = async (markerData: Omit<Marker, 'id' | 'createdAt'>) => {
    const newMarker: Marker = {
      ...markerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
  };

  // Remove a marker by ID
  const removeMarker = async (id: string) => {
    setMarkers((prevMarkers) => prevMarkers.filter((marker) => marker.id !== id));
  };

  // Get markers within a certain radius of a point
  const getMarkersNearby = (latitude: number, longitude: number, radiusInMeters: number): Marker[] => {
    return markers.filter((marker) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        marker.latitude,
        marker.longitude
      );
      return distance <= radiusInMeters;
    });
  };

  return (
    <MarkerContext.Provider
      value={{
        markers,
        addMarker,
        removeMarker,
        getMarkersNearby,
      }}>
      {children}
    </MarkerContext.Provider>
  );
};

// Custom hook to use the marker context
export function useMarkers() {
  const context = useContext(MarkerContext);
  if (context === undefined) {
    throw new Error('useMarkers must be used within a MarkerProvider');
  }
  return context;
} 