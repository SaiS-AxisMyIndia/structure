import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';

export type InterestChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

// A single toggleable pill - the "+ Food" / "✓ India" tags on Area of
// Interest (see AreaOfInterestPage.tsx). Same borderless-vs-filled toggle
// idea as ToggleButton/RadioButton, just shaped as a text pill instead of
// a switch/dot - unselected is a bordered outline with a plus glyph,
// selected fills solid with a check glyph, no separate "pressed" state.
export function InterestChip({ label, selected, onPress, disabled }: InterestChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        disabled && styles.disabled,
      ]}
    >
      <SvgIcon
        icon={selected ? SvgIcons.check : SvgIcons.plus}
        size={16}
        color={selected ? AppColors.white : AppColors.neutral400}
      />
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipUnselected: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.neutral200,
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
  },
  labelUnselected: {
    color: AppColors.neutral500,
    fontWeight: '500',
  },
  labelSelected: {
    color: AppColors.white,
    fontWeight: '600',
  },
});
