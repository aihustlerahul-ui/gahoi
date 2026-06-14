/**
 * Shared surface primitives — ivory Screen background, white Card, and Pill.
 * Spec §1.5 (Elevation & Surfaces) and §1.3 (radius).
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';

/** Ivory full-bleed background for every authenticated screen. */
export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

/** White card with warm border. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Rounded pill — used for categories, gotra, profession, status. */
export function Pill({
  label,
  active = false,
  bg,
  color,
  onPress,
}: {
  label: string;
  active?: boolean;
  bg?: string;
  color?: string;
  onPress?: () => void;
}) {
  const body = (
    <View
      style={[
        styles.pill,
        { backgroundColor: bg ?? (active ? colors.sacredGold : colors.pillInactiveBg) },
        !bg && { borderColor: active ? colors.sacredGold : colors.borderWarm },
      ]}
    >
      <Text style={[styles.pillText, { color: color ?? (active ? colors.onGold : colors.darkBrown) }]}>{label}</Text>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {body}
    </TouchableOpacity>
  ) : (
    body
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderWarm,
    padding: spacing.lg,
  },
  pill: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 11, fontWeight: '500' },
});
