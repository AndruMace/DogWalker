import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { DatePicker } from '@/components/ui/DatePicker';
import { WalkCard } from '@/components/ui/WalkCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useWalk } from '@/contexts/WalkContext';

export default function HistoryScreen() {
  const { walks, getWalksByDate } = useWalk();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get all unique dates from walks
  const uniqueDates = [...new Set(walks.map(walk => walk.date))];
  
  // Get today's date in YYYY-MM-DD format
  const now = new Date();
  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Add today's date to available dates if not already included
  if (!uniqueDates.includes(todayFormatted)) {
    uniqueDates.push(todayFormatted);
  }
  
  // Sort dates in descending order (newest first)
  uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Always default to today's date
  const [selectedDate, setSelectedDate] = useState(todayFormatted);
  const [walksForDate, setWalksForDate] = useState(getWalksByDate(todayFormatted));
  
  // Update walks when selected date changes
  useEffect(() => {
    const walksForSelectedDate = getWalksByDate(selectedDate);
    // Sort walks for the selected date in reverse chronological order (newest first)
    const sortedWalksForDate = [...walksForSelectedDate].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    setWalksForDate(sortedWalksForDate);
  }, [selectedDate, getWalksByDate, walks]);
  
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Group walks by date

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="title">Walk History</ThemedText>
      </ThemedView>
      
      {walks.length > 0 ? (
        <>
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            availableDates={uniqueDates}
          />
        
          {walksForDate.length > 0 ? (
            <FlatList
              data={walksForDate}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <WalkCard walk={item} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <ThemedView style={styles.emptyDateContainer}>
              <IconSymbol name="calendar" size={48} color="#888" />
              <ThemedText>No walks found for this date.</ThemedText>
            </ThemedView>
          )}
        </>
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol name="doc.text" size={64} color="#888" />
          <ThemedText type="subtitle">No Walk History</ThemedText>
          <ThemedText style={styles.emptyText}>
            Your completed walks will appear here. Start tracking a walk to begin building your history.
          </ThemedText>
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
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyDateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: '80%',
  },
}); 