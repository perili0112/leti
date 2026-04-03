// app/run-tracker.tsx
// Run Tracker — active run. No tab bar. Responds to theme.
// Map area is always dark (safety / readability while running).
// Metrics section below switches with theme mode.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowUp, ArrowDown, Mic, Play, Pause, Square } from 'lucide-react-native';
import Svg, { Defs, Pattern, Rect, Path, Polyline, Circle, G, Polygon, Text as SvgText } from 'react-native-svg';
import { FontFamily, type ColorPalette } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { fmtDist, fmtPace, distLabel, paceLabel } from '../constants/ThemeContext';

function formatPace(s: number): string {
  return `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
}

function MapView({ width, height }: { width: number; height: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <Pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <Path d="M 56 0 L 0 0 0 56" fill="none" stroke="#3EBEC4" strokeWidth="0.6" opacity="0.18" />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill="url(#grid)" />
      <Polyline points={`${width*.41},${height*.91} ${width*.41},${height*.2} ${width*.76},${height*.2} ${width*.76},${height*.62} ${width*.57},${height*.62}`} fill="none" stroke="#3EBEC4" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={`${width*.57},${height*.62} ${width*.19},${height*.62} ${width*.19},${height*.82} ${width*.41},${height*.82} ${width*.41},${height*.91}`} fill="none" stroke="#3EBEC4" strokeWidth="4" strokeDasharray="10,8" strokeOpacity="0.28" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={width*.41} cy={height*.91} r="7" fill="none" stroke="#3EBEC4" strokeWidth="2" opacity="0.6" />
      <Circle cx={width*.41} cy={height*.91} r="3" fill="#3EBEC4" opacity="0.6" />
      <Circle cx={width*.57} cy={height*.62} r="20" fill="rgba(62,190,196,0.08)" stroke="rgba(62,190,196,0.18)" strokeWidth="1" />
      <Circle cx={width*.57} cy={height*.62} r="10" fill="#0A1A1B" stroke="#3EBEC4" strokeWidth="2.5" />
      <Circle cx={width*.57} cy={height*.62} r="4" fill="#3EBEC4" />
      <G transform={`translate(${width - 40}, 36)`}>
        <Circle cx="0" cy="0" r="15" fill="rgba(10,26,27,0.72)" stroke="rgba(62,190,196,0.3)" strokeWidth="1.5" />
        <Polygon points="0,-9 -3,2 0,0 3,2" fill="#F5F5F0" />
        <Polygon points="0,9 -3,-2 0,0 3,-2" fill="#4C6B6C" />
        <SvgText x="0" y="-13" fill="#91AFAF" fontSize="7" textAnchor="middle">N</SvgText>
      </G>
    </Svg>
  );
}

export default function RunTrackerScreen() {
  const { colors: C, isDark, distUnit } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [isRunning, setIsRunning] = useState(true);
  const [elapsed,   setElapsed]   = useState(1394);
  const [distance,  setDistance]  = useState(3.4);   // always stored in km
  const [pace,      setPace]      = useState(342);   // always stored as sec/km
  const [cadence]   = useState(172);
  const [mapSize,   setMapSize]   = useState({ width: screenWidth, height: 0 });

  const TARGET_PACE_SEC = 354;  // sec/km
  const TARGET_PACE_STR = '5:54';
  const TOTAL_DISTANCE  = 5.0; // km

  // Converted display values
  const dispDistance  = fmtDist(distance, distUnit);
  const dispRemaining = fmtDist(Math.max(0, TOTAL_DISTANCE - distance), distUnit);
  const dispPace      = distUnit === 'mi'
    ? formatPace(Math.round(pace * 1.60934))
    : formatPace(pace);
  const dispTargetPace = fmtPace(TARGET_PACE_STR, distUnit);
  const dispUnit      = distLabel(distUnit);
  const dispPaceUnit  = paceLabel(distUnit).replace('/', '');

  const aheadSec  = Math.round((TARGET_PACE_SEC - pace) * distance);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1);
        setDistance(d => Math.min(TOTAL_DISTANCE, d + 0.001));
        setPace(p => Math.max(300, Math.min(400, p + (Math.random() > 0.5 ? 1 : -1))));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const goToAfterRun = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.push('/after-run');
  }, []);

  const handleEnd = useCallback(() => {
    Alert.alert('End Run?', 'Are you sure you want to finish this run?', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'End Run', style: 'destructive', onPress: goToAfterRun },
    ]);
  }, [goToAfterRun]);

  const metricText  = isDark ? '#F5F5F0' : C.dark;
  const metricMuted = isDark ? '#4C6B6C' : C.textSecondary;
  const metricBg    = isDark ? C.dark : C.bg;
  const cellBorder  = isDark ? 'rgba(245,245,240,0.07)' : C.border;
  const pauseBtnBg  = isDark ? '#F5F5F0' : C.dark;
  const pauseIconColor = isDark ? '#0A1A1B' : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: '#0A1A1B' }}>
      <StatusBar style="light" />

      {/* MAP AREA — always dark */}
      <View
        style={{ flex: 2, backgroundColor: '#0D2426', overflow: 'hidden' }}
        onLayout={e => setMapSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
        {mapSize.height > 0 && <MapView width={mapSize.width} height={mapSize.height} />}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(10,26,27,0.45)' }} pointerEvents="none" />


      </View>

      {/* METRICS — responds to theme */}
      <View style={{ flex: 3, backgroundColor: metricBg, paddingHorizontal: 20, paddingTop: 14, justifyContent: 'space-between' }}>

        {/* Pace hero */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
          <Text style={{ fontFamily: FontFamily.displayBold, fontSize: 80, color: metricText, lineHeight: 72, letterSpacing: -3 }}>{dispPace}</Text>
          <View style={{ paddingBottom: 8, gap: 4 }}>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: metricMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>min/{dispPaceUnit}</Text>
            <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: metricMuted }}>Current Pace</Text>
          </View>
        </View>

        {/* Ahead/behind pill */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: aheadSec >= 0 ? 'rgba(62,190,196,0.1)' : 'rgba(232,153,28,0.1)', borderWidth: 1, borderColor: aheadSec >= 0 ? 'rgba(62,190,196,0.25)' : 'rgba(232,153,28,0.25)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
            {aheadSec >= 0 ? <ArrowUp size={11} color='#3EBEC4' /> : <ArrowDown size={11} color='#E8991C' />}
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 12, color: aheadSec >= 0 ? '#3EBEC4' : '#E8991C' }}>{Math.abs(aheadSec)}s {aheadSec >= 0 ? 'ahead' : 'behind'}</Text>
          </View>
          <Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: metricMuted }}>target {dispTargetPace}{paceLabel(distUnit)}</Text>
        </View>

        {/* Secondary metrics */}
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: cellBorder, borderRadius: 12, overflow: 'hidden' }}>
          {[
            { val: dispDistance,   unit: ` ${dispUnit}`, label: 'Distance'  },
            { val: `${cadence}`,   unit: ' spm',          label: 'Cadence'   },
            { val: dispRemaining,  unit: ` ${dispUnit}`,  label: 'Remaining' },
          ].map(({ val, unit, label }, i) => (
            <View key={label} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', gap: 3, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: cellBorder }}>
              <Text style={{ fontFamily: FontFamily.displayBold, fontSize: 22, color: metricText, letterSpacing: -0.5 }}>{val}<Text style={{ fontFamily: FontFamily.uiRegular, fontSize: 12, color: metricMuted }}>{unit}</Text></Text>
              <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 9, color: metricMuted, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36 }}>
          <View style={{ alignItems: 'center', gap: 7 }}>
            <TouchableOpacity style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: isDark ? 'rgba(245,245,240,0.18)' : C.borderMedium, backgroundColor: isDark ? 'rgba(245,245,240,0.05)' : C.cardAlt, alignItems: 'center', justifyContent: 'center' }} onPress={() => Alert.alert('Voice', 'Voice coaching coming soon!')} activeOpacity={0.7}>
              <Mic size={22} color={metricMuted} />
            </TouchableOpacity>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: metricMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Voice</Text>
          </View>

          <View style={{ alignItems: 'center', gap: 7 }}>
            <TouchableOpacity style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: pauseBtnBg, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 8 }} onPress={() => setIsRunning(r => !r)} activeOpacity={0.85}>
              {isRunning ? <Pause size={28} color={pauseIconColor} /> : <Play size={28} color={pauseIconColor} />}
            </TouchableOpacity>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: metricMuted, letterSpacing: 1, textTransform: 'uppercase' }}>{isRunning ? 'Pause' : 'Resume'}</Text>
          </View>

          <View style={{ alignItems: 'center', gap: 7 }}>
            <TouchableOpacity style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: isDark ? 'rgba(245,245,240,0.18)' : C.borderMedium, backgroundColor: isDark ? 'rgba(245,245,240,0.05)' : C.cardAlt, alignItems: 'center', justifyContent: 'center' }} onPress={handleEnd} activeOpacity={0.7}>
              <Square size={22} color={isDark ? 'rgba(245,245,240,0.35)' : C.textMuted} />
            </TouchableOpacity>
            <Text style={{ fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: metricMuted, letterSpacing: 1, textTransform: 'uppercase' }}>End</Text>
          </View>
        </View>

        <SafeAreaView edges={['bottom']}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ width: 120, height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(245,245,240,0.12)' : C.border }} />
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}