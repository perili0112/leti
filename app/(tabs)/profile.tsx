// app/(tabs)/profile.tsx — Profile screen, fully theme-aware

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, X, ChevronRight, Pencil, Clock, Search, SlidersHorizontal, Camera, Trash2, CheckCircle, Star, Flame, Award, Target, Activity } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

type ProfileState = 'main' | 'edit' | 'search' | 'filter' | 'goals' | 'create-goal';
type FilterPeriod = 'This month' | 'Last 3 months' | 'This year' | 'All time';
type FilterType   = 'All' | 'Easy' | 'Tempo' | 'Long' | 'Interval';
type FilterDist   = 'Any' | 'Under 5 km' | '5–10 km' | '10+ km';
type GoalType     = 'Distance' | 'Runs' | 'Pace' | 'Streak';
type GoalResets   = 'Weekly' | 'Monthly' | 'Never';

const USER = {
  name: 'Dimi Papadopoulos', initial: 'D', username: 'dimi_runs',
  email: 'dimi@example.com', isPro: true, totalRuns: 42, totalKm: 387.4, streak: 8,
};

const RUNS = [
  { id: '1', label: 'Tue 3 Jun · Tempo',  name: 'Morning Tempo Run',    dist: '8.2 km',  time: '45:16',   pace: '5:32/km', type: 'tempo', routePoints: [[7,46],[7,18],[25,18],[25,6],[43,6],[43,18]]  as [number,number][] },
  { id: '2', label: 'Sat 31 May · Long',   name: 'Saturday Long Run',    dist: '14.1 km', time: '1:18:44', pace: '5:35/km', type: 'long',  routePoints: [[9,44],[9,14],[30,14],[30,26],[44,26]]         as [number,number][] },
  { id: '3', label: 'Thu 29 May · Easy',   name: 'Evening Recovery Run', dist: '5.8 km',  time: '34:12',   pace: '5:54/km', type: 'easy',  routePoints: [[6,40],[6,18],[20,18],[20,30],[36,30],[36,14],[48,14]] as [number,number][] },
];

// ─── PRIMITIVES ──────────────────────────────────────────────

function SectionLabel({ text, C }: { text: string; C: ColorPalette }) {
  return <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.textMuted, letterSpacing: 1.3, textTransform: 'uppercase' }}>{text}</Text>;
}

function BackButton({ onPress, C }: { onPress: () => void; C: ColorPalette }) {
  return (
    <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }} onPress={onPress} activeOpacity={0.7}>
      <ArrowLeft size={16} color={C.textPrimary} />
    </TouchableOpacity>
  );
}

function CloseButton({ onPress, C }: { onPress: () => void; C: ColorPalette }) {
  return (
    <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }} onPress={onPress} activeOpacity={0.7}>
      <X size={14} color={C.textSecondary} />
    </TouchableOpacity>
  );
}

function Pill({ label, active, onPress, C }: { label: string; active: boolean; onPress: () => void; C: ColorPalette }) {
  return (
    <TouchableOpacity
      style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1.5, borderColor: active ? C.dark : C.borderMedium, backgroundColor: active ? C.dark : C.card }}
      onPress={onPress} activeOpacity={0.75}
    >
      <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: active ? '#FFFFFF' : C.textPrimary }}>{label}</Text>
    </TouchableOpacity>
  );
}

function RunMapThumb({ points, C }: { points: [number,number][]; C: ColorPalette }) {
  const first = points[0]; const last = points[points.length - 1];
  return (
    <View style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: '#2A3C3D', flexShrink: 0, overflow: 'hidden' }}>
      {[[2,2,14,10],[18,2,14,10],[2,14,14,10],[18,14,14,10]].map(([x,y,w,h], i) => (
        <View key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: h, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
      ))}
      <View style={{ position: 'absolute', left: first[0]-3, top: first[1]-3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.primary, borderWidth: 1.5, borderColor: C.bg }} />
      <View style={{ position: 'absolute', left: last[0]-3,  top: last[1]-3,  width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.dark }} />
    </View>
  );
}

