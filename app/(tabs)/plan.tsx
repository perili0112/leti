// app/(tabs)/plan.tsx
//
// Plan screen — 7 states driven by a single planState variable:
//   'locked'     → free user, blurred calendar behind lock overlay
//   'empty'      → premium, no plan yet
//   'hobby'      → active plan, no race countdown
//   'race'       → active plan with race countdown card
//   'edit'       → half-screen AI chat modal over dimmed plan
//   'ai-chat'    → full dark AI chat (Edit My Plan flow)
//   'decision'   → forced choice: accept new plan or keep old one

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Send, ArrowLeft, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { type ColorPalette, FontFamily, Spacing, Radius, Shadow } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { LetiMark } from '../_components/LetiLogo';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type PlanState = 'locked' | 'empty' | 'hobby' | 'race' | 'edit' | 'ai-chat' | 'decision';

type RunBlock = {
  type: 'easy' | 'tempo' | 'long' | 'interval' | 'race' | 'rest';
  km: string;
  done?: boolean;
  today?: boolean;
  dim?: boolean;
};

type WeekRow = {
  label: string;
  badge?: 'done' | 'now';
  days: (RunBlock | null)[];
  totalKm: string;
  dimTotal?: boolean;
};

type ChatMessage = {
  role: 'user' | 'ai';
  text: string;
};

// ─────────────────────────────────────────────────────────────
// CALENDAR DATA
// ─────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HOBBY_WEEKS: WeekRow[] = [
  {
    label: 'Wk 1', badge: 'done',
    days: [
      { type: 'easy',     km: '6km', done: true },
      null,
      { type: 'tempo',    km: '5km', done: true },
      null,
      { type: 'easy',     km: '5km', done: true },
      { type: 'long',     km: '10km', done: true },
      null,
    ],
    totalKm: '26km',
  },
  {
    label: 'Wk 2', badge: 'done',
    days: [
      { type: 'easy',     km: '6km', done: true },
      null,
      { type: 'interval', km: '5km', done: true },
      null,
      { type: 'easy',     km: '6km', done: true },
      { type: 'long',     km: '12km', done: true },
      null,
    ],
    totalKm: '29km',
  },
  {
    label: 'Wk 3', badge: 'now',
    days: [
      { type: 'easy',     km: '7km', done: true },
      null,
      { type: 'tempo',    km: '6km', today: true },
      null,
      { type: 'easy',     km: '7km', dim: true },
      { type: 'long',     km: '14km', dim: true },
      null,
    ],
    totalKm: '34km',
  },
  {
    label: 'Wk 4',
    days: [
      { type: 'easy',     km: '7km', dim: true },
      null,
      { type: 'interval', km: '7km', dim: true },
      null,
      { type: 'easy',     km: '7km', dim: true },
      { type: 'long',     km: '16km', dim: true },
      null,
    ],
    totalKm: '37km',
    dimTotal: true,
  },
];

const RACE_WEEKS: WeekRow[] = [
  {
    label: 'Wk 3', badge: 'done',
    days: [
      { type: 'easy',  km: '8km',  done: true },
      null,
      { type: 'tempo', km: '7km',  done: true },
      null,
      { type: 'easy',  km: '8km',  done: true },
      { type: 'long',  km: '18km', done: true },
      null,
    ],
    totalKm: '41km',
  },
  {
    label: 'Wk 5', badge: 'now',
    days: [
      { type: 'easy',  km: '9km',  done: true },
      null,
      { type: 'tempo', km: '8km',  today: true },
      null,
      { type: 'easy',  km: '9km',  dim: true },
      { type: 'long',  km: '21km', dim: true },
      null,
    ],
    totalKm: '47km',
  },
  {
    label: 'Wk 6',
    days: [
      { type: 'easy',     km: '9km',  dim: true },
      null,
      { type: 'interval', km: '7km',  dim: true },
      null,
      { type: 'easy',     km: '9km',  dim: true },
      { type: 'long',     km: '22km', dim: true },
      null,
    ],
    totalKm: '47km',
    dimTotal: true,
  },
];

// ─────────────────────────────────────────────────────────────
// RUN BLOCK — single calendar cell
// ─────────────────────────────────────────────────────────────

