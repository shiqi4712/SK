import { Injectable, Optional, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AiEngineService, AiStyle } from './ai-engine.service';
import { Script } from '../script/script.entity';
import { CourseData } from '../course-data/course-data.entity';
import { StudentStatus } from '../status/status.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemoryQueueService } from './memory-queue.service';

@Injectable()
export class AiQueueService {
  constructor(
    @Optional() @InjectQueue('ai-script') private readonly aiQueue: Queue | null,
    @Optional() @Inject(MemoryQueueService) private readonly memoryQueue: MemoryQueueService | null,
    private aiEngine: AiEngineService,
    @InjectRepository(Script)
    private scriptRepo: Repository<Script>,
    @InjectRepository(CourseData)
    private courseDataRepo: Repository<CourseData>,
    @InjectRepository(StudentStatus)
    private statusRepo: Repository<StudentStatus>,
  ) {}

  get isQueueAvailable(): boolean {
    return this.aiQueue !== null || this.memoryQueue !== null;
  }

  async enqueueGenerate(courseDataId: number, teacherId: number, style?: string): Promise<any> {
    if (this.aiQueue) {
      try {
        const job = await Promise.race([
          this.aiQueue.add('generate', {
            courseDataId,
            teacherId,
            style: style || 'friendly',
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 10,
            removeOnFail: 10,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Redis queue timeout')), 3000),
          ),
        ]);
        return job;
      } catch (err) {
        return this.fallbackGenerate(courseDataId, teacherId, style);
      }
    }
    return this.fallbackGenerate(courseDataId, teacherId, style);
  }

  private fallbackGenerate(courseDataId: number, teacherId: number, style?: string) {
    if (this.memoryQueue) {
      return this.memoryQueue.add(courseDataId, teacherId, style);
    }
    return this.syncGenerate(courseDataId, teacherId, style);
  }

  async getJobStatus(jobId: string): Promise<any> {
    if (this.aiQueue) {
      const job = await this.aiQueue.getJob(jobId);
      if (!job) return null;
      return {
        id: job.id,
        state: await job.getState(),
        progress: job.progress(),
        result: job.returnvalue,
        failedReason: job.failedReason,
      };
    }
    if (this.memoryQueue) {
      return this.memoryQueue.getJob(jobId);
    }
    return null;
  }

  private async syncGenerate(courseDataId: number, teacherId: number, style?: string) {
    const data = await this.courseDataRepo.findOne({
      where: { id: courseDataId, teacherId },
    });
    if (!data) throw new Error('学员数据不存在');

    const status = await this.statusRepo.findOne({
      where: { courseDataId, teacherId },
    });
    if (!status || !status.isConfirmed) {
      throw new Error('请先确认该学员状态');
    }

    const content = await this.aiEngine.generateScript(data, status, (style || 'friendly') as AiStyle);

    let script = await this.scriptRepo.findOne({
      where: { courseDataId, teacherId },
    });

    if (!script) {
      script = this.scriptRepo.create({
        courseDataId,
        teacherId,
        weekLabel: data.weekLabel,
      });
    }

    script.generatedContent = content;
    script.finalContent = content;
    script.isEdited = false;
    script.aiStyle = style || 'friendly';

    const saved = await this.scriptRepo.save(script);
    return { id: `sync-${courseDataId}`, returnvalue: saved };
  }
}
