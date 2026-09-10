import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppColors } from '../../theme/AppColors';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

// A small pill-shaped, selectable filter button - e.g. the "All / AMI News /
// Health / Agriculture" row above the news feed. Unlike BorderButton /
// ElevatedButton (single fixed look), Chip toggles between an outlined
// unselected look and a filled selected look based on `selected`.
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: AppColors.neutral200,
    backgroundColor: AppColors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipPressed: {
    backgroundColor: AppColors.neutral,
  },
  label: {
    color: AppColors.neutral500,
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: AppColors.white,
  },
});
