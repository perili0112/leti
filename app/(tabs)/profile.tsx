// app/(tabs)/profile.tsx — Profile screen, fully theme-aware

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyboardTypeOptions, ViewStyle } from 'react-native';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Pressable,
  Alert, Animated, StyleSheet, TouchableWithoutFeedback, Easing, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft, X, ChevronRight,
  Pencil, Clock, Search, SlidersHorizontal, Camera,
  Trash2, CheckCircle, Star, Flame, Award, Target, Activity,
  Zap, TrendingUp, Lock,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontFamily, Spacing, Radius, Shadow, type ColorPalette } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import {
  MOCK_MILESTONES,
  type MilestoneCategory,
  type MilestoneTier,
  type TierName,
  type SpecialBadgeIconKey,
} from '../../constants/mockData';

type ProfileState = 'main' | 'edit' | 'search' | 'filter' | 'goals' | 'create-goal';

type MilestoneLayout = { x: number; y: number; width: number; height: number };

type ProfileRun = {
  id: string;
  label: string;
  name: string;
  dist: string;
  time: string;
  pace: string;
  type: string;
  routePoints: number[][];
};

const USER = {
  name: 'Dimi Papadopoulos', initial: 'D', username: 'dimi_runs',
  email: 'dimi@example.com', isPro: true, totalRuns: 42, totalKm: 387.4, streak: 8,
};

const RUNS: ProfileRun[] = [
  { id: '1', label: 'Tue 3 Jun - Tempo',  name: 'Morning Tempo Run',    dist: '8.2 km',  time: '45:16',   pace: '5:32/km', type: 'tempo', routePoints: [[7,46],[7,18],[25,18],[25,6],[43,6],[43,18]] },
  { id: '2', label: 'Sat 31 May - Long',   name: 'Saturday Long Run',    dist: '14.1 km', time: '1:18:44', pace: '5:35/km', type: 'long',  routePoints: [[9,44],[9,14],[30,14],[30,26],[44,26]]       },
  { id: '3', label: 'Thu 29 May - Easy',   name: 'Evening Recovery Run', dist: '5.8 km',  time: '34:12',   pace: '5:54/km', type: 'easy',  routePoints: [[6,40],[6,18],[20,18],[20,30],[36,30],[36,14],[48,14]] },
];

// Tier color system
// bg:          subtle whole-card tint (normal state)
// bgFocus:     stronger tint when card is highlighted (popup open)
// border:      card border (normal)
// borderFocus: card border when highlighted
// text:        readable text on bg
// bar:         progress bar colour
// rowBg:       solid colour for achieved rows (against dark backdrop)
const TIER_STYLES: Record<TierName, {
  bg: string; bgFocus: string; border: string; borderFocus: string; text: string; bar: string; rowBg: string;
}> = {
  Spark:  { bg: 'rgba(240,168,50,0.14)',  bgFocus: 'rgba(240,168,50,0.30)', border: 'rgba(240,168,50,0.38)',  borderFocus: 'rgba(240,168,50,0.80)',  text: '#9A6200', bar: '#F0A832', rowBg: '#C07800' },
  Stride: { bg: 'rgba(27,146,152,0.12)',  bgFocus: 'rgba(27,146,152,0.28)', border: 'rgba(27,146,152,0.35)',  borderFocus: 'rgba(27,146,152,0.80)',  text: '#0C7278', bar: '#3EBEC4', rowBg: '#0A6E74' },
  Surge:  { bg: 'rgba(228,100,60,0.12)',  bgFocus: 'rgba(228,100,60,0.26)', border: 'rgba(228,100,60,0.36)',  borderFocus: 'rgba(228,100,60,0.78)',  text: '#B03A10', bar: '#E8774A', rowBg: '#BE4418' },
  Soar:   { bg: 'rgba(110,70,190,0.12)',  bgFocus: 'rgba(110,70,190,0.26)', border: 'rgba(110,70,190,0.34)',  borderFocus: 'rgba(110,70,190,0.76)',  text: '#5830A8', bar: '#9B72CF', rowBg: '#6038B8' },
  Legend: { bg: 'rgba(200,148,10,0.14)',  bgFocus: 'rgba(200,148,10,0.30)', border: 'rgba(200,148,10,0.38)',  borderFocus: 'rgba(200,148,10,0.80)',  text: '#886000', bar: '#D4A017', rowBg: '#9E6800' },
};

