// app/(tabs)/_layout.tsx
// Defines the 5-tab bottom navigation.
// Tab order: AI · Plan · Home · Profile · Settings

import { Tabs } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Dimensions, Platform, StatusBar, useWindowDimensions } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Sparkles, Calendar, Home, User, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { FontFamily } from '../../constants/theme';
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
  const { colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

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
  }, []);

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
          headerShown: false,
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarHideOnKeyboard: Platform.OS === 'android',

          tabBarIcon: ({ focused, color }) => {
            const tab = TABS.find(t => t.name === route.name);
            const IconComp = tab?.Icon ?? Home;
            return <IconComp size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />;
          },

          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor:  colors.border,
            borderTopWidth: 1,
            paddingTop:      8,
          },

          tabBarLabelStyle: {
            fontFamily: FontFamily.uiMedium,
            fontSize: 10,
            letterSpacing: 0.2,
            marginTop: 2,
          },

          tabBarItemStyle: { gap: 2 },
        };
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}