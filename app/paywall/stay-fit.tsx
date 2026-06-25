// app/paywall/stay-fit.tsx
// Paywall for stay-fit users. Shows a flat steady-line graph.

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LineGraph }     from '../../components/paywall/LineGraph';
import { useTheme }      from '../../constants/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  STAY_FIT_GRAPH_POINTS, PRICING_PLANS,
} from '../../data/mockOnboardingData';
import { FontFamily, Radius, Shadow } from '../../constants/theme';
import type { PricingPlan } from '../../types/onboarding';

function PlanCard({ plan, C }: { plan: PricingPlan; C: any }) {
  return (
    <View style={[
      styles.planCard,
      {
        backgroundColor: C.card,
        borderColor:     plan.isHero ? C.dark  : C.border,
        borderWidth:     plan.isHero ? 2       : 1,
        opacity:         plan.isHero ? 1       : 0.72,
      },
    ]}>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.planName, { color: C.textPrimary }]}>{plan.name}</Text>
          {plan.badge && (
            <View style={[styles.badge, { backgroundColor: C.dark }]}>
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.planDetail, { color: C.textMuted }]}>{plan.detail}</Text>
        {plan.saveLabel && (
          <Text style={[styles.saveLabel, { color: C.success }]}>{plan.saveLabel}</Text>
        )}
      </View>
      <Text style={[styles.price, { color: C.textPrimary }]}>
        {plan.price}{' '}
        <Text style={[styles.period, { color: C.textMuted }]}>{plan.period}</Text>
      </Text>
    </View>
  );
}

export default function PaywallStayFitScreen() {
  const { colors: C, isDark } = useTheme();
  const { data }              = useOnboarding();
  const firstName             = data.firstName || 'You';

  const handleSubscribe = (planId: string) => {
    console.log('Subscribe:', planId);
    // router.replace('/(tabs)')
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Graph card — flat line signals consistency */}
        <View style={[styles.graphCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.graphTitle, { color: C.textMuted }]}>
            Weekly active minutes
          </Text>
          <LineGraph
            points={STAY_FIT_GRAPH_POINTS}
            unit="min"
            yLabels={['200', '150', '100', '50']}
            xLabels={['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6']}
            color={C.dark}
          />
          <View style={[styles.annotation, { backgroundColor: C.primaryFaint, borderColor: C.borderMedium }]}>
            <Text style={[styles.annotationText, { color: C.textSecondary }]}>
              Steady effort · ~150 active minutes per week · This is about showing up
            </Text>
          </View>
        </View>

        {/* Headline — consistency framing */}
        <Text style={[styles.headline, { color: C.textPrimary }]}>
          Consistency is what you value.{'\n'}Not motivation. Not burnout.
        </Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>
          A plan that keeps you steady. Week after week.
        </Text>

        {/* Intro offer */}
        <View style={[styles.offer, { backgroundColor: C.cardAlt, borderColor: C.border }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.offerTitle, { color: C.textPrimary }]}>
              First month{' '}
              <Text style={{ color: C.accent, fontFamily: FontFamily.uiSemiBold }}>$4.95</Text>
              {' '}· 45% off
            </Text>
            <Text style={[styles.offerSub, { color: C.textMuted }]}>Limited-time welcome offer</Text>
          </View>
          <View style={[styles.offerBadge, { backgroundColor: C.dark }]}>
            <Text style={styles.offerBadgeText}>New</Text>
          </View>
        </View>

        {/* Pricing cards */}
        <View style={styles.plans}>
          {PRICING_PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} C={C} />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: C.dark, ...Shadow.button }]}
          onPress={() => handleSubscribe('annual')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>Try 7 days free · then $4.95 first month</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.freeLink}
          activeOpacity={0.7}
        >
          <Text style={[styles.freeLinkText, { color: C.textMuted }]}>
            Continue with free tracking
          </Text>
        </TouchableOpacity>

        <View style={styles.legal}>
          {['Restore', 'Terms', 'Privacy'].map(l => (
            <TouchableOpacity key={l} onPress={() => console.log(l)} activeOpacity={0.7}>
              <Text style={[styles.legalText, { color: C.textTertiary }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1 },
  scroll:         { padding: 20, gap: 20, paddingBottom: 40 },
  graphCard:      { borderRadius: Radius.lg, borderWidth: 1, padding: 16, gap: 14 },
  graphTitle:     { fontFamily: FontFamily.uiSemiBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  annotation:     { borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  annotationText: { fontFamily: FontFamily.uiRegular, fontSize: 11, lineHeight: 17 },
  headline:       { fontFamily: FontFamily.displayBold, fontSize: 24, letterSpacing: -0.5, lineHeight: 32 },
  sub:            { fontFamily: FontFamily.uiRegular, fontSize: 13, lineHeight: 20, marginTop: -10 },
  offer:          { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  offerTitle:     { fontFamily: FontFamily.uiRegular, fontSize: 13 },
  offerSub:       { fontFamily: FontFamily.uiRegular, fontSize: 11 },
  offerBadge:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  offerBadgeText: { fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  plans:          { gap: 10 },
  planCard:       { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, padding: 14, gap: 10 },
  planName:       { fontFamily: FontFamily.uiSemiBold, fontSize: 14 },
  planDetail:     { fontFamily: FontFamily.uiRegular, fontSize: 11 },
  saveLabel:      { fontFamily: FontFamily.uiSemiBold, fontSize: 11 },
  badge:          { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:      { fontFamily: FontFamily.uiSemiBold, fontSize: 9, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  price:          { fontFamily: FontFamily.displayBold, fontSize: 20 },
  period:         { fontFamily: FontFamily.uiRegular, fontSize: 12 },
  cta:            { height: 58, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  ctaText:        { fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: '#fff', textAlign: 'center', letterSpacing: 0.3 },
  freeLink:       { alignItems: 'center', paddingVertical: 4 },
  freeLinkText:   { fontFamily: FontFamily.uiRegular, fontSize: 13, textDecorationLine: 'underline' },
  legal:          { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legalText:      { fontFamily: FontFamily.uiRegular, fontSize: 11, textDecorationLine: 'underline' },
});
