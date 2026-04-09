// app/after-run.tsx
//
// After Run screen — scrollable, light scroll area / dark nav.
// No tab bar (Stack screen from run-tracker).
//
// Sections:
//   ① Leti chat bubble         — PB message as a regular Leti bubble
//   ② Stats table              — Actual vs Planned
//   ③ Editable run title
//   ④ Route map SVG
//   ⑤ Pace towers              — individual PaceTower component per km
//   ⑥ AI analysis card
//   ⑦ Goals progress           — dashed border card
//   ⑧ Ask Leti input bar

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Pencil, Check, Send } from 'lucide-react-native';
import Svg, {
  Defs, Pattern, Rect, Path, Polyline, Circle,
  Text as SvgText,
} from 'react-native-svg';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { fmtDist, fmtPace, distLabel, paceLabel } from '../constants/ThemeContext';
import { PaceChartTowers, PaceKm } from './_components/PaceChart';
import { LetiMark } from './_components/LetiLogo';

// ─────────────────────────────────────────────────────────────
// PACE DATA — 10 km run, plan pace 5:00/km
// ─────────────────────────────────────────────────────────────
// deviationPct: negative = faster than plan, positive = slower
// km6 at 3:55 = 22% faster than 5:00 plan → burnout state

const AFTER_RUN_KMS: PaceKm[] = [
  { pace: '4:58', deviationPct: -0.7  }, // km 1  on target
  { pace: '5:02', deviationPct: +0.7  }, // km 2  on target
  { pace: '4:55', deviationPct: -1.7  }, // km 3  on target
  { pace: '4:58', deviationPct: -0.7  }, // km 4  on target
  { pace: '5:04', deviationPct: +1.3  }, // km 5  on target
  { pace: '3:55', deviationPct: -21.7 }, // km 6  burnout — 22% faster
  { pace: '5:06', deviationPct: +2.0  }, // km 7  on target
  { pace: '5:02', deviationPct: +0.7  }, // km 8  on target
  { pace: '4:50', deviationPct: -3.3  }, // km 9  on target
  { pace: '4:48', deviationPct: -4.0  }, // km 10 on target
];

const AFTER_RUN_PLAN_PACE = '5:00/km';

// ─────────────────────────────────────────────────────────────
// ROUTE MAP SVG
// ─────────────────────────────────────────────────────────────

