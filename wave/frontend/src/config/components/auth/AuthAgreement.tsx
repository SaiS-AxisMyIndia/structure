import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckBoxer } from '../form/CheckBoxer';
import { AppColors } from '../../theme/AppColors';
import { WebviewTag } from '../../constants/AppConstants';

export type AuthAgreementProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLinkPress: (tag: WebviewTag) => void;
  disabled?: boolean;
};

// Checkbox + "I agree to ..." row with four individually-clickable policy
// links, shared by both steps of LoginPage's login flow (mobile entry and
// OTP) - each link opens its own webview tag via the caller's onLinkPress.
export function AuthAgreement({ checked, onChange, onLinkPress, disabled }: AuthAgreementProps) {
  return (
    <View style={styles.row}>
      <CheckBoxer checked={checked} onChange={onChange} disabled={disabled} />
      <Text style={styles.text}>
        I agree that by signing up or logging in, I'm bound to{' '}
        <Text style={styles.link} onPress={() => onLinkPress('policy')}>
          Privacy Policy
        </Text>
        ,{' '}
        <Text style={styles.link} onPress={() => onLinkPress('security')}>
          Security
        </Text>
        ,{' '}
        <Text style={styles.link} onPress={() => onLinkPress('terms')}>
          Terms of Service
        </Text>
        ,{' '}
        <Text style={styles.link} onPress={() => onLinkPress('acceptableUsePolicy')}>
          Acceptable Use Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.neutral400,
  },
  link: {
    color: AppColors.primary,
    fontWeight: '600',
  },
});
