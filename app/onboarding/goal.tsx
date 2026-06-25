// app/onboarding/goal.tsx — Step 2 of 9
// Question: What brings you here?

import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Heart, Flag, Sparkles } from 'lucide-react-native';
import {
  OnboardingShell,
  OnboardingQuestion,
  CoachTip,
} from '../../components/shared/OnboardingShell';
import { OptionCard }    from '../../components/shared/OptionCard';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { FontFamily, Radius } from '../../constants/theme';
import type { PrimaryGoal } from '../../types/onboarding';

const OPTIONS: {
  value: PrimaryGoal;
  title: string;
  desc:  string;
  icon:  (color: string) => React.ReactNode;
}[] = [
  {
    value: 'stay-fit',
    title: 'Stay fit',
    desc:  'Building a healthy routine — no race in mind',
    icon:  c => <Heart size={22} color={c} />,
  },
  {
    value: 'race',
    title: 'Train for a race',
    desc:  '5K, 10K, half marathon, marathon, or ultra',
    icon:  c => <Flag size={22} color={c} />,
  },
  {
    value: 'other',
    title: 'Something else',
    desc:  'Tell me in your own words',
    icon:  c => <Sparkles size={22} color={c} />,
  },
];

export default function GoalScreen() {
  const { colors: C }           = useTheme();
  const { data, setPrimaryGoal } = useOnboarding();
  const [selected, setSelected]  = useState<PrimaryGoal | null>(data.primaryGoal);
  const [otherText, setOtherText] = useState('');

  const canContinue = !!selected && (selected !== 'other' || otherText.trim().length > 0);

  const handleContinue = () => {
    if (!selected) return;
    setPrimaryGoal(selected);
    if (selected === 'race') router.push('/onboarding/race-distance');
    else                     router.push('/onboarding/current-frequency');
  };

  return (
    <OnboardingShell
      step={2}
      canContinue={canContinue}
      onContinue={handleContinue}
    >
      <OnboardingQuestion
        question="What brings you here?"
        subtext="This shapes everything — your plan, your pacing, your check-ins."
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

      {selected === 'other' && (
        <View style={[s.textarea, { borderColor: C.primary, backgroundColor: C.card }]}>
          <TextInput
            style={[s.input, { color: C.textPrimary }]}
            value={otherText}
            onChangeText={setOtherText}
            placeholder="Tell me what you're working towards..."
            placeholderTextColor={C.textTertiary}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </View>
      )}
    </OnboardingShell>
  );
}

const s = StyleSheet.create({
  textarea: {
    borderWidth:   1.5,
    borderRadius:  Radius.md,
    minHeight:     96,
  },
  input: {
    padding:    14,
    fontFamily: FontFamily.uiRegular,
    fontSize:   14,
    lineHeight: 22,
    minHeight:  96,
  },
});