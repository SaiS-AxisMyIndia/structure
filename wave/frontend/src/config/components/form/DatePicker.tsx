import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { CalendarSheet } from './CalendarSheet';

export type DatePickerProps = {
  label?: string;
  // See EditText.tsx's own `required` prop - same purely-visual asterisk.
  required?: boolean;
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
};

// Fixed "DD MMM YYYY" display - no date-formatting/locale library exists in
// this app, same reasoning MySurveysMockData.ts's own plain strings use.
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month} ${date.getFullYear()}`;
}

// The one general-purpose date field this app has - opens CalendarSheet
// instead of a native date picker (no such library exists in this app).
export function DatePicker({ label, required, value, onChange, placeholder = 'Select date', error }: DatePickerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <Pressable style={[styles.inputRow, error && styles.inputError]} onPress={() => setVisible(true)}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value ? formatDate(value) : placeholder}</Text>
        <SvgIcon icon={SvgIcons.calendar} size={18} />
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <CalendarSheet visible={visible} value={value} onClose={() => setVisible(false)} onSelect={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  required: {
    color: AppColors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: AppColors.neutral200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  inputError: {
    borderColor: AppColors.secondary,
  },
  value: {
    fontSize: 14,
    color: AppColors.neutral500,
  },
  placeholder: {
    color: AppColors.neutral300,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.secondary,
  },
});
