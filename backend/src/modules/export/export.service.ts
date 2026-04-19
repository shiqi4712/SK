import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as XLSX from 'xlsx';
import { Script } from '../script/script.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Script)
    private scriptRepo: Repository<Script>,
  ) {}

  async exportExcel(teacherId: number, ids?: number[], weekLabel?: string) {
    const query = this.scriptRepo
      .createQueryBuilder('script')
      .leftJoinAndSelect('script.courseData', 'cd')
      .where('script.teacherId = :teacherId', { teacherId });

    if (ids && ids.length > 0) {
      query.andWhere('script.id IN (:...ids)', { ids });
    }

    if (weekLabel) {
      query.andWhere('script.weekLabel = :weekLabel', { weekLabel });
    }

    const scripts = await query.getMany();

    const rows = scripts.map((s) => ({
      用户姓名: s.courseData?.userName || '',
      上课时间: s.courseData?.lessonStartTime
        ? new Date(s.courseData.lessonStartTime).toLocaleString('zh-CN')
        : '',
      话术: s.finalContent || s.generatedContent || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '话术列表');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}