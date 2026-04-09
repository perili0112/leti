import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { FontFamily } from '../../constants/theme';

const RATIO = 165 / 80;

export function LetiMark({ size = 32, variant = 'default' }: { size?: number; variant?: 'default' | 'white' }) {
  const source = variant === 'white'
    ? require('../../assets/leti-logo-white.png')
    : require('../../assets/leti-logo.png');
  return (
    <Image
      source={source}
      style={{ width: Math.round(size * RATIO), height: size }}
      resizeMode="contain"
    />
  );
}

export function LetiWordmark({ size = 22, gap = 6, variant = 'default' }: { size?: number; gap?: number; variant?: 'default' | 'white' }) {
  const { isDark } = useTheme();
  const textColor = variant === 'white' ? '#FFFFFF' : isDark ? '#3EBEC4' : '#1B6C70';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <LetiMark size={size} variant={variant} />
      <Text style={{ fontFamily: FontFamily.displayBold, fontSize: size * 1.1, color: textColor, letterSpacing: 3, lineHeight: size * 1.3 }}>
        LETI
      </Text>
    </View>
  );
}
