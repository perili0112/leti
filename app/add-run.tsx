// app/add-run.tsx — Add Run Manually screen
// Accessed via long-press on START RUN → "Add Manually"

import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';

const RUN_TYPES = ['Easy', 'Tempo', 'Long', 'Interval', 'Race', 'Other'];

export default function AddRunScreen() {
  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  const [distance, setDistance]   = useState('');
  const [duration, setDuration]   = useState('');
  const [runType, setRunType]     = useState('Easy');
  const [notes, setNotes]         = useState('');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Log a Run</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          <Text style={s.sectionLabel}>Distance</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="0.0"
              placeholderTextColor={C.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={s.inputUnit}>km</Text>
          </View>

          <Text style={s.sectionLabel}>Duration</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="0:00:00"
              placeholderTextColor={C.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={s.inputUnit}>h:mm:ss</Text>
          </View>

          <Text style={s.sectionLabel}>Run Type</Text>
          <View style={s.typeGrid}>
            {RUN_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.typeChip, runType === t && s.typeChipActive]}
                onPress={() => setRunType(t)}
                activeOpacity={0.7}
              >
                <Text style={[s.typeChipText, runType === t && s.typeChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.sectionLabel}>Notes</Text>
          <TextInput
            style={[s.input, s.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it feel?"
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={s.saveBtn} activeOpacity={0.88} onPress={() => router.back()}>
            <Text style={s.saveBtnText}>Save Run</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
    safe:    { flex: 1, backgroundColor: C.bg },
    nav:     { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 36, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
    navTitle:{ fontFamily: FontFamily.displayBold, fontSize: 18, color: C.textPrimary, letterSpacing: 0.2 },
    content: { padding: Spacing.xl, gap: Spacing.sm, paddingBottom: 40 },
    sectionLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 1.3, textTransform: 'uppercase', marginTop: Spacing.sm, marginBottom: 6 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    input:    { flex: 1, height: 52, backgroundColor: C.card, borderRadius: Radius.md, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, fontFamily: FontFamily.displayBold, fontSize: 22, color: C.textPrimary },
    inputUnit:{ fontFamily: FontFamily.uiMedium, fontSize: 14, color: C.textMuted, width: 50 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.full, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
    typeChipActive: { backgroundColor: C.dark, borderColor: C.dark },
    typeChipText:   { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textSecondary },
    typeChipTextActive: { color: '#fff' },
    notesInput: { height: 88, textAlignVertical: 'top', paddingTop: 14, fontSize: 14, fontFamily: FontFamily.uiRegular },
    saveBtn:  { height: 60, backgroundColor: C.dark, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, ...Shadow.button },
    saveBtnText: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.5 },
  });
}