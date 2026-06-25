// components/shared/FormInput.tsx

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

interface Props extends TextInputProps {
  label?:      string;
  error?:      string;
  isPassword?: boolean;
}

export function FormInput({ label, error, isPassword, style, ...rest }: Props) {
  const { colors: C } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && (
        <Text style={[styles.label, { color: C.textMuted }]}>{label}</Text>
      )}
      <View style={[
        styles.inputRow,
        {
          borderColor:     error ? C.danger : C.borderMedium,
          backgroundColor: C.card,
        },
      ]}>
        <TextInput
          style={[styles.input, { color: C.textPrimary }, style]}
          placeholderTextColor={C.textTertiary}
          secureTextEntry={isPassword && !show}
          autoCapitalize="none"
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShow(s => !s)} style={styles.eyeBtn} activeOpacity={0.7}>
            {show
              ? <EyeOff size={18} color={C.textMuted} />
              : <Eye    size={18} color={C.textMuted} />
            }
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: C.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { gap: 5 },
  label:    { fontFamily: FontFamily.uiSemiBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  inputRow: {
    height:          52,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 16,
  },
  input:    { flex: 1, fontFamily: FontFamily.uiRegular, fontSize: 15 },
  eyeBtn:   { padding: 4 },
  error:    { fontFamily: FontFamily.uiRegular, fontSize: 11 },
});