const NO_TIER = {
  bg: 'transparent', bgFocus: 'rgba(10,26,27,0.07)',
  border: 'rgba(10,26,27,0.10)', borderFocus: 'rgba(10,26,27,0.30)',
  text: '#607878', bar: '#91AFAF', rowBg: '#2A3C3D',
};

// Helpers
function getEarnedTierIndex(cat: MilestoneCategory): number {
  if (cat.currentValue === null) return -1;
  let earned = -1;
  for (let i = 0; i < cat.tiers.length; i++) {
    if (cat.higherIsBetter) {
      if (cat.currentValue >= cat.tiers[i].target) earned = i; else break;
    } else {
      if (cat.currentValue < cat.tiers[i].target) earned = i; else break;
    }
  }
  return earned;
}

function formatCurrentValue(cat: MilestoneCategory): string {
  if (cat.currentValue === null) return 'none yet';
  if (!cat.higherIsBetter) {
    const s = cat.currentValue;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
    return m + ':' + String(sec).padStart(2,'0');
  }
  if (cat.unit === 'km') return cat.currentValue.toFixed(1) + ' km';
  if (cat.unit) return Math.floor(cat.currentValue) + ' ' + cat.unit;
  return String(Math.floor(cat.currentValue));
}

// Shared primitives
function SectionLabel({ text, C }: { text: string; C: ColorPalette }) {
  return <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: C.textMuted, letterSpacing: 1.3, textTransform: 'uppercase' }}>{text}</Text>;
}

const headerIconRipple =
  Platform.OS === 'android' ? { color: 'rgba(10,26,27,0.12)', borderless: false, radius: 18 } : undefined;

function BackButton({ onPress, C }: { onPress: () => void; C: ColorPalette }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={headerIconRipple}
      style={({ pressed }) => [
        { width: 36, height: 36, borderRadius: 9, overflow: 'hidden', borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
        Platform.OS === 'ios' && pressed ? { opacity: 0.72 } : null,
      ]}
    >
      <ArrowLeft size={16} color={C.textPrimary} />
    </Pressable>
  );
}

function CloseButton({ onPress, C }: { onPress: () => void; C: ColorPalette }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={headerIconRipple}
      style={({ pressed }) => [
        { width: 36, height: 36, borderRadius: 9, overflow: 'hidden', borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
        Platform.OS === 'ios' && pressed ? { opacity: 0.72 } : null,
      ]}
    >
      <X size={14} color={C.textSecondary} />
    </Pressable>
  );
}

function Pill({ label, active, onPress, C }: { label: string; active: boolean; onPress: () => void; C: ColorPalette }) {
  return (
    <TouchableOpacity style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1.5, borderColor: active ? C.dark : C.borderMedium, backgroundColor: active ? C.dark : C.card }} onPress={onPress} activeOpacity={0.75}>
      <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 11, color: active ? '#FFFFFF' : C.textPrimary }}>{label}</Text>
    </TouchableOpacity>
  );
}

function RunMapThumb({ points, C }: { points: number[][]; C: ColorPalette }) {
  const first = points[0]; const last = points[points.length - 1];
  return (
    <View style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: '#2A3C3D', flexShrink: 0, overflow: 'hidden' }}>
      {[[2,2,14,10],[18,2,14,10],[2,14,14,10],[18,14,14,10]].map(([x,y,w,h], i) => (
        <View key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: h, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
      ))}
      <View style={{ position: 'absolute', left: first[0]-3, top: first[1]-3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.primary, borderWidth: 1.5, borderColor: C.bg }} />
      <View style={{ position: 'absolute', left: last[0]-3, top: last[1]-3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.dark }} />
    </View>
  );
}

function RunCard({ run, onPress, C }: { run: ProfileRun; onPress: () => void; C: ColorPalette }) {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 12 }} onPress={onPress} activeOpacity={0.75}>
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

