import { useEffect, useState } from 'react';
import Toast from 'react-native-simple-toast';
import { Validator } from '../../../config/utils/Validator';
import { Routes } from '../../../config/routes/registry';
import { WebviewTag } from '../../../config/constants/AppConstants';
import { AStorage } from '../../../config/storage/AStorage';
import { setAuthToken, setRefreshToken } from '../../../config/network/secure_call';
import { isFailed } from '../../../config/network/data_response';
import { DateFormatter } from '../../../config/utils/DateFormatter';
import { LoginCases } from './LoginCases';

export const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;
const BLOCKED_MESSAGE = 'Your account has been blocked. Please contact support.';

export type LoginStep = 'mobile' | 'otp';

// Single-page login: entering a mobile number and verifying its OTP both
// happen here, one step swapped for the other in place (see LoginPage.tsx) -
// there is no separate Otp route/screen, and no registration step either.
// A first-time number (isNewUser === true) still logs straight in with
// placeholder profile details rather than being sent anywhere else.
export function useLoginController() {
  const [step, setStep] = useState<LoginStep>('mobile');
  const [mobile, setMobile] = useState('9999999999');
  const [mobileError, setMobileError] = useState<string | undefined>();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (step !== 'otp') {return;}
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const onMobileChange = (value: string) => {
    setMobile(value);
    if (mobileError) {setMobileError(undefined);}
  };

  const onOtpChange = (value: string) => {
    setOtp(value);
    if (otpError) {setOtpError(undefined);}
  };

  const onLinkPress = (tag: WebviewTag) => {
    Routes.common.webview.navigate({ tag });
  };

  const sendOtp = async (): Promise<boolean> => {
    const result = await LoginCases.sendOtp(mobile);
    if (isFailed(result)) {
      Toast.show(result.message, Toast.SHORT);
      return false;
    }
    return true;
  };

  const onLoginPress = async () => {
    if (!Validator.isValidPhoneNumber(mobile)) {
      setMobileError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!agreed) {
      Toast.show('Please accept the Terms & Policies to continue', Toast.SHORT);
      return;
    }

    setSubmitting(true);
    const success = await sendOtp();
    setSubmitting(false);
    if (!success) {return;}

    setOtp('');
    setOtpError(undefined);
    setSecondsLeft(RESEND_SECONDS);
    setStep('otp');
  };

  const onChangeNumberPress = () => {
    setStep('mobile');
    setOtp('');
    setOtpError(undefined);
  };

  const onResendPress = async () => {
    if (secondsLeft > 0 || resending) {return;}
    setResending(true);
    const success = await sendOtp();
    setResending(false);
    if (!success) {return;}

    setSecondsLeft(RESEND_SECONDS);
    setOtp('');
    setOtpError(undefined);
    Toast.show('OTP resent', Toast.SHORT);
  };

  const onVerifyPress = async () => {
    if (otp.length !== OTP_LENGTH) {
      setOtpError('Enter the complete OTP');
      return;
    }

    setSubmitting(true);
    const result = await LoginCases.verifyOtp(mobile, Number(otp));
    setSubmitting(false);

    if (isFailed(result)) {
      setOtpError(result.message);
      if (result.message === BLOCKED_MESSAGE) {
        Routes.auth.blocked.navigate();
      }
      return;
    }

    const { user, accessToken, refreshToken } = result.data;
    await setAuthToken(accessToken);
    await setRefreshToken(refreshToken);
    await AStorage.saveUser({
      mobile: user?.phone ?? mobile,
      name: [user?.fName, user?.lName].filter(Boolean).join(' ') || 'User',
    });

    Toast.show('Logged in successfully', Toast.SHORT);
    Routes.user.home.clearAll();
  };

  return {
    step,
    mobile,
    onMobileChange,
    mobileError,
    otp,
    onOtpChange,
    otpError,
    agreed,
    setAgreed,
    submitting,
    timerLabel: DateFormatter.countdown(secondsLeft),
    canResend: secondsLeft <= 0 && !resending,
    onLinkPress,
    onLoginPress,
    onChangeNumberPress,
    onResendPress,
    onVerifyPress,
  };
}
