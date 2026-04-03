// app/reset-password.tsx
// Step 1 of password reset — shows user's email, they confirm to send the link.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { MOCK_USER } from '../constants/mockData';

export default function ResetPasswordScreen() {
  const { colors: C, isDark } = useTheme();
  const s = React.useMemo(() => makeStyles(C), [C]);

  // Pre-filled with the user's registered email — editable in case they want another
  const [email, setEmail] = useState(MOCK_USER.email);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Reset Password</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.content}>

          {/* Icon */}
          <View style={s.iconWrap}>
            <Lock size={32} color={C.primary} />
          </View>

          {/* Copy */}
          <Text style={s.title}>Forgot your password?</Text>
          <Text style={s.subtitle}>
            We'll send a password reset link to the email address linked to your account. Check the address below and tap Send.
          </Text>

          {/* Email field — pre-filled, editable */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Email address</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={C.textMuted}
            />
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={[s.btn, !email.trim() && s.btnDisabled]}
            onPress={() => router.replace('/reset-password-sent')}
            activeOpacity={0.88}
            disabled={!email.trim()}
          >
            <Text style={s.btnText}>Send Reset Link</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
    safe:     { flex: 1, backgroundColor: C.bg },
    nav:      { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn:  { width: 36, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
    navTitle: { fontFamily: FontFamily.displayBold, fontSize: 18, color: C.textPrimary, letterSpacing: 0.2 },

    content:  { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 36 },

    iconWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.primaryFaint, borderWidth: 1.5, borderColor: 'rgba(27,108,112,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },

    title:    { fontFamily: FontFamily.displayBold, fontSize: 24, color: C.textPrimary, letterSpacing: -0.3, marginBottom: 10 },
    subtitle: { fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textSecondary, lineHeight: 22, marginBottom: 32 },

    fieldWrap:  { marginBottom: 20 },
    fieldLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    input: {
      height: 52,
      backgroundColor: C.card,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: C.border,
      paddingHorizontal: 16,
      fontFamily: FontFamily.uiRegular,
      fontSize: 15,
      color: C.textPrimary,
    },

    btn:         { height: 56, backgroundColor: C.dark, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', ...Shadow.button },
    btnDisabled: { opacity: 0.4 },
    btnText:     { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.3 },
  });
}