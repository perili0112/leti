// app/full-plan.tsx
//
// Full Plan View — S08
// Entered via "See the whole plan →" on PlanScreen (both hobby + race variants).
// Shows all weeks grouped by phase, with sticky header + progress strip.
// Auto-scrolls to current week on mount.
//
// Navigation params:
//   planType    → 'hobby' | 'race'
//   currentWeek → number (e.g. '3' or '5')

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { type ColorPalette, FontFamily, Spacing, Radius, Shadow } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';

// ─────────────────────────────────────────────────────────────
// TYPES  (mirrored from plan.tsx — not exported there)
// ─────────────────────────────────────────────────────────────

type RunType = 'easy' | 'tempo' | 'long' | 'interval' | 'race' | 'rest';

type RunBlock = {
  type: RunType;
  km: string;
  done?: boolean;
  today?: boolean;
  dim?: boolean;
  dimOpacity?: number; // 0–1, progressive fade for future weeks
};

type FullWeekRow = {
  label: string;                          // 'Wk 1', 'Wk 2', …
  badge?: 'done' | 'now';
  subLabel?: 'Recovery' | 'Taper';       // shown under week number
  days: (RunBlock | null)[];             // 7 slots Mon–Sun
  totalKm: string;
  phase: 1 | 2 | 3 | 4;
};

// ─────────────────────────────────────────────────────────────
// PHASE METADATA
// ─────────────────────────────────────────────────────────────

const PHASES: Record<number, { label: string; wkRange: string }> = {
  1: { label: 'Phase 1 · Base Building', wkRange: 'Wk 1–4' },
  2: { label: 'Phase 2 · Build',         wkRange: 'Wk 5–8' },
  3: { label: 'Phase 3 · Peak',          wkRange: 'Wk 9–10' },
  4: { label: 'Phase 4 · Taper',         wkRange: 'Wk 11–12' },
};

// ─────────────────────────────────────────────────────────────
// FULL PLAN DATA — 12-week hobby plan
// ─────────────────────────────────────────────────────────────
// Note: dim opacity gets progressively lighter the further out from current week.
// Completed weeks use done:true. Current week uses today:true on the active day.

