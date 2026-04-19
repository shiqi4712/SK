import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('course_data')
export class CourseData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  userName: string;

  @Column('bigint')
  teacherId: number;

  @Column({ length: 100, nullable: true })
  className: string;

  @Column({ length: 200 })
  courseName: string;

  @Column({ type: 'datetime' })
  lessonStartTime: Date;

  @Column({ default: true })
  isAttended: boolean;

  @Column({ default: false })
  isAbsent: boolean;

  @Column({ type: 'int', default: 0 })
  effectiveDuration: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  homeworkAccuracy: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  extensionAccuracy: number;

  @Column({ type: 'int', default: 0 })
  trophyCount: number;

  @Column({ type: 'int', default: 0 })
  micDuration: number;

  @Column({ type: 'int', default: 0 })
  cameraDuration: number;

  @Column({ length: 20 })
  weekLabel: string;

  @Column({ length: 50 })
  uploadBatch: string;

  @CreateDateColumn()
  createdAt: Date;
}
