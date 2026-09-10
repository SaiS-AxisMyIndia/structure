import React from 'react';
import { KeyboardTypeOptions, Platform, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';

// react-native-web renders TextInput as a plain <input>/<textarea>, which
// gets the browser's own default focus outline drawn inside our own
// bordered inputRow - same fix SearchView.tsx already applies to its field.
const webInputStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

export type EditTextProps = {
  label?: string;
  // Shows a purple asterisk after `label` - purely visual, same as
  // Dropdowner.tsx/DatePicker.tsx's own `required` prop; the actual
  // required-ness is still enforced by whatever validates the form (e.g.
  // AboutYouController's onSubmit), not by this component.
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  // Leading icon inside the input (e.g. LoginPage's mobile number field) -
  // omitted, this renders exactly as it always has.
  icon?: React.ComponentType<SvgProps>;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
};

// The one general-purpose text field this app has - AddNeedsPage.tsx is
// its first real caller. Kept generic (label/value/error, no Needs-specific
// wiring) so any future form screen can reuse it instead of hand-rolling
// another TextInput wrapper.
export function EditText({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  error,
  icon,
  keyboardType,
  maxLength,
}: EditTextProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[styles.inputRow, multiline && styles.multilineRow, error && styles.inputError]}>
        {icon && <SvgIcon icon={icon} size={18} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={AppColors.neutral300}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          keyboardType={keyboardType}
          maxLength={maxLength}
          style={[styles.input, multiline && styles.multilineText, webInputStyle]}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.neutral200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AppColors.neutral500,
    padding: 0,
  },
  multilineRow: {
    minHeight: 96,
    alignItems: 'flex-start',
  },
  multilineText: {
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: AppColors.secondary,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.secondary,
  },
});
