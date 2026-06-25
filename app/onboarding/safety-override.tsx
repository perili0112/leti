// app/onboarding/safety-override.tsx
// Triggered when the user picks a race date with not enough prep time.
// Leti intervenes — but gently, with options, not a hard block.

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Calendar, TrendingDown, Shield } from 'lucide-react-native';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { OptionCard }    from '../../components/shared/OptionCard';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { FontFamily } from '../../constants/theme';
import type { RaceDistance } from '../../types/onboarding';

type SafeChoice = 'shorter' | 'later' | 'careful';

const SHORTER: Partial<Record<RaceDistance, RaceDistance>> = {
  marathon: '10k',
  ultra:    'half',
  half:     '5k',
  '10k':    '5k',
};

export default function SafetyOverrideScreen() {
  const { colors: C }                      = useTheme();
  const { data, setRaceDistance, setRaceDate } = useOnboarding();
  const [selected, setSelected]            = useState<SafeChoice | null>(null);

  const shorterDist = SHORTER[data.raceDistance ?? 'marathon'] ?? '5k';

  const OPTIONS: {
    value: SafeChoice;
    title: string;
    desc:  string;
    icon:  (color: string) => React.ReactNode;
  }[] = [
    {
      value: 'shorter',
      title: `Shift to a ${shorterDist.toUpperCase()}`,
      desc:  `A realistic plan that peaks safely within your window`,
      icon:  c => <TrendingDown size={22} color={c} />,
    },
    {
      value: 'later',
      title: 'Save the race for later',
      desc:  'I\'ll find a future event and build a full plan from scratch',
      icon:  c => <Calendar size={22} color={c} />,
    },
    {
      value: 'careful',
      title: 'Proceed carefully',
      desc:  'A conservative run/walk plan — I\'ll monitor your load closely',
      icon:  c => <Shield size={22} color={c} />,
    },
  ];

  const handleConfirm = () => {
    if (!selected) return;
    if (selected === 'shorter') {
      setRaceDistance(shorterDist);
    } else if (selected === 'later') {
      const newDate = new Date(Date.now() + 20 * 7 * 24 * 60 * 60 * 1000);
      setRaceDate(newDate);
    }
    router.push('/onboarding/time-goal');
  };

  return (
    <OnboardingShell
      step={4}
      canContinue={!!selected}
      onContinue={handleConfirm}
      ctaLabel="Confirm"
    >
      {/* Leti speaks directly */}
      <View style={s.letiCard}>
        <View style={[s.dot, { backgroundColor: C.primary }]} />
        <Text style={[s.letiText, { color: C.textPrimary }]}>
          This is a big ask — and I want to be honest with you.
        </Text>
      </View>

      <OnboardingQuestion
        question="Let's find a safer path."
        subtext={`A ${(data.raceDistance ?? 'marathon').toUpperCase()} typically needs ${
          { '5k': 4, '10k': 6, 'half': 10, 'marathon': 12, 'ultra': 16 }[data.raceDistance ?? 'marathon']
        }+ weeks. The date you chose doesn't leave enough room to train safely.`}
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

      <CoachTip text="Whichever you choose, I'll build the best possible plan around it." />
    </OnboardingShell>
  );
}

const s = StyleSheet.create({
  letiCard: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
  },
  dot: {
    width:       8,
    height:      8,
    borderRadius: 4,
    flexShrink:  0,
    marginTop:   2,
  },
  letiText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize:   13,
    lineHeight: 20,
    flex:       1,
    fontStyle:  'italic',
  },
});