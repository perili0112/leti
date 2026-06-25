// app/onboarding/notes.tsx — Step 9 of 9
// Question: Anything else I should know?
// This is the final onboarding step before the paywall.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import {
  OnboardingShell,
  OnboardingQuestion,
} from '../../components/shared/OnboardingShell';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { FontFamily, Radius } from '../../constants/theme';

// Tap-to-fill suggestion chips
const SUGGESTIONS = [
  'Old knee injury',
  'I love hills',
  'No early mornings on weekends',
  'Lower back issues',
  'Prefer trails',
  'Avoid long intervals',
];

export default function NotesScreen() {
  const { colors: C }                 = useTheme();
  const { data, setAdditionalNotes }  = useOnboarding();
  const [notes, setNotes]             = useState(data.additionalNotes);

  const handleCreate = () => {
    setAdditionalNotes(notes);
    console.log('Onboarding complete:', { ...data, additionalNotes: notes });
    if (data.primaryGoal === 'race') router.replace('/paywall/race');
    else                             router.replace('/paywall/stay-fit');
  };

  const addSuggestion = (s: string) => {
    setNotes(prev => prev ? `${prev}, ${s}` : s);
  };

  return (
    <OnboardingShell
      step={9}
      canContinue={true}
      onContinue={handleCreate}
      ctaLabel="Build my plan"
    >
      <OnboardingQuestion
        question="Anything else I should know?"
        subtext="Injuries, preferences, things to avoid — or leave it blank. Totally optional."
      />

      {/* Suggestion chips */}
      <View style={s.chips}>
        {SUGGESTIONS.map(sug => (
          <TouchableOpacity
            key={sug}
            style={[s.chip, {
              backgroundColor: notes.includes(sug) ? C.primaryFaint : C.card,
              borderColor:     notes.includes(sug) ? C.primary : C.border,
              borderWidth:     notes.includes(sug) ? 1.5 : 1,
            }]}
            onPress={() => addSuggestion(sug)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, {
              color: notes.includes(sug) ? C.primary : C.textSecondary,
            }]}>
              {sug}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Free text area */}
      <View style={[s.textarea, { borderColor: C.borderMedium, backgroundColor: C.card }]}>
        <TextInput
          style={[s.input, { color: C.textPrimary }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Or write anything here..."
          placeholderTextColor={C.textTertiary}
          multiline
          textAlignVertical="top"
        />
        {notes.length > 0 && (
          <TouchableOpacity
            style={s.clearBtn}
            onPress={() => setNotes('')}
            activeOpacity={0.7}
          >
            <Text style={[s.clearText, { color: C.textTertiary }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[s.skipHint, { color: C.textTertiary }]}>
        You can always add this later from your profile.
      </Text>
    </OnboardingShell>
  );
}

const s = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  chip: {
    height:          34,
    paddingHorizontal: 12,
    borderRadius:    Radius.full,
    alignItems:      'center',
    justifyContent:  'center',
  },
  chipText: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   12,
  },
  textarea: {
    borderWidth:  1.5,
    borderRadius: Radius.md,
    minHeight:    110,
    position:     'relative',
  },
  input: {
    padding:    14,
    fontFamily: FontFamily.uiRegular,
    fontSize:   14,
    lineHeight: 22,
    minHeight:  110,
  },
  clearBtn: {
    position: 'absolute',
    bottom:   10,
    right:    12,
  },
  clearText: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   11,
  },
  skipHint: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   11,
    textAlign:  'center',
  },
});