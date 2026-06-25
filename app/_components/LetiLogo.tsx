import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { FontFamily } from '../../constants/theme';

const RATIO = 165 / 80;
// White asset has extra canvas padding — scale up so it matches the default mark size.
const WHITE_SIZE_SCALE = 600 / 372;

type LogoVariant = 'auto' | 'default' | 'white';

function resolveVariant(variant: LogoVariant, isDark: boolean): 'default' | 'white' {
  if (variant === 'auto') return isDark ? 'white' : 'default';
  return variant;
}

export function LetiMark({ size = 32, variant = 'auto' }: { size?: number; variant?: LogoVariant }) {
  const { isDark } = useTheme();
  const resolved = resolveVariant(variant, isDark);
  const source = resolved === 'white'
    ? require('../../assets/leti-logo-white.png')
    : require('../../assets/leti-logo.png');
  const height = resolved === 'white' ? size * WHITE_SIZE_SCALE : size;
  return (
    <Image
      source={source}
      style={{ width: Math.round(height * RATIO), height: Math.round(height) }}
      resizeMode="contain"
    />
  );
}

export function LetiWordmark({ size = 22, gap = 6, variant = 'auto' }: { size?: number; gap?: number; variant?: LogoVariant }) {
  const { isDark } = useTheme();
  const resolved = resolveVariant(variant, isDark);
  const textColor = resolved === 'white' ? '#FFFFFF' : isDark ? '#3EBEC4' : '#1B6C70';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <LetiMark size={size} variant={variant} />
      <Text style={{ fontFamily: FontFamily.displayBold, fontSize: size * 1.1, color: textColor, letterSpacing: 3, lineHeight: size * 1.3 }}>
        LETI
      </Text>
    </View>
  );
}
