import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CourseData } from '../course-data/course-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseData])],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}