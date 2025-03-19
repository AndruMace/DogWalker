import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Walk } from '@/contexts/WalkContext';
import { formatDistance, formatDuration, formatTime } from '@/utils/formatUtils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type WalkCardProps = {
  walk: Walk;
};

export const WalkCard: React.FC<WalkCardProps> = ({ walk }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const accentColor = Colors[colorScheme ?? 'light'].tint;

  const handlePress = () => {
    router.push({
      pathname: '/walk-details',
      params: { walkId: walk.id }
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">
          {formatTime(walk.startTime)} - {formatTime(walk.endTime)}
        </ThemedText>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <IconSymbol name="figure.walk" size={20} color={accentColor} />
            <ThemedText>{formatDistance(walk.distance)}</ThemedText>
          </View>
          
          <View style={styles.statItem}>
            <IconSymbol name="clock.fill" size={20} color={accentColor} />
            <ThemedText>{formatDuration(walk.duration)}</ThemedText>
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <IconSymbol name="chevron.right" size={20} color={accentColor} />
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'column',
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
}); 