import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { LetiMark } from './LetiLogo';

type LetiAvatarProps = {
  size?: number;
  containerSize?: number;
  style?: ViewStyle;
};

export function LetiAvatar({ size = 14, containerSize, style }: LetiAvatarProps) {
  const { colors: C } = useTheme();
  const dim = containerSize ?? size + 14;

  return (
    <View
      style={[
        styles.circle,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: C.primaryFaint,
          borderColor: C.borderMedium,
        },
        style,
      ]}
    >
      <LetiMark size={size} variant="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
});
