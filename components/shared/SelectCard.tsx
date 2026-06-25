// components/shared/SelectCard.tsx

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { FontFamily, Radius, Shadow } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

interface Props {
  title:       React.ReactNode;
  description?: string;
  selected:    boolean;
  onPress:     () => void;
  disabled?:   boolean;
  style?:      object;
}

export function SelectCard({ title, description, selected, onPress, disabled, style }: Props) {
  const { colors: C } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor:  selected ? C.card       : C.card,
          borderColor:      selected ? C.dark        : C.border,
          borderWidth:      selected ? 2             : 1,
          opacity:          disabled ? 0.45          : 1,
        },
        selected && { ...Shadow.cardSubtle },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      {/* Left accent bar when selected */}
      {selected && (
        <View style={[styles.accent, { backgroundColor: C.primary }]} />
      )}
      <View style={styles.content}>
        {typeof title === 'string'
          ? <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>
          : title
        }
        {description && (
          <Text style={[styles.desc, { color: C.textMuted }]}>{description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius:   Radius.md,
    flexDirection:  'row',
    alignItems:     'center',
    overflow:       'hidden',
    minHeight:      60,
  },
  accent: {
    width:  3,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  content: {
    flex:              1,
    paddingHorizontal: 14,
    paddingVertical:   14,
    gap:               3,
  },
  title: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize:   14,
    lineHeight: 20,
  },
  desc: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   11,
    lineHeight: 16,
  },
});
