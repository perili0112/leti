// components/shared/OptionCard.tsx
//
// The primary selection primitive for onboarding.
//
// Design decisions (from research):
//   • Icon container (44×44) on left — users scan icons before text
//   • Checkmark circle in top-right — appears on selection (spring in)
//   • Selected: 2px teal border + teal-faint bg + teal icon tint
//   • Minimum 76px height — thumb-friendly even with one hand
//   • No left accent bar — competes with icon
//   • Rounded corners 14px — premium, not clinical

import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

interface OptionCardProps {
  title:       string;
  description?: string;
  icon?:       React.ReactNode;  // icon at the left, sized for ~22px
  selected:    boolean;
  onPress:     () => void;
  disabled?:   boolean;
}

export function OptionCard({
  title, description, icon, selected, onPress, disabled,
}: OptionCardProps) {
  const { colors: C } = useTheme();

  // Checkmark scale animation — springs in on selection
  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const bgAnim     = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue:        selected ? 1 : 0,
        useNativeDriver: true,
        tension:        260,
        friction:       18,
      }),
      Animated.timing(bgAnim, {
        toValue:        selected ? 1 : 0,
        duration:       160,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selected]);

  // Interpolate background color via opacity overlay
  const overlayOpacity = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 1],
  });

  return (
    <TouchableOpacity
      style={[
        card.wrap,
        {
          backgroundColor: C.card,
          borderColor:     selected ? C.primary : C.border,
          borderWidth:     selected ? 2 : 1,
          opacity:         disabled ? 0.42 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      {/* Teal background wash — animates in on selection */}
      <Animated.View
        style={[
          card.bgOverlay,
          { backgroundColor: C.primary, opacity: overlayOpacity },
        ]}
        pointerEvents="none"
      />

      {/* Icon container */}
      {icon && (
        <View style={[
          card.iconWrap,
          {
            backgroundColor: selected ? C.primary : C.primaryFaint,
            borderColor:     selected ? C.primary : C.borderMedium,
          },
        ]}>
          {icon}
        </View>
      )}

      {/* Text */}
      <View style={card.text}>
        <Text style={[card.title, { color: C.textPrimary }]}>{title}</Text>
        {description && (
          <Text style={[card.desc, { color: C.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      {/* Checkmark — springs into existence */}
      <Animated.View
        style={[
          card.check,
          {
            backgroundColor: selected ? C.primary : 'transparent',
            borderColor:     selected ? C.primary : C.borderMedium,
            transform: [{ scale: checkScale }],
          },
        ]}
      >
        {selected && <Check size={10} color="#fff" strokeWidth={3} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

const CARD_BG_OPACITY = 0.055;

const card = StyleSheet.create({
  wrap: {
    borderRadius:   14,
    flexDirection:  'row',
    alignItems:     'center',
    minHeight:      76,
    paddingHorizontal: 14,
    paddingVertical:   14,
    gap:            14,
    overflow:       'hidden',
    position:       'relative',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: CARD_BG_OPACITY,
  },
  iconWrap: {
    width:          44,
    height:         44,
    borderRadius:   12,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  text: {
    flex: 1,
    gap:  3,
  },
  title: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize:   15,
    lineHeight: 21,
  },
  desc: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   12,
    lineHeight: 17,
  },
  check: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
});