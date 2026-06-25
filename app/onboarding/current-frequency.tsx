// app/onboarding/current-frequency.tsx — Step 6 of 9
// Question: How many days a week do you run right now?

import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { StepCounter }   from '../../components/shared/Stepcounter';
import { useOnboarding } from '../../context/OnboardingContext';

export default function CurrentFrequencyScreen() {
  const { data, setCurrentRunDays } = useOnboarding();
  const [value, setValue]           = useState(data.currentRunDays);

  const handleContinue = () => {
    setCurrentRunDays(value);
    router.push('/onboarding/desired-frequency');
  };

  const tips: Record<number, string> = {
    0: "Starting from zero is starting. That's the hardest part — and you've already done it.",
    1: "One day a week is a foundation. We'll build from here.",
    2: "Two days is a solid base. Most training plans can work with this.",
    3: "Three days a week is where a lot of improvement happens.",
    4: "Four days puts you in strong training territory.",
    5: "Five days is committed. We'll make sure recovery is built in.",
    6: "Six days takes careful management — rest matters as much as miles.",
    7: "Running every day takes experience. We'll be careful with load.",
  };

  return (
    <OnboardingShell
      step={6}
      canContinue={true}
      onContinue={handleContinue}
    >
      <OnboardingQuestion
        question="How many days a week do you run right now?"
        subtext="Be honest — there's no wrong answer here."
      />

      <StepCounter
        min={0}
        max={7}
        value={value}
        onChange={setValue}
        unit="days / week"
      />

      <CoachTip text={tips[value]} />
    </OnboardingShell>
  );
}