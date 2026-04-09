// app/run-detail.tsx
//
// Run Detail — pushed from Profile → run history, or from After Run.
// No bottom tab bar (drill-down screen).
//
// Sections (top to bottom):
//   ① Run Statistics table      — Actual vs Planned
//   ② Run Title (editable)
//   ③ Route map SVG
//   ④ Pace towers               — individual PaceTower per km
//   ⑤ AI Analysis               — read-only, well below fold
//
// Note: The retrospective AI message that previously sat at the top
// has been removed. The screen starts directly with run statistics.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Share2, Pencil } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Rect, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { fmtDist, fmtPace, distLabel, paceLabel } from '../constants/ThemeContext';
import { PaceChartTowers, PaceKm } from './_components/PaceChart';
import { LetiMark } from './_components/LetiLogo';

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK_RUNS: Record<string, {
  name: string;
  label: string;
  distKm: number;
  plannedDistKm: number;
  distDelta: string;
  distDeltaPositive: boolean;
  timeActual: string;
  timePlanned: string;
  timeDelta: string;
  timeDeltaPositive: boolean;
  avgPace: string;       // stored as min/km string e.g. '5:32'
  plannedPace: string;   // stored as min/km string e.g. '5:45'
  paceDelta: string;
  paceDeltaPositive: boolean;
  paceKms: PaceKm[];
  analysis: string[];
}> = {
  '1': {
    name: 'Morning Tempo Run', label: 'Tue 3 Jun · Tempo',
    distKm: 8.2, plannedDistKm: 8.0, distDelta: '+0.2', distDeltaPositive: true,
    timeActual: '45:16', timePlanned: '46:00', timeDelta: '−0:44', timeDeltaPositive: true,
    avgPace: '5:32', plannedPace: '5:45', paceDelta: '−0:13', paceDeltaPositive: true,
    paceKms: [
      { pace: '6:10', deviationPct: +7.2  },
      { pace: '5:55', deviationPct: +2.9  },
      { pace: '5:48', deviationPct: +0.9  },
      { pace: '5:42', deviationPct: -0.9  },
      { pace: '5:38', deviationPct: -2.0  },
      { pace: '5:52', deviationPct: +2.0  },
      { pace: '6:08', deviationPct: +6.7  },
      { pace: '5:04', deviationPct: -11.9 },
    ],
    analysis: [
      "Solid effort overall — your middle kilometres (2–6) held close to the plan, showing good pacing discipline through the core of the run.",
      "Km 1 and 7 were both slightly slower than target at 6:10 and 6:08. This is a normal pattern at run start and during any gentle elevation — not a concern.",
      "Km 8 at 5:04 is a flag. You ran the final kilometre 12% faster than plan. For a Zone 2 run this risks undermining the aerobic adaptation you were building. Worth watching on future easy runs.",
    ],
  },
  '2': {
    name: 'Saturday Long Run', label: 'Sat 31 May · Long',
    distKm: 14.1, plannedDistKm: 14.0, distDelta: '+0.1', distDeltaPositive: true,
    timeActual: '1:18:44', timePlanned: '1:20:00', timeDelta: '−1:16', timeDeltaPositive: true,
    avgPace: '5:35', plannedPace: '5:45', paceDelta: '−0:10', paceDeltaPositive: true,
    paceKms: [
      { pace: '5:50', deviationPct: +0.9 },
      { pace: '5:42', deviationPct: -0.5 },
      { pace: '5:38', deviationPct: -1.2 },
      { pace: '5:35', deviationPct: -1.7 },
      { pace: '5:33', deviationPct: -2.1 },
      { pace: '5:37', deviationPct: -1.4 },
      { pace: '5:40', deviationPct: -0.9 },
      { pace: '5:39', deviationPct: -1.0 },
      { pace: '5:44', deviationPct: -0.2 },
      { pace: '5:52', deviationPct: +1.2 },
    ],
    analysis: [
      "Excellent long run — consistent pacing throughout with a very minor fade at the end, which is completely normal over 14 km.",
      "Your aerobic base is clearly responding to training. The even split in the first 8 km shows growing pacing maturity.",
      "The slight slow-down in km 10 is nothing to worry about — it reflects proper effort distribution on long efforts.",
    ],
  },
  '3': {
    name: 'Evening Recovery Run', label: 'Thu 29 May · Easy',
    distKm: 5.8, plannedDistKm: 6.0, distDelta: '−0.2', distDeltaPositive: false,
    timeActual: '34:12', timePlanned: '35:30', timeDelta: '−1:18', timeDeltaPositive: true,
    avgPace: '5:54', plannedPace: '5:55', paceDelta: '−0:01', paceDeltaPositive: true,
    paceKms: [
      { pace: '6:02', deviationPct: +1.9 },
      { pace: '5:58', deviationPct: +0.8 },
      { pace: '5:54', deviationPct: -0.2 },
      { pace: '5:51', deviationPct: -0.7 },
      { pace: '5:49', deviationPct: -1.1 },
    ],
    analysis: [
      "Textbook recovery run — every kilometre was within 2% of your easy pace target. This is exactly what recovery days should look like.",
      "Slightly short on distance at 5.8 vs 6 km, but the effort and pace quality more than compensate for the minor shortfall.",
      "Your body is recovering efficiently between sessions. Keep following the easy day cadence.",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// ROUTE MAP
// ─────────────────────────────────────────────────────────────

function RouteMap({ distKm, C }: { distKm: string; C: ColorPalette }) {
  return (
    <View style={{ height: 190, backgroundColor: '#EAF0EE', borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...Shadow.cardSubtle }}>
      <Svg width="100%" height="100%" viewBox="0 0 357 190">
        <Rect width={357} height={190} fill="#EAF0EE" />
        {[
          [2,4,62,46],[72,4,70,46],[150,4,58,46],[216,4,60,46],[284,4,70,46],
          [2,58,62,46],[72,58,70,46],[150,58,58,46],[216,58,60,46],[284,58,70,46],
          [2,112,62,74],[72,112,70,74],[150,112,58,74],[216,112,60,74],[284,112,70,74],
        ].map(([x,y,w,h], i) => (
          <Rect key={i} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.55)" rx={2} />
        ))}
        <Polyline
          points="36,160 36,58 107,58 107,4 186,4 186,58 246,58 246,112 186,112 107,112"
          fill="none" stroke={C.primary} strokeWidth={3.5}
          strokeLinecap="round" strokeLinejoin="round"
        />
        <Circle cx={36}  cy={160} r={9}   fill="#F3F0E9" stroke={C.primary} strokeWidth={2} />
        <Circle cx={36}  cy={160} r={3.5} fill={C.primary} />
        <SvgText x={50}  y={164} fill={C.primary} fontSize={9.5} fontFamily="Figtree_600SemiBold">Start</SvgText>
        <Circle cx={107} cy={112} r={9}   fill={C.dark} />
        <Circle cx={107} cy={112} r={3.5} fill="#F3F0E9" />
        <SvgText x={121} y={116} fill={C.dark} fontSize={9.5} fontFamily="Figtree_600SemiBold">Finish</SvgText>
        <Rect x={270} y={160} width={78} height={22} rx={4} fill="rgba(10,26,27,0.70)" />
        <SvgText x={309} y={175} fill="#fff" fontSize={10} fontFamily="Figtree_600SemiBold" textAnchor="middle">{distKm}</SvgText>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────

function SecLabel({ text, rd }: { text: string; rd: ReturnType<typeof makeStyles> }) {
  return <Text style={rd.secLabel}>{text}</Text>;
}

// ─────────────────────────────────────────────────────────────
// RUN DETAIL SCREEN
// ─────────────────────────────────────────────────────────────

export default function RunDetailScreen() {
  const { colors: C, isDark, distUnit } = useTheme();
  const rd = React.useMemo(() => makeStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const run = MOCK_RUNS[id ?? '1'] ?? MOCK_RUNS['1'];

  const [title, setTitle]               = useState(run.name);
  const [editingTitle, setEditingTitle] = useState(false);

  const handleShare = () => {
    Share.share({
      message: `${title} — ${fmtDist(run.distKm, distUnit)} ${distLabel(distUnit)} in ${run.timeActual} at ${fmtPace(run.avgPace, distUnit)}${paceLabel(distUnit)}`,
    });
  };

  return (
    <SafeAreaView style={rd.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top nav */}
      <View style={rd.topNav}>
        <TouchableOpacity style={rd.navBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={C.dark} />
        </TouchableOpacity>
        <Text style={rd.navTitle}>Run Detail</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={rd.navBtn} onPress={handleShare} activeOpacity={0.7}>
            <Share2 size={15} color="#4C6B6C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={rd.navBtn}
            onPress={() => Alert.alert('Options', 'Delete run', [
              { text: 'Cancel',  style: 'cancel'      },
              { text: 'Delete',  style: 'destructive', onPress: () => router.back() },
            ])}
            activeOpacity={0.7}
          >
            <Text style={rd.ellipsis}>···</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content — starts directly with statistics */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={rd.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ① RUN STATISTICS */}
        <View>
          <SecLabel text="Run Statistics" rd={rd} />
          <View style={rd.statsCard}>
            <View style={rd.statsHeaderRow}>
              {['Metric', 'Actual', 'Planned'].map((h, i) => (
                <Text key={h} style={[rd.statsHeader, i > 0 && rd.statsBorderL, i === 0 && { flex: 1.4 }]}>
                  {h}
                </Text>
              ))}
            </View>
            {/* Distance row */}
            <View style={[rd.statsRow, rd.statsRowBorder]}>
              <Text style={[rd.statsMetric, { flex: 1.4 }]}>Distance</Text>
              <View style={[rd.statsCell, rd.statsBorderL]}>
                <Text style={rd.statsActual}>{fmtDist(run.distKm, distUnit)} {distLabel(distUnit)}</Text>
                <Text style={[rd.statsDelta, { color: run.distDeltaPositive ? C.success : C.danger }]}>{run.distDelta}</Text>
              </View>
              <View style={[rd.statsCell, rd.statsBorderL]}>
                <Text style={rd.statsPlanned}>{fmtDist(run.plannedDistKm, distUnit)} {distLabel(distUnit)}</Text>
              </View>
            </View>

            {/* Time row */}
            <View style={[rd.statsRow, rd.statsRowBorder]}>
              <Text style={[rd.statsMetric, { flex: 1.4 }]}>Time</Text>
              <View style={[rd.statsCell, rd.statsBorderL]}>
                <Text style={rd.statsActual}>{run.timeActual}</Text>
                <Text style={[rd.statsDelta, { color: run.timeDeltaPositive ? C.success : C.danger }]}>{run.timeDelta}</Text>
              </View>
              <View style={[rd.statsCell, rd.statsBorderL]}>
                <Text style={rd.statsPlanned}>{run.timePlanned}</Text>
              </View>
            </View>

            {/* Avg Pace row */}
            <View style={rd.statsRow}>
              <Text style={[rd.statsMetric, { flex: 1.4 }]}>Avg Pace</Text>
              <View style={[rd.statsCell, rd.statsBorderL]}>
                <Text style={rd.statsActual}>{fmtPace(run.avgPace, distUnit)}{paceLabel(distUnit)}</Text>
                <Text style={[rd.statsDelta, { color: run.paceDeltaPositive ? C.success : C.danger }]}>{run.paceDelta}</Text>
              </View>
              <View style={[rd.statsCell, rd.statsBorderL]}>
                <Text style={rd.statsPlanned}>{fmtPace(run.plannedPace, distUnit)}{paceLabel(distUnit)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ② RUN TITLE */}
        <View>
          <SecLabel text="Run Title" rd={rd} />
          <View style={rd.titleCard}>
            <View style={{ flex: 1 }}>
              {editingTitle ? (
                <TextInput
                  style={rd.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setEditingTitle(false)}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => setEditingTitle(false)}
                />
              ) : (
                <Text style={rd.titleText}>{title}</Text>
              )}
            </View>
            <TouchableOpacity
              style={rd.editTitleBtn}
              onPress={() => setEditingTitle(!editingTitle)}
              activeOpacity={0.7}
            >
              <Pencil size={15} color="#4C6B6C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ③ ROUTE MAP */}
        <View>
          <SecLabel text="Route" rd={rd} />
          <View style={rd.card}>
            <RouteMap distKm={`${fmtDist(run.distKm, distUnit)} ${distLabel(distUnit)}`} C={C} />
          </View>
        </View>

        {/* ④ PACE TOWERS */}
        <View>
          <SecLabel text="Pace by Kilometre" rd={rd} />
          <View style={[rd.card, { padding: 14 }]}>
            <PaceChartTowers kms={run.paceKms} plannedPace={run.plannedPace} />
          </View>
        </View>

        {/* ⑤ AI ANALYSIS */}
        <View style={{ marginBottom: Spacing.xxl }}>
          <SecLabel text="AI Analysis" rd={rd} />
          <View style={rd.aiAnalysisCard}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={rd.aiAvatar}>
                <LetiMark size={14} variant="white" />
              </View>
              <Text style={rd.aiCardLabel}>Leti AI · Post-run analysis</Text>
            </View>
            {run.analysis.map((para, i) => (
              <Text key={i} style={[rd.analysisText, i < run.analysis.length - 1 && { marginBottom: 10 }]}>
                {para}
              </Text>
            ))}
          </View>
        </View>

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

  topNav: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  navBtn: {
    width: 36, height: 36,
    borderRadius: 9,
    borderWidth: 1.5, borderColor: 'rgba(10,26,27,0.12)',
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.cardSubtle,
  },
  navTitle: { fontFamily: FontFamily.displayBold, fontSize: 17, color: C.dark, letterSpacing: 0.3 },
  ellipsis: { fontSize: 16, color: '#4C6B6C', letterSpacing: -1 },

  content: { padding: 18, gap: 16, paddingBottom: 40 },
  secLabel: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 9.5,
    color: C.textMuted,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...Shadow.cardSubtle,
  },

  // Stats table
  statsCard: {
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...Shadow.cardSubtle,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,26,27,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,26,27,0.07)',
  },
  statsHeader: {
    flex: 1, padding: 8,
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 9.5, color: C.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  statsRow:       { flexDirection: 'row' },
  statsRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(10,26,27,0.06)' },
  statsMetric: {
    flex: 1, padding: 13,
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 11, color: C.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  statsCell:    { flex: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsBorderL: { borderLeftWidth: 1, borderLeftColor: 'rgba(10,26,27,0.06)' },
  statsActual:  { fontFamily: FontFamily.displayBold, fontSize: 17, color: C.dark     },
  statsDelta:   { fontFamily: FontFamily.uiSemiBold,  fontSize: 11                         },
  statsPlanned: { fontFamily: FontFamily.uiRegular,   fontSize: 15, color: C.textMuted },

  // Run title
  titleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: C.border,
    padding: 14,
    ...Shadow.cardSubtle,
  },
  titleText: {
    fontFamily: FontFamily.displayBold, fontSize: 20,
    color: C.dark, letterSpacing: 0.2,
    borderBottomWidth: 2, borderBottomColor: 'rgba(10,26,27,0.22)',
    borderStyle: 'dashed', paddingBottom: 4,
  },
  titleInput: {
    fontFamily: FontFamily.displayBold, fontSize: 20,
    color: C.dark,
    borderBottomWidth: 2, borderBottomColor: C.primary, paddingBottom: 4,
  },
  editTitleBtn: {
    width: 36, height: 36, borderRadius: 9,
    borderWidth: 1.5, borderColor: 'rgba(10,26,27,0.12)',
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // AI analysis
  aiAnalysisCard: {
    backgroundColor: C.primaryFaint,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(27,108,112,0.12)',
    padding: 14,
    ...Shadow.cardSubtle,
  },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  aiCardLabel: {
    fontFamily: FontFamily.uiSemiBold, fontSize: 9.5,
    color: C.primary, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
    marginTop: 3,
  },
  analysisText: { fontFamily: FontFamily.uiRegular, fontSize: 13.5, color: C.dark, lineHeight: 22 },
  });
}