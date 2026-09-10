import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { RadioButton } from '../buttons/RadioButton';

export type RadioOption = {
  label: string;
  value: string;
};

export type RadioViewProps = {
  title?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  // Same idea as DropdownMenu.tsx's tap-to-clear: off by default (a plain
  // required radio group still needs exactly one option always selected),
  // opt in per-field for the optional ones (e.g. SchemeFilterSheet's
  // Gender/Sector/Residence) where re-tapping the selected option should
  // clear it back to ''.
  allowDeselect?: boolean;
};

// A full radio-group field - title/error follow the same convention
// EditText.tsx already uses for its own label/error, and each option row
// is one RadioButton.tsx (icon + label), same as EditText delegating its
// own leading icon to SvgIcon rather than drawing it itself.
export function RadioView({ title, options, value, onChange, error, disabled, allowDeselect }: RadioViewProps) {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.options}>
        {options.map(option => {
          const selected = value === option.value;
          return (
            <RadioButton
              key={option.value}
              label={option.label}
              selected={selected}
              onPress={() => onChange(allowDeselect && selected ? '' : option.value)}
              disabled={disabled}
            />
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  options: {
    gap: 10,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.secondary,
  },
});
