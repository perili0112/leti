// app/onboarding/time-of-day.tsx — Step 8 of 9
// Question: When do you prefer to run?
// Layout: 3-column icon grid (morning / afternoon / evening)

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Sunrise, Sun, Moon } from 'lucide-react-native';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { GridOptionCard } from '../../components/shared/GridoptionCard';
import { useTheme }       from '../../constants/ThemeContext';
import { useOnboarding }  from '../../context/OnboardingContext';
import type { TimeOfDay } from '../../types/onboarding';

const OPTIONS: {
  value:   TimeOfDay;
  label:   string;
  sub:     string;
  icon:    (color: string) => React.ReactNode;
}[] = [
  {
    value: 'morning',
    label: 'Morning',
    sub:   'Before the day begins',
    icon:  c => <Sunrise size={24} color={c} />,
  },
  {
    value: 'afternoon',
    label: 'Afternoon',
    sub:   'Midday or lunch',
    icon:  c => <Sun size={24} color={c} />,
  },
  {
    value: 'evening',
    label: 'Evening',
    sub:   'After work',
    icon:  c => <Moon size={24} color={c} />,
  },
];

const TIPS: Record<TimeOfDay, string> = {
  morning:   "Morning runners tend to be more consistent — the day can't get in the way.",
  afternoon: "Afternoon is when most people feel physically strongest.",
  evening:   "Evening runs are great for stress relief. We'll keep them from interfering with sleep.",
};

export default function TimeOfDayScreen() {
  const { colors: C }          = useTheme();
  const { data, setTimeOfDay } = useOnboarding();
  const [selected, setSelected] = useState<TimeOfDay | null>(data.timeOfDay);

  const handleContinue = () => {
    if (!selected) return;
    setTimeOfDay(selected);
    router.push('/onboarding/notes');
  };

  return (
    <OnboardingShell
      step={8}
      canContinue={!!selected}
      onContinue={handleContinue}
    >
      <OnboardingQuestion
        question="When do you prefer to run?"
        subtext="I'll schedule your sessions around your natural rhythm."
      />

      <View style={s.row}>
        {OPTIONS.map(opt => {
          const isSelected = selected === opt.value;
          const iconColor  = isSelected ? '#fff' : C.primary;
          return (
            <GridOptionCard
              key={opt.value}
              label={opt.label}
              subLabel={opt.sub}
              iconNode={opt.icon(iconColor)}
              selected={isSelected}
              onPress={() => setSelected(opt.value)}
              flex={1}
            />
          );
        })}
      </View>

      {selected && <CoachTip text={TIPS[selected]} />}
    </OnboardingShell>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
});