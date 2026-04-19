import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';
import { StudentStatus } from './status.entity';
import { CourseData } from '../course-data/course-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentStatus, CourseData])],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
