import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { formatDate } from '@/utils/formatUtils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

type DatePickerProps = {
  selectedDate: string; // ISO date string (YYYY-MM-DD)
  onDateChange: (date: string) => void;
  availableDates: string[]; // Array of dates that have walks
};

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  availableDates,
}) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const colorScheme = useColorScheme();
  const accentColor = Colors[colorScheme ?? 'light'].tint;

  // Convert selected date string to Date object
  const selectedDateObj = new Date(selectedDate);

  // Handle date selection
  const handleDateChange = (event: any, newDate?: Date) => {
    setIsPickerVisible(Platform.OS === 'ios');
    if (newDate) {
      const dateString = newDate.toISOString().split('T')[0];
      onDateChange(dateString);
    }
  };

  // Get the previous available date
  const getPreviousDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      const prevDate = availableDates[currentIndex - 1];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDateChange(prevDate);
    }
  };

  // Get the next available date
  const getNextDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1 && currentIndex !== -1) {
      const nextDate = availableDates[currentIndex + 1];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDateChange(nextDate);
    }
  };

  // Whether we can navigate to previous/next dates
  const canNavigatePrev = availableDates.indexOf(selectedDate) > 0;
  const canNavigateNext = availableDates.indexOf(selectedDate) < availableDates.length - 1 && availableDates.indexOf(selectedDate) !== -1;

  return (
    <View>
      <ThemedView style={styles.container}>
        <TouchableOpacity 
          onPress={getPreviousDate} 
          disabled={!canNavigatePrev} 
          style={styles.navigationButton}
        >
          <IconSymbol 
            name="chevron.left" 
            size={20} 
            color={canNavigatePrev ? accentColor : '#888'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsPickerVisible(true);
          }}
          style={styles.dateButton}
        >
          <ThemedText type="subtitle">{formatDate(selectedDate)}</ThemedText>
          <IconSymbol name="calendar" size={20} color={accentColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={getNextDate} 
          disabled={!canNavigateNext}
          style={styles.navigationButton}
        >
          <IconSymbol 
            name="chevron.right" 
            size={20} 
            color={canNavigateNext ? accentColor : '#888'} 
          />
        </TouchableOpacity>
      </ThemedView>

      {isPickerVisible && (
        <DateTimePicker
          value={selectedDateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 12,
    marginVertical: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  navigationButton: {
    padding: 12,
  },
}); 