function RouteMap() {
  const { width: screenWidth } = useWindowDimensions();
  const W = screenWidth - 36 - 2;
  const H = 190;
  return (
    <Svg width={W} height={H} viewBox="0 0 357 190" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <Pattern id="mapgrid" width="28" height="28" patternUnits="userSpaceOnUse">
          <Path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(27,108,112,0.07)" strokeWidth="0.8" />
        </Pattern>
      </Defs>
      <Rect width="357" height="190" fill="#EAF0EE" />
      <Rect width="357" height="190" fill="url(#mapgrid)" />
      {[
        [2,4,60,46],[70,4,68,46],[146,4,58,46],[212,4,58,46],[278,4,76,46],
        [2,58,60,46],[70,58,68,46],[146,58,58,46],[212,58,58,46],[278,58,76,46],
        [2,112,60,74],[70,112,68,74],[146,112,58,74],[212,112,58,74],[278,112,76,74],
      ].map(([x,y,w,h], i) => (
        <Rect key={i} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.55)" rx="2" />
      ))}
      <Polyline points="32,162 32,58 104,58 104,4 174,4 174,58 242,58 242,112 174,112 104,112"
        fill="none" stroke="#1B6C70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="104,112 32,112 32,162"
        fill="none" stroke="#1B6C70" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="32" cy="162" r="9" fill="#F3F0E9" stroke="#1B6C70" strokeWidth="2" />
      <Circle cx="32" cy="162" r="3.5" fill="#1B6C70" />
      <Circle cx="32" cy="162" r="14" fill="none" stroke="#1B6C70" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
      <SvgText x="46" y="166" fill="#1B6C70" fontSize="9.5" fontWeight="600">Start</SvgText>
      <Rect x="267" y="160" width="84" height="22" rx="4" fill="rgba(10,26,27,0.72)" />
      <SvgText x="309" y="175" fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">10.02 km</SvgText>
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// LETI CHAT BUBBLE
//
// Rendered as a regular left-side chat message — same visual
// language as any Leti message in the AI screen's thread.
// Not a hero card or a callout — just Leti sending a message.
// ─────────────────────────────────────────────────────────────

function LetiChatBubble() {
  const { colors: C } = useTheme();
  const b = makeBubbleStyles(C);
  return (
    <View style={b.row}>
      <View style={b.avatar}>
        <LetiMark size={16} variant="white" />
      </View>
      <View style={b.bubble}>
        <Text style={b.badge}>PB Detected</Text>
        <Text style={b.headline}>That's your fastest 10K yet, Dimi.</Text>
        <Text style={b.body}>
          48:22 — 1 minute 38 seconds under your previous best. Your km 1–5 were textbook: steady, controlled, exactly on plan.
        </Text>
      </View>
    </View>
  );
}


// ─────────────────────────────────────────────────────────────
// GOALS CARD — animated progress bar on scroll into view
// ─────────────────────────────────────────────────────────────

function GoalsCard({ s, distUnit, C }: { s: any; distUnit: any; C: any }) {
  const prevPct = 58;  // what it was before this run
  const newPct  = 68;  // what it is now

  // Start from 0 so the fill-in is always visible regardless of scroll position
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Small delay so the card has rendered and the user can see the start state
    const timer = setTimeout(() => {
      Animated.timing(barAnim, {
        toValue: newPct,
        duration: 900,
        useNativeDriver: false,
      }).start();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.goalsCard}>
      <View style={{ marginBottom: 4 }}>
        <View style={s.goalTitleRow}>
          <Text style={s.goalTitle}>Run 100 km this month</Text>
          <Text style={s.goalPercent}>{newPct}%</Text>
        </View>
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: barWidth }]} />
        </View>
        <Text style={s.goalSubtext}>{fmtDist(68.0, distUnit)} {distLabel(distUnit)} of {fmtDist(100, distUnit)} {distLabel(distUnit)} · {fmtDist(32, distUnit)} {distLabel(distUnit)} remaining</Text>
      </View>
      <View style={s.goalAchievedCard}>
        <View style={s.goalAchievedBadge}>
          <Check size={14} color="#fff" />
        </View>
        <View>
          <Text style={s.goalAchievedTitle}>Sub-48 min 10K</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Check size={11} color={C.success} />
            <Text style={s.goalAchievedSub}>Goal achieved this run!</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// AFTER RUN SCREEN
// ─────────────────────────────────────────────────────────────

