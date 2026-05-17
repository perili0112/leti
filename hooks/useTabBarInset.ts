import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Spacing } from '../constants/theme';

/** Bottom padding so scroll content clears the floating tab bar. */
export function useTabBarInset(extra = Spacing.md) {
  return useBottomTabBarHeight() + extra;
}
