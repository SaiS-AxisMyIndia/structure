import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AuthRole {
  USER = 'user',
  ADMIN = 'admin',
}

// The real account record - one row per phone number, created the first
// time that phone ever verifies an OTP successfully (see
// AuthService.verifyOtp). There's no registration step in this app (see
// the frontend's LoginController) - a first-time login creates a bare row
// here (fName defaulted, everything else left blank) instead of the user
// filling out a form first.
@Entity('auth')
export class AuthEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fName!: string;

  @Column({ nullable: true, type: 'text' })
  lName!: string | null;

  @Column({ nullable: true, type: 'text' })
  mail!: string | null;

  @Column({ unique: true })
  phone!: string;

  // `simple-enum`, not `enum` - sqlite has no native enum type, this is
  // TypeORM's own portable stand-in for one (stored as text, validated
  // against `enum` at the ORM layer).
  @Column({ type: 'simple-enum', enum: AuthRole, default: AuthRole.USER })
  roles!: AuthRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
