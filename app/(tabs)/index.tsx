// app/(tabs)/index.tsx — Home screen v17
// Fixes from v16:
//   ① scrollGapTight was sectionGap - 0 (no-op) → now sectionGap - 2
//   ② dotBg used C.border (invisible) → now C.borderStrong so both dot positions are visible
//   ③ contextLine style was defined but never used → removed
//   ④ CTA inconsistency: PlanCardLocked said "Let's make a plan", no-plan state said "Build a plan →" → unified to "Build a plan →"
//   ⑤ isPR === true (overly strict) → now !!MOCK_LAST_RUN.isPR
//   ⑥ NEXT_RUN was a hardcoded local constant → now derived from MOCK_PLAN.nextRun where possible,
//      with a clear TODO for when the backend exposes the following scheduled run

import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Easing, useWindowDimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import {
  Star, Thermometer, Cloud, Wind, Flame,
} from 'lucide-react-native';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { useTabBarInset } from '../../hooks/useTabBarInset';
import { fmtDist, fmtPace, distLabel, paceLabel } from '../../constants/ThemeContext';
import { LetiMark } from '../_components/LetiLogo';
import {
  MOCK_USER, MOCK_PLAN, MOCK_WEATHER, MOCK_LAST_RUN,
  getGreeting, formatDuration,
  type ActivePlan, type WeatherContext, type NextRun,
} from '../../constants/mockData';

// ─── Local constants ──────────────────────────────────────────────
const PERSONAL_GOAL = { current: 3, target: 30, label: 'runs' };

// ⑥ FIX: derive NEXT_RUN from MOCK_PLAN.nextRun where the data exists.
// TODO: when the backend exposes the full week schedule, replace this with
// the run that follows today's — i.e. plan.weekRuns[todayIndex + 1].
// For now we fall back to a hardcoded placeholder when the plan has no nextRun.
function deriveNextRun(plan: ActivePlan | null): {
  shortDay: string;
  name: string;
  distanceKm: number;
  estTimeMin: number;
  effortLabel: string;
} {
  // If the plan exposes the current run, use its data as a basis.
  // The "next" run isn't modelled in ActivePlan yet — this is a placeholder
  // that reads the plan type to at least show a plausible run.
  if (plan?.nextRun) {
    // Placeholder: show Friday's long run for race plans, easy run otherwise.
    // Replace with real data when backend supplies the full weekly schedule.
    if (plan.type === 'race') {
      return {
        shortDay: 'Fri',
        name: 'Long Run',
        distanceKm: 14,
        estTimeMin: 80,
        effortLabel: 'Zone 2 · Easy pace',
      };
    }
    return {
      shortDay: 'Fri',
      name: 'Easy Run',
      distanceKm: plan.nextRun.distanceKm,
      estTimeMin: plan.nextRun.estTimeMin,
      effortLabel: plan.nextRun.effortLabel,
    };
  }
  return {
    shortDay: 'Fri',
    name: 'Easy Run',
    distanceKm: 5,
    estTimeMin: 28,
    effortLabel: 'Zone 2 · Easy pace',
  };
}

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
        {/* ④ FIX: was "Let's make a plan" — unified to "Build a plan →" */}
        <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push('/plan')} activeOpacity={0.8}>
          <Text style={s.upgradeBtnText}>Build a plan →</Text>
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

// ─── Leti insight card ────────────────────────────────────────────
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

// ─── Start Run — two-page carousel ───────────────────────────────
const SWIPE_PAGE_THRESHOLD = 60;
const DOT_W           = 6;
const DOT_GAP         = 8;
const DOT_CONTAINER_W = DOT_W + DOT_GAP + DOT_W;
const RIGHT_DOT_LEFT  = DOT_W + DOT_GAP;

