// app/(tabs)/settings.tsx
// Settings screen — scrollable list with live toggles and segmented controls.
// Theme toggle is wired to ThemeContext — changes all screens immediately.

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight } from 'lucide-react-native';
import { FontFamily, Spacing, Radius, type ColorPalette } from '../../constants/theme';
import { useTheme, type ThemeMode, type DistUnit } from '../../constants/ThemeContext';

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES (all accept C for themed colors)
// ─────────────────────────────────────────────────────────────

function SectionHeader({ label, C }: { label: string; C: ColorPalette }) {
  const s = useMemo(() => StyleSheet.create({
    wrap:  { paddingHorizontal: Spacing.xl, paddingTop: 20, paddingBottom: 7, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
    label: { fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' },
  }), [C]);
  return <View style={s.wrap}><Text style={s.label}>{label}</Text></View>;
}

function RowDivider({ C }: { C: ColorPalette }) {
  return <View style={{ height: 1, backgroundColor: C.border, marginLeft: Spacing.xl }} />;
}

function Row({ children, C }: { children: React.ReactNode; C: ColorPalette }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, minHeight: 54, gap: 14, backgroundColor: C.card }}>
      {children}
    </View>
  );
}

function RowLabel({ text, sub, C }: { text: string; sub?: string; C: ColorPalette }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 15, color: C.textPrimary }}>{text}</Text>
      {sub && <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textMuted, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

function RowValue({ text, C }: { text: string; C: ColorPalette }) {
  return <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textMuted, flexShrink: 0 }}>{text}</Text>;
}

function Seg({ options, active, onChange, C }: {
  options: string[]; active: number; onChange: (i: number) => void; C: ColorPalette;
}) {
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1.5, borderColor: 'rgba(27,108,112,0.35)', borderRadius: Radius.sm, overflow: 'hidden', flexShrink: 1 }}>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={opt}
          style={[
            { paddingVertical: 7, paddingHorizontal: 10, backgroundColor: 'transparent' },
            i === active && { backgroundColor: C.primary },
            i < options.length - 1 && { borderRightWidth: 1, borderRightColor: 'rgba(27,108,112,0.2)' },
          ]}
          onPress={() => onChange(i)}
          activeOpacity={0.7}
        >
          <Text style={[
            { fontFamily: FontFamily.uiMedium, fontSize: 12, color: C.textSecondary },
            i === active && { color: '#fff' },
          ]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Toggle({ value, onChange, C }: { value: boolean; onChange: (v: boolean) => void; C: ColorPalette }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: C.border, true: C.primary }}
      thumbColor="#fff"
      ios_backgroundColor={C.border}
    />
  );
}

function NavRow({ label, value, onPress, C }: { label: string; value?: string; onPress?: () => void; C: ColorPalette }) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, minHeight: 54, gap: 14, backgroundColor: C.card }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 15, color: C.textPrimary, flex: 1 }}>{label}</Text>
      {value && <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textMuted }}>{value}</Text>}
      <ChevronRight size={14} color={C.textTertiary} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTINGS SCREEN
// ─────────────────────────────────────────────────────────────

// Maps ThemeMode → seg index
const MODE_TO_INDEX: Record<ThemeMode, number> = { light: 0, dark: 1, system: 2 };
const INDEX_TO_MODE: ThemeMode[] = ['light', 'dark', 'system'];

