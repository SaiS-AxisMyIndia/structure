import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';

export type ElevatedButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
  fontSize?: number;
  icon?: React.ComponentType<SvgProps>;
  iconSize?: number;
};

export function ElevatedButton({
  label,
  onPress,
  disabled,
  paddingHorizontal = 14,
  paddingVertical = 6,
  fontSize = 20,
  icon,
  iconSize,
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
      {icon && <SvgIcon icon={icon} size={iconSize ?? fontSize} color={AppColors.white} />}
      <Text style={[styles.label, { fontSize }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    fontWeight: '600',
  },
});
