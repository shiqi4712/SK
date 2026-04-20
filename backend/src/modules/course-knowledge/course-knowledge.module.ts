import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseKnowledge } from './course-knowledge.entity';
import { CourseKnowledgeService } from './course-knowledge.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseKnowledge])],
  providers: [CourseKnowledgeService],
  exports: [CourseKnowledgeService],
})
export class CourseKnowledgeModule {}
