import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Script } from '../script/script.entity';
import { CourseData } from '../course-data/course-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Script, CourseData])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}