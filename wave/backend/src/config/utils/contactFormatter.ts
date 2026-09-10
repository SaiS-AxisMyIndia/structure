// Dependency-free utility for classifying a login identifier - same
// structured object shape as numberFormatter.ts/the frontend's own
// config/utils/*Formatter.ts files.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactFormatter = {
  /**
   * Whether `value` looks like an email address rather than a phone
   * number - used to route an OTP through MailService vs SmsService (see
   * AuthService.generateOtp), and which of AuthEntity's `mail`/`phone`
   * fields a new profile's identifier gets stored under (see
   * AuthRepo.createProfile).
   */
  isEmail(value: string): boolean {
    return EMAIL_REGEX.test(value);
  },
};
