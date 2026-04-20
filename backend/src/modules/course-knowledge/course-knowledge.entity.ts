import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('course_knowledge')
export class CourseKnowledge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200, unique: true })
  courseName: string;

  @Column({ type: 'text', nullable: true })
  keyPoints: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