const RUN_COLORS: Record<string, { bg: string; border: string; labelColor: string; distColor: string }> = {
  easy:     { bg: '#D4EBEC', border: 'rgba(27,108,112,0.45)',  labelColor: '#0D4D50', distColor: '#1B6C70' },
  tempo:    { bg: '#1B6C70', border: '#1B6C70',                labelColor: '#fff',    distColor: '#fff'    },
  long:     { bg: '#112224', border: '#0A1A1B',                labelColor: 'rgba(255,255,255,0.85)', distColor: 'rgba(255,255,255,0.85)' },
  interval: { bg: '#EDE5FF', border: 'rgba(94,53,177,0.4)',    labelColor: '#4527A0', distColor: '#5E35B1' },
  race:     { bg: '#0A1A1B', border: '#0A1A1B',                labelColor: 'rgba(255,255,255,0.9)', distColor: 'rgba(255,255,255,0.9)' },
};

const TYPE_LABELS: Record<string, string> = {
  easy: 'Easy', tempo: 'Tempo', long: 'Long', interval: 'Intv.', race: 'Race',
};

function RunCell({ block, size }: { block: RunBlock; size: number }) {
  const { colors: C } = useTheme();
  const cal = React.useMemo(() => makeCalStyles(C), [C]);
  const cfg = RUN_COLORS[block.type] || RUN_COLORS.easy;
  // Done runs (past) fade out — they're history.
  // Future runs (dim) stay fully visible — you need to see what's coming.
  // Today is full opacity + special border treatment.
  const opacity = block.done ? 0.42 : 1;
  const todayBorder = block.today ? { borderColor: C.primary, borderWidth: 2.5 } : {};
  return (
    <View style={[
      cal.runBlock,
      { backgroundColor: cfg.bg, borderColor: cfg.border, opacity, width: size, height: size },
      todayBorder,
    ]}>
      <Text style={[cal.runLabel, { color: cfg.labelColor }]}>{TYPE_LABELS[block.type]}</Text>
      <Text style={[cal.runDist, { color: cfg.distColor }]}>{block.km}</Text>
      {block.done  && <Check size={8} color={cfg.labelColor} opacity={0.6} />}
      {block.today && <View style={cal.todayDot} />}
    </View>
  );
}


// ─────────────────────────────────────────────────────────────
// TODAY BANNER — surfaces today's run above the grid
// ─────────────────────────────────────────────────────────────

function findTodayBlock(weeks: WeekRow[]): { type: string; km: string } | null {
  for (const week of weeks) {
    for (const block of week.days) {
      if (block?.today) return block;
    }
  }
  return null;
}

function TodayRunBanner({ weeks, C }: { weeks: WeekRow[]; C: ColorPalette }) {
  const todayBlock = findTodayBlock(weeks);
  if (!todayBlock) return null;
  const cfg = RUN_COLORS[todayBlock.type] || RUN_COLORS.easy;
  const label = TYPE_LABELS[todayBlock.type];
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: cfg.bg,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: cfg.border,
      paddingHorizontal: 12,
      paddingVertical: 9,
      marginBottom: 8,
    }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cfg.labelColor, opacity: 0.9 }} />
      <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 9, color: cfg.labelColor, letterSpacing: 1.2, textTransform: 'uppercase', flex: 1 }}>
        Today · {label} · {todayBlock.km}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// CALENDAR GRID
// ─────────────────────────────────────────────────────────────

