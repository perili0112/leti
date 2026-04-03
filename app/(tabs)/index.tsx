// app/(tabs)/index.tsx — Home screen v12
// Changes from v11:
//   - Swipe-left on START RUN reveals "Add manually" (PanResponder)
//   - Single card language: white bg + border only (no shadow) except plan card
//   - Insight card: same white card treatment as everything else (no teal bg)
//   - Context line: C.textSecondary instead of C.primary (reduce teal hits)
//   - Shadow removed from week bar and motiv strip

import React, { useMemo, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Pressable, Modal, useWindowDimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import {
  Play, ChevronRight, Pencil,
  Thermometer, Cloud, Wind, Flame,
} from 'lucide-react-native';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { fmtDist, fmtPace, distLabel, paceLabel } from '../../constants/ThemeContext';
import { LetiMark } from '../components/LetiLogo';
import {
  MOCK_USER, MOCK_PLAN, MOCK_WEATHER,
  getGreeting,
  type ActivePlan, type WeatherContext,
} from '../../constants/mockData';

// ─── Local constants ──────────────────────────────────────────────
const PERSONAL_GOAL = { current: 3, target: 30, label: 'runs' };

type DayState = 'done' | 'today' | 'upcoming' | 'rest';
type WeekDay = { day: string; state: DayState; type?: string; km?: string };

const THIS_WEEK: WeekDay[] = [
  { day: 'Mon', state: 'done',     type: 'easy',  km: '9km'  },
  { day: 'Tue', state: 'rest'                                  },
  { day: 'Wed', state: 'today',    type: 'tempo', km: '8km'  },
  { day: 'Thu', state: 'rest'                                  },
  { day: 'Fri', state: 'upcoming', type: 'easy',  km: '9km'  },
  { day: 'Sat', state: 'upcoming', type: 'long',  km: '21km' },
  { day: 'Sun', state: 'rest'                                  },
];

const RUN_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  easy:     { bg: '#D4EBEC', border: '#1B6C70', text: '#0D4D50' },
  tempo:    { bg: '#1B6C70', border: '#155558', text: '#fff'    },
  long:     { bg: '#0D2426', border: '#0A1A1B', text: '#E2F0F0' },
  interval: { bg: '#EDE5FF', border: '#5E35B1', text: '#4527A0' },
  race:     { bg: '#0A1A1B', border: '#0A1A1B', text: '#fff'    },
};

function useHomeData() {
  return { user: MOCK_USER, plan: MOCK_PLAN, weather: MOCK_WEATHER };
}

// ─── Weather line ─────────────────────────────────────────────────
function WeatherLine({ weather, C, s }: {
  weather: WeatherContext; C: ColorPalette; s: ReturnType<typeof makeStyles>;
}) {
  if (weather.personalizedLabel) {
    return <Text style={s.wxText}>{weather.personalizedLabel}</Text>;
  }
  return (
    <View style={s.wxStrip}>
      <Thermometer size={11} color={C.textMuted} />
      <Text style={s.wxText}>{weather.tempC}°C</Text>
      <View style={s.wxDot} />
      <Cloud size={11} color={C.textMuted} />
      <Text style={s.wxText}>{weather.conditionLabel}</Text>
      <View style={s.wxDot} />
      <Wind size={11} color={C.textMuted} />
      <Text style={s.wxText}>{weather.windKph} km/h</Text>
    </View>
  );
}

