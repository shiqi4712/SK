import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScriptController } from './script.controller';
import { ScriptService } from './script.service';
import { Script } from './script.entity';
import { CourseData } from '../course-data/course-data.entity';
import { StudentStatus } from '../status/status.entity';
import { AiEngineModule } from '../ai-engine/ai-engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Script, CourseData, StudentStatus]),
    AiEngineModule,
  ],
  controllers: [ScriptController],
  providers: [ScriptService],
  exports: [ScriptService],
})
export class ScriptModule {}