const HOBBY_FULL: FullWeekRow[] = [
  // ── Phase 1: Base Building ──────────────────────────────────
  {
    label: 'Wk 1', badge: 'done', phase: 1,
    days: [
      { type: 'easy',     km: '6km',  done: true },
      null,
      { type: 'tempo',    km: '5km',  done: true },
      null,
      { type: 'easy',     km: '5km',  done: true },
      { type: 'long',     km: '10km', done: true },
      null,
    ],
    totalKm: '26km',
  },
  {
    label: 'Wk 2', badge: 'done', phase: 1,
    days: [
      { type: 'easy',     km: '6km',  done: true },
      null,
      { type: 'interval', km: '5km',  done: true },
      null,
      { type: 'easy',     km: '6km',  done: true },
      { type: 'long',     km: '12km', done: true },
      null,
    ],
    totalKm: '29km',
  },
  {
    label: 'Wk 3', badge: 'now', phase: 1,
    days: [
      { type: 'easy',     km: '7km',  done: true },
      null,
      { type: 'tempo',    km: '6km',  today: true },
      null,
      { type: 'easy',     km: '7km',  dim: true, dimOpacity: 0.45 },
      { type: 'long',     km: '14km', dim: true, dimOpacity: 0.45 },
      null,
    ],
    totalKm: '34km',
  },
  {
    label: 'Wk 4', phase: 1,
    days: [
      { type: 'easy',     km: '7km',  dim: true, dimOpacity: 0.35 },
      null,
      { type: 'interval', km: '7km',  dim: true, dimOpacity: 0.35 },
      null,
      { type: 'easy',     km: '7km',  dim: true, dimOpacity: 0.35 },
      { type: 'long',     km: '16km', dim: true, dimOpacity: 0.35 },
      null,
    ],
    totalKm: '37km',
  },

  // ── Phase 2: Build ───────────────────────────────────────────
  {
    label: 'Wk 5', phase: 2,
    days: [
      { type: 'easy',     km: '8km',  dim: true, dimOpacity: 0.3 },
      null,
      { type: 'tempo',    km: '7km',  dim: true, dimOpacity: 0.3 },
      null,
      { type: 'easy',     km: '8km',  dim: true, dimOpacity: 0.3 },
      { type: 'long',     km: '18km', dim: true, dimOpacity: 0.3 },
      null,
    ],
    totalKm: '41km',
  },
  {
    label: 'Wk 6', phase: 2,
    days: [
      { type: 'easy',     km: '8km',  dim: true, dimOpacity: 0.3 },
      null,
      { type: 'interval', km: '7km',  dim: true, dimOpacity: 0.3 },
      null,
      { type: 'easy',     km: '8km',  dim: true, dimOpacity: 0.3 },
      { type: 'long',     km: '20km', dim: true, dimOpacity: 0.3 },
      null,
    ],
    totalKm: '43km',
  },
  {
    label: 'Wk 7', phase: 2,
    days: [
      { type: 'easy',     km: '9km',  dim: true, dimOpacity: 0.3 },
      null,
      { type: 'tempo',    km: '8km',  dim: true, dimOpacity: 0.3 },
      null,
      { type: 'easy',     km: '9km',  dim: true, dimOpacity: 0.3 },
      { type: 'long',     km: '22km', dim: true, dimOpacity: 0.3 },
      null,
    ],
    totalKm: '48km',
  },
  {
    label: 'Wk 8', phase: 2, subLabel: 'Recovery',
    days: [
      { type: 'easy',     km: '6km',  dim: true, dimOpacity: 0.3 },
      null,
      { type: 'easy',     km: '5km',  dim: true, dimOpacity: 0.3 },
      null,
      null,
      { type: 'long',     km: '14km', dim: true, dimOpacity: 0.3 },
      null,
    ],
    totalKm: '25km',
  },

  // ── Phase 3: Peak ────────────────────────────────────────────
  {
    label: 'Wk 9', phase: 3,
    days: [
      { type: 'easy',     km: '9km',  dim: true, dimOpacity: 0.25 },
      null,
      { type: 'interval', km: '9km',  dim: true, dimOpacity: 0.25 },
      null,
      { type: 'tempo',    km: '9km',  dim: true, dimOpacity: 0.25 },
      { type: 'long',     km: '24km', dim: true, dimOpacity: 0.25 },
      null,
    ],
    totalKm: '51km',
  },
  {
    label: 'Wk 10', phase: 3,
    days: [
      { type: 'easy',     km: '9km',  dim: true, dimOpacity: 0.25 },
      null,
      { type: 'interval', km: '9km',  dim: true, dimOpacity: 0.25 },
      null,
      { type: 'tempo',    km: '9km',  dim: true, dimOpacity: 0.25 },
      { type: 'long',     km: '26km', dim: true, dimOpacity: 0.25 },
      null,
    ],
    totalKm: '53km',
  },

  // ── Phase 4: Taper ───────────────────────────────────────────
  {
    label: 'Wk 11', phase: 4, subLabel: 'Taper',
    days: [
      { type: 'easy',     km: '7km',  dim: true, dimOpacity: 0.2 },
      null,
      { type: 'tempo',    km: '6km',  dim: true, dimOpacity: 0.2 },
      null,
      null,
      { type: 'long',     km: '16km', dim: true, dimOpacity: 0.2 },
      null,
    ],
    totalKm: '29km',
  },
  {
    label: 'Wk 12', phase: 4, subLabel: 'Taper',
    days: [
      { type: 'easy',     km: '5km',  dim: true, dimOpacity: 0.2 },
      null,
      { type: 'easy',     km: '4km',  dim: true, dimOpacity: 0.2 },
      null,
      null,
      null,
      { type: 'race',     km: 'Day',  dim: true, dimOpacity: 0.2 },
    ],
    totalKm: '9km',
  },
];