export default function AfterRunScreen() {
  const { colors: C, isDark, distUnit } = useTheme();
  const s = React.useMemo(() => makeStyles(C), [C]);
  const [runTitle, setRunTitle]         = useState('Morning Tempo Run');
  const [editingTitle, setEditingTitle] = useState(false);
  const [aiInput, setAiInput]           = useState('');

  const handleSaveRun = () => router.replace('/(tabs)');

  const handleDiscard = () => {
    Alert.alert(
      'Discard this run?',
      'Your run data will not be saved.',
      [
        { text: 'Keep Run', style: 'cancel' },
        { text: 'Discard',  style: 'destructive', onPress: () => router.replace('/(tabs)') },
      ]
    );
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    Alert.alert('Leti AI', `You asked: "${aiInput}"\n\nAI responses coming soon!`);
    setAiInput('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.dark }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── FIXED DARK HEADER ── */}
      <SafeAreaView style={s.header} edges={['top']}>
        <View style={s.navRow}>
          <View style={{ width: 90 }} />
          <Text style={s.navTitle}>After Run</Text>
          <TouchableOpacity style={s.saveBtn} onPress={handleSaveRun} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>Save Run</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Visual transition dark → light */}
      <View style={s.transition} />

      {/* ── KEYBOARD-AWARE SCROLL AREA ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: C.bg }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ① LETI CHAT BUBBLE */}
          <LetiChatBubble />

          {/* ② STATS TABLE */}
          <Text style={s.sectionLabel}>Run Statistics</Text>
          <View style={[s.card, s.statsCard]}>
            <View style={[s.statsRow, s.statsHeaderRow]}>
              <Text style={[s.statsCell, s.statsMetricCol, s.statsHeaderText]}>Metric</Text>
              <Text style={[s.statsCell, s.statsActualCol,  s.statsHeaderText, s.statsBorderLeft]}>Actual</Text>
              <Text style={[s.statsCell, s.statsPlannedCol, s.statsHeaderText, s.statsBorderLeft]}>Planned</Text>
            </View>
            <View style={[s.statsRow, s.statsBorderTop]}>
              <Text style={[s.statsCell, s.statsMetricCol, s.statsMetricLabel]}>Distance</Text>
              <View style={[s.statsValueCell, s.statsActualCol,  s.statsBorderLeft]}>
                <Text style={s.statsActualValue}>{fmtDist(10.02, distUnit)} {distLabel(distUnit)}</Text>
                <Text style={[s.statsDelta, s.statsDeltaGood]}>+0.02</Text>
              </View>
              <View style={[s.statsValueCell, s.statsPlannedCol, s.statsBorderLeft]}>
                <Text style={s.statsPlannedValue}>{fmtDist(10.0, distUnit)} {distLabel(distUnit)}</Text>
              </View>
            </View>
            <View style={[s.statsRow, s.statsBorderTop]}>
              <Text style={[s.statsCell, s.statsMetricCol, s.statsMetricLabel]}>Time</Text>
              <View style={[s.statsValueCell, s.statsActualCol,  s.statsBorderLeft]}>
                <Text style={s.statsActualValue}>48:22</Text>
                <Text style={[s.statsDelta, s.statsDeltaGood]}>−1:38</Text>
              </View>
              <View style={[s.statsValueCell, s.statsPlannedCol, s.statsBorderLeft]}>
                <Text style={s.statsPlannedValue}>50:00</Text>
              </View>
            </View>
            <View style={[s.statsRow, s.statsBorderTop]}>
              <Text style={[s.statsCell, s.statsMetricCol, s.statsMetricLabel]}>Avg Pace</Text>
              <View style={[s.statsValueCell, s.statsActualCol,  s.statsBorderLeft]}>
                <Text style={s.statsActualValue}>{fmtPace('4:50', distUnit)}{paceLabel(distUnit)}</Text>
                <Text style={[s.statsDelta, s.statsDeltaGood]}>Faster</Text>
              </View>
              <View style={[s.statsValueCell, s.statsPlannedCol, s.statsBorderLeft]}>
                <Text style={s.statsPlannedValue}>{fmtPace('5:00', distUnit)}{paceLabel(distUnit)}</Text>
              </View>
            </View>
          </View>

          {/* ③ RUN TITLE */}
          <Text style={s.sectionLabel}>Run Title</Text>
          <View style={[s.card, s.titleCard]}>
            <View style={{ flex: 1 }}>
              {editingTitle ? (
                <TextInput
                  style={s.titleInput}
                  value={runTitle}
                  onChangeText={setRunTitle}
                  onBlur={() => setEditingTitle(false)}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => setEditingTitle(false)}
                />
              ) : (
                <Text style={s.titleText}>{runTitle}</Text>
              )}
              <Text style={s.titleHint}>Auto-generated · tap to rename</Text>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => setEditingTitle(true)} activeOpacity={0.7}>
              <Pencil size={15} color="#4C6B6C" />
            </TouchableOpacity>
          </View>

          {/* ④ ROUTE MAP */}
          <Text style={s.sectionLabel}>Route</Text>
          <View style={[s.card, { overflow: 'hidden', padding: 0 }]}>
            <RouteMap />
          </View>

          {/* ⑤ PACE TOWERS */}
          <Text style={s.sectionLabel}>Pace by Kilometre</Text>
          <View style={[s.card, { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14 }]}>
            <PaceChartTowers kms={AFTER_RUN_KMS} plannedPace={AFTER_RUN_PLAN_PACE} />
          </View>

          {/* ⑥ AI ANALYSIS */}
          <Text style={s.sectionLabel}>AI Analysis</Text>
          <View style={[s.card, s.aiAnalysisCard]}>
            <View style={s.aiAnalysisHeader}>
              <View style={s.aiSmallAvatar}>
                <LetiMark size={14} variant="white" />
              </View>
              <Text style={s.aiAnalysisLabel}>Leti AI · Post-run analysis</Text>
            </View>
            <Text style={s.aiAnalysisText}>
              Strong overall effort — 7 of 10 km on target. Your pacing through km 1–5 and km 7–10 was disciplined and close to plan.
            </Text>
            <Text style={s.aiAnalysisDanger}>
              km 6 burnout risk: 3:55/km — 22% faster than your easy-zone target of 5:00/km. A spike this sharp mid-run often signals a brief lapse in effort control, possibly a downhill or early race excitement. Worth monitoring in future tempo runs.
            </Text>
          </View>

          {/* ⑦ GOALS PROGRESS */}
          <Text style={s.sectionLabel}>Goals Progress</Text>
          <GoalsCard s={s} distUnit={distUnit} C={C} />

          {/* ⑧ ASK LETI */}
          <Text style={[s.sectionLabel, { marginTop: 16 }]}>Ask Leti</Text>
          <View style={s.askRow}>
            <TextInput
              style={s.askInput}
              value={aiInput}
              onChangeText={setAiInput}
              placeholder="Ask Leti anything about this run..."
              placeholderTextColor="#C0BCBA"
              returnKeyType="send"
              onSubmitEditing={handleAiSend}
            />
            <TouchableOpacity style={s.sendBtn} onPress={handleAiSend} activeOpacity={0.85}>
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.bottomRow}>
            <TouchableOpacity style={s.discardBtn} onPress={handleDiscard} activeOpacity={0.7}>
              <Text style={s.discardBtnText}>Discard Run</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtnBottom} onPress={handleSaveRun} activeOpacity={0.85}>
              <Text style={s.saveBtnBottomText}>Save Run</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
  header:  { backgroundColor: C.dark },
  navRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,245,240,0.08)',
  },
  navTitle: { fontFamily: FontFamily.displayBold, fontSize: 18, color: '#F5F5F0', letterSpacing: 0.3 },
  saveBtn:  { height: 32, width: 90, backgroundColor: '#FFFFFF', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.dark, letterSpacing: 0.2 },

  transition:    { height: 16, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 18, paddingTop: 4 },

  sectionLabel: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 9.5,
    color: '#91AFAF',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },

  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: 'rgba(10,26,27,0.07)',
    borderRadius: 16,
    shadowColor: '#0A1A1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  statsCard:      { overflow: 'hidden', padding: 0 },
  statsRow:       { flexDirection: 'row' },
  statsHeaderRow: { backgroundColor: 'rgba(10,26,27,0.03)' },
  statsCell: { padding: 8, fontSize: 9.5, fontFamily: FontFamily.uiSemiBold, color: '#91AFAF', letterSpacing: 1, textTransform: 'uppercase' },
  statsValueCell: { paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsMetricCol:  { width: 110 },
  statsActualCol:  { flex: 1 },
  statsPlannedCol: { flex: 1 },
  statsHeaderText: { fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: '#91AFAF', letterSpacing: 1 },
  statsMetricLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: '#91AFAF', letterSpacing: 0.8, textTransform: 'uppercase', paddingVertical: 13, paddingHorizontal: 12 },
  statsBorderLeft: { borderLeftWidth: 1, borderLeftColor: 'rgba(10,26,27,0.07)' },
  statsBorderTop:  { borderTopWidth: 1,  borderTopColor:  'rgba(10,26,27,0.06)' },
  statsActualValue:  { fontFamily: FontFamily.displayBold, fontSize: 17, color: C.dark  },
  statsPlannedValue: { fontFamily: FontFamily.uiRegular,   fontSize: 15, color: '#91AFAF'    },
  statsDelta:        { fontFamily: FontFamily.uiSemiBold,  fontSize: 11                      },
  statsDeltaGood:    { color: C.success },

  titleCard:  { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleText: {
    fontFamily: FontFamily.displayBold, fontSize: 20, color: C.dark, letterSpacing: 0.2,
    borderBottomWidth: 2, borderBottomColor: 'rgba(10,26,27,0.25)', borderStyle: 'dashed', paddingBottom: 4,
  },
  titleInput: {
    fontFamily: FontFamily.displayBold, fontSize: 20, color: C.dark, letterSpacing: 0.2,
    borderBottomWidth: 2, borderBottomColor: C.primary, paddingBottom: 4,
  },
  titleHint: { fontFamily: FontFamily.uiRegular, fontSize: 11, color: '#91AFAF', marginTop: 5 },
  editBtn:   { width: 36, height: 36, borderWidth: 1.5, borderColor: 'rgba(10,26,27,0.12)', borderRadius: 9, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  aiAnalysisCard:   { padding: 14, backgroundColor: '#EAF3F3', borderColor: 'rgba(27,108,112,0.12)' },
  aiAnalysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  aiSmallAvatar:    { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiAnalysisLabel:  { fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.primary, letterSpacing: 1.2, textTransform: 'uppercase' },
  aiAnalysisText:   { fontFamily: FontFamily.uiRegular,  fontSize: 13.5, color: C.dark,    lineHeight: 22, marginBottom: 10 },
  aiAnalysisDanger: { fontFamily: FontFamily.uiMedium,   fontSize: 13.5, color: C.danger,  lineHeight: 22 },

  goalsCard: { borderWidth: 1.5, borderColor: 'rgba(27,108,112,0.25)', borderRadius: 16, padding: 14, backgroundColor: 'rgba(234,243,243,0.5)', gap: 12 },

  goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalTitle:    { fontFamily: FontFamily.uiMedium, fontSize: 13, color: C.dark    },
  goalPercent:  { fontFamily: FontFamily.uiBold,   fontSize: 13, color: C.primary },
  progressTrack:  { height: 6, backgroundColor: 'rgba(10,26,27,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  goalSubtext:    { fontFamily: FontFamily.uiRegular, fontSize: 11, color: '#4C6B6C', marginTop: 4 },
  goalAchievedCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAF3F3', borderWidth: 1, borderColor: 'rgba(27,108,112,0.15)', borderRadius: 10, padding: 11 },
  goalAchievedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  goalAchievedTitle: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.dark    },
  goalAchievedSub:   { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.success },

  askRow:   { flexDirection: 'row', gap: 10, alignItems: 'center' },
  askInput: {
    flex: 1, height: 50,
    backgroundColor: C.card,
    borderWidth: 1.5, borderColor: 'rgba(10,26,27,0.1)',
    borderRadius: 25,
    paddingHorizontal: 18,
    fontFamily: FontFamily.uiRegular, fontSize: 13.5, color: C.dark,
    shadowColor: '#0A1A1B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  sendBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 4,
    flexShrink: 0,
  },

  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 4, gap: 10 },
  discardBtn: { height: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212,71,10,0.25)', backgroundColor: 'rgba(212,71,10,0.06)', alignItems: 'center', justifyContent: 'center' },
  discardBtnText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.danger, letterSpacing: 0.2 },
  saveBtnBottom: { flex: 1, height: 52, backgroundColor: C.dark, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.button },
  saveBtnBottomText: { fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  });
}

// ─────────────────────────────────────────────────────────────
// LETI CHAT BUBBLE STYLES
// ─────────────────────────────────────────────────────────────

function makeBubbleStyles(C: ColorPalette) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 3,
  },
  avatarIcon: { fontSize: 13, color: '#fff' },
  bubble: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    borderTopLeftRadius: 4,   // chat bubble corner — message comes from left
    borderWidth: 1,
    borderColor: 'rgba(10,26,27,0.07)',
    padding: 13,
    gap: 4,
    shadowColor: '#0A1A1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  badge: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 9, color: C.primary,
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 3,
  },
  headline: {
    fontFamily: FontFamily.displayBold,
    fontSize: 19, color: C.dark,
    lineHeight: 23, letterSpacing: 0.2,
  },
  body: {
    fontFamily: FontFamily.uiRegular,
    fontSize: 13.5, color: C.textSecondary,
    lineHeight: 21, marginTop: 3,
  },
  });
}