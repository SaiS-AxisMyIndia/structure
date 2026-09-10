import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// One row per generate-otp call - AuthRepo.saveOtp() always inserts a new
// row rather than overwriting a phone's previous one, so history piles up
// here instead of being deleted on verify (a cron job is what's meant to
// prune old/consumed rows, not this table's own read/write paths).
// AuthRepo.findOtp(phone, deviceId) reads the latest matching row
// (ORDER BY createdAt DESC) as the live one. There's no stored
// `expiresAt` on purpose - expiry is derived from `updatedAt` (see
// AuthService.OTP_TTL_MS): the row's own "last written" timestamp already
// says everything needed.
@Entity('auth_otp')
@Index(['phone', 'deviceId'])
export class AuthOtpEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  phone!: string;

  @Column()
  otp!: number;

  @Column()
  deviceId!: string;

  // How many times a *wrong* code has been submitted against this OTP -
  // starts at 0 for a freshly generated code. Verification is refused
  // once this reaches AuthService.OTP_MAX_ATTEMPTS, even if a later guess
  // would've been correct - see AuthService.verifyOtp.
  @Column({ default: 0 })
  attempts!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
