// app/onboarding/experience.tsx — Step 1 of 9
// Question: How would you describe your running history?

import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Activity, Zap, Footprints } from 'lucide-react-native';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { OptionCard }    from '../../components/shared/OptionCard';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import type { RunningExperience } from '../../types/onboarding';

const OPTIONS: {
  value:   RunningExperience;
  title:   string;
  desc:    string;
  icon:    (color: string) => React.ReactNode;
}[] = [
  {
    value: 'new',
    title: 'Just starting out',
    desc:  'New to running, or returning after a long break',
    icon:  c => <Footprints size={22} color={c} />,
  },
  {
    value: 'getting-comfortable',
    title: 'Getting comfortable',
    desc:  'I run occasionally — a few times a month',
    icon:  c => <Activity size={22} color={c} />,
  },
  {
    value: 'steady',
    title: 'Steady runner',
    desc:  'I run most weeks and have been for a while',
    icon:  c => <Zap size={22} color={c} />,
  },
];

export default function ExperienceScreen() {
  const { colors: C }            = useTheme();
  const { data, setExperience }  = useOnboarding();
  const [selected, setSelected]  = useState<RunningExperience | null>(data.experience);

  const handleContinue = () => {
    if (!selected) return;
    setExperience(selected);
    router.push('/onboarding/goal');
  };

  return (
    <OnboardingShell
      step={1}
      canContinue={!!selected}
      onContinue={handleContinue}
    >
      <OnboardingQuestion
        question="How would you describe your running history?"
      />

      <View style={{ gap: 10 }}>
        {OPTIONS.map(opt => {
          const isSelected = selected === opt.value;
          const iconColor  = isSelected ? '#fff' : C.primary;
          return (
            <OptionCard
              key={opt.value}
              title={opt.title}
              description={opt.desc}
              icon={opt.icon(iconColor)}
              selected={isSelected}
              onPress={() => setSelected(opt.value)}
            />
          );
        })}
      </View>

      <CoachTip text="Wherever you are is the right starting point. This just helps me set a pace that feels good, not overwhelming." />
    </OnboardingShell>
  );
}