import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-simple-toast';
import { SvgIcons } from '../../../config/components/images/svg_icons';
import { SvgIcon } from '../../../config/components/images/SvgIcon';
import { ElevatedButton } from '../../../config/components/buttons/ElevatedButton';
import { EditText } from '../../../config/components/form/EditText';
import { AppColors } from '../../../config/theme/AppColors';
import { AuthHeader } from '../../../config/components/auth/AuthHeader';
import { AuthAgreement } from '../../../config/components/auth/AuthAgreement';
import { AuthScreenShell } from '../../../config/components/auth/AuthScreenShell';
import { useLoginController } from './LoginController';

// There is no real Google OAuth wiring in this app yet (no SDK, no backend
// endpoint) - this button just matches the design and stands in as a
// "coming soon" placeholder until that lands.
function GoogleLoginButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.googleButton, pressed && styles.googleButtonPressed]} onPress={onPress}>
      <SvgIcon icon={SvgIcons.google} size={18} />
      <Text style={styles.googleLabel}>Google Login</Text>
    </Pressable>
  );
}

// Single page for the whole login flow: entering a mobile number and
// verifying its OTP are two steps of the same screen (see
// LoginController's `step`), not separate routes - there is no OtpPage and
// no registration step, a first-time number just logs straight in.
export function LoginBody() {
  const controller = useLoginController();
  const isOtpStep = controller.step === 'otp';

  const renderFields = () => (
    <>
      <AuthHeader />

      <View style={styles.form}>
        {isOtpStep ? (
          <>
            <EditText
              value={controller.otp}
              onChangeText={controller.onOtpChange}
              placeholder="OTP"
              keyboardType="number-pad"
              maxLength={4}
              error={controller.otpError}
            />
            <View style={styles.otpMetaRow}>
              {controller.canResend ? (
                <Pressable onPress={controller.onResendPress} hitSlop={8}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </Pressable>
              ) : (
                <Text style={styles.timerText}>
                  Valid for : <Text style={styles.timerValue}>{controller.timerLabel}</Text>
                </Text>
              )}
              <Pressable onPress={controller.onChangeNumberPress} hitSlop={8}>
                <Text style={styles.mobileText}>+91 {controller.mobile}</Text>
              </Pressable>
            </View>
            <ElevatedButton
              label={controller.submitting ? 'Verifying...' : 'Verify'}
              onPress={controller.onVerifyPress}
              disabled={controller.submitting}
              paddingVertical={14}
              fontSize={16}
            />
          </>
        ) : (
          <>
            <EditText
              value={controller.mobile}
              onChangeText={controller.onMobileChange}
              placeholder="E-Mail / Phone"
              error={controller.mobileError}
            />
            <ElevatedButton
              label={controller.submitting ? 'Sending OTP...' : 'Login'}
              onPress={controller.onLoginPress}
              disabled={controller.submitting}
              paddingVertical={14}
              fontSize={16}
            />
          </>
        )}

        <GoogleLoginButton onPress={() => Toast.show('Coming soon', Toast.SHORT)} />
      </View>
    </>
  );

  const renderActions = () => (
    <AuthAgreement
      checked={controller.agreed}
      onChange={controller.setAgreed}
      onLinkPress={controller.onLinkPress}
      disabled={isOtpStep}
    />
  );

  return <AuthScreenShell renderFields={renderFields} renderActions={renderActions} />;
}

export function LoginPage() {
  return <LoginBody />;
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
    marginTop: 32,
  },
  otpMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerText: {
    fontSize: 13,
    color: AppColors.neutral500,
  },
  timerValue: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  mobileText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: AppColors.neutral200,
    paddingVertical: 13,
    // AppColors has no `white` token yet (a pre-existing gap - see
    // EditText.tsx, which hits the same thing) - a literal hex avoids
    // depending on it.
    backgroundColor: '#FFFFFF',
  },
  googleButtonPressed: {
    backgroundColor: AppColors.neutral100,
  },
  googleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.neutral900,
  },
});