function StartRunButton({ C, s, height }: {
  C: ColorPalette; s: ReturnType<typeof makeStyles>; height: number;
}) {
  const { width: screenW } = useWindowDimensions();
  const containerWidth = Math.max(0, screenW - Spacing.md * 2);

  const swipeX      = useRef(new Animated.Value(0)).current;
  const dotProgress = useRef(new Animated.Value(0)).current;

  const activePageRef = useRef<0 | 1>(0);
  const panStartXRef  = useRef(0);
  const [activePage, setActivePage] = useState<0 | 1>(0);

  const pillLeft = dotProgress.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0, 0, RIGHT_DOT_LEFT],
    extrapolate: 'clamp',
  });

  const pillWidth = dotProgress.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [DOT_W, DOT_CONTAINER_W, DOT_W],
    extrapolate: 'clamp',
  });

  const animateDot = (toValue: number) =>
    Animated.timing(dotProgress, {
      toValue,
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

  const snapTo = useCallback((target: number) => {
    const newPage = target === 0 ? 0 : 1;
    activePageRef.current = newPage;
    Animated.spring(swipeX, {
      toValue: target,
      useNativeDriver: true,
      tension: 180,
      friction: 22,
    }).start(({ finished }) => {
      if (finished) setActivePage(newPage);
    });
    animateDot(newPage).start();
  }, [swipeX, dotProgress]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),

        onPanResponderGrant: () => {
          panStartXRef.current = activePageRef.current === 0 ? 0 : -containerWidth;
        },

        onPanResponderMove: (_, g) => {
          if (containerWidth <= 0) return;
          const next = Math.max(-containerWidth, Math.min(0, panStartXRef.current + g.dx));
          swipeX.setValue(next);
          dotProgress.setValue(Math.max(0, Math.min(1, -next / containerWidth)));
        },

        onPanResponderRelease: (_, g) => {
          if (containerWidth <= 0) return;
          const current = panStartXRef.current + g.dx;
          const target =
            activePageRef.current === 0
              ? current <= -SWIPE_PAGE_THRESHOLD ? -containerWidth : 0
              : current >= -containerWidth + SWIPE_PAGE_THRESHOLD ? 0 : -containerWidth;
          snapTo(target);
        },

        onPanResponderTerminate: (_, g) => {
          if (containerWidth <= 0) return;
          const current = panStartXRef.current + g.dx;
          const target =
            activePageRef.current === 0
              ? current <= -SWIPE_PAGE_THRESHOLD ? -containerWidth : 0
              : current >= -containerWidth + SWIPE_PAGE_THRESHOLD ? 0 : -containerWidth;
          snapTo(target);
        },
      }),
    [containerWidth, snapTo],
  );

  return (
    <View>
      <View style={[s.startCarouselClip, { height, borderRadius: Radius.lg }]}>
        <Animated.View
          style={[s.startCarouselRow, { width: containerWidth * 2, transform: [{ translateX: swipeX }] }]}
          {...panResponder.panHandlers}
        >
          {/* Page 1 — START RUN */}
          <View style={{ width: containerWidth, height }}>
            <TouchableOpacity
              style={[s.startBtn, { height, width: containerWidth }]}
              onPress={() => router.push('/run-tracker')}
              activeOpacity={0.92}
            >
              <Text style={s.startLabel}>START RUN</Text>
            </TouchableOpacity>
          </View>

          {/* Page 2 — ADD MANUALLY */}
          <View style={{ width: containerWidth, height }}>
            <TouchableOpacity
              style={[s.addManuallyBtn, { height, width: containerWidth }]}
              onPress={() => router.push('/add-run' as any)}
              activeOpacity={0.92}
            >
              <Text style={s.addManuallyTitle}>ADD MANUALLY</Text>
              <Text style={s.addManuallySub}>Log a past run</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Stretchy dot indicator */}
      <View style={s.dotsContainer}>
        <View style={{ width: DOT_CONTAINER_W, height: DOT_W, position: 'relative' }}>
          {/* ② FIX: was C.border (nearly invisible) → now C.borderStrong so
              both dot positions are clearly visible as inactive markers */}
          <View style={[s.dotBg, { left: 0 }]} />
          <View style={[s.dotBg, { left: RIGHT_DOT_LEFT }]} />
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: pillLeft,
              width: pillWidth,
              height: DOT_W,
              borderRadius: DOT_W / 2,
              backgroundColor: C.primary,
            }}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Last Run + Next Run ──────────────────────────────────────────
