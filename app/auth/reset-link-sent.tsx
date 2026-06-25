// app/auth/reset-link-sent.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { useTheme }    from '../../constants/ThemeContext';
import { FontFamily, Radius, Shadow } from '../../constants/theme';

export default function ResetLinkSentScreen() {
  const { colors: C } = useTheme();
  const { email }     = useLocalSearchParams<{ email?: string }>();
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    setResent(true);
    console.log('Resend reset link to:', email);
    setTimeout(() => setResent(false), 3000);
  };

  // Mask email: d***@email.com
  const masked = email
    ? email.replace(/^(.).*(@.*)$/, '$1***$2')
    : 'your email';

  return (
    <ScreenShell centered>
      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: C.primaryFaint, borderColor: C.primary }]}>
          <Mail size={32} color={C.primary} />
        </View>
      </View>

      <Text style={[styles.headline, { color: C.textPrimary }]}>Check your inbox</Text>
      <Text style={[styles.body, { color: C.textSecondary }]}>
        I've sent a password reset link to{'\n'}
        <Text style={[styles.email, { color: C.textPrimary }]}>{masked}</Text>
        {'\n\n'}Tap the link in the email to continue. It expires in 30 minutes.
      </Text>

      <View style={styles.spacer} />

      <View style={styles.resendRow}>
        <Text style={[styles.hint, { color: C.textMuted }]}>Didn't receive it?</Text>
        <TouchableOpacity onPress={handleResend} activeOpacity={0.7} disabled={resent}>
          <Text style={[styles.resendText, { color: resent ? C.success : C.primary }]}>
            {resent ? '✓ Sent again' : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: C.card, borderColor: C.border, borderWidth: 1.5 }]}
        onPress={() => router.replace('/auth/sign-in')}
        activeOpacity={0.8}
      >
        <Text style={[styles.btnText, { color: C.textPrimary }]}>Back to Sign In</Text>
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  iconWrap:    { alignItems: 'center', marginBottom: 28 },
  iconCircle:  { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  headline:    { fontFamily: FontFamily.displayBold, fontSize: 26, letterSpacing: -0.5, textAlign: 'center', marginBottom: 14 },
  body:        { fontFamily: FontFamily.uiRegular, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  email:       { fontFamily: FontFamily.uiSemiBold },
  spacer:      { flex: 1, minHeight: 32 },
  resendRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20 },
  hint:        { fontFamily: FontFamily.uiRegular, fontSize: 13 },
  resendText:  { fontFamily: FontFamily.uiSemiBold, fontSize: 13 },
  btn:         { height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  btnText:     { fontFamily: FontFamily.uiSemiBold, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
});
