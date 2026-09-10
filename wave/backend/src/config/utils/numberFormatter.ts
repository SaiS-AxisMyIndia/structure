import { FeaturesConfig } from '../features.config.js';

// Dependency-free utility for generating/formatting numbers - matches the
// structured object shape of the frontend's own config/utils/
// DateFormatter.ts/StringFormatter.ts.
export const NumberFormatter = {
  /**
   * Random `length`-digit number, no leading zero - e.g. length 4 ->
   * [1000, 9999]. Defaults to FeaturesConfig.otp.length so a caller
   * generating an OTP just calls `NumberFormatter.randomOtp()` with no
   * argument; the length param exists for anything else that wants a
   * random N-digit number.
   */
  randomOtp(length: number = FeaturesConfig.otp.length): number {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
  },
};
