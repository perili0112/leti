// components/paywall/LineGraph.tsx
// SVG line chart built with react-native-svg (already in project).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Polygon, Circle, Line } from 'react-native-svg';
import { FontFamily } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import type { GraphPoint } from '../../types/onboarding';

interface Props {
  points:       GraphPoint[];
  unit:         string;   // 'km' | 'min'
  yLabels:      string[]; // top → bottom, 4 values
  xLabels:      string[]; // subset of week labels to show
  peakLabel?:   string;   // e.g. "55 km" shown at peak
  startLabel?:  string;   // e.g. "12 km" shown at start
  color?:       string;
}

const PAD_LEFT   = 36;
const PAD_RIGHT  = 12;
const PAD_TOP    = 16;
const PAD_BOTTOM = 18;
const H          = 110;

export function LineGraph({
  points, unit, yLabels, xLabels, peakLabel, startLabel, color,
}: Props) {
  const { colors: C } = useTheme();
  const lineColor = color ?? C.dark;

  // Normalise points to SVG coordinates
  const maxVal  = Math.max(...points.map(p => p.distance));
  const minVal  = 0;
  const range   = maxVal - minVal || 1;
  const W       = 290; // viewBox width; actual rendered width is 100%

  const toX = (i: number) =>
    PAD_LEFT + (i / (points.length - 1)) * (W - PAD_LEFT - PAD_RIGHT);
  const toY = (v: number) =>
    PAD_TOP + (1 - (v - minVal) / range) * (H - PAD_TOP - PAD_BOTTOM);

  const coords = points.map((p, i) => `${toX(i).toFixed(1)},${toY(p.distance).toFixed(1)}`);
  const polylinePoints = coords.join(' ');

  // Fill polygon: close bottom
  const fillPoints = [
    ...coords,
    `${toX(points.length - 1).toFixed(1)},${H}`,
    `${toX(0).toFixed(1)},${H}`,
  ].join(' ');

  // Peak point index
  const peakIdx = points.reduce((bi, p, i) => p.distance > points[bi].distance ? i : bi, 0);

  // Grid Y positions (4 lines)
  const gridYs = [0.1, 0.4, 0.6, 0.9].map(
    f => PAD_TOP + (1 - f) * (H - PAD_TOP - PAD_BOTTOM)
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.container}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {yLabels.map((l, i) => (
            <Text key={i} style={[styles.axisLabel, { color: C.textMuted }]}>{l}</Text>
          ))}
        </View>

        {/* Plot area */}
        <View style={{ flex: 1 }}>
          <Svg viewBox={`0 0 ${W} ${H}`} style={styles.svg} preserveAspectRatio="none">
            {/* Grid lines */}
            {gridYs.map((y, i) => (
              <Line
                key={i}
                x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y}
                stroke={C.border} strokeWidth="1"
                strokeDasharray="3 3"
              />
            ))}
            {/* Fill */}
            <Polygon
              points={fillPoints}
              fill={`${lineColor}12`}
            />
            {/* Line */}
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Start dot */}
            <Circle cx={toX(0)} cy={toY(points[0].distance)} r="4" fill={lineColor} />
            {/* Peak dot */}
            <Circle cx={toX(peakIdx)} cy={toY(points[peakIdx].distance)} r="4" fill={lineColor} />
            {/* End dot */}
            {points.length - 1 !== peakIdx && (
              <Circle
                cx={toX(points.length - 1)}
                cy={toY(points[points.length - 1].distance)}
                r="3.5"
                fill={lineColor}
              />
            )}
          </Svg>

          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {xLabels.map((l, i) => (
              <Text key={i} style={[styles.axisLabel, { color: C.textMuted }]}>{l}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: lineColor }]} />
          <Text style={[styles.legendText, { color: C.textSecondary }]}>
            {startLabel && peakLabel
              ? `${startLabel} → ${peakLabel}`
              : `Weekly ${unit}`
            }
          </Text>
        </View>
        {startLabel && peakLabel && (
          <Text style={[styles.legendValue, { color: C.textPrimary }]}>
            {startLabel} → {peakLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { gap: 0 },
  container:  { flexDirection: 'row', height: H + 22, alignItems: 'flex-start' },
  yAxis:      { width: 32, height: H, justifyContent: 'space-between', paddingBottom: PAD_BOTTOM, paddingTop: PAD_TOP },
  axisLabel:  { fontFamily: FontFamily.uiRegular, fontSize: 7.5, textAlign: 'right' },
  svg:        { width: '100%', height: H },
  xAxis:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  legend:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginLeft: 36 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontFamily: FontFamily.uiRegular, fontSize: 10 },
  legendValue:{ fontFamily: FontFamily.uiSemiBold, fontSize: 11 },
});
