// app/onboarding/desired-frequency.tsx — Step 7 of 9
// Question: How many days a week feels good to aim for?

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { StepCounter }   from '../../components/shared/Stepcounter';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { FontFamily, Radius } from '../../constants/theme';

const MIN_SAFE_RACE = 3;

export default function DesiredFrequencyScreen() {
  const { colors: C }              = useTheme();
  const { data, setDesiredRunDays } = useOnboarding();
  const [value, setValue]           = useState(data.desiredRunDays);

  const isRace      = data.primaryGoal === 'race';
  const showWarning = isRace && value < MIN_SAFE_RACE;

  const handleContinue = () => {
    setDesiredRunDays(value);
    router.push('/onboarding/time-of-day');
  };

  // Dynamic tip based on value
  const getTip = () => {
    if (value > data.currentRunDays + 2) return "That's a meaningful jump — I'll phase it in gradually so your body can adapt.";
    if (value === data.currentRunDays)    return "Maintaining your current rhythm is a completely valid plan.";
    if (value < data.currentRunDays)      return "Scaling back can be smart — quality over quantity, always.";
    return "A small step up. That's often the most sustainable kind.";
  };

  return (
    <OnboardingShell
      step={7}
      canContinue={true}
      onContinue={handleContinue}
    >
      <OnboardingQuestion
        question="How many days a week feels good to aim for?"
        subtext="This becomes the rhythm of your plan."
      />

      <StepCounter
        min={1}
        max={7}
        value={value}
        onChange={setValue}
        unit="runs / week"
      />

      {/* Range guide for race users */}
      {isRace && (
        <View style={s.rangeRow}>
          <Text style={[s.rangeHint, { color: C.textMuted }]}>Min safe: {MIN_SAFE_RACE}</Text>
          <Text style={[s.rangeHint, { color: C.primary }]}>Sweet spot: 4–5</Text>
          <Text style={[s.rangeHint, { color: C.textMuted }]}>Max: 6</Text>
        </View>
      )}

      {/* Safety warning */}
      {showWarning && (
        <View style={[s.warning, { backgroundColor: C.accentFaint, borderColor: C.accent }]}>
          <AlertTriangle size={16} color={C.accent} style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={[s.warningText, { color: C.textPrimary }]}>
            Fewer than {MIN_SAFE_RACE} days a week for a race increases injury risk. I'll work with it, but we'll be careful.
          </Text>
        </View>
      )}

      {!showWarning && <CoachTip text={getTip()} />}
    </OnboardingShell>
  );
}

const s = StyleSheet.create({
  rangeRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  rangeHint:   { fontFamily: FontFamily.uiRegular, fontSize: 11 },
  warning: {
    flexDirection:  'row',
    gap:            10,
    borderRadius:   Radius.md,
    borderWidth:    1,
    padding:        13,
  },
  warningText: { fontFamily: FontFamily.uiRegular, fontSize: 12, lineHeight: 18, flex: 1 },
});