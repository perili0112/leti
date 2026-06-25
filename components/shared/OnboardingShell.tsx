// components/shared/OnboardingShell.tsx
//
// Three-zone layout for every onboarding survey screen:
//   HEADER  — back button + step indicator + segmented progress bar (fixed)
//   BODY    — question text + option cards (scrollable)
//   FOOTER  — Continue CTA (fixed, anchored to bottom)
//
// This shell enforces visual consistency across all 9 steps.
// Individual screens only need to supply: question, options, tip, step.

import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FontFamily, Spacing, Radius, Shadow } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

const TOTAL_STEPS = 9;

interface OnboardingShellProps {
  step:        number;          // 1-based
  children:    React.ReactNode; // question + cards + tip
  canContinue: boolean;
  onContinue:  () => void;
  ctaLabel?:   string;          // default "Continue"
  hideBack?:   boolean;
}

// ── Segmented progress bar ────────────────────────────────────────
function SegmentedBar({ step }: { step: number }) {
  const { colors: C } = useTheme();
  return (
    <View style={bar.row}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            bar.seg,
            {
              backgroundColor: i < step ? C.primary : C.border,
              flex: 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

const bar = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, height: 3 },
  seg: { borderRadius: 2 },
});

// ── Main shell ────────────────────────────────────────────────────
export function OnboardingShell({
  step, children, canContinue, onContinue, ctaLabel = 'Continue', hideBack,
}: OnboardingShellProps) {
  const { colors: C, isDark } = useTheme();

  // Animate the CTA enable/disable so it doesn't just snap
  const ctaOpacity = useRef(new Animated.Value(canContinue ? 1 : 0.38)).current;
  React.useEffect(() => {
    Animated.timing(ctaOpacity, {
      toValue:        canContinue ? 1 : 0.38,
      duration:       200,
      useNativeDriver: true,
    }).start();
  }, [canContinue]);

  return (
    <SafeAreaView style={[shell.safe, { backgroundColor: C.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* ── HEADER ── */}
        <View style={[shell.header, { borderBottomColor: C.border }]}>
          {/* Back button */}
          <TouchableOpacity
            style={[shell.backBtn, { borderColor: C.borderMedium, backgroundColor: C.card }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
            disabled={hideBack}
          >
            {!hideBack && <ArrowLeft size={16} color={C.textSecondary} />}
          </TouchableOpacity>

          {/* Progress area */}
          <View style={shell.progressArea}>
            <SegmentedBar step={step} />
            <Text style={[shell.stepLabel, { color: C.textTertiary }]}>
              {step} of {TOTAL_STEPS}
            </Text>
          </View>

          {/* Spacer to balance back button */}
          <View style={{ width: 36 }} />
        </View>

        {/* ── BODY ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[shell.body, { paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* ── FOOTER ── */}
        <View style={[shell.footer, { backgroundColor: C.bg, borderTopColor: C.border }]}>
          <Animated.View style={{ opacity: ctaOpacity }}>
            <TouchableOpacity
              style={[
                shell.cta,
                {
                  backgroundColor: canContinue ? C.dark : C.border,
                },
              ]}
              onPress={onContinue}
              activeOpacity={0.88}
              disabled={!canContinue}
            >
              <Text style={[
                shell.ctaText,
                { color: canContinue ? '#FFFFFF' : C.textMuted },
              ]}>
                {ctaLabel}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Question heading — used inside body ──────────────────────────
export function OnboardingQuestion({
  question, subtext,
}: { question: string; subtext?: string }) {
  const { colors: C } = useTheme();
  return (
    <View style={q.wrap}>
      <Text style={[q.text, { color: C.textPrimary }]}>{question}</Text>
      {subtext && (
        <Text style={[q.sub, { color: C.textSecondary }]}>{subtext}</Text>
      )}
    </View>
  );
}

// ── Coach tip — replaces bordered tip boxes ──────────────────────
export function CoachTip({ text }: { text: string }) {
  const { colors: C } = useTheme();
  return (
    <Text style={[tip.text, { color: C.textTertiary }]}>{text}</Text>
  );
}

const shell = StyleSheet.create({
  safe:        { flex: 1 },
  header: {
    height:           64,
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: Spacing.md,
    gap:              12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width:          36,
    height:         36,
    borderRadius:   10,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  progressArea: { flex: 1, gap: 6 },
  stepLabel: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   10,
    textAlign:  'right',
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.xl,
    gap:               Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderTopWidth:    1,
  },
  cta: {
    height:         56,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily:    FontFamily.uiSemiBold,
    fontSize:      15,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

const q = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 4 },
  text: {
    fontFamily:    FontFamily.displayBold,
    fontSize:      26,
    lineHeight:    32,
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: FontFamily.uiRegular,
    fontSize:   13,
    lineHeight: 20,
  },
});

const tip = StyleSheet.create({
  text: {
    fontFamily:  FontFamily.uiRegular,
    fontSize:    12,
    lineHeight:  19,
    fontStyle:   'italic',
    marginTop:   4,
    paddingHorizontal: 2,
  },
});