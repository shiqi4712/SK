import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AiEngineService, AiStyle } from './ai-engine.service';
import { Script } from '../script/script.entity';
import { CourseData } from '../course-data/course-data.entity';
import { StudentStatus } from '../status/status.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Processor('ai-script')
export class AiQueueProcessor {
  constructor(
    private aiEngine: AiEngineService,
    @InjectRepository(Script)
    private scriptRepo: Repository<Script>,
    @InjectRepository(CourseData)
    private courseDataRepo: Repository<CourseData>,
    @InjectRepository(StudentStatus)
    private statusRepo: Repository<StudentStatus>,
  ) {}

  @Process('generate')
  async handleGenerate(job: Job) {
    const { courseDataId, teacherId, style } = job.data;

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

    const content = await this.aiEngine.generateScript(data, status, style as AiStyle);

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

    return this.scriptRepo.save(script);
  }
}