function CalendarGrid({ weeks, showTodayBanner = true }: { weeks: WeekRow[]; showTodayBanner?: boolean }) {
  const { colors: C } = useTheme();
  const cal = React.useMemo(() => makeCalStyles(C), [C]);
  const { width } = useWindowDimensions();
  // Available width: screen - horizontal padding (Spacing.lg * 2) - wkIdCol (38) - kmCol (36)
  const PADDING = Spacing.lg * 2; // 32
  const WK_COL = 38;
  const KM_COL = 36;
  const CELL = Math.floor((width - PADDING - WK_COL - KM_COL) / 7);

  return (
    <View>
      {/* Today banner — above day headers */}
      {showTodayBanner && <TodayRunBanner weeks={weeks} C={C} />}
      {/* Day header */}
      <View style={cal.headerRow}>
        <View style={cal.wkIdCol} />
        {DAYS.map(d => (
          <Text key={d} style={[cal.dayLabel, { width: CELL }]}>{d}</Text>
        ))}
        <Text style={cal.kmHeaderLabel}>km</Text>
      </View>

      {/* Week rows */}
      {weeks.map((wk, wi) => (
        <View
          key={wi}
          style={[
            cal.weekRow,
            wk.badge === 'done' && cal.weekDone,
            wk.badge === 'now'  && cal.weekNow,
          ]}
        >
          {/* Week ID */}
          <View style={cal.wkIdCol}>
            <Text style={cal.wkNum}>{wk.label}</Text>
            {wk.badge === 'done' && <Text style={cal.wkCheck}>✓</Text>}
            {wk.badge === 'now'  && <View style={cal.nowBadge}><Text style={cal.nowBadgeText}>Now</Text></View>}
          </View>

          {/* Days */}
          {wk.days.map((block, di) => (
            <View key={di} style={[cal.dayCell, { width: CELL, height: CELL + 8 }]}>
              {block && <RunCell block={block} size={CELL - 2} />}
            </View>
          ))}

          {/* km total */}
          <Text style={[cal.wkKm, wk.badge === 'now' && cal.wkKmNow, wk.dimTotal && { opacity: 0.4 }]}>
            {wk.totalKm}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// LEGEND
// ─────────────────────────────────────────────────────────────

function Legend({ showRace = false }) {
  const { colors: C } = useTheme();
  const s = React.useMemo(() => makeSStyles(C), [C]);
  const items = [
    { type: 'easy',     label: 'Easy'  },
    { type: 'tempo',    label: 'Tempo' },
    { type: 'long',     label: 'Long'  },
    { type: 'interval', label: 'Intv.' },
    ...(showRace ? [{ type: 'race', label: 'Race' }] : []),
  ];
  return (
    <View style={s.legendRow}>
      {items.map(it => {
        const cfg = RUN_COLORS[it.type];
        return (
          <View key={it.type} style={s.legendItem}>
            <View style={[s.legendSwatch, { backgroundColor: cfg.bg, borderColor: cfg.border }]} />
            <Text style={s.legendLabel}>{it.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, label, value }: { pct: number; label: string; value: string }) {
  const { colors: C } = useTheme();
  const s = React.useMemo(() => makeSStyles(C), [C]);
  return (
    <View>
      <View style={s.progressRow}>
        <Text style={s.progressLabel}>{label}</Text>
        <Text style={s.progressValue}>{value}</Text>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// THUMB SHADOW ZONE INFO CARD
// ─────────────────────────────────────────────────────────────

function InfoCard({ label, body }: { label: string; body: string }) {
  const { colors: C } = useTheme();
  const s = React.useMemo(() => makeSStyles(C), [C]);
  return (
    <View style={s.infoCard}>
      <Text style={s.infoCardLabel}>{label}</Text>
      <Text style={s.infoCardBody}>{body}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN STATES
// ─────────────────────────────────────────────────────────────

function LockedState({ onUpgrade }: { onUpgrade: () => void }) {
  const { colors: C, isDark } = useTheme();
  const s = React.useMemo(() => makeSStyles(C), [C]);
  return (
    <View style={{ flex: 1 }}>
      {/* Blurred plan behind lock */}
      <View style={{ flex: 1, overflow: 'hidden', opacity: 0.45 }} pointerEvents="none">
        <ScrollView scrollEnabled={false} style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}>
          <ProgressBar pct={25} label="Week 3 of 12 · Base Building" value="25%" />
          <Legend />
          <CalendarGrid weeks={HOBBY_WEEKS.slice(0, 3)} />
        </ScrollView>
      </View>

      {/* Blur overlay */}
      <View style={s.lockBlur} pointerEvents="none" />

      {/* Lock card */}
      <View style={s.lockCard}>
        <Text style={{ fontSize: 28, marginBottom: Spacing.md }}>🔒</Text>
        <Text style={s.lockTitle}>Plans require Premium</Text>
        <Text style={s.lockBody}>
          Get a personalised training plan built around your schedule, pace, and goals.
        </Text>

        <View style={s.infoCard}>
          <Text style={s.infoCardLabel}>No commitment</Text>
          <Text style={s.infoCardBody}>Cancel anytime · free 7-day trial</Text>
        </View>

        <TouchableOpacity style={s.btnOutline} onPress={onUpgrade} activeOpacity={0.8}>
          <Text style={s.btnOutlineText}>See Premium Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ onBuild }: { onBuild: () => void }) {
  const { colors: C, isDark } = useTheme();
  const s   = React.useMemo(() => makeSStyles(C), [C]);
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyInner}>
        <View style={s.emptyIcon}>
          <Calendar size={28} color={C.primary} />
        </View>
        <Text style={s.emptyTitle}>No plan yet</Text>
        <Text style={s.emptyBody}>Tell us your goals and we'll build the rest.</Text>
      </View>

      <View style={s.emptyFooter}>
        <InfoCard label="Your AI coach" body="Personalised to your schedule, pace & goals." />
        <TouchableOpacity style={s.btnPrimary} onPress={onBuild} activeOpacity={0.88}>
          <Text style={s.btnPrimaryText}>Let's build your plan.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ActiveHobbyState({ onEdit, onNew, onDelete, onSeeFullPlan }: { onEdit: () => void; onNew: () => void; onDelete: () => void; onSeeFullPlan: () => void }) {
  const { colors: C } = useTheme();
  const s = React.useMemo(() => makeSStyles(C), [C]);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.activeContent} showsVerticalScrollIndicator={false}>
      <ProgressBar pct={25} label="Week 3 of 12 · Base Building" value="25%" />
      <Legend />
      <CalendarGrid weeks={HOBBY_WEEKS} />

      <TouchableOpacity style={s.btnSeeAll} onPress={onSeeFullPlan} activeOpacity={0.8}>
        <Text style={s.btnSeeAllText}>See the whole plan →</Text>
      </TouchableOpacity>

      <View style={s.divider} />
      <InfoCard label="This week" body="2 of 4 runs done · on track" />
      <TouchableOpacity style={s.btnPrimary} onPress={onEdit} activeOpacity={0.88}>
        <Text style={s.btnPrimaryText}>Edit My Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecondary} onPress={onNew} activeOpacity={0.8}>
        <Text style={s.btnSecondaryText}>Start New Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={s.btnDanger}>
        <Text style={s.btnDangerText}>Delete This Plan</Text>
      </TouchableOpacity>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function ActiveRaceState({ onEdit, onNew, onDelete, onSeeFullPlan }: { onEdit: () => void; onNew: () => void; onDelete: () => void; onSeeFullPlan: () => void }) {
  const { colors: C } = useTheme();
  const s = React.useMemo(() => makeSStyles(C), [C]);
  const { width } = useWindowDimensions();
  const raceNumSize = width < 360 ? 42 : 56;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.activeContent} showsVerticalScrollIndicator={false}>
      {/* Race countdown */}
      <View style={s.raceCard}>
        <View style={s.raceCountdown}>
          <Text style={[s.raceNum, { fontSize: raceNumSize, lineHeight: raceNumSize + 2 }]}>63</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.raceCountdownLabel}>Days until race</Text>
          <Text style={s.raceName}>Berlin Half Marathon</Text>
          <Text style={s.raceDate}>Sunday, 7 September 2025</Text>
        </View>
      </View>

      <ProgressBar pct={31} label="Race prep: Week 5 of 16" value="31%" />
      <Legend showRace />
      <CalendarGrid weeks={RACE_WEEKS} />

      <TouchableOpacity style={s.btnSeeAll} onPress={onSeeFullPlan} activeOpacity={0.8}>
        <Text style={s.btnSeeAllText}>See the whole plan →</Text>
      </TouchableOpacity>

      <View style={s.divider} />
      <InfoCard label="Race countdown" body="On track · peak week in 11 days" />
      <TouchableOpacity style={s.btnPrimary} onPress={onEdit} activeOpacity={0.88}>
        <Text style={s.btnPrimaryText}>Edit My Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecondary} onPress={onNew} activeOpacity={0.8}>
        <Text style={s.btnSecondaryText}>Start New Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={s.btnDanger}>
        <Text style={s.btnDangerText}>Delete This Plan</Text>
      </TouchableOpacity>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// EDIT MODAL (half-screen AI input)
// ─────────────────────────────────────────────────────────────

function makeEmStyles(C: ColorPalette) { return StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(10,26,27,0.28)' },
  sheet: {
    backgroundColor: C.bg,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 0,
  },
  handle: { alignSelf: 'center', width: 36, height: 5, backgroundColor: 'rgba(10,26,27,0.15)', borderRadius: 3, marginTop: 14, marginBottom: 8 },
  sheetTitle: { fontFamily: FontFamily.displayBold, fontSize: 19, color: C.dark, paddingHorizontal: 20, paddingBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 14 },
  input: {
    flex: 1, height: 48,
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(10,26,27,0.1)',
    paddingHorizontal: 18,
    fontFamily: FontFamily.uiRegular,
    fontSize: 14,
    color: C.dark,
    ...Shadow.cardSubtle,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4 },
});}

function makeDarkStyles(C: ColorPalette) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.dark },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,245,240,0.08)',
    backgroundColor: C.dark,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(245,245,240,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FontFamily.displayBold, fontSize: 18, color: '#F5F5F0', letterSpacing: 0.3 },
  messages: { padding: Spacing.lg, gap: Spacing.md },
  systemText: { fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: '#4C6B6C', textAlign: 'center', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.xs },
  bubble: { gap: 4 },
  bubbleUser: { alignItems: 'flex-end' },
  bubbleAI: { alignItems: 'flex-start' },
  roleLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: '#4C6B6C', letterSpacing: 0.8, textTransform: 'uppercase' },
  bubbleTextUser: { maxWidth: '80%', backgroundColor: C.primary, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 11 },
  bubbleTextAI: { maxWidth: '88%', backgroundColor: C.darkSurface2, borderWidth: 1, borderColor: 'rgba(245,245,240,0.07)', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 11 },
  msgUser: { fontFamily: FontFamily.uiRegular, fontSize: 13.5, color: '#fff', lineHeight: 21 },
  msgAI: { fontFamily: FontFamily.uiRegular, fontSize: 13.5, color: '#F5F5F0', lineHeight: 22 },
  waitingText: { fontFamily: FontFamily.uiRegular, fontSize: 12, color: '#4C6B6C', fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,245,240,0.07)',
    backgroundColor: C.dark,
  },
  input: {
    flex: 1, height: 48,
    backgroundColor: C.darkSurface1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,245,240,0.1)',
    paddingHorizontal: 18,
    fontFamily: FontFamily.uiRegular,
    fontSize: 14,
    color: '#F5F5F0',
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(27,108,112,0.3)', alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 4 },
});}

