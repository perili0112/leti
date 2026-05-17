// app/(tabs)/_layout.tsx
// Defines the 5-tab bottom navigation.
// Tab order: AI · Plan · Home · Profile · Settings

import { Tabs } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Dimensions, Platform, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Sparkles, Calendar, Home, User, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { FontFamily, Radius } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';

const TABS: Array<{ name: string; title: string; Icon: LucideIcon }> = [
  { name: 'ai',       title: 'AI',       Icon: Sparkles  },
  { name: 'plan',     title: 'Plan',     Icon: Calendar  },
  { name: 'index',    title: 'Home',     Icon: Home      },
  { name: 'profile',  title: 'Profile',  Icon: User      },
  { name: 'settings', title: 'Settings', Icon: Settings  },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const tabBarBg = isDark ? colors.cardAlt : colors.card;
  const tabBarInactive = isDark ? colors.textSecondary : colors.textMuted;

  // Android (RN 0.81 + Expo): edge-to-edge is on by default; safe-area bottom can be 0 while
  // the 3-button nav still overlaps. Merge hook + splash metrics + window/screen gap, then 48dp fallback.
  const tabBarBottomInset = useMemo(() => {
    if (Platform.OS !== 'android') {
      return insets.bottom;
    }
    const initialBottom = initialWindowMetrics?.insets.bottom ?? 0;
    const { height: winH } = Dimensions.get('window');
    const { height: scrH } = Dimensions.get('screen');
    const statusBar = StatusBar.currentHeight ?? 0;
    const fromSizeGap = Math.max(0, scrH - winH - statusBar);
    const merged = Math.max(insets.bottom, initialBottom, fromSizeGap);
    return merged > 0 ? merged : 48;
  }, [insets.bottom, windowHeight]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setPositionAsync('relative').catch(() => {});
    NavigationBar.setStyle(isDark ? 'dark' : 'light');
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
    NavigationBar.setBackgroundColorAsync(colors.bg).catch(() => {});
    NavigationBar.setBorderColorAsync(colors.bg).catch(() => {});
  }, [isDark, colors.bg]);

  const tabBarStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      paddingTop: isDark ? 10 : 8,
      elevation: 0,
      shadowOpacity: 0,
    }),
    [isDark],
  );

  return (
    <Tabs
      safeAreaInsets={{
        top: insets.top,
        right: insets.right,
        bottom: tabBarBottomInset,
        left: insets.left,
      }}
      screenOptions={({ route }) => {
        return {
          sceneStyle: { backgroundColor: colors.bg },
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: tabBarInactive,
          tabBarHideOnKeyboard: Platform.OS === 'android',

          tabBarBackground: () => (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: tabBarBg,
                  borderTopLeftRadius: Radius.lg,
                  borderTopRightRadius: Radius.lg,
                  overflow: 'hidden',
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                  shadowColor: '#0A1A1B',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: isDark ? 0.28 : 0.08,
                  shadowRadius: 12,
                  elevation: 12,
                },
              ]}
            />
          ),

          tabBarIcon: ({ focused, color }) => {
            const tab = TABS.find(t => t.name === route.name);
            const IconComp = tab?.Icon ?? Home;
            return (
              <IconComp
                size={isDark ? 24 : 22}
                color={color}
                strokeWidth={focused ? 2.5 : 1.75}
              />
            );
          },

          tabBarStyle,

          tabBarLabelStyle: {
            fontFamily: FontFamily.uiMedium,
            fontSize: isDark ? 11 : 10,
            letterSpacing: isDark ? 0.3 : 0.2,
            marginTop: 2,
          },

          tabBarItemStyle: { gap: isDark ? 4 : 2, paddingVertical: isDark ? 2 : 0 },
        };
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}