function ProgBar({ pct, color }: { pct: number; color: string }) {
  const fillWidth: ViewStyle['width'] = `${Math.min(100, Math.max(0, pct))}%`;
  return (
    <View style={{ height: 3, backgroundColor: 'rgba(0,0,0,0.10)', borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: fillWidth, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

function Field({ label, value, onChange, keyboardType, C }: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  keyboardType?: KeyboardTypeOptions;
  C: ColorPalette;
}) {
  const kb: KeyboardTypeOptions = keyboardType ?? 'default';
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</Text>
      <TextInput style={{ height: 46, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, borderRadius: 10, paddingHorizontal: 14, fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary }} value={value} onChangeText={onChange} keyboardType={kb} autoCapitalize="none" placeholderTextColor={C.textTertiary} />
    </View>
  );
}

function SpecialBadgeIcon({ iconKey, color, size = 20 }: { iconKey: SpecialBadgeIconKey; color: string; size?: number }) {
  switch (iconKey) {
    case 'firstStep':    return <Star        size={size} color={color} fill={color} />;
    case 'earlyBird':    return <Clock       size={size} color={color} />;
    case 'personalBest': return <TrendingUp  size={size} color={color} />;
    case 'nightOwl':     return <Zap         size={size} color={color} />;
    case 'rainRunner':   return <Activity    size={size} color={color} />;
    case 'centuryMonth': return <Target      size={size} color={color} />;
    case 'allDistances': return <Award       size={size} color={color} />;
    default:             return <Star        size={size} color={color} />;
  }
}

function TierBadge({ tier, small = false, onDark = false, compact = false }: { tier: TierName; small?: boolean; onDark?: boolean; compact?: boolean }) {
  const s = TIER_STYLES[tier];
  const outlined = onDark || !compact;
  const bg = onDark ? 'rgba(255,255,255,0.18)' : compact ? 'transparent' : s.bg;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bg, borderWidth: outlined ? 1 : 0, borderColor: onDark ? 'rgba(255,255,255,0.30)' : s.border, borderRadius: 5, paddingHorizontal: small ? 5 : 7, paddingVertical: small ? 2 : 3 }}>
      {tier === 'Legend' && <Star size={7} color={onDark ? '#fff' : s.text} fill={onDark ? '#fff' : s.text} />}
      <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: small ? 9 : 10.5, color: onDark ? '#fff' : s.text, letterSpacing: 0.2 }}>{tier}</Text>
    </View>
  );
}

// Milestone compact card
// Layout: [Label ..... Value]
//         [Tier badge       ]
// Whole card is colored — NO internal stripe
function MilestoneCompactCard({ cat, openCatId, onOpen, onClose, C }: {
  cat: MilestoneCategory;
  openCatId: string | null;
  onOpen: (layout: MilestoneLayout) => void;
  onClose: () => void;
  C: ColorPalette;
}) {
  const ref = useRef<View>(null);
  const earnedIdx  = getEarnedTierIndex(cat);
  const earnedTier = earnedIdx >= 0 ? cat.tiers[earnedIdx].name : null;
  const ts = earnedTier ? TIER_STYLES[earnedTier] : NO_TIER;

  const handlePress = () => {
    if (openCatId === cat.id) {
      onClose();
      return;
    }
    ref.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      onOpen({ x, y, width, height });
    });
  };

  const cardBg = earnedTier ? ts.bg : C.primaryFaint;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.78} style={{ flex: 1 }}>
      <View
        ref={ref}
        collapsable={false}
        style={{
          flex: 1,
          backgroundColor: cardBg,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: C.border,
          padding: 12,
          gap: 8,
        }}
      >
        {/* Row 1: label left, current value right */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 12, color: C.textPrimary, lineHeight: 15, flex: 1 }} numberOfLines={2}>
            {cat.label}
          </Text>
          <Text style={{ fontFamily: FontFamily.displayExtraBold, fontSize: 24, lineHeight: 26, color: earnedTier ? ts.text : C.textMuted, flexShrink: 0, maxWidth: '58%', textAlign: 'right' }} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrentValue(cat)}
          </Text>
        </View>

        {earnedTier ? <TierBadge tier={earnedTier} small compact /> : null}
      </View>
    </TouchableOpacity>
  );
}

// In-tree overlay: only dimmer + tier rows — no Modal, nothing drawn over the card itself
const ROW_H    = 42;
const ROW_GAP  = 6;
const ROW_STEP = ROW_H + ROW_GAP;

