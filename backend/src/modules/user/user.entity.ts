import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, default: UserRole.TEACHER })
  role: UserRole;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, unique: true })
  employeeNo: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
