// components/shared/StepSlider.tsx
// A discrete step selector — pill buttons for each integer value.
// Expo SDK 54 doesn't ship Slider in core; this avoids adding a dep.

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

interface Props {
  min:      number;
  max:      number;
  value:    number;
  onChange: (v: number) => void;
  unit?:    string;
}

export function StepSlider({ min, max, value, onChange, unit = '' }: Props) {
  const { colors: C } = useTheme();
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <View style={styles.wrap}>
      {/* Hero display */}
      <View style={styles.heroRow}>
        <Text style={[styles.heroNum, { color: C.textPrimary }]}>{value}</Text>
        {unit ? <Text style={[styles.heroUnit, { color: C.textMuted }]}>{unit}</Text> : null}
      </View>

      {/* Step buttons */}
      <View style={styles.steps}>
        {steps.map(n => {
          const active = n === value;
          return (
            <TouchableOpacity
              key={n}
              style={[
                styles.step,
                {
                  backgroundColor: active ? C.dark    : C.card,
                  borderColor:     active ? C.dark    : C.borderMedium,
                  flex: 1,
                },
              ]}
              onPress={() => onChange(n)}
              activeOpacity={0.75}
            >
              <Text style={[styles.stepLabel, { color: active ? '#fff' : C.textPrimary }]}>
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:      { gap: 12 },
  heroRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroNum:   { fontFamily: FontFamily.displayExtraBold, fontSize: 42, letterSpacing: -2, lineHeight: 44 },
  heroUnit:  { fontFamily: FontFamily.uiRegular, fontSize: 14, paddingBottom: 6 },
  steps:     { flexDirection: 'row', gap: 5 },
  step: {
    height:         38,
    borderRadius:   Radius.sm,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    minWidth:       32,
  },
  stepLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 12 },
});
