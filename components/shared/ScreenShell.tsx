// components/shared/ScreenShell.tsx
// Keyboard-aware scroll container used by every auth/onboarding screen.

import React from 'react';
import {
  View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../constants/ThemeContext';

interface Props {
  children:   React.ReactNode;
  centered?:  boolean;   // vertically centre scroll content
  noPadding?: boolean;
}

export function ScreenShell({ children, centered, noPadding }: Props) {
  const { colors: C, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            !noPadding && styles.padded,
            centered && styles.centered,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  content:  { flexGrow: 1 },
  padded:   { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  centered: { justifyContent: 'center' },
});