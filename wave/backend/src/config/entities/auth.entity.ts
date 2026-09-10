import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AuthRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('auth')
export class AuthEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fName!: string;

  @Column({ nullable: true, type: 'text' })
  lName!: string | null;

  @Column({ nullable: true, type: 'text' })
  mail!: string | null;

  @Column({ unique: true })
  phone!: string;

  @Column({ type: 'simple-enum', enum: AuthRole, default: AuthRole.USER })
  roles!: AuthRole;

  @Column({ default: false })
  blocked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
