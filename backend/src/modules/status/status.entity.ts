import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseData } from '../course-data/course-data.entity';

@Entity('student_status')
export class StudentStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('bigint')
  courseDataId: number;

  @ManyToOne(() => CourseData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseDataId' })
  courseData: CourseData;

  @Column('bigint')
  teacherId: number;

  @Column({ length: 20, nullable: true })
  attendanceStatus: string;

  @Column({ length: 20, nullable: true })
  performanceLevel: string;

  @Column({ length: 50, nullable: true })
  homeworkStatus: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: false })
  isConfirmed: boolean;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}