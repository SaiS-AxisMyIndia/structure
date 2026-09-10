import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// One row per (authId, deviceId) pair - a device that logs in again just
// updates its existing row (see AuthRepo.upsertDevice) rather than
// accumulating a new one per login. Plain `authId` column, not a
// `@ManyToOne` relation - AuthEntity.id (a UUID) is duplicated here, same
// as auth_otp's own `phone` column doesn't relate back to `auth` either.
@Entity('devices')
@Index(['authId', 'deviceId'], { unique: true })
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  authId!: string;

  @Column()
  deviceId!: string;

  // Human-readable device name (e.g. "Adi's iPhone") - the frontend's own
  // DeviceInfo.getDetails().deviceName, sent once at verify-otp time. Null
  // when a client doesn't provide one.
  @Column({ nullable: true, type: 'text' })
  name!: string | null;

  // Lets a device be revoked (e.g. a future "sign out this device"
  // feature) without deleting its row/history - true on every successful
  // login (see AuthRepo.upsertDevice).
  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
