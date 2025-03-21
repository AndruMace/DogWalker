import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
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
};

export const WalkStatsCard: React.FC<WalkStatsCardProps> = ({
  walkId,
  distance,
  duration,
  isLive = false,
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
        <ThemedText type="subtitle">{formatDistance(distance)}</ThemedText>
      </View>
      <View style={styles.statItem}>
        <IconSymbol name="clock.fill" size={24} color={accentColor} />
        <ThemedText type="subtitle">{formatDuration(duration)}</ThemedText>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  liveContainer: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
}); 