function EditModal({ visible, onSend, onClose }: { visible: boolean; onSend: (msg: string) => void; onClose: () => void }) {
  const { colors: C, isDark } = useTheme();
  const s  = React.useMemo(() => makeSStyles(C), [C]);
  const em = React.useMemo(() => makeEmStyles(C), [C]);
  const [msg, setMsg] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={em.scrim} activeOpacity={1} onPress={onClose} />
        <View style={em.sheet}>
          {/* Handle */}
          <View style={em.handle} />
          <Text style={em.sheetTitle}>What would you like to change?</Text>

          {/* Input row */}
          <View style={em.inputRow}>
            <TextInput
              style={em.input}
              value={msg}
              onChangeText={setMsg}
              placeholder="Tell me what you'd like to change..."
              placeholderTextColor="#C0BCBA"
              multiline={false}
              returnKeyType="send"
              autoFocus
              onSubmitEditing={() => { if (msg.trim()) { onSend(msg.trim()); setMsg(''); } }}
            />
            <TouchableOpacity
              style={[em.sendBtn, msg.trim().length > 0 && em.sendBtnActive]}
              onPress={() => { if (msg.trim()) { onSend(msg.trim()); setMsg(''); } }}
              activeOpacity={0.85}
            >
              <Send size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// AI CHAT STATE (full dark screen)
// ─────────────────────────────────────────────────────────────

function AIChatState({ onBack, onDecision }: { onBack: () => void; onDecision: () => void }) {
  const { colors: C, isDark } = useTheme();
  const s    = React.useMemo(() => makeSStyles(C), [C]);
  const dark = React.useMemo(() => makeDarkStyles(C), [C]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'user',
      text: "Can you reduce my long runs? My knees have been hurting after anything over 14 km.",
    },
    {
      role: 'ai',
      text: "Of course — protecting your joints is the priority. Two quick questions before I update your plan:\n\n1. What would you like to cap long runs at — max 10 km or 12 km?\n\n2. Should I redistribute the removed km to other days, or reduce your total weekly volume?",
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    setMessages(prev => [...prev, { role: 'user', text: t }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: "Perfect — I'll cap long runs at 12 km and redistribute the remaining kilometres across your mid-week easy runs. Give me a moment to rebuild your plan..." },
      ]);
      scrollRef.current?.scrollToEnd({ animated: true });
      setTimeout(onDecision, 1400);
    }, 900);
  };

  return (
    <SafeAreaView style={dark.safe} edges={['bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={dark.header}>
        <TouchableOpacity style={dark.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#91AFAF" />
        </TouchableOpacity>
        <Text style={dark.title}>Edit My Plan</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: C.dark }}
        contentContainerStyle={dark.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={dark.systemText}>YOUR CURRENT PLAN IS LOADED</Text>
        {messages.map((m, i) => (
          <View key={i} style={[dark.bubble, m.role === 'user' ? dark.bubbleUser : dark.bubbleAI]}>
            {m.role === 'user' && <Text style={dark.roleLabel}>You</Text>}
            {m.role === 'ai'   && <Text style={dark.roleLabel}>Leti AI</Text>}
            <View style={m.role === 'user' ? dark.bubbleTextUser : dark.bubbleTextAI}>
              <Text style={m.role === 'user' ? dark.msgUser : dark.msgAI}>{m.text}</Text>
            </View>
          </View>
        ))}
        {input === '' && <Text style={dark.waitingText}>Leti AI is waiting for your reply...</Text>}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={dark.inputBar}>
          <TextInput
            style={dark.input}
            value={input}
            onChangeText={setInput}
            placeholder="Cap at 12 km · redistribute the volume"
            placeholderTextColor="#4C6B6C"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[dark.sendBtn, input.trim().length > 0 && dark.sendBtnActive]}
            onPress={handleSend}
            activeOpacity={0.85}
          >
            <Send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// DECISION STATE
// ─────────────────────────────────────────────────────────────

function makeDecStyles(C: ColorPalette) { return StyleSheet.create({
  titleBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  titleBarText: { fontFamily: FontFamily.displayBold, fontSize: 17, color: C.dark, letterSpacing: 0.3 },
  content: { padding: Spacing.xl, gap: Spacing.md, flexGrow: 1 },
  summaryCard: {
    backgroundColor: C.primaryFaint,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(27,108,112,0.12)',
    padding: Spacing.md,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  summaryAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  summaryHeaderLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.primary, letterSpacing: 1.2, textTransform: 'uppercase' },
  summaryBody: { fontFamily: FontFamily.uiRegular, fontSize: 13.5, color: C.dark, lineHeight: 21, marginBottom: 10 },
  summaryDivider: { height: 1, backgroundColor: 'rgba(27,108,112,0.15)', marginBottom: 10 },
  changeRow: { flexDirection: 'row', gap: 6, marginBottom: 7 },
  changeArrow: { fontFamily: FontFamily.uiRegular, fontSize: 12.5, color: C.textMuted },
  changeText: { fontFamily: FontFamily.uiRegular, fontSize: 12.5, color: C.textSecondary, lineHeight: 19, flex: 1 },
  nodismiss: { fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textTertiary, textAlign: 'center', letterSpacing: 0.8, textTransform: 'uppercase' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnNew: {
    flex: 1, height: 68,
    backgroundColor: C.dark,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: C.dark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 5,
  },
  btnNewTop: { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8 },
  btnNewBottom: { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  btnOld: {
    flex: 1, height: 68,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: 'rgba(10,26,27,0.25)',
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  btnOldTop: { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.dark, textTransform: 'uppercase', letterSpacing: 0.8 },
  btnOldBottom: { fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: C.dark, textTransform: 'uppercase', letterSpacing: 0.8 },
});}

function DecisionState({ onAccept, onKeep }: { onAccept: () => void; onKeep: () => void }) {
  const { colors: C, isDark } = useTheme();
  const s   = React.useMemo(() => makeSStyles(C), [C]);
  const dec = React.useMemo(() => makeDecStyles(C), [C]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
      {/* Title bar — no back, no close */}
      <View style={dec.titleBar}>
        <Text style={dec.titleBarText}>Your New Plan is Ready</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={dec.content}>
        {/* AI change summary */}
        <View style={dec.summaryCard}>
          <View style={dec.summaryHeader}>
            <View style={dec.summaryAvatar}>
              <LetiMark size={14} variant="white" />
            </View>
            <Text style={dec.summaryHeaderLabel}>Leti AI · Here's what changed</Text>
          </View>
          <Text style={dec.summaryBody}>
            I've updated your plan based on your knee concern. Your race timeline is unchanged — Berlin is still achievable.
          </Text>
          <View style={dec.summaryDivider} />
          {[
            'Long runs capped at 12 km from Week 4 onward',
            'Removed km spread across mid-week easy runs',
            'Weekly total reduced by ~6 km from Week 6 on',
            'Berlin timeline unchanged · still on track',
          ].map((line, i) => (
            <View key={i} style={dec.changeRow}>
              <Text style={dec.changeArrow}>→</Text>
              <Text style={dec.changeText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: Spacing.xl }} />

        {/* Reassurance card */}
        <InfoCard label="Your current plan is saved" body="It won't be deleted unless you choose the new one." />

        <Text style={dec.nodismiss}>CHOOSE ONE TO CONTINUE · CANNOT BE DISMISSED</Text>

        {/* Two equal buttons — forced choice */}
        <View style={dec.btnRow}>
          <TouchableOpacity style={dec.btnNew} onPress={onAccept} activeOpacity={0.88}>
            <Text style={dec.btnNewTop}>See Your</Text>
            <Text style={dec.btnNewBottom}>New Plan →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dec.btnOld} onPress={onKeep} activeOpacity={0.8}>
            <Text style={dec.btnOldTop}>Keep My</Text>
            <Text style={dec.btnOldBottom}>Old Plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// PLAN SCREEN
// ─────────────────────────────────────────────────────────────

// Toggle this to test different states while developing
const INITIAL_STATE: PlanState = 'race'; // 'locked' | 'empty' | 'hobby' | 'race'

export default function PlanScreen() {
  const { colors: C, isDark } = useTheme();
  const s   = React.useMemo(() => makeSStyles(C), [C]);
  const cal = React.useMemo(() => makeCalStyles(C), [C]);
  const dec = React.useMemo(() => makeDecStyles(C), [C]);

  const [planState, setPlanState] = useState<PlanState>(INITIAL_STATE);
  const [showEditModal, setShowEditModal] = useState(false);

  // AI chat & decision are full-screen replacements — render directly
  if (planState === 'ai-chat') {
    return (
      <AIChatState
        onBack={() => setPlanState('race')}
        onDecision={() => setPlanState('decision')}
      />
    );
  }

  if (planState === 'decision') {
    return (
      <DecisionState
        onAccept={() => setPlanState('race')}
        onKeep={() => setPlanState('race')}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Title bar */}
      <View style={s.titleBar}>
        <View style={{ width: 40 }} />
        <Text style={s.titleBarText}>My Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* State routing */}
      {planState === 'locked' && (
        <LockedState onUpgrade={() => Alert.alert('Premium Plans', 'Upgrade flow goes here')} />
      )}

      {planState === 'empty' && (
        <EmptyState onBuild={() => { setShowEditModal(true); }} />
      )}

      {planState === 'hobby' && (
        <ActiveHobbyState
          onEdit={() => setShowEditModal(true)}
          onSeeFullPlan={() => router.push('/full-plan?planType=hobby&currentWeek=3')}
          onNew={() => Alert.alert('New Plan', 'Start new plan flow')}
          onDelete={() => Alert.alert('Delete Plan', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => setPlanState('empty') },
          ])}
        />
      )}

      {planState === 'race' && (
        <ActiveRaceState
          onEdit={() => setShowEditModal(true)}
          onSeeFullPlan={() => router.push('/full-plan?planType=race&currentWeek=5')}
          onNew={() => Alert.alert('New Plan', 'Start new plan flow')}
          onDelete={() => Alert.alert('Delete Plan', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => setPlanState('empty') },
          ])}
        />
      )}

      {/* Edit half-modal */}
      <EditModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSend={(msg) => {
          setShowEditModal(false);
          setPlanState('ai-chat');
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

function makeSStyles(C: ColorPalette) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  titleBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  titleBarText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 18,
    color: C.dark,
  },

  // Lock state
  lockBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(243,240,233,0.72)',
  },
  lockCard: {
    position: 'absolute',
    left: Spacing.xxl,
    right: Spacing.xxl,
    top: '20%',
    bottom: '15%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  lockTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: 20,
    color: C.dark,
    textAlign: 'center',
  },
  lockBody: {
    fontFamily: FontFamily.uiRegular,
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Empty state
  emptyWrap: { flex: 1, flexDirection: 'column', padding: Spacing.xl },
  emptyInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.primaryFaint,
    borderWidth: 1.5, borderColor: 'rgba(27,108,112,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontFamily: FontFamily.displayBold, fontSize: 22, color: C.dark },
  emptyBody: { fontFamily: FontFamily.uiRegular, fontSize: 13.5, color: C.textSecondary, textAlign: 'center', lineHeight: 21, maxWidth: 220 },
  emptyFooter: { gap: Spacing.sm },

  // Active plan content
  activeContent: { padding: Spacing.lg, gap: Spacing.sm },

  // Legend
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5 },
  legendLabel: { fontFamily: FontFamily.uiRegular, fontSize: 10, color: C.textSecondary },

  // Progress
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary },
  progressValue: { fontFamily: FontFamily.uiSemiBold, fontSize: 12, color: C.primary },
  progressTrack: { height: 6, backgroundColor: 'rgba(10,26,27,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' as any, backgroundColor: C.primary, borderRadius: 3 },

  // Race card
  raceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    ...Shadow.cardSubtle,
  },
  raceCountdown: { flexShrink: 0 },
  raceNum: { fontFamily: FontFamily.displayExtraBold, fontSize: 56, color: C.dark, lineHeight: 58, letterSpacing: -2 },
  raceCountdownLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  raceName: { fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.dark },
  raceDate: { fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary },

  // Info card (thumb shadow zone)
  infoCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
    ...Shadow.cardSubtle,
  },
  infoCardLabel: { fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  infoCardBody: { fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.textSecondary },

  // Buttons
  btnPrimary: {
    height: 64,
    backgroundColor: C.dark,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
  },
  btnPrimaryText: { fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.white, letterSpacing: 0.5, textTransform: 'uppercase' },

  btnSecondary: {
    height: 50,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: 'rgba(10,26,27,0.25)',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.dark, letterSpacing: 0.3 },

  // "See the whole plan →" — sits directly below calendar, above the divider
  btnSeeAll: {
    height: 44,
    marginTop: 6,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: 'rgba(10,26,27,0.25)',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSeeAllText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.dark, letterSpacing: 0.3 },

  btnOutline: {
    width: '100%',
    height: 54,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: 'rgba(10,26,27,0.3)',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.dark },

  btnDanger: { height: 36, alignItems: 'center', justifyContent: 'center' },
  btnDangerText: { fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.textTertiary, textDecorationLine: 'underline' },

  divider: { height: 1, backgroundColor: 'rgba(10,26,27,0.08)', marginHorizontal: -Spacing.lg },
  });
}

