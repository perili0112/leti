// app/_components/PaceChart.tsx
//
// Shared pace-per-kilometre tower chart.
// Used by AfterRunScreen and RunDetailScreen.
//
// Architecture
// ────────────
//   PaceChartTowers           ← full chart: tower row + reference line + legend
//     PaceTower               ← one component per km, mapped over data array
//
// Theming
// ───────
// Calls useTheme() internally — no color props needed from callers.
//
// Four deviation states (B/W accessible — shape + fill, not just colour):
//   onTarget   ±5%     solid dark fill
//   offTarget  5–10%   light teal fill + teal border
//   extreme    10–20%  light amber fill + amber border
//   burnout    20%+    light red fill + red border + ⚠

import { AlertTriangle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily, type ColorPalette } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

// ─────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────────────────────

export type PaceKm = {
  pace: string;         // e.g. '5:02' or '5:02/km'
  deviationPct: number; // signed % from planned pace (+slow, -fast)
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

type TowerState = 'onTarget' | 'offTarget' | 'extreme' | 'burnout';

export function paceToSec(p: string): number {
  const clean = p.replace('/km', '').trim();
  const [m, s] = clean.split(':').map(Number);
  return m * 60 + (s || 0);
}

function getTowerState(dev: number): TowerState {
  const abs = Math.abs(dev);
  if (abs <= 5)  return 'onTarget';
  if (abs <= 10) return 'offTarget';
  if (abs <= 20) return 'extreme';
  return 'burnout';
}

// ─────────────────────────────────────────────────────────────
// STATE VISUAL CONFIG — generated from current color palette
// ─────────────────────────────────────────────────────────────

type StateStyle = { bg: string; border: string; borderWidth: number; labelColor: string };

function getStateStyles(C: ColorPalette): Record<TowerState, StateStyle> {
  return {
    onTarget:  { bg: C.dark,         border: C.dark,    borderWidth: 0,   labelColor: C.textMuted    },
    offTarget: { bg: C.primaryFaint, border: C.primary, borderWidth: 1.5, labelColor: C.primary      },
    extreme:   { bg: C.accentFaint,  border: C.accent,  borderWidth: 1.5, labelColor: C.accent       },
    burnout:   { bg: C.dangerFaint,  border: C.danger,  borderWidth: 1.5, labelColor: C.danger       },
  };
}

// ─────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS
// ─────────────────────────────────────────────────────────────

const CHART_H      = 120; // plot area height in px
const PACE_LABEL_H = 18;  // space above bars for pace text
const KM_LABEL_H   = 18;  // space below bars for km number
const TOWER_COL_H  = CHART_H + PACE_LABEL_H + KM_LABEL_H; // 156

// ─────────────────────────────────────────────────────────────
// PACE TOWER — one per kilometre
// ─────────────────────────────────────────────────────────────

interface PaceTowerProps {
  pace: string;
  deviationPct: number;
  barHeight: number;
  kmIndex: number;
  showPaceLabel: boolean;
  stateStyles: Record<TowerState, StateStyle>;
  C: ColorPalette;
}

function PaceTower({ pace, deviationPct, barHeight, kmIndex, showPaceLabel, stateStyles, C }: PaceTowerProps) {
  const state     = getTowerState(deviationPct);
  const vs        = stateStyles[state];
  const isBurnout = state === 'burnout';

  return (
    <View style={[t.col, { height: TOWER_COL_H }]}>

      {/* Pace label — floats above bar */}
      <View style={t.paceArea}>
        {showPaceLabel && (
          <Text style={[t.paceLabel, { color: vs.labelColor }]} numberOfLines={1} adjustsFontSizeToFit>
            {pace.replace('/km', '')}
          </Text>
        )}
      </View>

      {/* Bar */}
      <View style={[t.bar, { height: barHeight, backgroundColor: vs.bg, borderColor: vs.border, borderWidth: vs.borderWidth }]}>
        {isBurnout && <AlertTriangle size={10} color={C.danger} />}
      </View>

      {/* Km number */}
      <Text style={[t.kmLabel, { color: C.textMuted }, isBurnout && { color: C.danger, fontFamily: FontFamily.uiBold }]}>
        {kmIndex}
      </Text>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PACE CHART TOWERS — full chart section
// ─────────────────────────────────────────────────────────────

interface PaceChartTowersProps {
  kms: PaceKm[];
  plannedPace: string;
}

export function PaceChartTowers({ kms, plannedPace }: PaceChartTowersProps) {
  const { colors: C } = useTheme();
  const stateStyles   = useMemo(() => getStateStyles(C), [C]);

  const allSecs = kms.map(k => paceToSec(k.pace));
  const planSec = paceToSec(plannedPace);
  const minSec  = Math.min(...allSecs, planSec) - 15;
  const maxSec  = Math.max(...allSecs, planSec) + 15;
  const range   = maxSec - minSec;

  function barHeightFor(sec: number): number {
    return Math.max(8, Math.round(((sec - minSec) / range) * CHART_H));
  }

  const planLineFromBottom = ((planSec - minSec) / range) * CHART_H;
  const refLineBottom      = KM_LABEL_H + planLineFromBottom;
  const planLabel          = `Plan ${plannedPace.replace('/km', '')}/km`;

  const leg = useMemo(() => makeLegStyles(C), [C]);

  return (
    <View>

      {/* Tower row + reference line */}
      <View style={{ height: TOWER_COL_H, position: 'relative', flexDirection: 'row' }}>

        {kms.map((km, i) => {
          const height      = barHeightFor(paceToSec(km.pace));
          const absDeviation = Math.abs(km.deviationPct);
          const showLabel   = i === 0 || i === kms.length - 1 || absDeviation >= 10;
          return (
            <PaceTower
              key={i}
              pace={km.pace}
              deviationPct={km.deviationPct}
              barHeight={height}
              kmIndex={i + 1}
              showPaceLabel={showLabel}
              stateStyles={stateStyles}
              C={C}
            />
          );
        })}

        {/* Dashed reference line at planned-pace height */}
        <View
          pointerEvents="none"
          style={[r.refLine, { bottom: refLineBottom, borderBottomColor: C.dark }]}
        />

        {/* Plan pace label — floats above reference line */}
        <Text
          pointerEvents="none"
          style={[r.refLabel, { bottom: refLineBottom + 3, color: C.dark, backgroundColor: C.bg + 'E8' }]}
          numberOfLines={1}
        >
          {planLabel}
        </Text>

      </View>

      {/* Legend */}
      <View style={[leg.wrap, { borderTopColor: C.border }]}>
        <Text style={[leg.title, { color: C.textMuted }]}>
          Legend · deviation from {plannedPace.replace('/km', '')}/km plan
        </Text>
        {(
          [
            { state: 'onTarget'  as TowerState, label: 'On Target',     sub: '±5%'                 },
            { state: 'offTarget' as TowerState, label: 'Off Target',    sub: '5–10% from plan'     },
            { state: 'extreme'   as TowerState, label: 'Too Fast/Slow', sub: '10–20% from plan'    },
            { state: 'burnout'   as TowerState, label: 'Burnout Risk',  sub: '20%+ · effort spike' },
          ] as const
        ).map(({ state, label, sub }) => {
          const vs = stateStyles[state];
          return (
            <View key={state} style={leg.row}>
              <View style={[leg.swatch, { backgroundColor: vs.bg, borderColor: vs.border, borderWidth: Math.max(1, vs.borderWidth) }]} />
              <Text style={[leg.text, { color: C.textSecondary }]}>
                <Text style={[leg.textBold, { color: state === 'burnout' ? C.danger : C.dark }]}>{label}</Text>
                {'  ·  '}{sub}
              </Text>
            </View>
          );
        })}
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const t = StyleSheet.create({
  col: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 1.5,
  },
  paceArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
    width: '100%',
  },
  paceLabel: {
    fontFamily: FontFamily.uiBold,
    fontSize: 7,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    overflow: 'hidden',
  },
  burnoutMark: { fontSize: 8, lineHeight: 10 },
  kmLabel: {
    height: KM_LABEL_H,
    width: '100%',
    textAlign: 'center',
    fontFamily: FontFamily.uiRegular,
    fontSize: 9,
    lineHeight: KM_LABEL_H,
  },
});

const r = StyleSheet.create({
  refLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.65,
  },
  refLabel: {
    position: 'absolute',
    left: 3,
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 7.5,
    paddingHorizontal: 3,
    borderRadius: 2,
  },
});

function makeLegStyles(C: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      borderTopWidth: 1,
      marginTop: 8,
      paddingTop: 12,
      gap: 7,
    },
    title: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 9.5,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    row:      { flexDirection: 'row', alignItems: 'center', gap: 9 },
    swatch:   { width: 26, height: 14, borderRadius: 3, flexShrink: 0 },
    text:     { fontFamily: FontFamily.uiRegular, fontSize: 12 },
    textBold: { fontFamily: FontFamily.uiSemiBold },
  });
}