function RunCard({ run, onPress, C }: { run: typeof RUNS[0]; onPress: () => void; C: ColorPalette }) {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 12, ...Shadow.cardSubtle }} onPress={onPress} activeOpacity={0.75}>
      <RunMapThumb points={run.routePoints} C={C} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textMuted }}>{run.label}</Text>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.textPrimary }}>{run.name}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary }}>{run.dist}</Text>
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary }}>{run.time}</Text>
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 12, color: C.primary }}>{run.pace}</Text>
        </View>
      </View>
      <ChevronRight size={14} color={C.textTertiary} />
    </TouchableOpacity>
  );
}

function ProgBar({ pct, C }: { pct: number; C: ColorPalette }) {
  return (
    <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
      <View style={{ height: '100%' as any, width: `${pct}%` as any, backgroundColor: C.primary, borderRadius: 3 }} />
    </View>
  );
}

function Field({ label, value, onChange, keyboardType = 'default', C }: { label: string; value: string; onChange: (v: string) => void; keyboardType?: any; C: ColorPalette }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</Text>
      <TextInput
        style={{ height: 46, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, borderRadius: 10, paddingHorizontal: 14, fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary }}
        value={value} onChangeText={onChange} keyboardType={keyboardType} autoCapitalize="none"
        placeholderTextColor={C.textTertiary}
      />
    </View>
  );
}

// ─── MAIN STATE ──────────────────────────────────────────────

function MainState({ onEdit, onSearchFocus, onFilterOpen, onGoals, onRunTap, C }: {
  onEdit: () => void; onSearchFocus: () => void; onFilterOpen: () => void;
  onGoals: () => void; onRunTap: (id: string) => void; C: ColorPalette;
}) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }} showsVerticalScrollIndicator={false}>
      {/* Profile card */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: Spacing.md, ...Shadow.cardSubtle }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Text style={{ fontFamily: FontFamily.displayBold, fontSize: 24, color: '#fff' }}>{USER.initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FontFamily.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: 0.2 }}>{USER.name}</Text>
          {USER.isPro && (
            <View style={{ backgroundColor: C.accent, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={10} color="#fff" fill="#fff" />
              <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8 }}>Pro Member</Text>
            </View>
            </View>
          )}
        </View>
        <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onPress={onEdit} activeOpacity={0.7}>
          <Pencil size={15} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Goals nav */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 12, ...Shadow.cardSubtle }} onPress={onGoals} activeOpacity={0.75}>
        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={17} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textPrimary }}>Personal Goals & Milestones</Text>
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textSecondary, marginTop: 2 }}>2 active goals</Text>
        </View>
        <ChevronRight size={16} color={C.textMuted} />
      </TouchableOpacity>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {[{ val: '42', sub: 'Runs', icon: null }, { val: '387', sub: 'km total', icon: null }, { val: '8', sub: 'Streak', icon: <Flame size={20} color={C.accent} fill={C.accent} /> }].map(({ val, sub, icon }, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: C.card, borderRadius: Radius.md, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 3, ...Shadow.cardSubtle }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={{ fontFamily: FontFamily.displayExtraBold, fontSize: 26, color: sub === 'Streak' ? C.accent : C.textPrimary, lineHeight: 28 }}>{val}</Text>
              {icon}
            </View>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{sub}</Text>
          </View>
        ))}
      </View>

      {/* Search + filter */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <TouchableOpacity style={{ flex: 1, height: 42, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, borderRadius: 21, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8, ...Shadow.cardSubtle }} onPress={onSearchFocus} activeOpacity={0.85}>
          <Search size={14} color={C.textMuted} />
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.textTertiary }}>Search runs...</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, alignItems: 'center', justifyContent: 'center', ...Shadow.cardSubtle }} onPress={onFilterOpen} activeOpacity={0.8}>
          <SlidersHorizontal size={16} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <SectionLabel text="Run History" C={C} />
      {RUNS.map(run => <RunCard key={run.id} run={run} onPress={() => onRunTap(run.id)} C={C} />)}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

// ─── EDIT STATE ──────────────────────────────────────────────

