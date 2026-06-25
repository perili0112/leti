// components/shared/GridOptionCard.tsx
//
// Compact card for 2-column grids (race distance, time of day).
// Taller aspect ratio — stacks label and sub-label vertically.
// Same selection mechanics as OptionCard.

import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

interface GridOptionCardProps {
  label:       string;
  subLabel?:   string;
  icon?:       string;          // emoji or leave undefined
  iconNode?:   React.ReactNode; // lucide icon
  selected:    boolean;
  onPress:     () => void;
  disabled?:   boolean;
  flex?:       number;
}

export function GridOptionCard({
  label, subLabel, icon, iconNode, selected, onPress, disabled, flex = 1,
}: GridOptionCardProps) {
  const { colors: C } = useTheme();

  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue:         selected ? 1 : 0,
      useNativeDriver: true,
      tension:         260,
      friction:        18,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity
      style={[
        grid.wrap,
        {
          flex,
          backgroundColor: selected ? C.primaryFaint : C.card,
          borderColor:     selected ? C.primary : C.border,
          borderWidth:     selected ? 2 : 1,
          opacity:         disabled ? 0.42 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      {/* Checkmark */}
      <Animated.View
        style={[
          grid.check,
          {
            backgroundColor: selected ? C.primary : 'transparent',
            borderColor:     selected ? C.primary : C.borderMedium,
            transform:       [{ scale: checkScale }],
          },
        ]}
      >
        {selected && <Check size={8} color="#fff" strokeWidth={3} />}
      </Animated.View>

      {/* Content */}
      <View style={{ alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
        {iconNode && (
          <View style={[grid.iconCircle, { backgroundColor: selected ? C.primary : C.primaryFaint }]}>
            {iconNode}
          </View>
        )}
        {icon && <Text style={grid.emoji}>{icon}</Text>}
        <Text style={[grid.label, { color: C.textPrimary }]}>{label}</Text>
        {subLabel && (
          <Text style={[grid.sub, { color: C.textMuted }]}>{subLabel}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const grid = StyleSheet.create({
  wrap: {
    borderRadius:   14,
    paddingVertical:   18,
    paddingHorizontal: 10,
    alignItems:     'center',
    minHeight:      90,
    position:       'relative',
    overflow:       'hidden',
  },
  check: {
    position:       'absolute',
    top:            8,
    right:          8,
    width:          18,
    height:         18,
    borderRadius:   9,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emoji:  { fontSize: 22 },
  label: {
    fontFamily: FontFamily.displayBold,
    fontSize:   17,
    letterSpacing: -0.3,
    textAlign:  'center',
  },
  sub: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   10,
    textAlign:  'center',
    lineHeight: 14,
  },
});