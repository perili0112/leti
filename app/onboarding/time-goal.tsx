// app/onboarding/time-goal.tsx — Step 5 of 9
// Question: What's your race goal?

import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle, Timer } from 'lucide-react-native';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { OptionCard }    from '../../components/shared/OptionCard';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import type { TimeGoalType } from '../../types/onboarding';

function weeksUntil(d: Date | null) {
  if (!d) return 99;
  return Math.floor((d.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000));
}

export default function TimeGoalScreen() {
  const { colors: C }          = useTheme();
  const { data, setTimeGoal }  = useOnboarding();
  const [selected, setSelected] = useState<TimeGoalType | null>(data.timeGoal);

  const weeks     = weeksUntil(data.raceDate);
  const canTime   = weeks >= 12;

  const handleContinue = () => {
    if (!selected) return;
    setTimeGoal(selected);
    router.push('/onboarding/current-frequency');
  };

  return (
    <OnboardingShell
      step={5}
      canContinue={!!selected}
      onContinue={handleContinue}
    >
      <OnboardingQuestion
        question="What's your race goal?"
        subtext={data.raceDistance
          ? `${data.raceDistance.toUpperCase()} · ${weeks} week${weeks !== 1 ? 's' : ''} to race`
          : undefined
        }
      />

      <View style={{ gap: 10 }}>
        <OptionCard
          title="Just finish"
          description="Run smart, cross the line feeling good — that's the win"
          icon={<CheckCircle size={22} color={selected === 'just-finish' ? '#fff' : C.primary} />}
          selected={selected === 'just-finish'}
          onPress={() => setSelected('just-finish')}
        />
        <OptionCard
          title="Specific time goal"
          description={canTime
            ? 'Set a target finish time and train towards it'
            : 'Not available — needs 12+ weeks of prep time'
          }
          icon={<Timer size={22} color={
            !canTime ? C.textTertiary :
            selected === 'specific-time' ? '#fff' : C.primary
          } />}
          selected={selected === 'specific-time'}
          onPress={() => canTime && setSelected('specific-time')}
          disabled={!canTime}
        />
      </View>

      <CoachTip text={
        canTime
          ? "Both are valid goals. Finishing well is harder than it sounds."
          : "With more time we can aim for a specific finish. For now, let's focus on getting you there."
      } />
    </OnboardingShell>
  );
}