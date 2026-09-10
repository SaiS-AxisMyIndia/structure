import ms from 'ms';

type Duration = ms.StringValue;

export const FeaturesConfig = {
  otp: {
    length: Number(process.env.OTP_LENGTH ?? 4),
    ttlMs: ms((process.env.OTP_TTL ?? '5m') as Duration),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 3),
    devCode: Number(process.env.OTP_DEV_CODE ?? 1234),
  },
  mailer: process.env.MAILER_FROM ?? 'example@test.com',
} as const;
