// app/auth/forgot-password.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { FormInput }   from '../../components/shared/FormInput';
import { useTheme }    from '../../constants/ThemeContext';
import { FontFamily, Radius, Shadow } from '../../constants/theme';

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function ForgotPasswordScreen() {
  const { colors: C } = useTheme();
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');

  const handleSend = () => {
    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    console.log('Send reset link to:', email);
    router.push({ pathname: '/auth/reset-link-sent', params: { email } });
  };

  return (
    <ScreenShell centered>
      <Text style={[styles.headline, { color: C.textPrimary }]}>Reset password</Text>
      <Text style={[styles.sub, { color: C.textSecondary }]}>
        No worries. Enter your email and I'll send you a link to reset it.
      </Text>

      <FormInput
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChangeText={v => { setEmail(v); setError(''); }}
        error={error}
        keyboardType="email-address"
        returnKeyType="done"
        onSubmitEditing={handleSend}
        autoFocus
      />

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: C.dark, ...Shadow.button }]}
        onPress={handleSend}
        activeOpacity={0.88}
      >
        <Text style={styles.btnText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={[styles.linkText, { color: C.textMuted }]}>Back to Sign In</Text>
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: FontFamily.displayBold, fontSize: 26, letterSpacing: -0.5, marginBottom: 10 },
  sub:      { fontFamily: FontFamily.uiRegular, fontSize: 13, lineHeight: 20, marginBottom: 28 },
  spacer:   { flex: 1, minHeight: 32 },
  btn:      { height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  btnText:  { fontFamily: FontFamily.uiSemiBold, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, color: '#fff' },
  link:     { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontFamily: FontFamily.uiRegular, fontSize: 13, textDecorationLine: 'underline' },
});