// Calendar styles
function makeCalStyles(C: ColorPalette) { return StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayLabel: { textAlign: 'center', fontFamily: FontFamily.uiSemiBold, fontSize: 7.5, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7 },
  wkIdCol: { width: 38, flexShrink: 0, flexDirection: 'column', justifyContent: 'center', gap: 2 },
  kmHeaderLabel: { width: 36, textAlign: 'right', fontFamily: FontFamily.uiSemiBold, fontSize: 7.5, color: C.textTertiary, paddingRight: 2 },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  weekDone: { backgroundColor: 'rgba(10,26,27,0.025)' },
  weekNow: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.primary },

  wkNum: { fontFamily: FontFamily.uiSemiBold, fontSize: 8, color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  wkCheck: { fontSize: 10, color: C.success },
  nowBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  nowBadgeText: { fontFamily: FontFamily.uiSemiBold, fontSize: 6.5, color: C.primary, textTransform: 'uppercase', letterSpacing: 0.8 },

  dayCell: { alignItems: 'center', justifyContent: 'center' },

  runBlock: {
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  runLabel: { fontFamily: FontFamily.uiBold, fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 9 },
  runDist:  { fontFamily: FontFamily.uiSemiBold, fontSize: 8, lineHeight: 9.5 },
  runMeta:  { fontSize: 7, lineHeight: 8 },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3EBEC4', marginTop: 1 },

  wkKm: { width: 36, textAlign: 'right', fontFamily: FontFamily.uiRegular, fontSize: 8.5, color: C.textMuted, paddingRight: 2 },
  wkKmNow: { color: C.primary, fontFamily: FontFamily.uiSemiBold },
}); }