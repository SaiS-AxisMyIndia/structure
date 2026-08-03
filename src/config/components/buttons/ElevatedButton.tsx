import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppColors } from '../../theme/AppColors';

export type ElevatedButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
};

export function ElevatedButton({
  label,
  onPress,
  disabled,
  paddingHorizontal = 20,
  paddingVertical = 14,
}: ElevatedButtonProps) {
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
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    elevation: 3,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    backgroundColor: AppColors.neutral200,
  },
  label: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
