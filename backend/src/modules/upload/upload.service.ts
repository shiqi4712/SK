import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { CourseData } from '../course-data/course-data.entity';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(CourseData)
    private courseDataRepo: Repository<CourseData>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async parseExcel(file: Express.Multer.File, teacherId: number) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      throw new BadRequestException('仅支持 .xlsx, .xls, .csv 格式');
    }

    try {
      const buffer = await fsPromises.readFile(file.path);
      const workbook = XLSX.read(buffer, {
        type: 'buffer',
        codepage: ext === 'csv' ? 65001 : undefined,
        cellDates: true,
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new BadRequestException('文件为空或格式不正确');
      }

      // 限制最大行数，防止恶意超大文件
      const MAX_ROWS = 5000;
      if (jsonData.length > MAX_ROWS + 1) {
        throw new BadRequestException(`文件行数超过上限（最多${MAX_ROWS}条）`);
      }

      const headers = jsonData[0].map((h: string) => h?.toString().trim());
      const rows = jsonData.slice(1);

      const nameIndex = headers.findIndex((h: string) => h.includes('用户姓名'));
      const timeIndex = headers.findIndex((h: string) => h.includes('课节开始时间') || h.includes('开始时间'));
      const courseIndex = headers.findIndex((h: string) => h.includes('课程名称'));
      const classIndex = headers.findIndex((h: string) => h.includes('班级名'));
      const attendedIndex = headers.findIndex((h: string) => h.includes('是否到课'));
      const absentIndex = headers.findIndex((h: string) => h.includes('是否旷课'));
      const durationIndex = headers.findIndex((h: string) => h.includes('有效上课时长'));
      const hwAccuracyIndex = headers.findIndex((h: string) => h.includes('课后题目正确率') || h.includes('课后正确率'));
      const extAccuracyIndex = headers.findIndex((h: string) => h.includes('课后拓展正确率') || h.includes('拓展正确率'));
      const trophyIndex = headers.findIndex((h: string) => h.includes('奖杯数'));
      const micIndex = headers.findIndex((h: string) => h.includes('开麦时长'));
      const camIndex = headers.findIndex((h: string) => h.includes('开摄像头时长'));

      if (nameIndex === -1 || timeIndex === -1) {
        throw new BadRequestException('缺少必要字段：用户姓名、课节开始时间');
      }

      const now = new Date();
      const weekLabel = this.getWeekLabel(now);
      const uploadBatch = `batch-${teacherId}-${Date.now()}`;

      const records: CourseData[] = [];
      for (const row of rows) {
        if (!row[nameIndex]) continue;

        const lessonTime = this.parseDate(row[timeIndex]);
        const record = this.courseDataRepo.create({
          userName: String(row[nameIndex] || ''),
          teacherId,
          className: classIndex >= 0 ? String(row[classIndex] || '') : null,
          courseName: courseIndex >= 0 ? String(row[courseIndex] || '') : '',
          lessonStartTime: lessonTime || now,
          isAttended: attendedIndex >= 0 ? this.parseBoolean(row[attendedIndex]) : true,
          isAbsent: absentIndex >= 0 ? this.parseBoolean(row[absentIndex]) : false,
          effectiveDuration: durationIndex >= 0 ? Number(row[durationIndex]) || 0 : 0,
          homeworkAccuracy: hwAccuracyIndex >= 0 ? Number(row[hwAccuracyIndex]) || 0 : null,
          extensionAccuracy: extAccuracyIndex >= 0 ? Number(row[extAccuracyIndex]) || 0 : null,
          trophyCount: trophyIndex >= 0 ? Number(row[trophyIndex]) || 0 : 0,
          micDuration: micIndex >= 0 ? Number(row[micIndex]) || 0 : 0,
          cameraDuration: camIndex >= 0 ? Number(row[camIndex]) || 0 : 0,
          weekLabel,
          uploadBatch,
        });
        records.push(record);
      }

      // 事务包裹：先删旧数据，再插入新数据
      await this.dataSource.transaction(async (manager) => {
        await manager.delete(CourseData, { teacherId, weekLabel });
        await manager.save(CourseData, records);
      });

      // Clean up temp file
      await fsPromises.unlink(file.path).catch(() => {});

      return {
        message: '上传成功',
        total: records.length,
        weekLabel,
      };
    } catch (error) {
      await fsPromises.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  private getWeekLabel(date: Date): string {
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const week = Math.floor(diff / oneWeek) + 1;
    return `${year}W${String(week).padStart(2, '0')}`;
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.trim() === '是' || value.trim().toLowerCase() === 'true' || value.trim() === '1';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  }
}
