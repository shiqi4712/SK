import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiEngineService } from './ai-engine.service';
import { AiQueueService } from './ai-queue.service';
import { AiQueueProcessor } from './ai-queue.processor';
import { MemoryQueueService } from './memory-queue.service';
import { Script } from '../script/script.entity';
import { CourseData } from '../course-data/course-data.entity';
import { StudentStatus } from '../status/status.entity';

const imports: any[] = [TypeOrmModule.forFeature([Script, CourseData, StudentStatus])];
const providers: any[] = [AiEngineService, AiQueueService];

if (process.env.REDIS_HOST) {
  imports.push(BullModule.registerQueue({ name: 'ai-script' }));
  providers.push(AiQueueProcessor);
} else {
  providers.push(MemoryQueueService);
}

@Module({
  imports,
  providers,
  exports: [AiEngineService, AiQueueService],
})
export class AiEngineModule {}
