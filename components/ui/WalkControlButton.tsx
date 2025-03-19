import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type WalkControlButtonProps = {
  type: 'start' | 'stop';
  onPress: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
};

export const WalkControlButton: React.FC<WalkControlButtonProps> = ({
  type,
  onPress,
  isLoading = false,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const buttonColor = type === 'start' ? '#34C759' : '#FF3B30'; // Green for start, red for stop
  const buttonText = type === 'start' ? 'Start Walk' : 'End Walk';
  const iconName = type === 'start' ? 'play.fill' : 'stop.fill';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: buttonColor },
        style,
      ]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <>
          <IconSymbol name={iconName} size={20} color="white" />
          <ThemedText
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            {buttonText}
          </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}); 