// Race plan: 12 weeks (condensed from 16 for display parity, same phase structure)
const RACE_FULL: FullWeekRow[] = [
  { label: 'Wk 1', badge: 'done', phase: 1,
    days: [{ type: 'easy', km: '7km', done: true }, null, { type: 'tempo', km: '6km', done: true }, null, { type: 'easy', km: '7km', done: true }, { type: 'long', km: '14km', done: true }, null],
    totalKm: '34km' },
  { label: 'Wk 2', badge: 'done', phase: 1,
    days: [{ type: 'easy', km: '8km', done: true }, null, { type: 'interval', km: '6km', done: true }, null, { type: 'easy', km: '8km', done: true }, { type: 'long', km: '16km', done: true }, null],
    totalKm: '38km' },
  { label: 'Wk 3', badge: 'done', phase: 1,
    days: [{ type: 'easy', km: '8km', done: true }, null, { type: 'tempo', km: '7km', done: true }, null, { type: 'easy', km: '8km', done: true }, { type: 'long', km: '18km', done: true }, null],
    totalKm: '41km' },
  { label: 'Wk 4', badge: 'done', phase: 1,
    days: [{ type: 'easy', km: '8km', done: true }, null, { type: 'interval', km: '6km', done: true }, null, { type: 'easy', km: '8km', done: true }, { type: 'long', km: '20km', done: true }, null],
    totalKm: '42km' },

  { label: 'Wk 5', badge: 'now', phase: 2,
    days: [{ type: 'easy', km: '9km', done: true }, null, { type: 'tempo', km: '8km', today: true }, null, { type: 'easy', km: '9km', dim: true, dimOpacity: 0.45 }, { type: 'long', km: '21km', dim: true, dimOpacity: 0.45 }, null],
    totalKm: '47km' },
  { label: 'Wk 6', phase: 2,
    days: [{ type: 'easy', km: '9km', dim: true, dimOpacity: 0.35 }, null, { type: 'interval', km: '7km', dim: true, dimOpacity: 0.35 }, null, { type: 'easy', km: '9km', dim: true, dimOpacity: 0.35 }, { type: 'long', km: '22km', dim: true, dimOpacity: 0.35 }, null],
    totalKm: '47km' },
  { label: 'Wk 7', phase: 2,
    days: [{ type: 'easy', km: '9km', dim: true, dimOpacity: 0.3 }, null, { type: 'tempo', km: '8km', dim: true, dimOpacity: 0.3 }, null, { type: 'easy', km: '9km', dim: true, dimOpacity: 0.3 }, { type: 'long', km: '24km', dim: true, dimOpacity: 0.3 }, null],
    totalKm: '50km' },
  { label: 'Wk 8', phase: 2, subLabel: 'Recovery',
    days: [{ type: 'easy', km: '6km', dim: true, dimOpacity: 0.3 }, null, { type: 'easy', km: '5km', dim: true, dimOpacity: 0.3 }, null, null, { type: 'long', km: '14km', dim: true, dimOpacity: 0.3 }, null],
    totalKm: '25km' },

  { label: 'Wk 9', phase: 3,
    days: [{ type: 'easy', km: '9km', dim: true, dimOpacity: 0.25 }, null, { type: 'interval', km: '9km', dim: true, dimOpacity: 0.25 }, null, { type: 'tempo', km: '9km', dim: true, dimOpacity: 0.25 }, { type: 'long', km: '26km', dim: true, dimOpacity: 0.25 }, null],
    totalKm: '53km' },
  { label: 'Wk 10', phase: 3,
    days: [{ type: 'easy', km: '9km', dim: true, dimOpacity: 0.25 }, null, { type: 'interval', km: '9km', dim: true, dimOpacity: 0.25 }, null, { type: 'tempo', km: '9km', dim: true, dimOpacity: 0.25 }, { type: 'long', km: '28km', dim: true, dimOpacity: 0.25 }, null],
    totalKm: '55km' },

  { label: 'Wk 11', phase: 4, subLabel: 'Taper',
    days: [{ type: 'easy', km: '7km', dim: true, dimOpacity: 0.2 }, null, { type: 'tempo', km: '6km', dim: true, dimOpacity: 0.2 }, null, null, { type: 'long', km: '14km', dim: true, dimOpacity: 0.2 }, null],
    totalKm: '27km' },
  { label: 'Wk 12', phase: 4, subLabel: 'Taper',
    days: [{ type: 'easy', km: '5km', dim: true, dimOpacity: 0.2 }, null, { type: 'easy', km: '4km', dim: true, dimOpacity: 0.2 }, null, null, null, { type: 'race', km: 'Day', dim: true, dimOpacity: 0.2 }],
    totalKm: '9km' },
];

// ─────────────────────────────────────────────────────────────
// PLAN META per type
// ─────────────────────────────────────────────────────────────