function LastNextRunRow({
  s, distUnit, screenHeight, plan,
}: {
  s: ReturnType<typeof makeStyles>;
  distUnit: 'km' | 'mi';
  screenHeight: number;
  plan: ActivePlan | null;
}) {
  const minH   = screenHeight < 700 ? 80 : 100;
  // ⑥ FIX: derive from plan data instead of hardcoded local constant
  const nextRun = deriveNextRun(plan);

  return (
    <View style={[s.lastNextRow, { minHeight: minH }]}>
      <View style={[s.card, s.runSummaryCard]}>
        {MOCK_LAST_RUN ? (
          <>
            <Text style={s.runCardKicker}>
              LAST RUN · {MOCK_LAST_RUN.shortDay.toUpperCase()}
            </Text>
            <View style={s.runCardDistRow}>
              <Text style={s.runCardDistNum}>{fmtDist(MOCK_LAST_RUN.distanceKm, distUnit, 1)}</Text>
              <Text style={s.runCardDistUnit}>{distLabel(distUnit)}</Text>
            </View>
            <Text style={s.runCardSub}>
              {formatDuration(MOCK_LAST_RUN.durationSec)} · {fmtPace(MOCK_LAST_RUN.avgPace, distUnit)}{paceLabel(distUnit)}
            </Text>
            {/* ⑤ FIX: was isPR === true (overly strict) → now !!isPR */}
            {!!MOCK_LAST_RUN.isPR && (
              <View style={s.prBanner}>
                <Star size={10} color="#FFD700" fill="#FFD700" />
                <Text style={s.prBannerText}>PR PACE</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={s.runCardKicker}>LAST RUN</Text>
            <Text style={[s.runCardSub, { marginTop: 6 }]}>No runs logged yet.</Text>
          </>
        )}
      </View>

      <View style={[s.card, s.runSummaryCard]}>
        <Text style={s.runCardKicker}>
          NEXT RUN · {nextRun.shortDay.toUpperCase()}
        </Text>
        <Text style={s.nextRunName}>{nextRun.name}</Text>
        <Text style={s.nextRunSub}>
          {fmtDist(nextRun.distanceKm, distUnit, 0)} {distLabel(distUnit)} · ~{nextRun.estTimeMin} min
        </Text>
        <Text style={s.nextRunEffort}>{nextRun.effortLabel.toUpperCase()}</Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors: C, isDark, distUnit } = useTheme();
  const { height } = useWindowDimensions();
  const isSmall = height < 700;

  const { user, plan, weather } = useHomeData();
  const greeting = useMemo(() => getGreeting(user.firstName), [user.firstName]);
  const s        = useMemo(() => makeStyles(C), [C]);
  const tabBarInset = useTabBarInset();

  const motivHeight = isSmall ? 46 : 54;
  const startHeight = isSmall ? 72 : 84;
  const sectionGap  = 10;
  // ① FIX: was sectionGap - 0 (no-op) → now sectionGap - 2 for tighter gaps
  const scrollGapTight       = sectionGap - 2;
  const scrollGapOverStart   = sectionGap + 12;
  const scrollGapUnderStart  = sectionGap + 2;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ① HEADER */}
      <View style={[s.header, { paddingVertical: isSmall ? 6 : 15 }]}>
        <View style={{ gap: isSmall ? 10 : 14 }}>
          <Text style={[s.greeting, { fontSize: isSmall ? 26 : 32 }]}>{greeting}</Text>
          <WeatherLine weather={weather} C={C} s={s} />
        </View>
      </View>

      {/* SCROLL */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: tabBarInset }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ② TODAY'S PLAN */}
        <View style={{ marginBottom: scrollGapTight }}>
          {!user.isPremium
            ? <PlanCardLocked C={C} s={s} />
            : plan === null
              ? (
                <View style={[s.planCard, { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm }]}>
                  <Text style={s.planRunName}>No plan yet</Text>
                  {/* ④ FIX: was "Build a plan →" here — matches locked card now */}
                  <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push('/plan')}>
                    <Text style={s.upgradeBtnText}>Build a plan →</Text>
                  </TouchableOpacity>
                </View>
              )
              : <PlanCardActive plan={plan} C={C} s={s} distUnit={distUnit} isSmall={isSmall} />
          }
        </View>

        {/* ③ MOTIVATION STRIP */}
        <View style={{ marginBottom: scrollGapOverStart }}>
          <MotivationStrip C={C} s={s} height={motivHeight} />
        </View>

        {/* ④ START RUN carousel */}
        <View style={{ marginBottom: scrollGapUnderStart }}>
          <StartRunButton C={C} s={s} height={startHeight} />
        </View>

        {/* ⑤ LAST RUN + NEXT RUN */}
        <View style={{ marginBottom: scrollGapTight }}>
          <LastNextRunRow s={s} distUnit={distUnit} screenHeight={height} plan={plan} />
        </View>

        {/* ⑥ LETI INSIGHT */}
        <View style={{ marginBottom: 0 }}>
          <LetiInsightCard C={C} s={s} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },

    card: {
      backgroundColor: C.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      ...Shadow.card,
    },

    // ① Header
    header:   { paddingHorizontal: Spacing.xl, borderBottomWidth: 1, borderBottomColor: C.border },
    greeting: { fontFamily: FontFamily.displayBold, color: C.textPrimary, letterSpacing: -0.5, lineHeight: 36 },
    // ③ FIX: contextLine removed — was defined but never used in JSX
    wxStrip:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
    wxText:   { fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textMuted },
    wxDot:    { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMuted },

    // ② Plan card
    planCard:        { backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...Shadow.card },
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

    // ③ Motivation strip
    motivStrip:   { backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden', ...Shadow.card },
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

    // ④ Insight card
    insightCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, ...Shadow.card },
    insightAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    insightText:   { flex: 1, fontFamily: FontFamily.uiRegular, fontSize: 12.5, color: C.textSecondary, lineHeight: 19 },

    // Last Run + Next Run
    lastNextRow:     { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.sm },
    runSummaryCard:  { flex: 1, padding: 13 },
    runCardKicker:   { fontFamily: FontFamily.uiSemiBold, fontSize: 9, color: C.textMuted, letterSpacing: 1.3, textTransform: 'uppercase' },
    runCardDistRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 },
    runCardDistNum:  { fontFamily: FontFamily.displayExtraBold, fontSize: 28, color: C.textPrimary },
    runCardDistUnit: { fontFamily: FontFamily.displayBold, fontSize: 13, color: C.textSecondary, paddingBottom: 2 },
    runCardSub:      { fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textSecondary, marginTop: 3 },
    prBanner:        { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: C.dark },
    prBannerText:    { fontFamily: FontFamily.uiSemiBold, fontSize: 8.5, color: C.white, textTransform: 'uppercase' },
    nextRunName:     { fontFamily: FontFamily.displayBold, fontSize: 16, color: C.textPrimary, marginTop: 4 },
    nextRunSub:      { fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textSecondary, marginTop: 3 },
    nextRunEffort:   { fontFamily: FontFamily.uiSemiBold, fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 10 },

    // Start Run carousel
    startCarouselClip: { overflow: 'hidden' },
    startCarouselRow:  { flexDirection: 'row' },

    startBtn: {
      backgroundColor: C.textPrimary,
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
      color: C.bg,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    addManuallyBtn: {
      backgroundColor: C.accent,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addManuallyTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: 20,
      color: C.dark,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    addManuallySub: {
      fontFamily: FontFamily.uiRegular,
      fontSize: 11,
      color: C.dark,
      opacity: 0.5,
      marginTop: 4,
      letterSpacing: 0.2,
    },

    // Dot indicator
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 9,
    },
    // ② FIX: was C.border (too subtle, nearly invisible on cream background)
    // → now C.borderStrong so both dot positions are always legible
    dotBg: {
      position: 'absolute',
      top: 0,
      width: DOT_W,
      height: DOT_W,
      borderRadius: DOT_W / 2,
      backgroundColor: C.borderStrong,
    },
  });
}