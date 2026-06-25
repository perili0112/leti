// app/onboarding/race-date.tsx — Step 4 of 9
// Question: When is your race?

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react-native';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { FontFamily, Radius } from '../../constants/theme';

const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_F = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_H   = ['M','T','W','T','F','S','S'];

const MIN_WEEKS: Record<string, number> = {
  '5k': 4, '10k': 6, 'half': 10, 'marathon': 12, 'ultra': 16,
};

function weeksUntil(d: Date) {
  return Math.floor((d.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000));
}

function calCells(year: number, month: number): (number | null)[] {
  const start = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const days  = new Date(year, month + 1, 0).getDate();
  return [...Array(start).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

export default function RaceDateScreen() {
  const { colors: C }              = useTheme();
  const { data, setRaceDate }      = useOnboarding();
  const now                        = new Date();
  const [yr,  setYr]               = useState(now.getFullYear());
  const [mo,  setMo]               = useState(now.getMonth());
  const [day, setDay]              = useState<number | null>(null);

  const selectedDate = day ? new Date(yr, mo, day) : null;
  const weeks        = selectedDate ? weeksUntil(selectedDate) : null;
  const minWeeks     = MIN_WEEKS[data.raceDistance ?? 'marathon'] ?? 12;
  const tooShort     = weeks !== null && weeks < minWeeks;
  const tooEarly     = (d: number) => new Date(yr, mo, d) <= now;

  const prevMo = () => { if (mo === 0) { setYr(y => y-1); setMo(11); } else setMo(m => m-1); setDay(null); };
  const nextMo = () => { if (mo === 11) { setYr(y => y+1); setMo(0); } else setMo(m => m+1); setDay(null); };

  const handleContinue = () => {
    if (!selectedDate) return;
    if (tooShort) { router.push('/onboarding/safety-override'); return; }
    setRaceDate(selectedDate);
    router.push('/onboarding/time-goal');
  };

  return (
    <OnboardingShell
      step={4}
      canContinue={!!selectedDate}
      onContinue={handleContinue}
      ctaLabel={tooShort ? 'Review Options' : 'Set Date'}
    >
      <OnboardingQuestion
        question="When is your race?"
        subtext={data.raceDistance ? `${data.raceDistance.toUpperCase()} · ${minWeeks}+ weeks recommended` : undefined}
      />

      {/* Calendar */}
      <View style={[cal.wrap, { backgroundColor: C.card, borderColor: C.border }]}>
        {/* Month nav */}
        <View style={cal.nav}>
          <TouchableOpacity onPress={prevMo} style={cal.navBtn} activeOpacity={0.7}>
            <ChevronLeft size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={[cal.month, { color: C.textPrimary }]}>{MONTHS_F[mo]} {yr}</Text>
          <TouchableOpacity onPress={nextMo} style={cal.navBtn} activeOpacity={0.7}>
            <ChevronRight size={20} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={cal.dayRow}>
          {DAYS_H.map((d, i) => (
            <Text key={i} style={[cal.dayH, { color: C.textMuted }]}>{d}</Text>
          ))}
        </View>

        {/* Days */}
        <View style={cal.grid}>
          {calCells(yr, mo).map((d, i) => {
            if (!d) return <View key={i} style={cal.cell} />;
            const past     = tooEarly(d);
            const selected = d === day;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  cal.cell,
                  selected && { backgroundColor: C.primary, borderRadius: 20 },
                ]}
                onPress={() => !past && setDay(d)}
                disabled={past}
                activeOpacity={0.7}
              >
                <Text style={[
                  cal.dayTxt,
                  { color: past ? C.textTertiary : C.textPrimary },
                  selected && { color: '#fff' },
                ]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Contextual feedback */}
      {weeks !== null && tooShort && (
        <View style={[warn.wrap, { backgroundColor: C.accentFaint, borderColor: C.accent }]}>
          <AlertTriangle size={16} color={C.accent} style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={[warn.text, { color: C.textPrimary }]}>
            That's {weeks} week{weeks !== 1 ? 's' : ''} — a {data.raceDistance} usually needs {minWeeks}+. I'll suggest some safer options.
          </Text>
        </View>
      )}

      {weeks !== null && !tooShort && (
        <CoachTip text={`${weeks} weeks to race day. ${weeks >= minWeeks + 4 ? 'Plenty of time to build well.' : 'A solid window — we\'ll make it count.'}`} />
      )}
    </OnboardingShell>
  );
}

const cal = StyleSheet.create({
  wrap:   { borderRadius: Radius.lg, borderWidth: 1, padding: 16 },
  nav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  month:  { fontFamily: FontFamily.uiSemiBold, fontSize: 15 },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayH:   { flex: 1, textAlign: 'center', fontFamily: FontFamily.uiSemiBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid:   { flexDirection: 'row', flexWrap: 'wrap' },
  cell:   { width: `${100/7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayTxt: { fontFamily: FontFamily.uiRegular, fontSize: 13 },
});

const warn = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10, borderRadius: Radius.md, borderWidth: 1, padding: 13 },
  text: { fontFamily: FontFamily.uiRegular, fontSize: 12, lineHeight: 18, flex: 1 },
});