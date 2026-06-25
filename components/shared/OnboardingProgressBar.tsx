// components/shared/OnboardingProgressBar.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { ONBOARDING_TOTAL_STEPS } from '../../data/mockOnboardingData';

interface Props {
  step: number; // 1-based
}

export function OnboardingProgressBar({ step }: Props) {
  const { colors: C } = useTheme();
  const pct = Math.round((step / ONBOARDING_TOTAL_STEPS) * 100);

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { backgroundColor: C.border }]}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: C.primary }]} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: C.textMuted }]}>
          Step {step} of {ONBOARDING_TOTAL_STEPS}
        </Text>
        <Text style={[styles.label, { color: C.textMuted }]}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { marginBottom: 20 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  fill:  { height: '100%' as any, borderRadius: 2 },
  row:   { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: FontFamily.uiRegular, fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase' },
});
