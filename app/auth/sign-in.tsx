// app/auth/sign-in.tsx

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

export default function SignInScreen() {
  const { colors: C } = useTheme();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())          e.email    = 'Email is required.';
    else if (!isValidEmail(email)) e.email = 'Please enter a valid email.';
    if (!password)              e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignIn = () => {
    if (!validate()) return;
    console.log('Sign in:', { email, password: '***' });
    // On success → router.replace('/(tabs)')
  };

  return (
    <ScreenShell centered>
      <Text style={[styles.headline, { color: C.textPrimary }]}>Welcome back</Text>
      <Text style={[styles.sub, { color: C.textSecondary }]}>
        Sign in to continue with Leti.
      </Text>

      <View style={styles.form}>
        <FormInput
          label="Email or username"
          placeholder="you@example.com"
          value={email}
          onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: undefined })); }}
          error={errors.email}
          keyboardType="email-address"
          returnKeyType="next"
        />
        <FormInput
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: undefined })); }}
          error={errors.password}
          isPassword
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />
        <TouchableOpacity
          onPress={() => router.push('/auth/forgot-password')}
          style={styles.forgotRow}
          activeOpacity={0.7}
        >
          <Text style={[styles.forgotText, { color: C.textMuted }]}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: C.dark, ...Shadow.button }]}
        onPress={handleSignIn}
        activeOpacity={0.88}
      >
        <Text style={[styles.btnText, { color: '#fff' }]}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={[styles.linkText, { color: C.textMuted }]}>
          Don't have an account?{' '}
          <Text style={{ color: C.primary, fontFamily: FontFamily.uiSemiBold }}>Create one</Text>
        </Text>
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headline:   { fontFamily: FontFamily.displayBold, fontSize: 28, letterSpacing: -0.5, marginBottom: 8 },
  sub:        { fontFamily: FontFamily.uiRegular, fontSize: 13, lineHeight: 20, marginBottom: 32 },
  form:       { gap: 14 },
  forgotRow:  { alignSelf: 'flex-end' },
  forgotText: { fontFamily: FontFamily.uiRegular, fontSize: 12, textDecorationLine: 'underline' },
  spacer:     { flex: 1, minHeight: 32 },
  btn: { height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  btnText:    { fontFamily: FontFamily.uiSemiBold, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, color: '#fff' },
  link:       { alignItems: 'center', paddingVertical: 8 },
  linkText:   { fontFamily: FontFamily.uiRegular, fontSize: 13 },
});
