// app/onboarding/race-distance.tsx — Step 3 of 9
// Question: What distance? (2-column grid layout)

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { GridOptionCard } from '../../components/shared/GridoptionCard';
import { useOnboarding }  from '../../context/OnboardingContext';
import type { RaceDistance } from '../../types/onboarding';

const OPTIONS: { value: RaceDistance; label: string; sub?: string; emoji: string }[] = [
  { value: '5k',       label: '5K',           emoji: '🏃'  },
  { value: '10k',      label: '10K',          emoji: '🏃'  },
  { value: 'half',     label: 'Half',         sub: '21.1 km', emoji: '🏅' },
  { value: 'marathon', label: 'Marathon',     sub: '42.2 km', emoji: '🏆' },
  { value: 'ultra',    label: 'Ultra (42K+)', sub: 'For the bold', emoji: '⛰️' },
];

export default function RaceDistanceScreen() {
  const { data, setRaceDistance } = useOnboarding();
  const [selected, setSelected]   = useState<RaceDistance | null>(data.raceDistance);

  const handleContinue = () => {
    if (!selected) return;
    setRaceDistance(selected);
    router.push('/onboarding/race-date');
  };

  // Split into 2-column pairs + full-width ultra
  const pairs    = OPTIONS.slice(0, 4);
  const ultraOpt = OPTIONS[4];

  return (
    <OnboardingShell
      step={3}
      canContinue={!!selected}
      onContinue={handleContinue}
    >
      <OnboardingQuestion
        question="What distance are you training for?"
      />

      {/* 2×2 grid */}
      <View style={s.grid}>
        {[0, 1].map(row => (
          <View key={row} style={s.row}>
            {pairs.slice(row * 2, row * 2 + 2).map(opt => (
              <GridOptionCard
                key={opt.value}
                label={opt.label}
                subLabel={opt.sub}
                icon={opt.emoji}
                selected={selected === opt.value}
                onPress={() => setSelected(opt.value)}
                flex={1}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Ultra — full width */}
      <GridOptionCard
        label={ultraOpt.label}
        subLabel={ultraOpt.sub}
        icon={ultraOpt.emoji}
        selected={selected === ultraOpt.value}
        onPress={() => setSelected(ultraOpt.value)}
        flex={undefined}
      />

      <CoachTip text="Not sure yet? Pick the one that feels right. We can always adjust later." />
    </OnboardingShell>
  );
}

const s = StyleSheet.create({
  grid: { gap: 10 },
  row:  { flexDirection: 'row', gap: 10 },
});