function MilestoneTiersOverlay({ cat, layout, onClose }: {
  cat: MilestoneCategory;
  layout: MilestoneLayout;
  onClose: () => void;
}) {
  const earnedIdx   = getEarnedTierIndex(cat);
  const earnedTiers = cat.tiers.slice(0, earnedIdx + 1);
  const futureTiers = cat.tiers.slice(earnedIdx + 1);

  const anims = useRef(cat.tiers.map(() => ({ opacity: new Animated.Value(0), translate: new Animated.Value(0) }))).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(backdropAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();

    const all: Animated.CompositeAnimation[] = [];

    // Achieved: start below card, spring UP to position above it
    [...earnedTiers].reverse().forEach((_: MilestoneTier, i: number) => {
      const idx = earnedIdx - i;
      const a   = anims[idx];
      a.translate.setValue((i + 1) * ROW_STEP);
      all.push(Animated.sequence([
        Animated.delay(i * 45),
        Animated.parallel([
          Animated.spring(a.translate, { toValue: 0, damping: 16, stiffness: 220, useNativeDriver: true }),
          Animated.timing(a.opacity,   { toValue: 1, duration: 140, useNativeDriver: true }),
        ]),
      ]));
    });

    // Future: start above card, spring DOWN to position below it
    futureTiers.forEach((_: MilestoneTier, i: number) => {
      const idx = earnedIdx + 1 + i;
      const a   = anims[idx];
      a.translate.setValue(-(i + 1) * ROW_STEP);
      all.push(Animated.sequence([
        Animated.delay(i * 45),
        Animated.parallel([
          Animated.spring(a.translate, { toValue: 0, damping: 16, stiffness: 220, useNativeDriver: true }),
          Animated.timing(a.opacity,   { toValue: 1, duration: 140, useNativeDriver: true }),
        ]),
      ]));
    });

    Animated.parallel(all).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ...cat.tiers.map((_: MilestoneTier, i: number) => Animated.timing(anims[i].opacity, { toValue: 0, duration: 120, useNativeDriver: true })),
    ]).start(onClose);
  };

  const dim = 'rgba(6,14,15,0.72)';

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 20 }]} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={dismiss}>
        <View style={StyleSheet.absoluteFillObject}>
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: layout.y, backgroundColor: dim, opacity: backdropAnim }} />
          <Animated.View style={{ position: 'absolute', top: layout.y + layout.height, left: 0, right: 0, bottom: 0, backgroundColor: dim, opacity: backdropAnim }} />
          <Animated.View style={{ position: 'absolute', top: layout.y, left: 0, width: layout.x, height: layout.height, backgroundColor: dim, opacity: backdropAnim }} />
          <Animated.View style={{ position: 'absolute', top: layout.y, left: layout.x + layout.width, right: 0, height: layout.height, backgroundColor: dim, opacity: backdropAnim }} />
        </View>
      </TouchableWithoutFeedback>

      {earnedTiers.map((tier: MilestoneTier, i: number) => {
        const revI   = earnedTiers.length - 1 - i;
        const rowTop = layout.y - (revI + 1) * ROW_STEP;
        const tts    = TIER_STYLES[tier.name];
        return (
          <Animated.View key={'e-' + tier.name} pointerEvents="none" style={{ position: 'absolute', left: layout.x, top: rowTop, width: layout.width, height: ROW_H, zIndex: 21, opacity: anims[i].opacity, transform: [{ translateY: anims[i].translate }], backgroundColor: tts.rowBg, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
            <TierBadge tier={tier.name} small onDark />
            <Text style={{ flex: 1, fontFamily: FontFamily.uiSemiBold, fontSize: 12.5, color: '#fff' }} numberOfLines={1}>{tier.display}</Text>
            <CheckCircle size={14} color="rgba(255,255,255,0.80)" />
          </Animated.View>
        );
      })}

      {futureTiers.map((tier: MilestoneTier, i: number) => {
        const idx    = earnedIdx + 1 + i;
        const isNext = i === 0;
        const tts    = TIER_STYLES[tier.name];
        const rowTop = layout.y + layout.height + ROW_GAP + i * ROW_STEP;
        return (
          <Animated.View key={'f-' + tier.name} pointerEvents="none" style={{ position: 'absolute', left: layout.x, top: rowTop, width: layout.width, height: ROW_H, zIndex: 21, opacity: anims[idx].opacity, transform: [{ translateY: anims[idx].translate }], backgroundColor: isNext ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1, borderColor: isNext ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8 }}>
            <View style={{ backgroundColor: isNext ? tts.rowBg : 'rgba(255,255,255,0.08)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 9.5, color: isNext ? '#fff' : 'rgba(255,255,255,0.38)' }}>{tier.name}</Text>
            </View>
            <Text style={{ flex: 1, fontFamily: FontFamily.uiRegular, fontSize: 12, color: isNext ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.32)' }} numberOfLines={1}>{tier.display}</Text>
            {!isNext && <Lock size={11} color="rgba(255,255,255,0.22)" />}
          </Animated.View>
        );
      })}
    </View>
  );
}

function SpecialBadgesSection({ C }: { C: ColorPalette }) {
  const earned = MOCK_MILESTONES.specialBadges.filter(b => b.earned);
  if (earned.length === 0) return null;
  return (
    <>
      <SectionLabel text="Special Badges" C={C} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {earned.map(badge => (
          <View key={badge.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: Radius.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.accentFaint, alignItems: 'center', justifyContent: 'center' }}>
              <SpecialBadgeIcon iconKey={badge.iconKey} color={C.accent} size={16} />
            </View>
            <View style={{ gap: 1 }}>
              <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 12.5, color: C.textPrimary }}>{badge.label}</Text>
              {badge.earnedDate && <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 10.5, color: C.textMuted }}>{badge.earnedDate}</Text>}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function MainState({ onEdit, onSearchFocus, onFilterOpen, onGoals, onRunTap, C }: {
  onEdit: () => void;
  onSearchFocus: () => void;
  onFilterOpen: () => void;
  onGoals: () => void;
  onRunTap: (id: string) => void;
  C: ColorPalette;
}) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: Spacing.md }}>
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

      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 12 }} onPress={onGoals} activeOpacity={0.75}>
        <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={17} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textPrimary }}>Personal Goals & Milestones</Text>
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textSecondary, marginTop: 2 }}>2 active goals</Text>
        </View>
        <ChevronRight size={16} color={C.textMuted} />
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {[{ val: '42', sub: 'Runs' }, { val: '387', sub: 'km total' }, { val: '8', sub: 'Streak' }].map(({ val, sub }, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: C.card, borderRadius: Radius.md, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={{ fontFamily: FontFamily.displayExtraBold, fontSize: 26, color: sub === 'Streak' ? C.accent : C.textPrimary, lineHeight: 28 }}>{val}</Text>
              {sub === 'Streak' && <Flame size={20} color={C.accent} fill={C.accent} />}
            </View>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{sub}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <TouchableOpacity style={{ flex: 1, height: 42, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, borderRadius: 21, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 }} onPress={onSearchFocus} activeOpacity={0.85}>
          <Search size={14} color={C.textMuted} />
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.textTertiary }}>Search runs...</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, alignItems: 'center', justifyContent: 'center' }} onPress={onFilterOpen} activeOpacity={0.8}>
          <SlidersHorizontal size={16} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <SectionLabel text="Run History" C={C} />
      {RUNS.map(run => <RunCard key={run.id} run={run} onPress={() => onRunTap(run.id)} C={C} />)}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function EditState({ onBack, C }: { onBack: () => void; C: ColorPalette }) {
  const [username, setUsername] = useState(USER.username);
  const [email, setEmail] = useState(USER.email);
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
      <View style={{ backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
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

function SearchState({ onCancel, C }: { onCancel: () => void; C: ColorPalette }) {
  const [query, setQuery] = useState('easy run');
  const results = RUNS.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.type.includes(query.toLowerCase()));
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flex: 1, height: 40, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.primary, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
          <Search size={14} color={C.primary} style={{ marginRight: 6 }} />
          <TextInput style={{ flex: 1, fontFamily: FontFamily.uiMedium, fontSize: 13, color: C.textPrimary }} value={query} onChangeText={setQuery} autoFocus returnKeyType="search" selectTextOnFocus placeholderTextColor={C.textTertiary} />
        </View>
        <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}>
        <SectionLabel text={results.length + ' results for "' + query + '"'} C={C} />
        {results.map(run => (
          <TouchableOpacity key={run.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 12 }} onPress={() => router.push('/run-detail?id=' + run.id)} activeOpacity={0.75}>
            <RunMapThumb points={run.routePoints} C={C} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textMuted }}>{run.label}</Text>
              <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.textPrimary }}>{run.name}</Text>
            </View>
            <ChevronRight size={14} color={C.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function FilterState({ onClose, C }: { onClose: () => void; C: ColorPalette }) {
  const [period, setPeriod] = useState('This month');
  const [type, setType]     = useState('Easy');
  const [dist, setDist]     = useState('5-10 km');
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, padding: 14, gap: 12, ...Shadow.card }}>
        {[
          { label: 'Date Range', opts: ['This month','Last 3 months','This year','All time'], val: period, set: setPeriod },
          { label: 'Run Type',   opts: ['All','Easy','Tempo','Long','Interval'],             val: type,   set: setType   },
          { label: 'Distance',   opts: ['Any','Under 5 km','5-10 km','10+ km'],              val: dist,   set: setDist   },
        ].map(({ label, opts, val, set }) => (
          <View key={label}>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {opts.map(opt => <Pill key={opt} label={opt} active={val === opt} onPress={() => set(opt)} C={C} />)}
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <TouchableOpacity style={{ flex: 1, height: 46, backgroundColor: C.dark, borderRadius: 10, alignItems: 'center', justifyContent: 'center', ...Shadow.button }} onPress={onClose} activeOpacity={0.88}>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setPeriod('This month'); setType('All'); setDist('Any'); }} activeOpacity={0.7}>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 12, color: C.textMuted, textDecorationLine: 'underline' }}>Clear all</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function GoalsState({ onBack, onCreateGoal, C }: { onBack: () => void; onCreateGoal: () => void; C: ColorPalette }) {
  const [open, setOpen] = useState<{ cat: MilestoneCategory; layout: MilestoneLayout } | null>(null);
  const goalsRootRef = useRef<View>(null);

  const handleMilestoneOpen = useCallback((cat: MilestoneCategory, win: MilestoneLayout) => {
    goalsRootRef.current?.measureInWindow((cx: number, cy: number) => {
      setOpen({
        cat,
        layout: {
          x: win.x - cx,
          y: win.y - cy,
          width: win.width,
          height: win.height,
        },
      });
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(null);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  return (
    <View ref={goalsRootRef} style={{ flex: 1 }} collapsable={false}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }} showsVerticalScrollIndicator={false} scrollEnabled={open === null}>
        <SectionLabel text="Personal Goals" C={C} />
        <View style={{ gap: Spacing.sm }}>
          {[
            { title: 'Weekly Distance', progress: '18.4 km of 30 km', pct: 61, meta: 'Resets weekly · 11.6 km remaining' },
            { title: 'Monthly Runs',    progress: '11 of 16 runs',     pct: 69, meta: 'Resets monthly · 5 runs remaining' },
          ].map(({ title, progress, pct, meta }) => (
            <View key={title} style={{ backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.textPrimary }}>{title}</Text>
                  <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{progress}</Text>
                </View>
                <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: C.primary }}>{pct}%</Text>
                <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7} onPress={() => Alert.alert('Delete goal?', title + ' will be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }])}>
                  <Trash2 size={15} color={C.textMuted} />
                </TouchableOpacity>
              </View>
              <ProgBar pct={pct} color={C.primary} />
              <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 10.5, color: C.textMuted, marginTop: 2 }}>{meta}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={{ height: 46, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.borderStrong, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} onPress={onCreateGoal} activeOpacity={0.8}>
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: C.textPrimary }}>Create New Goal</Text>
        </TouchableOpacity>

        <SectionLabel text="Milestones" C={C} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MOCK_MILESTONES.categories.map(cat => (
            <View key={cat.id} style={{ width: '48.6%' }}>
              <MilestoneCompactCard
                cat={cat}
                openCatId={open?.cat.id ?? null}
                onOpen={wl => handleMilestoneOpen(cat, wl)}
                onClose={() => setOpen(null)}
                C={C}
              />
            </View>
          ))}
        </View>

        <SpecialBadgesSection C={C} />
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {open && <MilestoneTiersOverlay cat={open.cat} layout={open.layout} onClose={() => setOpen(null)} />}
    </View>
  );
}

