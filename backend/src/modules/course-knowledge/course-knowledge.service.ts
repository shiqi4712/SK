import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import * as path from 'path';
import { CourseKnowledge } from './course-knowledge.entity';

@Injectable()
export class CourseKnowledgeService implements OnModuleInit {
  constructor(
    @InjectRepository(CourseKnowledge)
    private repo: Repository<CourseKnowledge>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.importFromExcel();
    }
  }

  async importFromExcel() {
    const filePath = path.join(process.cwd(), '..', 'KCDG.xlsx');
    let workbook: xlsx.WorkBook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch {
      // fallback for different cwd
      try {
        workbook = xlsx.readFile(path.join(process.cwd(), 'KCDG.xlsx'));
      } catch {
        console.log('KCDG.xlsx not found, skipping course knowledge import');
        return;
      }
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const map = new Map<string, string>();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const courseName = String(row[0]).trim();
      const keyPoints = row[1] ? String(row[1]).trim() : '';
      if (!courseName) continue;
      if (!map.has(courseName)) {
        map.set(courseName, keyPoints);
      }
    }

    const entities: Partial<CourseKnowledge>[] = [];
    for (const [courseName, keyPoints] of map) {
      entities.push({ courseName, keyPoints });
    }

    if (entities.length > 0) {
      await this.repo.save(entities);
      console.log(`Imported ${entities.length} course knowledge entries`);
    }
  }

  async findByCourseName(courseName: string): Promise<CourseKnowledge | null> {
    return this.repo.findOne({ where: { courseName } });
  }

  async findAll(): Promise<CourseKnowledge[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }
}
