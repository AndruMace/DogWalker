// Instead of using the device's color scheme, always return 'light'
// export { useColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
