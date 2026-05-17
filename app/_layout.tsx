 // app/_layout.tsx

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { OnboardingProvider } from '../context/OnboardingContext';
import { AndroidNavigationBarSync } from '../components/shared/AndroidNavigationBarSync';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // --- Auth state (replace with real auth later) ---
  const [user, setUser] = useState<{ email: string } | null>({ email: 'test@example.com' } );
  // For testing the MAIN APP (skip auth/onboarding)
 //const [user, setUser] = useState<{ email: string } | null>({ email: 'test@example.com' });
 // For testing the AUTH/ONBOARDING flow (normal behavior)
 // const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // --- Font loading ---
  const [fontsLoaded, fontError] = useFonts({
    BarlowSemiCondensed_300Light,
    BarlowSemiCondensed_400Regular,
    BarlowSemiCondensed_500Medium,
    BarlowSemiCondensed_600SemiBold,
    BarlowSemiCondensed_700Bold,
    BarlowSemiCondensed_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // --- Auth redirect logic (FIXED) ---
  useEffect(() => {
    if (!fontsLoaded) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const inPaywallGroup = segments[0] === 'paywall';
    
    const inPublicFlow = inAuthGroup || inOnboardingGroup || inPaywallGroup;

    if (!user && !inPublicFlow) {
      // Not logged in and not in public flow → go to name entry
      router.replace('/auth/name-entry');
    } else if (user && inPublicFlow) {
      // Logged in but still in public flow → go to main app
      router.replace('/(tabs)');
    }
  }, [user, segments, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <AndroidNavigationBarSync />
      <OnboardingProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/name-entry"      options={{ animation: 'fade' }} />
          <Stack.Screen name="auth/sign-in"         options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/forgot-password" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/reset-link-sent" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/new-password"    options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="onboarding/experience"         options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/goal"               options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/race-distance"      options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/race-date"          options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/time-goal"          options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/current-frequency"  options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/desired-frequency"  options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/time-of-day"        options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/notes"              options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/safety-override"    options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="paywall/race"     options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="paywall/stay-fit" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="run-tracker"          options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="after-run"            options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="run-detail"           options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="add-run"              options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="reset-password"       options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="reset-password-sent"  options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="reset-password-new"   options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="full-plan"            options={{ animation: 'slide_from_right' }} />
        </Stack>
      </OnboardingProvider>
    </ThemeProvider>
  );
}