/**
 * Shared CTA button. Spec §1.5:
 *  - primary: Sacred Gold fill, white text, radius 10
 *  - destructive: #FEF0F0 bg, red text/border (log out, delete)
 *  - secondary: outline
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';

type Variant = 'primary' | 'destructive' | 'secondary';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';
  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        isDestructive && styles.destructive,
        variant === 'secondary' && styles.secondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onGold : colors.sacredGold} />
      ) : (
        <Text
          style={[
            styles.label,
            isPrimary && styles.labelPrimary,
            isDestructive && styles.labelDestructive,
            variant === 'secondary' && styles.labelSecondary,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.sacredGold },
  destructive: { backgroundColor: colors.destructiveBg, borderWidth: 1, borderColor: colors.destructiveBorder },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderWarm },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '600' },
  labelPrimary: { color: colors.onGold },
  labelDestructive: { color: colors.rejected },
  labelSecondary: { color: colors.darkBrown },
});
