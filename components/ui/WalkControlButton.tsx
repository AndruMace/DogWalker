import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

type WalkControlButtonProps = {
  type: 'start' | 'stop';
  onPress: () => void;
  isLoading?: boolean;
  style?: any;
};

export const WalkControlButton: React.FC<WalkControlButtonProps> = ({
  type,
  onPress,
  isLoading = false,
  style,
}) => {
  const isStart = type === 'start';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
      style={[
        styles.button,
        isStart ? styles.startButton : styles.stopButton,
        isLoading && styles.disabledButton,
        style,
      ]}>
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" />
            <ThemedText style={styles.loadingText}>
              {isStart ? 'Starting Walk...' : 'Stopping Walk...'}
            </ThemedText>
          </View>
        ) : (
          <>
            <IconSymbol
              name={isStart ? 'play.circle.fill' : 'stop.circle.fill'}
              size={24}
              color="white"
            />
            <ThemedText style={styles.text}>
              {isStart ? 'Start Walk' : 'End Walk'}
            </ThemedText>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 