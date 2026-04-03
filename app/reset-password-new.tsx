// app/reset-password-new.tsx
// Step 3 (phone branch) — user opened the reset link on their phone.
// After success, returns to profile with a success toast.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';

export default function ResetPasswordNewScreen() {
  const { colors: C, isDark } = useTheme();
  const s = React.useMemo(() => makeStyles(C), [C]);

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [error,     setError]     = useState('');

  const isValid  = scorePassword(password).score >= 1 && password.length >= 8 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;

function scorePassword(pw: string): { score: number; label: string; hint: string; color: string } {
  if (!pw) return { score: 0, label: '', hint: '', color: '' };

  let score = 0;
  const hints: string[] = [];

  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (pw.length < 8)   hints.push('At least 8 characters needed');

  const hasUpper  = /[A-Z]/.test(pw);
  const hasLower  = /[a-z]/.test(pw);
  const hasDigit  = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  if (hasUpper && hasLower) score++;
  else hints.push('Mix upper and lowercase letters');

  if (hasDigit) score++;
  else hints.push('Add at least one number');

  if (hasSymbol) score++;
  else if (pw.length < 12) hints.push('Add a symbol for extra strength');

  if (/^(.)\1+$/.test(pw)) {
    score = 0; hints.length = 0; hints.push('All identical characters');
  }
  if (/^(123|abc|qwerty|password|letmein|iloveyou|admin|welcome)/i.test(pw)) {
    score = Math.min(score, 1); hints.unshift('Too predictable');
  }
  if (/^[a-zA-Z]+$/.test(pw) && pw.length < 12) score = Math.min(score, 2);

  score = Math.max(0, Math.min(4, score));

  const levels = [
    { label: 'Weak',   color: '#D4470A' },
    { label: 'Fair',   color: '#E8991C' },
    { label: 'Good',   color: '#1B6C70' },
    { label: 'Strong', color: '#3BBF6E' },
    { label: 'Strong', color: '#3BBF6E' },
  ];

  return { score, label: levels[score].label, hint: hints[0] || '', color: levels[score].color };
}

  const handleSave = () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    // Navigate to profile with success param
    router.replace('/(tabs)/profile?passwordReset=1' as any);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.nav}>
        <View style={{ width: 36 }} />
        <Text style={s.navTitle}>New Password</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.content}>

          <View style={s.iconWrap}>
            <Ionicons name="key-outline" size={32} color={C.primary} />
          </View>

          <Text style={s.title}>Create a new password</Text>
          <Text style={s.subtitle}>
            Choose something strong — at least 8 characters, ideally a mix of letters and numbers.
          </Text>

          {/* New password */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>New password</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                secureTextEntry={!showPass}
                placeholder="Min. 8 characters"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity style={s.eye} onPress={() => setShowPass(v => !v)} activeOpacity={0.7}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Confirm password</Text>
            <View style={[s.inputRow, mismatch && s.inputRowError]}>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={v => { setConfirm(v); setError(''); }}
                secureTextEntry={!showConf}
                placeholder="Repeat password"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity style={s.eye} onPress={() => setShowConf(v => !v)} activeOpacity={0.7}>
                <Ionicons name={showConf ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            {mismatch && <Text style={s.errorText}>Passwords don't match</Text>}
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          {/* Strength indicator */}
          {password.length > 0 && (() => {
            const { score, label, hint, color } = scorePassword(password);
            return (
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                <View style={s.strengthRow}>
                  {[1,2,3,4].map(i => (
                    <View key={i} style={[s.strengthBar, { backgroundColor: i <= score ? color : C.border }]} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                  <Text style={[s.strengthLabel, { color }]}>{label}</Text>
                  {hint ? <Text style={[s.strengthHint]}>{hint}</Text> : null}
                </View>
              </View>
            );
          })()}

          <TouchableOpacity
            style={[s.btn, !isValid && s.btnDisabled]}
            onPress={handleSave}
            activeOpacity={0.88}
            disabled={!isValid}
          >
            <Text style={s.btnText}>Save New Password</Text>
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
    navTitle: { fontFamily: FontFamily.displayBold, fontSize: 18, color: C.textPrimary, letterSpacing: 0.2 },

    content:  { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 36 },

    iconWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.primaryFaint, borderWidth: 1.5, borderColor: 'rgba(27,108,112,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },

    title:    { fontFamily: FontFamily.displayBold, fontSize: 24, color: C.textPrimary, letterSpacing: -0.3, marginBottom: 10 },
    subtitle: { fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textSecondary, lineHeight: 22, marginBottom: 32 },

    fieldWrap:   { marginBottom: 16 },
    fieldLabel:  { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: Radius.md, borderWidth: 1.5, borderColor: C.border },
    inputRowError: { borderColor: C.danger },
    input:       { flex: 1, height: 52, paddingHorizontal: 16, fontFamily: FontFamily.uiRegular, fontSize: 15, color: C.textPrimary },
    eye:         { width: 44, height: 52, alignItems: 'center', justifyContent: 'center' },
    errorText:   { fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.danger, marginTop: 5 },

    strengthRow:   { flexDirection: 'row', gap: 4, height: 3 },
    strengthBar:   { flex: 1, height: 3, borderRadius: 2 },
    strengthLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 11 },
    strengthHint:  { fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textMuted, textAlign: 'right', flex: 1, marginLeft: 8 },

    btn:         { height: 56, backgroundColor: C.dark, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', ...Shadow.button },
    btnDisabled: { opacity: 0.4 },
    btnText:     { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.3 },
  });
}