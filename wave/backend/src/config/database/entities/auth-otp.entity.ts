import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// One row per phone number - AuthRepo.saveOtp() overwrites it (new code,
// new deviceId, attempts reset to 0) on every generate/resend instead of
// inserting a new row per request, so a phone only ever has one live OTP.
// There's no stored `expiresAt` on purpose - expiry is derived from
// `updatedAt` (see AuthService.OTP_TTL_MS): the row's own "last written"
// timestamp already says everything needed.
@Entity('auth_otp')
export class AuthOtpEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  phone!: string;

  @Column()
  otp!: number;

  @Column()
  deviceId!: string;

  // How many times a *wrong* code has been submitted against this OTP -
  // reset to 0 every time a fresh code is generated. Verification is
  // refused once this reaches AuthService.OTP_MAX_ATTEMPTS, even if a
  // later guess would've been correct - see AuthService.verifyOtp.
  @Column({ default: 0 })
  attempts!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