function CreateGoalState({ onBack, C }: { onBack: () => void; C: ColorPalette }) {
  const [title, setTitle]       = useState('Run 100 km this month');
  const [goalType, setGoalType] = useState('Distance');
  const [target, setTarget]     = useState('100');
  const [resets, setResets]     = useState('Monthly');
  const summary = 'Run ' + target + ' km every ' + resets.toLowerCase().replace('ly', '');
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>Goal Title</Text>
        <TextInput style={{ height: 46, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.primary, borderRadius: 10, paddingHorizontal: 14, fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary }} value={title} onChangeText={setTitle} placeholderTextColor={C.textTertiary} />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10.5, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>Goal Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {['Distance','Runs','Pace','Streak'].map(opt => <Pill key={opt} label={opt} active={goalType === opt} onPress={() => setGoalType(opt)} C={C} />)}
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
          {['Weekly','Monthly','Never'].map(opt => <Pill key={opt} label={opt} active={resets === opt} onPress={() => setResets(opt)} C={C} />)}
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

export default function ProfileScreen() {
  const { colors: C, isDark } = useTheme();
  const [state, setState] = useState<ProfileState>('main');
  const params = useLocalSearchParams();
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

  type NavCfg = { title: string; showBack: boolean; showClose: boolean; backState: ProfileState | null };
  const cfgs: Record<ProfileState, NavCfg> = {
    main:        { title: 'Profile',            showBack: false, showClose: false, backState: null    },
    edit:        { title: 'Edit Profile',       showBack: true,  showClose: true,  backState: 'main'  },
    search:      { title: '',                   showBack: false, showClose: false, backState: null    },
    filter:      { title: 'Profile',            showBack: false, showClose: false, backState: null    },
    goals:       { title: 'Goals & Milestones', showBack: true,  showClose: false, backState: 'main'  },
    'create-goal': { title: 'Create Goal',        showBack: false, showClose: true,  backState: 'goals' },
  };
  const cfg = cfgs[state];
  const navBackTarget = cfg.backState;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {toastVisible && (
        <Animated.View style={{ position: 'absolute', bottom: 90, left: 20, right: 20, zIndex: 100, backgroundColor: C.success, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: toastOpacity, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}>
          <CheckCircle size={20} color="#fff" />
          <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: '#fff', flex: 1 }}>Password reset successfully</Text>
        </Animated.View>
      )}

      {state !== 'search' && (
        <View
          style={{
            height: 54,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.md,
            backgroundColor: C.bg,
            borderBottomLeftRadius: Radius.lg,
            borderBottomRightRadius: Radius.lg,
            ...Shadow.card,
          }}
        >
          {cfg.showBack && navBackTarget != null ? <BackButton onPress={() => setState(navBackTarget)} C={C} /> : <View style={{ width: 36 }} />}
          <Text style={{ fontFamily: FontFamily.displayBold, fontSize: 18, color: C.textPrimary }}>{cfg.title}</Text>
          {cfg.showClose && navBackTarget != null ? <CloseButton onPress={() => setState(navBackTarget)} C={C} /> : <View style={{ width: 36 }} />}
        </View>
      )}

      {state === 'main'        && <MainState        onEdit={() => setState('edit')} onSearchFocus={() => setState('search')} onFilterOpen={() => setState('filter')} onGoals={() => setState('goals')} onRunTap={(id: string) => router.push('/run-detail?id=' + id)} C={C} />}
      {state === 'edit'        && <EditState        onBack={() => setState('main')} C={C} />}
      {state === 'search'      && <SearchState      onCancel={() => setState('main')} C={C} />}
      {state === 'filter'      && <FilterState      onClose={() => setState('main')} C={C} />}
      {state === 'goals'       && <GoalsState       onBack={() => setState('main')} onCreateGoal={() => setState('create-goal')} C={C} />}
      {state === 'create-goal' && <CreateGoalState  onBack={() => setState('goals')} C={C} />}
    </SafeAreaView>
  );
}