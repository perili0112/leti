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
  fullName: 'Dimi',
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

// ─────────────────────────────────────────────────────────────
// MILESTONES
// ─────────────────────────────────────────────────────────────

export type TierName = 'Spark' | 'Stride' | 'Surge' | 'Soar' | 'Legend';

export const TIER_ORDER: TierName[] = ['Spark', 'Stride', 'Surge', 'Soar', 'Legend'];

export type MilestoneIconKey =
  | 'distance' | 'runs' | 'dailyStreak' | 'weeklyStreak'
  | 'flag' | 'ultra' | 'races' | 'elevation'
  | 'pace5k' | 'pace10k' | 'paceHM' | 'paceMarathon' | 'paceUltra';

export interface MilestoneTier {
  name: TierName;
  /** Raw value in base unit: km/runs/days/weeks/completions/m for volume;
   *  seconds for pace categories. */
  target: number;
  /** Human-readable requirement: "250 km", "sub-28:00", etc. */
  display: string;
}

export interface MilestoneCategory {
  id: string;
  label: string;
  iconKey: MilestoneIconKey;
  /** Display unit appended to numbers: 'km', 'runs', 'days', 'weeks', 'm', '' */
  unit: string;
  /** false for pace categories — lower time = better */
  higherIsBetter: boolean;
  tiers: MilestoneTier[];
  /** null = no data recorded yet (pace categories before first race) */
  currentValue: number | null;
}

export type SpecialBadgeIconKey =
  | 'firstStep' | 'earlyBird' | 'nightOwl' | 'rainRunner'
  | 'fourSeasons' | 'globetrotter' | 'comeback'
  | 'centuryMonth' | 'personalBest' | 'allDistances';

export interface SpecialBadge {
  id: string;
  label: string;
  description: string;
  iconKey: SpecialBadgeIconKey;
  earned: boolean;
  earnedDate?: string; // e.g. "Jan 2025"
}

export interface MilestoneData {
  categories: MilestoneCategory[];
  specialBadges: SpecialBadge[];
}

