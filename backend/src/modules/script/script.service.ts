import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Script } from './script.entity';
import { CourseData } from '../course-data/course-data.entity';
import { StudentStatus } from '../status/status.entity';
import { AiEngineService, AiStyle } from '../ai-engine/ai-engine.service';
import { AiQueueService } from '../ai-engine/ai-queue.service';

@Injectable()
export class ScriptService {
  constructor(
    @InjectRepository(Script)
    private scriptRepo: Repository<Script>,
    @InjectRepository(CourseData)
    private courseDataRepo: Repository<CourseData>,
    @InjectRepository(StudentStatus)
    private statusRepo: Repository<StudentStatus>,
    private aiEngine: AiEngineService,
    private aiQueue: AiQueueService,
  ) {}

  async findByTeacher(teacherId: number, weekLabel: string) {
    const query = this.scriptRepo
      .createQueryBuilder('script')
      .leftJoinAndSelect('script.courseData', 'cd')
      .where('script.teacherId = :teacherId', { teacherId });

    if (weekLabel) {
      query.andWhere('script.weekLabel = :weekLabel', { weekLabel });
    }

    return query.orderBy('script.createdAt', 'DESC').getMany();
  }

  async generate(courseDataId: number, teacherId: number, style?: string) {
    const data = await this.courseDataRepo.findOne({
      where: { id: courseDataId, teacherId },
    });
    if (!data) throw new NotFoundException('学员数据不存在');

    const status = await this.statusRepo.findOne({
      where: { courseDataId, teacherId },
    });
    if (!status || !status.isConfirmed) {
      throw new BadRequestException('请先确认该学员状态');
    }

    const aiStyle: AiStyle = this.validateStyle(style);
    const content = await this.aiEngine.generateScript(data, status, aiStyle);

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
    script.aiStyle = aiStyle;

    return this.scriptRepo.save(script);
  }

  async batchGenerate(ids: number[], teacherId: number, style?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('请至少选择一名学员');
    }
    if (ids.length > 200) {
      throw new BadRequestException('单次批量生成最多支持200条');
    }
    const aiStyle = this.validateStyle(style);
    const jobs = [];
    for (const id of ids) {
      const job = await this.aiQueue.enqueueGenerate(id, teacherId, aiStyle);
      jobs.push({ id, jobId: job.id });
    }
    return { message: '已加入生成队列', jobs };
  }

  async update(id: number, teacherId: number, finalContent: string) {
    const script = await this.scriptRepo.findOne({
      where: { id, teacherId },
    });
    if (!script) throw new NotFoundException('话术不存在');

    script.finalContent = finalContent;
    script.isEdited = true;
    return this.scriptRepo.save(script);
  }

  private validateStyle(style?: string): AiStyle {
    const valid: AiStyle[] = ['serious', 'friendly', 'warm', 'challenge'];
    if (!style) return 'friendly';
    if (valid.includes(style as AiStyle)) return style as AiStyle;
    return 'friendly';
  }
}