const PLAN_META = {
  hobby: {
    progressLabel: 'Week 3 of 12 · Base Building',
    progressPct: 25,
    currentWeek: 3,
    totalWeeks: 12,
    totalKm: '450km',
    showRace: false,
    weeks: HOBBY_FULL,
  },
  race: {
    progressLabel: 'Race prep: Week 5 of 12',
    progressPct: 38,
    currentWeek: 5,
    totalWeeks: 12,
    totalKm: '468km',
    showRace: true,
    weeks: RACE_FULL,
  },
};

// ─────────────────────────────────────────────────────────────
// RUN TYPE VISUAL CONFIG  (identical to plan.tsx)
// ─────────────────────────────────────────────────────────────

const RUN_COLORS: Record<string, { bg: string; border: string; labelColor: string; distColor: string }> = {
  easy:     { bg: '#EAF3F3', border: 'rgba(27,108,112,0.3)',   labelColor: '#1B6C70', distColor: '#4C6B6C' },
  tempo:    { bg: '#1B6C70', border: '#1B6C70',                labelColor: '#fff',    distColor: '#fff'    },
  long:     { bg: '#112224', border: '#0A1A1B',                labelColor: 'rgba(255,255,255,0.85)', distColor: 'rgba(255,255,255,0.85)' },
  interval: { bg: '#F3EEFF', border: 'rgba(124,77,255,0.35)',  labelColor: '#7C4DFF', distColor: '#5E35B1' },
  race:     { bg: '#0A1A1B', border: '#0A1A1B',                labelColor: 'rgba(255,255,255,0.9)', distColor: 'rgba(255,255,255,0.9)' },
};

