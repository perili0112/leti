// components/shared/PillSelector.tsx

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options:  PillOption<T>[];
  value:    T;
  onChange: (v: T) => void;
  wrap?:    boolean;
}

export function PillSelector<T extends string>({ options, value, onChange, wrap }: Props<T>) {
  const { colors: C } = useTheme();
  return (
    <View style={[styles.row, wrap && styles.wrap]}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.pill,
              {
                backgroundColor: active ? C.dark    : C.card,
                borderColor:     active ? C.dark    : C.borderMedium,
              },
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, { color: active ? '#fff' : C.textPrimary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 6 },
  wrap:  { flexWrap: 'wrap' },
  pill:  {
    height:          34,
    paddingHorizontal: 14,
    borderRadius:    Radius.full,
    borderWidth:     1.5,
    alignItems:      'center',
    justifyContent:  'center',
  },
  label: { fontFamily: FontFamily.uiSemiBold, fontSize: 12 },
});
