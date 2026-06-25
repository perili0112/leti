// data/mockOnboardingData.ts

import type { GraphPoint, PricingPlan, OnboardingData } from '../types/onboarding';

// ── Mock user scenario: marathon beginner ──────────────────────
export const MOCK_MARATHON_USER: OnboardingData = {
  firstName:      'Dimi',
  experience:     'getting-comfortable',
  primaryGoal:    'race',
  raceDistance:   'marathon',
  raceDate:       new Date(Date.now() + 20 * 7 * 24 * 60 * 60 * 1000), // 20 weeks
  timeGoal:       'just-finish',
  currentRunDays: 2,
  desiredRunDays: 4,
  timeOfDay:      'morning',
  additionalNotes: '',
};

// ── Mock user scenario: stay fit ──────────────────────────────
export const MOCK_STAY_FIT_USER: OnboardingData = {
  firstName:      'Dimi',
  experience:     'steady',
  primaryGoal:    'stay-fit',
  raceDistance:   null,
  raceDate:       null,
  timeGoal:       null,
  currentRunDays: 3,
  desiredRunDays: 4,
  timeOfDay:      'morning',
  additionalNotes: '',
};

// ── Graph: race variant (growing weekly km) ───────────────────
export const RACE_GRAPH_POINTS: GraphPoint[] = [
  { week: 0,  label: 'Now',     distance: 12 },
  { week: 2,  label: 'Wk 2',   distance: 18 },
  { week: 4,  label: 'Wk 4',   distance: 24 },
  { week: 6,  label: 'Wk 6',   distance: 30 },
  { week: 8,  label: 'Wk 8',   distance: 38 },
  { week: 10, label: 'Wk 10',  distance: 45 },
  { week: 12, label: 'Wk 12',  distance: 52 },
  { week: 14, label: 'Wk 14',  distance: 55 },
  { week: 16, label: 'Wk 16',  distance: 48 }, // taper
  { week: 18, label: 'Wk 18',  distance: 38 }, // taper
  { week: 20, label: 'Race',   distance: 42 }, // race
];

// ── Graph: stay-fit variant (steady weekly minutes) ───────────
export const STAY_FIT_GRAPH_POINTS: GraphPoint[] = [
  { week: 0, label: 'Wk 1', distance: 150 },
  { week: 1, label: 'Wk 2', distance: 148 },
  { week: 2, label: 'Wk 3', distance: 155 },
  { week: 3, label: 'Wk 4', distance: 150 },
  { week: 4, label: 'Wk 5', distance: 152 },
  { week: 5, label: 'Wk 6', distance: 150 },
];

// ── Pricing plans ─────────────────────────────────────────────
export const PRICING_PLANS: PricingPlan[] = [
  {
    id:         'annual',
    name:       'Annual',
    badge:      'Best value',
    detail:     '$4.92/mo equivalent · Save 45%',
    price:      '$59',
    period:     '/ year',
    saveLabel:  'Includes first month at $4.95',
    isHero:     true,
  },
  {
    id:         'monthly',
    name:       'Monthly',
    detail:     'Full price · Cancel anytime',
    price:      '$8.95',
    period:     '/ mo',
    isHero:     false,
  },
];

// ── Onboarding total steps ────────────────────────────────────
export const ONBOARDING_TOTAL_STEPS = 9;