export const MOCK_MILESTONES: MilestoneData = {
  categories: [
    // ── Volume ──────────────────────────────────────────────
    {
      id: 'total_distance',
      label: 'Total Distance',
      iconKey: 'distance',
      unit: 'km',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 50,    display: '50 km'      },
        { name: 'Stride', target: 250,   display: '250 km'     },
        { name: 'Surge',  target: 1000,  display: '1,000 km'   },
        { name: 'Soar',   target: 5000,  display: '5,000 km'   },
        { name: 'Legend', target: 20000, display: '20,000 km'  },
      ],
      currentValue: 387.4, // Stride earned; working toward Surge
    },
    {
      id: 'total_runs',
      label: 'Total Runs',
      iconKey: 'runs',
      unit: 'runs',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 10,   display: '10 runs'    },
        { name: 'Stride', target: 50,   display: '50 runs'    },
        { name: 'Surge',  target: 200,  display: '200 runs'   },
        { name: 'Soar',   target: 500,  display: '500 runs'   },
        { name: 'Legend', target: 1500, display: '1,500 runs' },
      ],
      currentValue: 42, // Spark earned; 8 runs to Stride
    },
    {
      id: 'weekly_streak',
      label: 'Weekly Streak',
      iconKey: 'weeklyStreak',
      unit: 'weeks',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 4,   display: '4 weeks'   },
        { name: 'Stride', target: 12,  display: '12 weeks'  },
        { name: 'Surge',  target: 26,  display: '26 weeks'  },
        { name: 'Soar',   target: 52,  display: '52 weeks'  },
        { name: 'Legend', target: 104, display: '104 weeks' },
      ],
      currentValue: 27, // not yet earned; 1 week to Spark
    },
    // ── Distance completions ──────────────────────────────────
    {
      id: '5k_completions',
      label: '5K Runs',
      iconKey: 'flag',
      unit: '',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 1,   display: '1st completion'   },
        { name: 'Stride', target: 10,  display: '10 completions'   },
        { name: 'Surge',  target: 50,  display: '50 completions'   },
        { name: 'Soar',   target: 100, display: '100 completions'  },
        { name: 'Legend', target: 500, display: '500 completions'  },
      ],
      currentValue: 12, // Stride earned; 38 to Surge
    },
    {
      id: '10k_completions',
      label: '10K Runs',
      iconKey: 'flag',
      unit: '',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 1,   display: '1st completion'  },
        { name: 'Stride', target: 5,   display: '5 completions'   },
        { name: 'Surge',  target: 25,  display: '25 completions'  },
        { name: 'Soar',   target: 75,  display: '75 completions'  },
        { name: 'Legend', target: 200, display: '200 completions' },
      ],
      currentValue: 6, // Stride earned; 19 to Surge
    },
    {
      id: 'hm_completions',
      label: 'Half Marathon',
      iconKey: 'flag',
      unit: '',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 1,   display: '1st completion'  },
        { name: 'Stride', target: 5,   display: '5 completions'   },
        { name: 'Surge',  target: 15,  display: '15 completions'  },
        { name: 'Soar',   target: 50,  display: '50 completions'  },
        { name: 'Legend', target: 100, display: '100 completions' },
      ],
      currentValue: 2, // Spark earned; 3 to Stride
    },
    {
      id: 'marathon_completions',
      label: 'Marathon',
      iconKey: 'flag',
      unit: '',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 1,  display: '1st completion'  },
        { name: 'Stride', target: 3,  display: '3 completions'   },
        { name: 'Surge',  target: 10, display: '10 completions'  },
        { name: 'Soar',   target: 26, display: '26 completions'  },
        { name: 'Legend', target: 100, display: '100 completions'},
      ],
      currentValue: 0, // not started
    },
    {
      id: 'ultra_completions',
      label: 'Ultra Marathon',
      iconKey: 'ultra',
      unit: '',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 1,  display: '1st completion'  },
        { name: 'Stride', target: 3,  display: '3 completions'   },
        { name: 'Surge',  target: 10, display: '10 completions'  },
        { name: 'Soar',   target: 25, display: '25 completions'  },
        { name: 'Legend', target: 50, display: '50 completions'  },
      ],
      currentValue: 0, // not started
    },
    {
      id: 'races',
      label: 'Races Completed',
      iconKey: 'races',
      unit: '',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 1,   display: '1st race'  },
        { name: 'Stride', target: 5,   display: '5 races'   },
        { name: 'Surge',  target: 20,  display: '20 races'  },
        { name: 'Soar',   target: 50,  display: '50 races'  },
        { name: 'Legend', target: 200, display: '200 races' },
      ],
      currentValue: 3, // Spark earned; 2 to Stride
    },
    {
      id: 'elevation',
      label: 'Elevation Gained',
      iconKey: 'elevation',
      unit: 'm',
      higherIsBetter: true,
      tiers: [
        { name: 'Spark',  target: 500,    display: '500 m'       },
        { name: 'Stride', target: 5000,   display: '5,000 m'     },
        { name: 'Surge',  target: 25000,  display: '25,000 m'    },
        { name: 'Soar',   target: 100000, display: '100,000 m'   },
        { name: 'Legend', target: 500000, display: '500,000 m'   },
      ],
      currentValue: 2800, // Spark earned; 2,200 m to Stride
    },
    // ── Pace / best times (target = seconds; lower = better) ──
    {
      id: 'pace_5k',
      label: '5K Best Time',
      iconKey: 'pace5k',
      unit: '',
      higherIsBetter: false,
      tiers: [
        { name: 'Spark',  target: 2700, display: 'sub-45:00' }, // 45 min
        { name: 'Stride', target: 2100, display: 'sub-35:00' }, // 35 min
        { name: 'Surge',  target: 1680, display: 'sub-28:00' }, // 28 min
        { name: 'Soar',   target: 1380, display: 'sub-23:00' }, // 23 min
        { name: 'Legend', target: 1200, display: 'sub-20:00' }, // 20 min
      ],
      currentValue: 1665, // 27:45 → Surge earned (just under 28:00)
    },
    {
      id: 'pace_10k',
      label: '10K Best Time',
      iconKey: 'pace10k',
      unit: '',
      higherIsBetter: false,
      tiers: [
        { name: 'Spark',  target: 5400, display: 'sub-1:30:00' },
        { name: 'Stride', target: 4200, display: 'sub-1:10:00' },
        { name: 'Surge',  target: 3300, display: 'sub-55:00'   },
        { name: 'Soar',   target: 2820, display: 'sub-47:00'   },
        { name: 'Legend', target: 2400, display: 'sub-40:00'   },
      ],
      currentValue: 3480, // 58:00 → Stride earned
    },
    {
      id: 'pace_hm',
      label: 'HM Best Time',
      iconKey: 'paceHM',
      unit: '',
      higherIsBetter: false,
      tiers: [
        { name: 'Spark',  target: 9900, display: 'sub-2:45:00'  },
        { name: 'Stride', target: 8100, display: 'sub-2:15:00'  },
        { name: 'Surge',  target: 6900, display: 'sub-1:55:00'  },
        { name: 'Soar',   target: 6000, display: 'sub-1:40:00'  },
        { name: 'Legend', target: 5400, display: 'sub-1:30:00'  },
      ],
      currentValue: 7500, // 2:05:00 → Stride earned
    },
    {
      id: 'pace_marathon',
      label: 'Marathon Time',
      iconKey: 'paceMarathon',
      unit: '',
      higherIsBetter: false,
      tiers: [
        { name: 'Spark',  target: 19800, display: 'sub-5:30:00' },
        { name: 'Stride', target: 16200, display: 'sub-4:30:00' },
        { name: 'Surge',  target: 13500, display: 'sub-3:45:00' },
        { name: 'Soar',   target: 11700, display: 'sub-3:15:00' },
        { name: 'Legend', target: 10800, display: 'sub-3:00:00' },
      ],
      currentValue: null, // no marathon logged yet
    },
    {
      id: 'pace_ultra',
      label: 'Ultra Time (50K)',
      iconKey: 'paceUltra',
      unit: '',
      higherIsBetter: false,
      tiers: [
        { name: 'Spark',  target: 32400, display: 'sub-9:00:00' },
        { name: 'Stride', target: 25200, display: 'sub-7:00:00' },
        { name: 'Surge',  target: 21600, display: 'sub-6:00:00' },
        { name: 'Soar',   target: 18000, display: 'sub-5:00:00' },
        { name: 'Legend', target: 15300, display: 'sub-4:15:00' },
      ],
      currentValue: null, // no ultra logged yet
    },
  ],

  // Only earned badges should be shown — unearned stay hidden
  specialBadges: [
    {
      id: 'first_step',
      label: 'First Step',
      description: 'Complete your very first logged run',
      iconKey: 'firstStep',
      earned: true,
      earnedDate: 'Jan 2025',
    },
    {
      id: 'early_bird',
      label: 'Early Bird',
      description: 'Start a run before 6:00 AM',
      iconKey: 'earlyBird',
      earned: true,
      earnedDate: 'Feb 2025',
    },
    {
      id: 'personal_best',
      label: 'Personal Best',
      description: 'Beat your own record at any distance',
      iconKey: 'personalBest',
      earned: true,
      earnedDate: 'May 2025',
    },
    // The rest stay hidden until earned — never shown to user
    { id: 'night_owl',      label: 'Night Owl',      description: 'Start a run after 10:00 PM',                         iconKey: 'nightOwl',     earned: true, earnedDate: 'cao kako si', },
    { id: 'rain_runner',    label: 'Rain Runner',    description: 'Run during active rain',                              iconKey: 'rainRunner',   earned: false },
    { id: 'four_seasons',   label: 'Four Seasons',   description: 'Log a run in all four calendar seasons',             iconKey: 'fourSeasons',  earned: false },
    { id: 'globe_trotter',  label: 'Globe Trotter',  description: 'Run in 3 or more different cities',                  iconKey: 'globetrotter', earned: false },
    { id: 'comeback',       label: 'Comeback',       description: 'Return and run after 30+ days off',                  iconKey: 'comeback',     earned: false },
    { id: 'century_month',  label: 'Century Month',  description: 'Log 100 km in a single calendar month',             iconKey: 'centuryMonth', earned: false },
    { id: 'all_distances',  label: 'All Distances',  description: 'Complete a 5K, 10K, half marathon, and marathon',   iconKey: 'allDistances', earned: false },
  ],
};