const TYPE_LABELS: Record<string, string> = {
  easy: 'Easy', tempo: 'Tempo', long: 'Long', interval: 'Intv.', race: 'Race',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

function RunCell({ block, size, cs, C }: { block: RunBlock; size: number; cs: ReturnType<typeof makeCStyles>; C: ColorPalette }) {
  const cfg = RUN_COLORS[block.type] || RUN_COLORS.easy;
  const opacity = block.dim ? (block.dimOpacity ?? 0.32) : 1;
  return (
    <View style={[
      cs.runBlock,
      { backgroundColor: cfg.bg, borderColor: cfg.border, opacity, width: size, height: size },
    ]}>
      <Text style={[cs.runLabel, { color: cfg.labelColor }]}>{TYPE_LABELS[block.type]}</Text>
      <Text style={[cs.runDist, { color: cfg.distColor }]}>{block.km}</Text>
      {block.done  && <Text style={[cs.runMeta, { color: cfg.labelColor, opacity: 0.6 }]}>✓</Text>}
      {block.today && <Text style={[cs.runToday, { color: block.type === 'tempo' ? '#fff' : C.primary }]}>Today</Text>}
    </View>
  );
}

function WeekRow({
  week, cellSize, isRecoveryOrTaper, cs, C,
}: {
  week: FullWeekRow;
  cellSize: number;
  isRecoveryOrTaper: boolean;
  cs: ReturnType<typeof makeCStyles>;
  C: ColorPalette;
}) {
  return (
    <View style={[
      cs.weekRow,
      week.badge === 'done' && cs.weekDone,
      week.badge === 'now'  && cs.weekNow,
      isRecoveryOrTaper     && cs.weekSpecial,
    ]}>
      {/* Week ID */}
      <View style={cs.wkIdCol}>
        <Text style={cs.wkNum}>{week.label}</Text>
        {week.badge === 'done' && <Text style={cs.wkCheck}>✓</Text>}
        {week.badge === 'now'  && (
          <View style={cs.nowBadge}><Text style={cs.nowBadgeText}>Now</Text></View>
        )}
        {week.subLabel && (
          <Text style={cs.subLabel}>{week.subLabel}</Text>
        )}
      </View>

      {/* Days */}
      {week.days.map((block, di) => (
        <View key={di} style={[cs.dayCell, { width: cellSize, height: cellSize + 8 }]}>
          {block && <RunCell block={block} size={cellSize - 2} cs={cs} C={C} />}
        </View>
      ))}

      {/* km total */}
      <Text style={[cs.wkKm, week.badge === 'now' && cs.wkKmNow]}>
        {week.totalKm}
      </Text>
    </View>
  );
}

function PhaseHeader({ phase, cs }: { phase: number; cs: ReturnType<typeof makeCStyles> }) {
  const meta = PHASES[phase];
  if (!meta) return null;
  return (
    <View style={cs.phaseHeader}>
      <Text style={cs.phaseLabel}>{meta.label}</Text>
      <Text style={cs.phaseRange}>{meta.wkRange}</Text>
    </View>
  );
}

function Legend({ showRace, hs }: { showRace: boolean; hs: ReturnType<typeof makeHStyles> }) {
  const items = [
    { type: 'easy',     label: 'Easy'  },
    { type: 'tempo',    label: 'Tempo' },
    { type: 'long',     label: 'Long'  },
    { type: 'interval', label: 'Intv.' },
    ...(showRace ? [{ type: 'race', label: 'Race' }] : []),
  ];
  return (
    <View style={hs.legendRow}>
      {items.map(it => {
        const cfg = RUN_COLORS[it.type];
        return (
          <View key={it.type} style={hs.legendItem}>
            <View style={[hs.legendSwatch, { backgroundColor: cfg.bg, borderColor: cfg.border }]} />
            <Text style={hs.legendLabel}>{it.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────

export default function FullPlanScreen() {
  const { planType, currentWeek: currentWeekParam } = useLocalSearchParams<{
    planType: 'hobby' | 'race';
    currentWeek: string;
  }>();

  const type = (planType === 'race' ? 'race' : 'hobby') as 'hobby' | 'race';
  const meta = PLAN_META[type];
  const currentWeek = parseInt(currentWeekParam ?? String(meta.currentWeek), 10);

  const { colors: C, isDark } = useTheme();

  // Generate themed styles — recomputed only when color palette changes
  const s  = useMemo(() => makeSStyles(C), [C]);
  const hs = useMemo(() => makeHStyles(C), [C]);
  const cs = useMemo(() => makeCStyles(C), [C]);

  const { width } = useWindowDimensions();
  // Compute responsive cell size — same formula as plan.tsx CalendarGrid
  const PADDING = Spacing.lg * 2;
  const WK_COL = 38;
  const KM_COL = 36;
  const cellSize = Math.floor((width - PADDING - WK_COL - KM_COL) / 7);

  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to current week on mount
  // Each week row is approx (cellSize + 8 + 4) px tall; phase headers ~32px
  // We measure via onLayout on a ref View instead to be precise
  const weekYRef = useRef<Record<number, number>>({});

  const scrollToCurrentWeek = useCallback(() => {
    const y = weekYRef.current[currentWeek];
    if (y != null && scrollRef.current) {
      // Offset by 20px so the week isn't flush against the top
      scrollRef.current.scrollTo({ y: Math.max(0, y - 20), animated: true });
    }
  }, [currentWeek]);

  // Group weeks by phase for rendering
  const phases = [1, 2, 3, 4] as const;
  const weeksByPhase = phases.reduce<Record<number, FullWeekRow[]>>((acc, ph) => {
    acc[ph] = meta.weeks.filter(w => w.phase === ph);
    return acc;
  }, {});

  // Running index for onLayout keying
  let weekIndex = 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── STICKY HEADER ── */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color={C.dark} />
        </TouchableOpacity>
        <Text style={s.navTitle}>My Plan · All Weeks</Text>
        <View style={s.currentWkBadge}>
          <Text style={s.currentWkText}>Wk {currentWeek} Now</Text>
        </View>
      </View>

      {/* ── SUMMARY STRIP (non-scrolling) ── */}
      <View style={s.summaryStrip}>
        {/* Progress row */}
        <View style={hs.progressRow}>
          <Text style={hs.progressLabel}>{meta.progressLabel}</Text>
          <Text style={hs.progressValue}>{meta.progressPct}% complete</Text>
        </View>
        <View style={hs.progressTrack}>
          <View style={[hs.progressFill, { width: `${meta.progressPct}%` as any }]} />
        </View>

        {/* Legend */}
        <Legend showRace={meta.showRace} hs={hs} />
      </View>

      {/* ── SCROLLABLE WEEKS ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={() => {
          // Delay scroll until layout has settled
          setTimeout(scrollToCurrentWeek, 120);
        }}
      >
        {/* Column headers — shown once before Phase 1 */}
        <View style={cs.headerRow}>
          <View style={cs.wkIdCol} />
          {DAYS.map(d => (
            <Text key={d} style={[cs.dayLabel, { width: cellSize }]}>{d}</Text>
          ))}
          <Text style={cs.kmHeaderLabel}>km</Text>
        </View>

        {/* Phases */}
        {phases.map(ph => (
          <View key={ph}>
            <PhaseHeader phase={ph} cs={cs} />
            {weeksByPhase[ph].map(week => {
              // Derive 1-based week number from label e.g. "Wk 3" → 3
              const wkNum = parseInt(week.label.replace('Wk ', ''), 10);
              const isSpecial = !!week.subLabel;
              const capturedIndex = weekIndex++;
              return (
                <View
                  key={week.label}
                  onLayout={e => {
                    weekYRef.current[wkNum] = e.nativeEvent.layout.y;
                    // Try to scroll once we have the current week's y
                    if (wkNum === currentWeek) {
                      setTimeout(scrollToCurrentWeek, 80);
                    }
                  }}
                >
                  <WeekRow week={week} cellSize={cellSize} isRecoveryOrTaper={isSpecial} cs={cs} C={C} />
                </View>
              );
            })}
          </View>
        ))}

        {/* ── BOTTOM SUMMARY + ACTIONS ── */}
        <View style={s.bottomSection}>
          <View style={s.summaryNote}>
            <Text style={s.summaryNoteText}>
              {meta.totalWeeks} weeks · 4 phases · {meta.totalKm} total volume
            </Text>
          </View>

          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => {
              router.back(); // Go back to plan, then open edit modal
            }}
            activeOpacity={0.88}
          >
            <Text style={s.btnPrimaryText}>Edit My Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnBack}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={s.btnBackText}>← Back to Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

function makeSStyles(C: ColorPalette) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Nav bar
  navBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.borderMedium,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: 17,
    color: C.dark,
    letterSpacing: 0.2,
  },
  currentWkBadge: {
    backgroundColor: C.dark,
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  currentWkText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 8,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Summary strip
  summaryStrip: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  // Bottom section
  bottomSection: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryNote: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
    ...Shadow.cardSubtle,
  },
  summaryNoteText: {
    fontFamily: FontFamily.uiRegular,
    fontSize: 12.5,
    color: C.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Buttons
  btnPrimary: {
    height: 64,
    backgroundColor: C.dark,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 14,
    color: C.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  btnBack: {
    height: 50,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBackText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 13,
    color: C.dark,
    letterSpacing: 0.3,
  },
});}

function makeHStyles(C: ColorPalette) { return StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  progressLabel: {
    fontFamily: FontFamily.uiRegular,
    fontSize: 11,
    color: C.textSecondary,
  },
  progressValue: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 11,
    color: C.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%' as any,
    backgroundColor: C.primary,
    borderRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  legendLabel: {
    fontFamily: FontFamily.uiRegular,
    fontSize: 10,
    color: C.textSecondary,
  },
});}

// Calendar / week row styles
function makeCStyles(C: ColorPalette) { return StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 2,
  },
  dayLabel: {
    textAlign: 'center',
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 7.5,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  wkIdCol: {
    width: 38,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 2,
  },
  kmHeaderLabel: {
    width: 36,
    textAlign: 'right',
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 7.5,
    color: C.textTertiary,
    paddingRight: 2,
  },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  weekDone: {
    backgroundColor: C.border,
    opacity: 0.75,
  },
  weekNow: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  // Recovery / Taper weeks — dashed border, slightly tinted background
  weekSpecial: {
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.borderStrong,
  },

  wkNum: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 8,
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  wkCheck: { fontSize: 10, color: C.success },
  nowBadge: {
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  nowBadgeText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 6.5,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subLabel: {
    fontFamily: FontFamily.uiRegular,
    fontSize: 6,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 1,
  },

  dayCell: { alignItems: 'center', justifyContent: 'center' },

  runBlock: {
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  runLabel: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 8,
  },
  runDist:  { fontFamily: FontFamily.uiRegular, fontSize: 7.5, lineHeight: 9 },
  runMeta:  { fontSize: 7, lineHeight: 8 },
  runToday: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 8,
  },

  wkKm: {
    width: 36,
    textAlign: 'right',
    fontFamily: FontFamily.uiRegular,
    fontSize: 8.5,
    color: C.textMuted,
    paddingRight: 2,
  },
  wkKmNow: { color: C.primary, fontFamily: FontFamily.uiSemiBold },

  // Phase section header
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  phaseLabel: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 8,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  phaseRange: {
    fontFamily: FontFamily.uiRegular,
    fontSize: 8,
    color: C.textTertiary,
    letterSpacing: 0.8,
  },
});}