// app/_layout.tsx
// Root layout: loads fonts, hides splash screen, defines navigation stack.
// All screens that live OUTSIDE the tab bar (Run Tracker, After Run, Run Detail)
// are registered as Stack screens here so they render without any tab bar.

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import {
  BarlowSemiCondensed_300Light,
  BarlowSemiCondensed_400Regular,
  BarlowSemiCondensed_500Medium,
  BarlowSemiCondensed_600SemiBold,
  BarlowSemiCondensed_700Bold,
  BarlowSemiCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-semi-condensed';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../constants/ThemeContext';

// Keep splash visible until fonts are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Barlow Semi Condensed — display / big numbers
    BarlowSemiCondensed_300Light,
    BarlowSemiCondensed_400Regular,
    BarlowSemiCondensed_500Medium,
    BarlowSemiCondensed_600SemiBold,
    BarlowSemiCondensed_700Bold,
    BarlowSemiCondensed_800ExtraBold,
    // Figtree — UI / body / labels
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  useEffect(() => {
    // Hide splash when fonts are ready OR if they fail (graceful degradation)
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Block render until fonts resolve — prevents flash of unstyled text
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tab screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Stack screens — no tab bar */}
        <Stack.Screen
          name="run-tracker"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="after-run"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="run-detail"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="add-run"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="reset-password-sent"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="reset-password-new"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="full-plan"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </ThemeProvider>
  );
}