// app/(tabs)/settings.tsx
// Settings screen — scrollable list with live toggles and segmented controls.
// Theme toggle is wired to ThemeContext — changes all screens immediately.

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Linking, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, Clock } from 'lucide-react-native';
import { FontFamily, Spacing, Radius, type ColorPalette } from '../../constants/theme';
import { useTheme, type ThemeMode, type DistUnit } from '../../constants/ThemeContext';
import { useTabBarInset } from '../../hooks/useTabBarInset';

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
// TIME PICKER MODAL
// ─────────────────────────────────────────────────────────────

function pad(n: number) { return n.toString().padStart(2, '0'); }

function TimePickerModal({
  visible, hour, minute, ampm, onConfirm, onDismiss, C,
}: {
  visible: boolean;
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  onConfirm: (h: number, m: number, ap: 'AM' | 'PM') => void;
  onDismiss: () => void;
  C: ColorPalette;
}) {
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);
  const [ap, setAp] = useState<'AM' | 'PM'>(ampm);

  // keep local state in sync when modal re-opens
  React.useEffect(() => {
    if (visible) { setH(hour); setM(minute); setAp(ampm); }
  }, [visible]);

  function stepHour(dir: 1 | -1) {
    setH(prev => { const next = prev + dir; return next < 1 ? 12 : next > 12 ? 1 : next; });
  }
  function stepMinute(dir: 1 | -1) {
    setM(prev => { const next = prev + dir; return next < 0 ? 59 : next > 59 ? 0 : next; });
  }

  const s = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 12,
      paddingBottom: 34,
      paddingHorizontal: Spacing.xl,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: C.border, alignSelf: 'center', marginBottom: 20,
    },
    sheetTitle: {
      fontFamily: FontFamily.uiSemiBold, fontSize: 13,
      color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase',
      textAlign: 'center', marginBottom: 24,
    },
    pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    column: { alignItems: 'center', gap: 6 },
    digitBox: {
      width: 72, height: 56, borderRadius: Radius.sm,
      backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    digitText: { fontFamily: FontFamily.displayBold, fontSize: 30, color: C.textPrimary },
    arrow: {
      width: 72, height: 36, borderRadius: Radius.sm,
      alignItems: 'center', justifyContent: 'center',
    },
    arrowText: { fontFamily: FontFamily.uiMedium, fontSize: 20, color: C.primary },
    colon: { fontFamily: FontFamily.displayBold, fontSize: 30, color: C.textMuted, marginBottom: 2 },
    ampmCol: { alignItems: 'center', gap: 4, marginLeft: 8 },
    ampmBtn: {
      width: 52, height: 40, borderRadius: Radius.sm, borderWidth: 1.5,
      borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    },
    ampmBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
    ampmText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textSecondary },
    ampmTextActive: { color: '#fff' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
    btn: {
      flex: 1, height: 50, borderRadius: Radius.sm,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: C.border,
    },
    btnPrimary: { backgroundColor: C.primary, borderColor: C.primary },
    btnText: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: C.textSecondary },
    btnTextPrimary: { color: '#fff' },
  }), [C]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Reminder Time</Text>

            <View style={s.pickerRow}>
              {/* Hours */}
              <View style={s.column}>
                <TouchableOpacity style={s.arrow} onPress={() => stepHour(1)} activeOpacity={0.7}>
                  <Text style={s.arrowText}>▲</Text>
                </TouchableOpacity>
                <View style={s.digitBox}>
                  <Text style={s.digitText}>{pad(h)}</Text>
                </View>
                <TouchableOpacity style={s.arrow} onPress={() => stepHour(-1)} activeOpacity={0.7}>
                  <Text style={s.arrowText}>▼</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.colon}>:</Text>

              {/* Minutes */}
              <View style={s.column}>
                <TouchableOpacity style={s.arrow} onPress={() => stepMinute(1)} activeOpacity={0.7}>
                  <Text style={s.arrowText}>▲</Text>
                </TouchableOpacity>
                <View style={s.digitBox}>
                  <Text style={s.digitText}>{pad(m)}</Text>
                </View>
                <TouchableOpacity style={s.arrow} onPress={() => stepMinute(-1)} activeOpacity={0.7}>
                  <Text style={s.arrowText}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* AM / PM */}
              <View style={s.ampmCol}>
                {(['AM', 'PM'] as const).map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[s.ampmBtn, ap === val && s.ampmBtnActive]}
                    onPress={() => setAp(val)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.ampmText, ap === val && s.ampmTextActive]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.btn} onPress={onDismiss} activeOpacity={0.7}>
                <Text style={s.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={() => onConfirm(h, m, ap)} activeOpacity={0.7}>
                <Text style={[s.btnText, s.btnTextPrimary]}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
  const [audioHints,    setAudioHints]    = useState(true);
  const [metronome,     setMetronome]     = useState(false);
  const [volume,        setVolume]        = useState(1); // 0=Low 1=Med 2=High

  // Units
  const [weightUnit,    setWeightUnit]    = useState(0); // 0=kg 1=lb

  // Notifications
  const [runReminders,  setRunReminders]  = useState(true);
  const [aiMessages,    setAiMessages]    = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  // Run reminder time
  const [reminderHour,   setReminderHour]   = useState(7);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [reminderAmPm,   setReminderAmPm]   = useState<'AM' | 'PM'>('AM');
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const reminderTimeLabel = `${pad(reminderHour)}:${pad(reminderMinute)} ${reminderAmPm}`;

  const s = useMemo(() => makeStyles(C), [C]);
  const tabBarInset = useTabBarInset();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.titleBar}>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        showsVerticalScrollIndicator={false}
      >

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
            <RowLabel text="Audio Cues" sub="Little audio cues to help you stay on track" C={C} />
            <Toggle value={audioHints} onChange={setAudioHints} C={C} />
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

          {/* Reminder time row — only shown while reminders are on */}
          {runReminders && (
            <>
              <RowDivider C={C} />
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, minHeight: 54, gap: 14, backgroundColor: C.card }}
                onPress={() => setTimePickerOpen(true)}
                activeOpacity={0.7}
              >
                <Clock size={16} color={C.textMuted} />
                <RowLabel text="Reminder Time" sub="Tap to change" C={C} />
                <Text style={{ fontFamily: FontFamily.uiMedium, fontSize: 14, color: C.primary }}>
                  {reminderTimeLabel}
                </Text>
                <ChevronRight size={14} color={C.textTertiary} />
              </TouchableOpacity>
            </>
          )}

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

      {/* ── TIME PICKER MODAL ── */}
      <TimePickerModal
        visible={timePickerOpen}
        hour={reminderHour}
        minute={reminderMinute}
        ampm={reminderAmPm}
        onConfirm={(h, m, ap) => {
          setReminderHour(h);
          setReminderMinute(m);
          setReminderAmPm(ap);
          setTimePickerOpen(false);
        }}
        onDismiss={() => setTimePickerOpen(false)}
        C={C}
      />
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