function EditState({ onBack, C }: { onBack: () => void; C: ColorPalette }) {
  const [username, setUsername] = useState(USER.username);
  const [email,    setEmail]    = useState(USER.email);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View style={{ position: 'relative' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: FontFamily.displayBold, fontSize: 32, color: '#fff' }}>{USER.initial}</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: C.dark, borderWidth: 2, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={13} color="#fff" />
          </View>
        </View>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 12, color: C.primary }}>Change photo</Text>
      </View>

      <Field label="Username" value={username} onChange={setUsername} C={C} />
      <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" C={C} />

      <View style={{ backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...Shadow.cardSubtle }}>
        <TouchableOpacity style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md }} activeOpacity={0.7} onPress={() => router.push('/reset-password')}>
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary }}>Change Password</Text>
          <ChevronRight size={14} color={C.textMuted} />
        </TouchableOpacity>
        <View style={{ height: 1, backgroundColor: C.border }} />
        <TouchableOpacity style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md }} activeOpacity={0.7}>
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary }}>Manage Subscription</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: C.accent, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}><Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: '#fff' }}>Pro</Text></View>
            <ChevronRight size={14} color={C.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />
      <TouchableOpacity style={{ height: 56, backgroundColor: C.dark, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...Shadow.button }} activeOpacity={0.88} onPress={onBack}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ height: 40, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7} onPress={() => Alert.alert('Delete Account', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }])}>
        <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.danger, textDecorationLine: 'underline' }}>Delete Account</Text>
      </TouchableOpacity>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

// ─── SEARCH STATE ─────────────────────────────────────────────

