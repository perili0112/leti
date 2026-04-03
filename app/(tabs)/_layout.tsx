// app/(tabs)/_layout.tsx
// Defines the 5-tab bottom navigation.
// Tab order: AI · Plan · Home · Profile · Settings

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const TAB_BAR_HEIGHT = 50 + insets.bottom;

  return (
    <Tabs
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
            height:          TAB_BAR_HEIGHT,
            paddingTop:      8,
            paddingBottom:   insets.bottom,
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