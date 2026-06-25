// components/shared/StepCounter.tsx
//
// Discrete integer selector for "how many days" questions.
// Displays large hero number + row of tappable step pills.
// No continuous slider — avoids the precision/overshoot problem.

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

interface Props {
  min:      number;
  max:      number;
  value:    number;
  onChange: (v: number) => void;
  unit:     string;   // e.g. "days / week"
}

export function StepCounter({ min, max, value, onChange, unit }: Props) {
  const { colors: C } = useTheme();
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  // Animate the hero number scale on change
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
  }, [value]);

  return (
    <View style={s.wrap}>
      {/* Hero display */}
      <View style={s.heroRow}>
        <Animated.Text style={[s.heroNum, { color: C.primary, transform: [{ scale }] }]}>
          {value}
        </Animated.Text>
        <Text style={[s.heroUnit, { color: C.textMuted }]}>{unit}</Text>
      </View>

      {/* Step pills */}
      <View style={s.pills}>
        {steps.map(n => {
          const active = n === value;
          return (
            <TouchableOpacity
              key={n}
              style={[
                s.pill,
                {
                  backgroundColor: active ? C.primary : C.card,
                  borderColor:     active ? C.primary : C.borderMedium,
                  flex: 1,
                },
              ]}
              onPress={() => onChange(n)}
              activeOpacity={0.75}
            >
              <Text style={[s.pillLabel, { color: active ? '#fff' : C.textSecondary }]}>
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { gap: 20 },
  heroRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  heroNum: {
    fontFamily:    FontFamily.displayExtraBold,
    fontSize:      72,
    lineHeight:    72,
    letterSpacing: -3,
  },
  heroUnit: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   16,
    paddingBottom: 10,
  },
  pills: { flexDirection: 'row', gap: 6 },
  pill: {
    height:         44,
    borderRadius:   Radius.md,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    minWidth:       32,
  },
  pillLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 14 },
});