function SearchState({ onCancel, C }: { onCancel: () => void; C: ColorPalette }) {
  const [query, setQuery] = useState('easy run');
  const results = RUNS.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.type.includes(query.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg }}>
        <View style={{ flex: 1, height: 40, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.primary, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
          <Search size={14} color={C.primary} style={{ marginRight: 6 }} />
          <TextInput style={{ flex: 1, fontFamily: FontFamily.uiMedium, fontSize: 13, color: C.textPrimary }} value={query} onChangeText={setQuery} autoFocus returnKeyType="search" selectTextOnFocus placeholderTextColor={C.textTertiary} />
        </View>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}>
        <SectionLabel text={`${results.length} results for "${query}"`} C={C} />
        {results.map(run => (
          <TouchableOpacity key={run.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 12, ...Shadow.cardSubtle }} onPress={() => router.push(`/run-detail?id=${run.id}`)} activeOpacity={0.75}>
            <RunMapThumb points={run.routePoints} C={C} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textMuted }}>{run.label}</Text>
              <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.textPrimary }}>{run.name}</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary }}>{run.dist}</Text>
                <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary }}>{run.time}</Text>
                <View style={{ backgroundColor: C.primaryFaint, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: C.borderMedium }}>
                  <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.primary }}>{run.type}</Text>
                </View>
              </View>
            </View>
            <ChevronRight size={14} color={C.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── FILTER STATE ─────────────────────────────────────────────

function FilterState({ onClose, C }: { onClose: () => void; C: ColorPalette }) {
  const [period, setPeriod] = useState<FilterPeriod>('This month');
  const [type,   setType]   = useState<FilterType>('Easy');
  const [dist,   setDist]   = useState<FilterDist>('5–10 km');

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, padding: 14, gap: 12, ...Shadow.card }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Date Range</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(['This month', 'Last 3 months', 'This year', 'All time'] as FilterPeriod[]).map(opt => <Pill key={opt} label={opt} active={period === opt} onPress={() => setPeriod(opt)} C={C} />)}
        </View>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Run Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(['All', 'Easy', 'Tempo', 'Long', 'Interval'] as FilterType[]).map(opt => <Pill key={opt} label={opt} active={type === opt} onPress={() => setType(opt)} C={C} />)}
        </View>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Distance</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(['Any', 'Under 5 km', '5–10 km', '10+ km'] as FilterDist[]).map(opt => <Pill key={opt} label={opt} active={dist === opt} onPress={() => setDist(opt)} C={C} />)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <TouchableOpacity style={{ flex: 1, height: 46, backgroundColor: C.dark, borderRadius: 10, alignItems: 'center', justifyContent: 'center', ...Shadow.button }} onPress={onClose} activeOpacity={0.88}>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setPeriod('This month'); setType('All'); setDist('Any'); }} activeOpacity={0.7}>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 12, color: C.textMuted, textDecorationLine: 'underline' }}>Clear all</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flex: 1, opacity: 0.32, padding: Spacing.md, gap: Spacing.sm }} pointerEvents="none">
        <SectionLabel text="Run History" C={C} />
        {RUNS.slice(0, 2).map(run => (
          <View key={run.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: C.cardAlt }} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ height: 10, width: '40%', backgroundColor: C.border, borderRadius: 3 }} />
              <View style={{ height: 13, width: '75%', backgroundColor: C.borderMedium, borderRadius: 3 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── GOALS STATE ─────────────────────────────────────────────

function GoalsState({ onBack, onCreateGoal, C }: { onBack: () => void; onCreateGoal: () => void; C: ColorPalette }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }} showsVerticalScrollIndicator={false}>
      <SectionLabel text="Personal Goals" C={C} />
      <View style={{ gap: Spacing.sm }}>
        {[
          { title: 'Weekly Distance', progress: '18.4 km of 30 km', pct: 61, meta: 'Resets weekly · 11.6 km remaining' },
          { title: 'Monthly Runs',    progress: '11 of 16 runs',     pct: 69, meta: 'Resets monthly · 5 runs remaining' },
        ].map(({ title, progress, pct, meta }) => (
          <View key={title} style={{ backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 14, gap: 8, ...Shadow.cardSubtle }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.textPrimary }}>{title}</Text>
                <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{progress}</Text>
              </View>
              <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.primary }}>{pct}%</Text>
              <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7} onPress={() => Alert.alert('Delete goal?', `${title} will be removed.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }])}>
                <Trash2 size={15} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ProgBar pct={pct} C={C} />
            <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 10.5, color: C.textMuted, marginTop: 2 }}>{meta}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={{ height: 46, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.borderStrong, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} onPress={onCreateGoal} activeOpacity={0.8}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textPrimary }}>Create New Goal</Text>
      </TouchableOpacity>

      <SectionLabel text="Milestones" C={C} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          { icon: 'award',    title: 'First Half\nMarathon', earned: true,  bg: C.primaryFaint, border: 'rgba(62,190,196,0.2)',  statusColor: C.primary },
          { icon: 'target',   title: '100 km\nTotal',         earned: true,  bg: C.primaryFaint, border: 'rgba(62,190,196,0.2)',  statusColor: C.primary },
          { icon: 'flame',    title: '7-Day\nStreak',         earned: true,  bg: C.accentFaint,  border: 'rgba(240,168,50,0.2)',  statusColor: C.accent  },
          { icon: 'activity', title: 'First\nRun',            earned: false, bg: C.card,         border: C.border,                statusColor: C.textMuted},
        ].map(({ icon, title, earned, bg, border, statusColor }) => {
            const renderIcon = () => {
              if (icon === 'award')    return <Award    size={26} color="#D4A017" />;
              if (icon === 'target')   return <Target   size={26} color={C.primary} />;
              if (icon === 'flame')    return <Flame    size={26} color={C.accent} fill={C.accent} />;
              if (icon === 'activity') return <Activity size={26} color={C.textMuted} />;
              return null;
            };
            return (
          <View key={title} style={{ width: '47%', borderRadius: Radius.lg, borderWidth: 1, padding: 12, alignItems: 'center', backgroundColor: bg, borderColor: border, opacity: earned ? 1 : 0.45, ...Shadow.cardSubtle }}>
            <View style={{ marginBottom: 6 }}>{renderIcon()}</View>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 11.5, color: C.textPrimary, textAlign: 'center', lineHeight: 17 }}>{title}</Text>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, marginTop: 4, letterSpacing: 0.5, color: statusColor }}>{earned ? 'Earned' : 'Locked'}</Text>
          </View>
            );
        })}
      </View>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

// ─── CREATE GOAL STATE ────────────────────────────────────────

function CreateGoalState({ onBack, C }: { onBack: () => void; C: ColorPalette }) {
  const [title,    setTitle]    = useState('Run 100 km this month');
  const [goalType, setGoalType] = useState<GoalType>('Distance');
  const [target,   setTarget]   = useState('100');
  const [resets,   setResets]   = useState<GoalResets>('Monthly');

  const summary = `Run ${target} km every ${resets.toLowerCase().replace('ly', '')}`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>Goal Title</Text>
        <TextInput style={{ height: 46, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.primary, borderRadius: 10, paddingHorizontal: 14, fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary }} value={title} onChangeText={setTitle} placeholderTextColor={C.textTertiary} />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>Goal Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {(['Distance', 'Runs', 'Pace', 'Streak'] as GoalType[]).map(opt => <Pill key={opt} label={opt} active={goalType === opt} onPress={() => setGoalType(opt)} C={C} />)}
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>Target</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 46, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, borderRadius: 10, paddingHorizontal: 14 }}>
          <TextInput style={{ fontFamily: FontFamily.displayBold, fontSize: 16, color: C.textPrimary, flex: 1 }} value={target} onChangeText={setTarget} keyboardType="numeric" placeholderTextColor={C.textTertiary} />
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textSecondary }}>{goalType === 'Distance' ? 'km' : goalType === 'Runs' ? 'runs' : goalType === 'Pace' ? '/km' : 'days'}</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>Resets</Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {(['Weekly', 'Monthly', 'Never'] as GoalResets[]).map(opt => <Pill key={opt} label={opt} active={resets === opt} onPress={() => setResets(opt)} C={C} />)}
        </View>
      </View>
      <View style={{ backgroundColor: C.primaryFaint, borderWidth: 1, borderColor: C.borderMedium, borderRadius: 12, padding: 10, gap: 4 }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.primary, letterSpacing: 1, textTransform: 'uppercase' }}>Goal Summary</Text>
        <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.textPrimary }}>{summary}</Text>
      </View>
      <TouchableOpacity style={{ height: 58, backgroundColor: C.dark, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...Shadow.button }} onPress={onBack} activeOpacity={0.88}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Create Goal</Text>
      </TouchableOpacity>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────

export default function ProfileScreen() {
  const { colors: C, isDark } = useTheme();
  const [state, setState] = useState<ProfileState>('main');
  const params = useLocalSearchParams<{ passwordReset?: string }>();

  // Success toast
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (params.passwordReset === '1') {
      setToastVisible(true);
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setToastVisible(false));
    }
  }, [params.passwordReset]);

  const TITLE_CONFIGS: Record<ProfileState, { title: string; showBack: boolean; showClose: boolean; backState: ProfileState | null }> = {
    'main':        { title: 'Profile',            showBack: false, showClose: false, backState: null   },
    'edit':        { title: 'Edit Profile',       showBack: true,  showClose: true,  backState: 'main' },
    'search':      { title: '',                   showBack: false, showClose: false, backState: null   },
    'filter':      { title: 'Profile',            showBack: false, showClose: false, backState: null   },
    'goals':       { title: 'Goals & Milestones', showBack: true,  showClose: false, backState: 'main' },
    'create-goal': { title: 'Create Goal',        showBack: false, showClose: true,  backState: 'goals'},
  };

  const cfg = TITLE_CONFIGS[state];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Success toast */}
      {toastVisible && (
        <Animated.View style={{
          position: 'absolute', bottom: 90, left: 20, right: 20, zIndex: 100,
          backgroundColor: C.success, borderRadius: 12, padding: 14,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          opacity: toastOpacity,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
        }}>
          <CheckCircle size={20} color="#fff" />
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: '#fff', flex: 1 }}>
            Password reset successfully
          </Text>
        </Animated.View>
      )}

      {state !== 'search' && (
        <View style={{ height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg }}>
          {cfg.showBack ? <BackButton onPress={() => setState(cfg.backState!)} C={C} /> : <View style={{ width: 36 }} />}
          <Text style={{ fontFamily: FontFamily.displayBold, fontSize: 18, color: C.textPrimary }}>{cfg.title}</Text>
          {cfg.showClose ? <CloseButton onPress={() => setState(cfg.backState!)} C={C} /> : <View style={{ width: 36 }} />}
        </View>
      )}

      {state === 'main'        && <MainState        onEdit={() => setState('edit')} onSearchFocus={() => setState('search')} onFilterOpen={() => setState('filter')} onGoals={() => setState('goals')} onRunTap={id => router.push(`/run-detail?id=${id}`)} C={C} />}
      {state === 'edit'        && <EditState        onBack={() => setState('main')}  C={C} />}
      {state === 'search'      && <SearchState      onCancel={() => setState('main')} C={C} />}
      {state === 'filter'      && <FilterState      onClose={() => setState('main')}  C={C} />}
      {state === 'goals'       && <GoalsState       onBack={() => setState('main')} onCreateGoal={() => setState('create-goal')} C={C} />}
      {state === 'create-goal' && <CreateGoalState  onBack={() => setState('goals')} C={C} />}
    </SafeAreaView>
  );
}