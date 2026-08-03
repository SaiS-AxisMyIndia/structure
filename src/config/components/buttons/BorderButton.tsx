import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppColors } from '../../theme/AppColors';

export type BorderButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
};

export function BorderButton({
  label,
  onPress,
  disabled,
  paddingHorizontal = 20,
  paddingVertical = 14,
}: BorderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { paddingHorizontal, paddingVertical },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: AppColors.primaryBg2,
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
