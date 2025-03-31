import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { formatDistance, formatDuration } from '@/utils/formatUtils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type WalkStatsCardProps = {
  walkId?: string;
  distance: number; // meters
  duration: number; // seconds
  isLive?: boolean;
  isLoading?: boolean;
};

export const WalkStatsCard: React.FC<WalkStatsCardProps> = ({
  walkId,
  distance,
  duration,
  isLive = false,
  isLoading = false,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const accentColor = Colors[colorScheme ?? 'light'].tint;

  const handlePress = () => {
    if (walkId) {
      router.push({
        pathname: '/walk-details',
        params: { walkId }
      });
    }
  };

  const card = (
    <ThemedView style={[styles.container, isLive && styles.liveContainer]}>
      <View style={styles.statItem}>
        <IconSymbol name="figure.walk" size={24} color={accentColor} />
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={accentColor} />
            <ThemedText type="subtitle">Initializing...</ThemedText>
          </View>
        ) : (
          <ThemedText type="subtitle">{formatDistance(distance)}</ThemedText>
        )}
      </View>
      <View style={styles.statItem}>
        <IconSymbol name="clock.fill" size={24} color={accentColor} />
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={accentColor} />
            <ThemedText type="subtitle">Initializing...</ThemedText>
          </View>
        ) : (
          <ThemedText type="subtitle">{formatDuration(duration)}</ThemedText>
        )}
      </View>
      {isLive && (
        <View style={styles.liveIndicator}>
          <ThemedView style={styles.liveDot} />
          <ThemedText type="defaultSemiBold">LIVE</ThemedText>
        </View>
      )}
      {walkId && (
        <View style={styles.arrowContainer}>
          <IconSymbol name="chevron.right" size={20} color={accentColor} />
        </View>
      )}
    </ThemedView>
  );

  // If walkId is provided, make the card touchable
  if (walkId) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {card}
      </TouchableOpacity>
    );
  }

  // Otherwise, just return the card
  return card;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  liveContainer: {
    backgroundColor: '#34C75920',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  arrowContainer: {
    marginLeft: 'auto',
  },
}); 