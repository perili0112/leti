// app/auth/new-password.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenShell } from '../../components/shared/ScreenShell';
import { FormInput }   from '../../components/shared/FormInput';
import { useTheme }    from '../../constants/ThemeContext';
import { FontFamily, Radius, Shadow } from '../../constants/theme';

function getStrength(p: string): { score: number; label: string; color: string } {
  if (!p)            return { score: 0, label: '',        color: 'transparent' };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['transparent', '#E8774A', '#F0A832', '#3EBEC4', '#3BBF6E'];
  return { score: s, label: labels[s], color: colors[s] };
}

export default function NewPasswordScreen() {
  const { colors: C } = useTheme();
  const [pass,    setPass]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors,  setErrors]  = useState<{ pass?: string; confirm?: string }>({});

  const strength = getStrength(pass);

  const validate = () => {
    const e: typeof errors = {};
    if (pass.length < 8)    e.pass    = 'Password must be at least 8 characters.';
    if (pass !== confirm)   e.confirm = 'Passwords don\'t match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = () => {
    if (!validate()) return;
    console.log('Password reset successful');
    router.replace('/(tabs)/profile?passwordReset=1');
  };

  return (
    <ScreenShell centered>
      <Text style={[styles.headline, { color: C.textPrimary }]}>New password</Text>
      <Text style={[styles.sub, { color: C.textSecondary }]}>
        Almost there. Choose a new password.
      </Text>

      <View style={styles.form}>
        <View>
          <FormInput
            label="New password"
            placeholder="At least 8 characters"
            value={pass}
            onChangeText={v => { setPass(v); setErrors(p => ({ ...p, pass: undefined })); }}
            error={errors.pass}
            isPassword
            returnKeyType="next"
          />
          {/* Strength bar */}
          {pass.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={[styles.strengthTrack, { backgroundColor: C.border }]}>
                <View style={[
                  styles.strengthFill,
                  { width: `${(strength.score / 4) * 100}%` as any, backgroundColor: strength.color },
                ]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}
        </View>
        <FormInput
          label="Confirm new password"
          placeholder="Repeat your password"
          value={confirm}
          onChangeText={v => { setConfirm(v); setErrors(p => ({ ...p, confirm: undefined })); }}
          error={errors.confirm}
          isPassword
          returnKeyType="done"
          onSubmitEditing={handleReset}
        />
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: C.dark, ...Shadow.button }]}
        onPress={handleReset}
        activeOpacity={0.88}
      >
        <Text style={styles.btnText}>Reset Password</Text>
      </TouchableOpacity>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headline:       { fontFamily: FontFamily.displayBold, fontSize: 26, letterSpacing: -0.5, marginBottom: 10 },
  sub:            { fontFamily: FontFamily.uiRegular, fontSize: 13, lineHeight: 20, marginBottom: 28 },
  form:           { gap: 16 },
  strengthWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  strengthTrack:  { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill:   { height: '100%' as any, borderRadius: 2 },
  strengthLabel:  { fontFamily: FontFamily.uiSemiBold, fontSize: 11, width: 46 },
  spacer:         { flex: 1, minHeight: 32 },
  btn:            { height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  btnText:        { fontFamily: FontFamily.uiSemiBold, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1, color: '#fff' },
});
