// Syncs Android system navigation bar with app theme.
// Note: On gesture navigation (most phones), only button/handle styling may apply;
// the OS draws the home indicator — see Expo docs for expo-navigation-bar.

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from '../../constants/ThemeContext';

export function AndroidNavigationBarSync() {
  const { isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    NavigationBar.setPositionAsync('absolute').catch(() => {});
    NavigationBar.setBackgroundColorAsync('#00000000').catch(() => {});
    NavigationBar.setStyle(isDark ? 'dark' : 'light');
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
  }, [isDark]);

  return null;
}
