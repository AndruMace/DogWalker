import { useEffect, useState } from 'react';
// import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 * Modified to always return 'light' regardless of system preferences
 */
export function useColorScheme() {
  // We no longer need the hydration check since we're always returning 'light'
  return 'light';
}
