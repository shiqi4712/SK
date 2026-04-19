import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseData } from '../course-data/course-data.entity';

@Entity('scripts')
export class Script {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('bigint')
  courseDataId: number;

  @ManyToOne(() => CourseData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseDataId' })
  courseData: CourseData;

  @Column('bigint')
  teacherId: number;

  @Column({ type: 'text' })
  generatedContent: string;

  @Column({ type: 'text', nullable: true })
  finalContent: string;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ length: 50, nullable: true })
  scenarioType: string;

  @Column({ length: 20, nullable: true })
  aiStyle: string;

  @Column({ length: 20 })
  weekLabel: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}