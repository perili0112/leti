// context/OnboardingContext.tsx

import React, { createContext, useContext, useState } from 'react';
import type { OnboardingData, RunningExperience, PrimaryGoal, RaceDistance, TimeGoalType, TimeOfDay } from '../types/onboarding';

const DEFAULT: OnboardingData = {
  firstName:      '',
  experience:     null,
  primaryGoal:    null,
  raceDistance:   null,
  raceDate:       null,
  timeGoal:       null,
  currentRunDays: 2,
  desiredRunDays: 4,
  timeOfDay:      null,
  additionalNotes: '',
};

interface OnboardingContextValue {
  data: OnboardingData;
  setFirstName:       (v: string) => void;
  setExperience:      (v: RunningExperience) => void;
  setPrimaryGoal:     (v: PrimaryGoal) => void;
  setRaceDistance:    (v: RaceDistance) => void;
  setRaceDate:        (v: Date) => void;
  setTimeGoal:        (v: TimeGoalType) => void;
  setCurrentRunDays:  (v: number) => void;
  setDesiredRunDays:  (v: number) => void;
  setTimeOfDay:       (v: TimeOfDay) => void;
  setAdditionalNotes: (v: string) => void;
  reset:              () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  data: DEFAULT,
  setFirstName:       () => {},
  setExperience:      () => {},
  setPrimaryGoal:     () => {},
  setRaceDistance:    () => {},
  setRaceDate:        () => {},
  setTimeGoal:        () => {},
  setCurrentRunDays:  () => {},
  setDesiredRunDays:  () => {},
  setTimeOfDay:       () => {},
  setAdditionalNotes: () => {},
  reset:              () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULT);

  const patch = (partial: Partial<OnboardingData>) =>
    setData(prev => ({ ...prev, ...partial }));

  return (
    <OnboardingContext.Provider value={{
      data,
      setFirstName:       v => patch({ firstName: v }),
      setExperience:      v => patch({ experience: v }),
      setPrimaryGoal:     v => patch({ primaryGoal: v }),
      setRaceDistance:    v => patch({ raceDistance: v }),
      setRaceDate:        v => patch({ raceDate: v }),
      setTimeGoal:        v => patch({ timeGoal: v }),
      setCurrentRunDays:  v => patch({ currentRunDays: v }),
      setDesiredRunDays:  v => patch({ desiredRunDays: v }),
      setTimeOfDay:       v => patch({ timeOfDay: v }),
      setAdditionalNotes: v => patch({ additionalNotes: v }),
      reset:              () => setData(DEFAULT),
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
