// app/auth/name-entry.tsx
// First screen: "Hi, I'm Leti. What should I call you?"
// New user → onboarding.  Existing user → sign in.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenShell }   from '../../components/shared/ScreenShell';
import { FormInput }     from '../../components/shared/FormInput';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { FontFamily, Radius, Shadow } from '../../constants/theme';
import { LetiWordmark }  from '../../app/_components/LetiLogo';

export default function NameEntryScreen() {
  const { colors: C } = useTheme();
  const { setFirstName } = useOnboarding();
  const [name, setName]   = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }
    setFirstName(trimmed);
    router.push('/onboarding/experience');
  };

  return (
    <ScreenShell centered>
      {/* Logo */}
      <View style={styles.logoRow}>
        <LetiWordmark size={20} />
      </View>

      {/* Headline */}
      <Text style={[styles.headline, { color: C.textPrimary }]}>
        Hi, I'm Leti.{'\n'}What should I call you?
      </Text>

      <View style={styles.form}>
        <FormInput
          placeholder="Your first name"
          value={name}
          onChangeText={v => { setName(v); setError(''); }}
          error={error}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          autoFocus
          autoCapitalize="words"
        />
      </View>

      <View style={styles.spacer} />

      {/* CTA */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: C.dark, ...Shadow.button }]}
        onPress={handleContinue}
        activeOpacity={0.88}
      >
        <Text style={[styles.btnText, { color: '#fff' }]}>Continue</Text>
      </TouchableOpacity>

      {/* Sign-in link */}
      <TouchableOpacity
        style={styles.link}
        onPress={() => router.push('/auth/sign-in')}
        activeOpacity={0.7}
      >
        <Text style={[styles.linkText, { color: C.textMuted }]}>
          Already have an account?{' '}
          <Text style={{ color: C.primary, fontFamily: FontFamily.uiSemiBold }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  logoRow:  { alignItems: 'center', marginBottom: 48 },
  headline: {
    fontFamily:  FontFamily.displayBold,
    fontSize:    28,
    letterSpacing: -0.5,
    lineHeight:  36,
    textAlign:   'center',
    marginBottom: 32,
  },
  form:     { gap: 12 },
  spacer:   { flex: 1, minHeight: 24 },
  btn: {
    height:         56,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   16,
  },
  btnText:  { fontFamily: FontFamily.uiSemiBold, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
  link:     { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontFamily: FontFamily.uiRegular, fontSize: 13 },
});
