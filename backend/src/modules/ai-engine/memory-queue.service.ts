import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Script } from '../script/script.entity';
import { CourseData } from '../course-data/course-data.entity';
import { StudentStatus } from '../status/status.entity';
import { AiEngineService, AiStyle } from './ai-engine.service';

export interface QueueJob {
  id: string;
  courseDataId: number;
  teacherId: number;
  style: AiStyle;
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: any;
  failedReason?: string;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MemoryQueueService implements OnModuleDestroy {
  private jobs = new Map<string, QueueJob>();
  private waiting: string[] = [];
  private activeCount = 0;
  private readonly maxConcurrency = 3;
  private readonly maxAttempts = 3;
  private running = true;

  constructor(
    private aiEngine: AiEngineService,
    @InjectRepository(Script)
    private scriptRepo: Repository<Script>,
    @InjectRepository(CourseData)
    private courseDataRepo: Repository<CourseData>,
    @InjectRepository(StudentStatus)
    private statusRepo: Repository<StudentStatus>,
  ) {
    this.processLoop();
  }

  async add(courseDataId: number, teacherId: number, style?: string): Promise<QueueJob> {
    const id = `mem-${courseDataId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const job: QueueJob = {
      id,
      courseDataId,
      teacherId,
      style: (style || 'friendly') as AiStyle,
      state: 'waiting',
      progress: 0,
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    this.waiting.push(id);
    return job;
  }

  async getJob(id: string): Promise<QueueJob | null> {
    return this.jobs.get(id) || null;
  }

  onModuleDestroy() {
    this.running = false;
  }

  private async processLoop() {
    while (this.running) {
      if (this.activeCount >= this.maxConcurrency || this.waiting.length === 0) {
        await this.sleep(200);
        continue;
      }
      const jobId = this.waiting.shift();
      if (!jobId) continue;
      const job = this.jobs.get(jobId);
      if (!job) continue;
      this.activeCount++;
      job.state = 'active';
      job.updatedAt = new Date();
      this.processJob(job).finally(() => {
        this.activeCount--;
      });
    }
  }

  private async processJob(job: QueueJob) {
    try {
      job.attempts++;
      const result = await this.syncGenerate(job.courseDataId, job.teacherId, job.style);
      job.state = 'completed';
      job.progress = 100;
      job.result = result;
    } catch (err) {
      if (job.attempts < this.maxAttempts) {
        job.state = 'waiting';
        this.waiting.push(job.id);
        return;
      }
      job.state = 'failed';
      job.failedReason = err instanceof Error ? err.message : String(err);
    } finally {
      job.updatedAt = new Date();
    }
  }

  private async syncGenerate(courseDataId: number, teacherId: number, style: AiStyle) {
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

    const content = await this.aiEngine.generateScript(data, status, style);

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
    script.aiStyle = style;

    const saved = await this.scriptRepo.save(script);
    return saved;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
