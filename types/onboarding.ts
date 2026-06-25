// types/onboarding.ts

export type RunningExperience = 'new' | 'getting-comfortable' | 'steady';

export type PrimaryGoal = 'stay-fit' | 'race' | 'other';

export type RaceDistance = '5k' | '10k' | 'half' | 'marathon' | 'ultra';

export type TimeGoalType = 'just-finish' | 'specific-time';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface OnboardingData {
  // Auth
  firstName: string;

  // Onboarding steps
  experience:        RunningExperience | null;
  primaryGoal:       PrimaryGoal | null;
  raceDistance:      RaceDistance | null;
  raceDate:          Date | null;
  timeGoal:          TimeGoalType | null;
  currentRunDays:    number;
  desiredRunDays:    number;
  timeOfDay:         TimeOfDay | null;
  additionalNotes:   string;
}

export interface MockUser {
  firstName: string;
  email: string;
}

export type PaywallVariant = 'race' | 'stay-fit';

export interface PricingPlan {
  id:          string;
  name:        string;
  badge?:      string;
  detail:      string;
  price:       string;
  period:      string;
  saveLabel?:  string;
  isHero:      boolean;
}

export interface GraphPoint {
  week:     number;
  label:    string;
  distance: number;  // km or minutes depending on variant
}