export default function SettingsScreen() {
  const { colors: C, isDark, themeMode, setThemeMode, distUnit, setDistUnit } = useTheme();

  // Audio
  const [coachingCues,  setCoachingCues]  = useState(true);
  const [metronome,     setMetronome]     = useState(false);
  const [volume,        setVolume]        = useState(1); // 0=Low 1=Med 2=High

  // Units — pace is derived automatically from distUnit, never set independently
  const [weightUnit,    setWeightUnit]    = useState(0); // 0=kg 1=lb

  // Notifications
  const [runReminders,  setRunReminders]  = useState(true);
  const [aiMessages,    setAiMessages]    = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.titleBar}>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>

        {/* ── APPEARANCE ── */}
        <SectionHeader label="Appearance" C={C} />
        <View style={s.card}>
          <Row C={C}>
            <RowLabel text="Theme" C={C} />
            <Seg
              options={['Light', 'Dark', 'System']}
              active={MODE_TO_INDEX[themeMode]}
              onChange={i => setThemeMode(INDEX_TO_MODE[i])}
              C={C}
            />
          </Row>
        </View>

        {/* ── AUDIO ── */}
        <SectionHeader label="Audio" C={C} />
        <View style={s.card}>
          <Row C={C}>
            <RowLabel text="Sound Volume" C={C} />
            <Seg options={['Low', 'Med', 'High']} active={volume} onChange={setVolume} C={C} />
          </Row>
          <RowDivider C={C} />
          <Row C={C}>
            <RowLabel text="Coaching Cues" sub="AI voice cues during run" C={C} />
            <Toggle value={coachingCues} onChange={setCoachingCues} C={C} />
          </Row>
          <RowDivider C={C} />
          <Row C={C}>
            <RowLabel text="Metronome" sub="Rhythmic beep to hold your cadence during a run" C={C} />
            <Toggle value={metronome} onChange={setMetronome} C={C} />
          </Row>
        </View>

        {/* ── UNITS ── */}
        <SectionHeader label="Units" C={C} />
        <View style={s.card}>
          <Row C={C}>
            <RowLabel text="Distance" C={C} />
            <Seg
              options={['km', 'mi']}
              active={distUnit === 'km' ? 0 : 1}
              onChange={i => setDistUnit(i === 0 ? 'km' : 'mi')}
              C={C}
            />
          </Row>
          <RowDivider C={C} />
          <Row C={C}>
            <RowLabel
              text="Pace"
              sub={`Auto: ${distUnit === 'km' ? 'min/km' : 'min/mi'} — follows distance`}
              C={C}
            />
            <RowValue text={distUnit === 'km' ? 'min/km' : 'min/mi'} C={C} />
          </Row>
          <RowDivider C={C} />
          <Row C={C}>
            <RowLabel text="Weight" C={C} />
            <Seg options={['kg', 'lb']} active={weightUnit} onChange={setWeightUnit} C={C} />
          </Row>
        </View>

        {/* ── NOTIFICATIONS ── */}
        <SectionHeader label="Notifications" C={C} />
        <View style={s.card}>
          <Row C={C}>
            <RowLabel text="Run Reminders" C={C} />
            <Toggle value={runReminders} onChange={setRunReminders} C={C} />
          </Row>
          <RowDivider C={C} />
          <Row C={C}>
            <RowLabel text="AI Messages" C={C} />
            <Toggle value={aiMessages} onChange={setAiMessages} C={C} />
          </Row>
          <RowDivider C={C} />
          <Row C={C}>
            <RowLabel text="Weekly Summary" C={C} />
            <Toggle value={weeklySummary} onChange={setWeeklySummary} C={C} />
          </Row>
        </View>

        {/* ── ABOUT ── */}
        <SectionHeader label="About" C={C} />
        <View style={s.card}>
          <Row C={C}>
            <RowLabel text="App Version" C={C} />
            <RowValue text="1.0.0" C={C} />
          </Row>
          <RowDivider C={C} />
          <NavRow label="Privacy Policy"  onPress={() => Linking.openURL('https://example.com/privacy')} C={C} />
          <RowDivider C={C} />
          <NavRow label="Terms of Service" onPress={() => Linking.openURL('https://example.com/terms')} C={C} />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    titleBar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      backgroundColor: C.bg,
    },
    title: { fontFamily: FontFamily.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: 0.3 },
    card: {
      backgroundColor: C.card,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
  });
}