// ─── Plan card ────────────────────────────────────────────────────
function PlanCardLocked({ C, s }: { C: ColorPalette; s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={[s.planCard, { overflow: 'hidden', minHeight: 160 }]}>
      <View style={{ opacity: 0.18, padding: Spacing.lg, gap: Spacing.sm }}>
        <Text style={s.planKicker}>Today's Plan</Text>
        <Text style={s.planHeroNum}>5</Text>
      </View>
      <View style={s.lockedOverlay}>
        <Text style={s.lockTitle}>Unlock AI Training Plans</Text>
        <Text style={s.lockSub}>Personalised schedules adapted as you train.</Text>
        <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push('/plan')} activeOpacity={0.8}>
          <Text style={s.upgradeBtnText}>See Premium Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PlanCardActive({
  plan, C, s, distUnit, isSmall,
}: {
  plan: ActivePlan; C: ColorPalette;
  s: ReturnType<typeof makeStyles>; distUnit: 'km' | 'mi'; isSmall: boolean;
}) {
  const run = plan.nextRun;
  const heroPV  = isSmall ? 6 : 10;
  const statsPV = isSmall ? 6 : 8;
  return (
    <View style={s.planCard}>
      <View style={s.planAccentBar} />
      <View style={s.planHeaderRow}>
        <Text style={s.planKicker}>Today's Plan</Text>
        {run && (
          <View style={s.weekPill}>
            <Text style={s.weekPillText}>
              Week {plan.currentWeek} · Run {run.runIndexThisWeek}/{run.totalRunsThisWeek}
            </Text>
          </View>
        )}
      </View>
      <View style={[s.planHeroBlock, { paddingVertical: heroPV }]}>
        {run ? (
          <>
            <View style={s.planHeroDistRow}>
              <Text style={s.planHeroNum}>{fmtDist(run.distanceKm, distUnit, 0)}</Text>
              <Text style={s.planHeroUnit}>{distLabel(distUnit)}</Text>
            </View>
            <Text style={s.planRunName}>{run.name}</Text>
            <Text style={s.planRunSub}>{run.subtitle}</Text>
          </>
        ) : (
          <>
            <Text style={s.planRunName}>Rest Day</Text>
            <Text style={s.planRunSub}>Great work this week — you've earned it.</Text>
          </>
        )}
      </View>
      {run && (
        <View style={s.statsGrid}>
          <View style={[s.statsCell, s.statsBorderR, { paddingVertical: statsPV }]}>
            <Text style={s.statsVal}>~{run.estTimeMin}<Text style={s.statsUnit}> min</Text></Text>
            <Text style={s.statsLbl}>Est. Time</Text>
          </View>
          <View style={[s.statsCell, { paddingVertical: statsPV }]}>
            <Text style={s.statsVal}>{fmtPace(run.targetPace, distUnit)}<Text style={s.statsUnit}>{paceLabel(distUnit)}</Text></Text>
            <Text style={s.statsLbl}>Target Pace</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Leti insight card — same card language as everything else ────
function LetiInsightCard({ C, s }: { C: ColorPalette; s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={s.insightCard}>
      <View style={s.insightAvatar}>
        <LetiMark size={14} variant="white" />
      </View>
      <Text style={s.insightText}>
        You've been consistent 3 weeks in a row — your weekly mileage is up 18%. Keep the easy runs easy.
      </Text>
    </View>
  );
}

// ─── Motivation strip ─────────────────────────────────────────────
function MotivationStrip({ C, s, height }: {
  C: ColorPalette; s: ReturnType<typeof makeStyles>; height: number;
}) {
  const goalPct = Math.round((PERSONAL_GOAL.current / PERSONAL_GOAL.target) * 100);
  return (
    <View style={[s.motivStrip, { height }]}>
      <View style={s.motivHalf}>
        <View style={{ flex: 1 }}>
          <Text style={s.motivKicker}>Personal Goal</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
            <Text style={s.motivVal}>{PERSONAL_GOAL.current}</Text>
            <Text style={s.motivSuffix}> / {PERSONAL_GOAL.target} {PERSONAL_GOAL.label}</Text>
          </View>
          <View style={s.goalProgRow}>
            <View style={s.goalBarTrack}>
              <View style={[s.goalBarFill, { width: `${goalPct}%` as any }]} />
            </View>
            <Text style={s.goalPct}>{goalPct}%</Text>
          </View>
        </View>
      </View>
      <View style={s.motivDivider} />
      <View style={s.motivHalf}>
        <Flame size={22} color={C.accent} fill={C.accent} />
        <View>
          <Text style={s.motivKicker}>Streak</Text>
          <Text style={s.motivVal}>{MOCK_USER.streak}-run</Text>
          <Text style={s.motivSub}>Keep going</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Start Run — swipe left reveals Add Manually ──────────────────
const SWIPE_THRESHOLD = 90;
const REVEAL_WIDTH    = 110; // px of "Add manually" panel revealed

function StartRunButton({ C, s, height }: {
  C: ColorPalette; s: ReturnType<typeof makeStyles>; height: number;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  // Sheet modal state (kept from previous versions)
  const [showSheet, setShowSheet]   = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setShowSheet(true);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
    ]).start();
  };

  const closeSheet = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 180, useNativeDriver: true }),
    ]).start(() => { setShowSheet(false); cb?.(); });
  };

  const snapBack = () => {
    setSwiped(false);
    Animated.spring(translateX, {
      toValue: 0, useNativeDriver: true, tension: 120, friction: 14,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),

      onPanResponderMove: (_, g) => {
        // Only allow leftward drag, cap at REVEAL_WIDTH
        const x = Math.max(-REVEAL_WIDTH, Math.min(0, g.dx));
        translateX.setValue(x);
        setSwiped(x < -SWIPE_THRESHOLD / 2);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD) {
          // Full swipe — navigate
          Animated.spring(translateX, {
            toValue: -REVEAL_WIDTH, useNativeDriver: true, tension: 120, friction: 14,
          }).start(() => {
            snapBack();
            router.push('/add-run' as any);
          });
        } else {
          // Partial — snap back
          snapBack();
        }
      },
      onPanResponderTerminate: () => snapBack(),
    })
  ).current;

  return (
    <>
      {/* Container clips the sliding button so the reveal stays bounded */}
      <View style={[s.startOuter, { height, borderRadius: Radius.lg }]}>

        {/* "Add manually" revealed panel — sits behind the sliding button */}
        <View style={[s.addManuallyPanel, { width: REVEAL_WIDTH, borderRadius: Radius.lg }]}>
          <Pencil size={18} color={C.textSecondary} />
          <Text style={s.addManuallyLabel}>Add{'\n'}manually</Text>
        </View>

        {/* Main START RUN button — slides left */}
        <Animated.View
          style={[s.startBtnWrap, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[s.startBtn, { height }]}
            onPress={() => router.push('/run-tracker')}
            activeOpacity={0.92}
          >
            <Text style={s.startLabel}>Start Run</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Sheet modal — kept for any future long-press path */}
      <Modal visible={showSheet} transparent animationType="none" statusBarTranslucent onRequestClose={() => closeSheet()}>
        <Animated.View style={[s.sheetScrim, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeSheet()} />
        </Animated.View>
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Ready to run?</Text>
          <TouchableOpacity style={s.sheetOptionPrimary} onPress={() => closeSheet(() => router.push('/run-tracker'))} activeOpacity={0.85}>
            <View style={s.sheetOptionIcon}><Play size={20} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.sheetOptionLabel}>Start Tracking</Text>
              <Text style={s.sheetOptionSub}>GPS-tracked run</Text>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <TouchableOpacity style={s.sheetOptionSecondary} onPress={() => closeSheet(() => router.push('/add-run' as any))} activeOpacity={0.8}>
            <View style={[s.sheetOptionIcon, s.sheetOptionIconSecondary]}>
              <Pencil size={18} color={C.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sheetOptionLabelSecondary}>Add Manually</Text>
              <Text style={s.sheetOptionSub}>Log a past run</Text>
            </View>
            <ChevronRight size={16} color={C.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.sheetCancel} onPress={() => closeSheet()} activeOpacity={0.7}>
            <Text style={s.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

// ─── Week bar ─────────────────────────────────────────────────────
function WeekBar({ C, s }: { C: ColorPalette; s: ReturnType<typeof makeStyles> }) {
  const { width } = useWindowDimensions();
  const cellW = Math.floor((width - Spacing.md * 2) / 7);

  return (
    <View style={[s.card, { flex: 1, minHeight: 80, padding: 13 }]}>
      <View style={s.weekBarHeader}>
        <Text style={s.weekBarKicker}>This Week</Text>
        <TouchableOpacity onPress={() => router.push('/plan')} activeOpacity={0.7}>
          <Text style={s.weekBarLink}>Full plan →</Text>
        </TouchableOpacity>
      </View>
      <View style={s.weekBarRow}>
        {THIS_WEEK.map((d) => {
          const cfg      = d.type ? RUN_TYPE_COLORS[d.type] : null;
          const isToday    = d.state === 'today';
          const isDone     = d.state === 'done';
          const isUpcoming = d.state === 'upcoming';
          const isRest     = d.state === 'rest';

          return (
            <View key={d.day} style={[s.weekCell, { width: cellW }]}>
              <Text style={[
                s.weekDayLabel,
                isToday && { color: C.primary, fontFamily: FontFamily.uiBold },
              ]}>
                {d.day}
              </Text>
              {isRest ? (
                <View style={s.weekRestDot} />
              ) : cfg ? (
                <View style={[
                  s.weekRunBlock,
                  { backgroundColor: cfg.bg, borderColor: cfg.border },
                  isDone     && { opacity: 0.38 },
                  isToday    && { borderWidth: 2, borderColor: C.primary },
                  isUpcoming && { borderStyle: 'dashed' as any },
                ]}>
                  <Text style={[s.weekRunKm, { color: cfg.text }]}>{d.km}</Text>
                  {isToday && <View style={[s.weekTodayDot, { backgroundColor: C.primary }]} />}
                  {isDone  && <Text style={[s.weekDoneCheck, { color: cfg.text }]}>✓</Text>}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors: C, isDark, distUnit } = useTheme();
  const { width, height } = useWindowDimensions();
  const isSmall = height < 700;

  const { user, plan, weather } = useHomeData();
  const greeting  = useMemo(() => getGreeting(user.firstName), [user.firstName]);
  const s         = useMemo(() => makeStyles(C), [C]);

  const motivHeight = isSmall ? 46 : 54;
  const startHeight = isSmall ? 72 : 84;
  const sectionGap  = isSmall ? 7  : 9;


  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ① HEADER */}
      <View style={[s.header, { paddingVertical: isSmall ? 14 : 20 }]}>
        <View style={{ gap: isSmall ? 10 : 14 }}>
          <Text style={s.wordmark}>Leti</Text>
          <Text style={[s.greeting, { fontSize: isSmall ? 26 : 32 }]}>{greeting}</Text>
          <View style={{ opacity: 0.55 }}>
            <WeatherLine weather={weather} C={C} s={s} />
          </View>
        </View>
      </View>

      {/* SCROLL */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { gap: sectionGap }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ② TODAY'S PLAN */}
        {!user.isPremium
          ? <PlanCardLocked C={C} s={s} />
          : plan === null
            ? (
              <View style={[s.planCard, { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm }]}>
                <Text style={s.planRunName}>No plan yet</Text>
                <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push('/plan')}>
                  <Text style={s.upgradeBtnText}>Build a plan →</Text>
                </TouchableOpacity>
              </View>
            )
            : <PlanCardActive plan={plan} C={C} s={s} distUnit={distUnit} isSmall={isSmall} />
        }

        {/* ③ MOTIVATION STRIP */}
        <MotivationStrip C={C} s={s} height={motivHeight} />

        {/* ④ LETI INSIGHT */}
        <LetiInsightCard C={C} s={s} />

        {/* ⑤ START RUN — swipe left to add manually */}
        <StartRunButton C={C} s={s} height={startHeight} />

        {/* ⑥ WEEK BAR */}
        <WeekBar C={C} s={s} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },

    // Shared card language — white bg, thin border, no shadow (except plan card)
    card: {
      backgroundColor: C.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
    },

    // ① Header
    header: {
      paddingHorizontal: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    wordmark:    { fontFamily: FontFamily.uiSemiBold, fontSize: 8, textTransform: 'uppercase', letterSpacing: 3.5, color: C.textMuted },
    greeting:    { fontFamily: FontFamily.displayBold, color: C.textPrimary, letterSpacing: -0.5, lineHeight: 36 },
    contextLine: { fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textSecondary, marginTop: 1 },
    wxStrip:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
    wxText:      { fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textMuted },
    wxDot:       { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMuted },

    // ② Plan card — only card that gets a shadow (primary content)
    planCard:        { backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...Shadow.card },
    planAccentBar:   { height: 3, backgroundColor: C.primary },
    planHeaderRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    planKicker:      { fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
    weekPill:        { backgroundColor: C.dark, borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
    weekPillText:    { fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: '#FFFFFF' },
    planHeroBlock:   { alignItems: 'center', paddingHorizontal: Spacing.xl, gap: 2 },
    planHeroDistRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    planHeroNum:     { fontFamily: FontFamily.displayExtraBold, fontSize: 52, color: C.textPrimary, lineHeight: 52, letterSpacing: -1 },
    planHeroUnit:    { fontFamily: FontFamily.displayBold, fontSize: 20, color: C.primary, paddingBottom: 6 },
    planRunName:     { fontFamily: FontFamily.displayBold, fontSize: 17, color: C.textPrimary, letterSpacing: 0.1, textAlign: 'center' },
    planRunSub:      { fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary, textAlign: 'center' },
    statsGrid:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border },
    statsCell:       { flex: 1, alignItems: 'center', gap: 2 },
    statsBorderR:    { borderRightWidth: 1, borderRightColor: C.border },
    statsVal:        { fontFamily: FontFamily.displayBold, fontSize: 20, color: C.textPrimary, lineHeight: 22 },
    statsUnit:       { fontFamily: FontFamily.uiRegular, fontSize: 10, color: C.textMuted },
    statsLbl:        { fontFamily: FontFamily.uiRegular, fontSize: 8.5, color: C.textMuted, letterSpacing: 0.9, textTransform: 'uppercase' },
    lockedOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg + 'EC', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
    lockTitle:       { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: C.textPrimary, textAlign: 'center' },
    lockSub:         { fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 18 },
    upgradeBtn:      { borderWidth: 1.5, borderColor: C.borderStrong, borderRadius: Radius.md, paddingVertical: 9, paddingHorizontal: Spacing.xl },
    upgradeBtnText:  { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textPrimary },

    // ③ Motivation strip — same card language, no shadow
    motivStrip:   { backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden' },
    motivHalf:    { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
    motivDivider: { width: 1, backgroundColor: C.border, marginVertical: 8 },
    motivKicker:  { fontFamily: FontFamily.uiSemiBold, fontSize: 7, color: C.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' },
    motivVal:     { fontFamily: FontFamily.displayExtraBold, fontSize: 16, color: C.textPrimary, lineHeight: 20 },
    motivSuffix:  { fontFamily: FontFamily.uiRegular, fontSize: 10, color: C.textSecondary },
    motivSub:     { fontFamily: FontFamily.uiRegular, fontSize: 10, color: C.textSecondary },
    goalProgRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    goalBarTrack: { flex: 1, height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
    goalBarFill:  { height: '100%' as any, backgroundColor: C.primary, borderRadius: 2 },
    goalPct:      { fontFamily: FontFamily.uiRegular, fontSize: 8, color: C.textMuted },

    // ④ Leti insight — same card language as motiv strip
    insightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: C.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    insightAvatar: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    insightText: {
      flex: 1,
      fontFamily: FontFamily.uiRegular,
      fontSize: 12.5,
      color: C.textSecondary,
      lineHeight: 19,
    },

    // ⑤ Start Run — swipe container
    startOuter: {
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: C.cardAlt,
      borderWidth: 1,
      borderColor: C.border,
    },
    addManuallyPanel: {
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    addManuallyLabel: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 10,
      color: C.textSecondary,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    startBtnWrap: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
    },
    startBtn: {
      flex: 1,
      backgroundColor: C.dark,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 10,
    },
    startLabel: {
      fontFamily: FontFamily.displayBold,
      fontSize: 20,
      color: C.accent,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },

    // Bottom sheet
    sheetScrim:                { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet:                     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
    sheetHandle:               { width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderMedium, alignSelf: 'center', marginBottom: 18 },
    sheetTitle:                { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 },
    sheetOptionPrimary:        { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 10, backgroundColor: C.dark, borderRadius: Radius.lg, padding: 16 },
    sheetOptionSecondary:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, backgroundColor: C.cardAlt, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 16 },
    sheetOptionIcon:           { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
    sheetOptionIconSecondary:  { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
    sheetOptionLabel:          { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: '#FFFFFF' },
    sheetOptionLabelSecondary: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: C.textPrimary },
    sheetOptionSub:            { fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textMuted, marginTop: 1 },
    sheetCancel:               { marginTop: 14, alignItems: 'center', paddingVertical: 8 },
    sheetCancelText:           { fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.textMuted },

    // ⑥ Week bar
    weekBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    weekBarKicker: { fontFamily: FontFamily.uiSemiBold, fontSize: 9, color: C.textMuted, letterSpacing: 1.3, textTransform: 'uppercase' },
    weekBarLink:   { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.primary },
    weekBarRow:    { flexDirection: 'row', alignItems: 'flex-end' },
    weekCell:      { alignItems: 'center', gap: 5 },
    weekDayLabel:  { fontFamily: FontFamily.uiSemiBold, fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    weekRestDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
    weekRunBlock:  { width: '85%' as any, aspectRatio: 0.9, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2 },
    weekRunKm:     { fontFamily: FontFamily.uiBold, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.2 },
    weekTodayDot:  { width: 4, height: 4, borderRadius: 2 },
    weekDoneCheck: { fontSize: 7, opacity: 0.7 },
  });
}