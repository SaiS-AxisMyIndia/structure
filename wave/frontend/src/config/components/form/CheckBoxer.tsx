import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';

const BOX_SIZE = 20;

export type CheckBoxerProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

// Plain square checkbox - LoginPage's "I agree to ..." row is the first
// caller. No label prop here on purpose: that row's text has several
// individually-clickable links inside it (Privacy Policy/Security/etc, each
// opening its own webview tag), which only works as a sibling <Text> the
// caller builds itself, not something this component could own generically.
export function CheckBoxer({ checked, onChange, disabled }: CheckBoxerProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      style={[styles.box, checked && styles.boxChecked, disabled && styles.boxDisabled]}
      hitSlop={8}
    >
      {checked && <SvgIcon icon={SvgIcons.check} size={12} color={AppColors.white} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.neutral300,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  boxDisabled: {
    opacity: 0.5,
  },
});
