// app/reset-password-sent.tsx
// Step 2 — email sent confirmation with resend option.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Check } from 'lucide-react-native';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { MOCK_USER } from '../constants/mockData';

export default function ResetPasswordSentScreen() {
  const { colors: C, isDark } = useTheme();
  const s = React.useMemo(() => makeStyles(C), [C]);
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Check Your Inbox</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.content}>

        {/* Icon */}
        <View style={s.iconWrap}>
          <Mail size={32} color={C.primary} />
        </View>

        <Text style={s.title}>Reset link sent</Text>
        <Text style={s.subtitle}>
          We've sent a password reset link to{'\n'}
          <Text style={s.email}>{MOCK_USER.email}</Text>
        </Text>
        <Text style={s.hint}>
          Check your inbox and tap the link to create a new password. The link expires in 30 minutes.
        </Text>

        {/* Resend */}
        <View style={s.resendRow}>
          <Text style={s.resendLabel}>Didn't receive it?</Text>
          <TouchableOpacity onPress={handleResend} activeOpacity={0.7} disabled={resent}>
            {resent ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Check size={13} color={C.success} />
                <Text style={[s.resendBtn, s.resendSent]}>Sent again</Text>
              </View>
            ) : (
              <Text style={s.resendBtn}>Resend email</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to login / profile */}
        <TouchableOpacity style={s.backToBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
          <Text style={s.backToBtnText}>Back to App</Text>
        </TouchableOpacity>

      </View>
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
    subtitle: { fontFamily: FontFamily.uiRegular, fontSize: 15, color: C.textSecondary, lineHeight: 24, marginBottom: 16 },
    email:    { fontFamily: FontFamily.uiSemiBold, color: C.textPrimary },
    hint:     { fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.textMuted, lineHeight: 20, marginBottom: 36 },

    resendRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
    resendLabel: { fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textSecondary },
    resendBtn:   { fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.primary },
    resendSent:  { color: C.success },

    backToBtn:     { height: 56, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    backToBtnText: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: C.textPrimary, letterSpacing: 0.2 },
  });
}