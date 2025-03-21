import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Walk } from '@/contexts/WalkContext';
import { DeleteWalkButton } from './DeleteWalkButton';
import { formatDistance, formatDuration } from '@/utils/formatters';

type WalkHistoryItemProps = {
  walk: Walk;
}; 