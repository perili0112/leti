// ─────────────────────────────────────────────────────────────
// constants/mockData.ts
//
// All TypeScript types for the app + realistic placeholder data.
// When connecting to Supabase, keep the types and delete/replace
// the MOCK_* constants at the bottom.
// ─────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────

export type RunType = 'easy' | 'tempo' | 'long' | 'interval' | 'race';
export type PlanType = 'race' | 'hobby' | 'casual';
export type GoalType = 'distance' | 'runs' | 'pace' | 'streak';

// ── User ──────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  fullName: string;
  email: string;
  isPremium: boolean;
  avatarInitial: string;
  streak: number; // consecutive runs
}

// ── Plan ──────────────────────────────────────────────────────

export interface NextRun {
  name: string;
  subtitle: string;         // e.g. "Conversational pace · low effort"
  type: RunType;
  distanceKm: number;
  estTimeMin: number;       // estimated minutes
  effortLabel: string;      // e.g. "Zone 2"
  targetPace: string;       // formatted: "5:45"
  // Position in week: "Run 2 of 3"
  runIndexThisWeek: number;
  totalRunsThisWeek: number;
}

export interface ActivePlan {
  id: string;
  type: PlanType;
  currentWeek: number;
  totalWeeks: number;
  progressPct: number;
  nextRun: NextRun | null;  // null = rest day
  // Race runner extras
  raceName?: string;
  raceDate?: string;
  daysToRace?: number;
}

// ── Runs ──────────────────────────────────────────────────────

export interface Run {
  id: string;
  date: string;         // display string e.g. 'Thu 29 May'
  shortDay: string;     // e.g. 'Thu'
  name: string;
  type: RunType;
  distanceKm: number;
  durationSec: number;
  avgPace: string;      // formatted: '5:14'
  isPR: boolean;
  routePoints?: Array<{ x: number; y: number }>; // for map thumbnail
}

// ── Goals ─────────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  current: number;
  target: number;
  unit: string;         // 'km', 'runs', 'days'
  progressPct: number;
  resetsLabel: string;  // 'Resets 1 Jul' | 'Resets weekly'
}

// ── Weekly progress (for Home "This Week" card) ───────────────

export interface WeeklyProgress {
  distanceKm: number;
  runsCompleted: number;
  totalRuns: number;    // as per plan; null if no plan
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

/** Time-of-day greeting */
export function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}.`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}.`;
  return `Good evening, ${firstName}.`;
}

/** Format "Tuesday, 3 June" */
export function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Format seconds → "30:21" or "1:02:45" */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Run type display config */
export const RUN_TYPE_CONFIG: Record<
  RunType,
  { label: string; color: string; bg: string }
> = {
  easy:     { label: 'Easy Run',  color: '#1B6C70', bg: '#EAF3F3' },
  tempo:    { label: 'Tempo Run', color: '#E8991C', bg: '#FEF4E2' },
  long:     { label: 'Long Run',  color: '#152B2D', bg: '#E8EDEC' },
  interval: { label: 'Intervals', color: '#7C4DFF', bg: '#F3EEFF' },
  race:     { label: 'Race Day',  color: '#0A1A1B', bg: '#EBEBEB' },
};

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// To test different states, set any of these to null (or false).
// ─────────────────────────────────────────────────────────────

export const MOCK_USER: User = {
  id: 'user_dimi',
  firstName: 'Dimi',
  fullName: 'Dimi Papadopoulos',
  email: 'dimi@example.com',
  isPremium: true,
  avatarInitial: 'D',
  streak: 3,
};

// Set to null → shows "No plan yet" empty state
export const MOCK_PLAN: ActivePlan | null = {
  id: 'plan_1',
  type: 'race',
  currentWeek: 4,
  totalWeeks: 14,
  progressPct: 31,
  raceName: 'Berlin Half Marathon',
  raceDate: 'Sun 7 Sep',
  daysToRace: 63,
  nextRun: {
    name: 'Easy Run',
    subtitle: 'Conversational pace · low effort',
    type: 'easy',
    distanceKm: 5.0,
    estTimeMin: 28,
    effortLabel: 'Zone 2',
    targetPace: '5:45',
    runIndexThisWeek: 2,
    totalRunsThisWeek: 3,
  },
};

// Set to null → hides last run card on Home
export const MOCK_LAST_RUN: Run | null = {
  id: 'run_last',
  date: 'Thu 29 May',
  shortDay: 'Thu',
  name: 'Morning Tempo Run',
  type: 'tempo',
  distanceKm: 5.8,
  durationSec: 1821, // 30:21
  avgPace: '5:14',
  isPR: true,
};

// Set to null → hides goal card on Home
export const MOCK_GOAL: Goal | null = {
  id: 'goal_1',
  title: 'Monthly Runs',
  type: 'runs',
  current: 3,
  target: 30,
  unit: 'runs',
  progressPct: 10,
  resetsLabel: 'Resets 1 Jul',
};


// ── Weather context ───────────────────────────────────────────

export interface WeatherContext {
  tempC: number;
  conditionLabel: string;
  windKph: number;
  /** Set by backend once runsLogged >= 12 */
  personalizedLabel: string | null;
  runsLogged: number;
}

// Set personalizedLabel to a string to test the personalised state
export const MOCK_WEATHER: WeatherContext = {
  tempC: 18,
  conditionLabel: 'Overcast',
  windKph: 12,
  personalizedLabel: null,
  runsLogged: 6,   // 6 away from threshold → shows "6 more runs" hint
};

// Set to null → hides "This Week" card on Home
export const MOCK_WEEKLY: WeeklyProgress | null = {
  distanceKm: 18.4,
  runsCompleted: 3,
  totalRuns: 4,
};

// Recent run history (Profile screen)
export const MOCK_RUN_HISTORY: Run[] = [
  {
    id: 'run_1',
    date: 'Tue 3 Jun',
    shortDay: 'Tue',
    name: 'Morning Tempo Run',
    type: 'tempo',
    distanceKm: 8.2,
    durationSec: 2716, // 45:16
    avgPace: '5:32',
    isPR: false,
  },
  {
    id: 'run_2',
    date: 'Sat 31 May',
    shortDay: 'Sat',
    name: 'Saturday Long Run',
    type: 'long',
    distanceKm: 14.1,
    durationSec: 4724, // 1:18:44
    avgPace: '5:35',
    isPR: false,
  },
  {
    id: 'run_3',
    date: 'Thu 29 May',
    shortDay: 'Thu',
    name: 'Morning Tempo Run',
    type: 'tempo',
    distanceKm: 5.8,
    durationSec: 1821, // 30:21
    avgPace: '5:14',
    isPR: true,
  },
];