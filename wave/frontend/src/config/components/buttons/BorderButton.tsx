import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';

export type BorderButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
  // Smaller footer-button contexts (e.g. NeedTile's "View Details") need a
  // more compact label than the 16px default - same escape hatch
  // ElevatedButton's own fontSize prop already provides.
  fontSize?: number;
  // BorderButton is transparent by default (e.g. sitting on a white
  // card) - callers on a non-white surface (e.g. Skip on
  // WalkthroughOverlay's dark mask) can override just this.
  backgroundColor?: string;
  // Leading icon - same icon/iconSize pair ElevatedButton already has, tinted AppColors.primary
  // (or the disabled grey below) to match this button's own outline/label
  // color instead of ElevatedButton's fixed white.
  icon?: React.ComponentType<SvgProps>;
  iconSize?: number;
};

// RN has no box-sizing equivalent - borderWidth always adds to the box on
// top of padding, it doesn't eat into it - so at equal padding a
// BorderButton renders larger than a border-less button like
// ElevatedButton. Subtracting it back out of the padding below keeps the
// stroke visually "inside" the same box a caller's padding describes.
const BORDER_WIDTH = 1.5;

export function BorderButton({
  label,
  onPress,
  disabled,
  paddingHorizontal = 14,
  paddingVertical = 6,
  fontSize = 20,
  backgroundColor,
  icon,
  iconSize,
}: BorderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          paddingHorizontal: paddingHorizontal - BORDER_WIDTH,
          paddingVertical: paddingVertical - BORDER_WIDTH,
          backgroundColor,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon && <SvgIcon icon={icon} size={iconSize ?? fontSize} color={disabled ? AppColors.neutral300 : AppColors.primary} />}
      <Text style={[styles.label, { fontSize }, disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    borderWidth: BORDER_WIDTH,
    borderColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    backgroundColor: AppColors.primary200,
  },
  disabled: {
    borderColor: AppColors.neutral300,
  },
  label: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledLabel: {
    color: AppColors.neutral300,
  },
});
