import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';

export type RadioButtonProps = {
  // Omitted when the caller renders its own label elsewhere (e.g. a
  // heading + description next to the radio, not a single line of text) -
  // see DeleteAccountPage.tsx's reason rows.
  label?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  // Same escape hatches ElevatedButton/BorderButton already provide for a
  // more compact label than the defaults below.
  paddingVertical?: number;
  fontSize?: number;
  // Size of the radio glyph itself (see RadioView.tsx's own default).
  size?: number;
};

// Labeled radio option, one row of RadioView.tsx's bare icon + a tappable
// label next to it - a group of these (one per option, only one `selected`
// at a time) is the caller's job, same convention RadioView itself follows.
export function RadioButton({
  label,
  selected,
  onPress,
  disabled,
  paddingVertical = 4,
  fontSize = 14,
  size = 18,
}: RadioButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { paddingVertical }, disabled && styles.disabled]}
      hitSlop={8}
    >
      <SvgIcon icon={selected ? SvgIcons.radioFilled : SvgIcons.radio} size={size} />
      {label && <Text style={[styles.label, { fontSize }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: AppColors.neutral500,
    fontWeight: '500',
  },
});
