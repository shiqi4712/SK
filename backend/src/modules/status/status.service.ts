import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StudentStatus } from './status.entity';
import { CourseData } from '../course-data/course-data.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(StudentStatus)
    private statusRepo: Repository<StudentStatus>,
    @InjectRepository(CourseData)
    private courseDataRepo: Repository<CourseData>,
  ) {}

  async findByTeacher(teacherId: number, weekLabel?: string) {
    const where: any = { teacherId };
    if (weekLabel) {
      where.weekLabel = weekLabel;
    }

    const courseDataList = await this.courseDataRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    if (courseDataList.length === 0) {
      return [];
    }

    const courseDataIds = courseDataList.map((cd) => cd.id);
    const statuses = await this.statusRepo.find({
      where: { courseDataId: In(courseDataIds), teacherId },
    });

    const statusMap = new Map(statuses.map((s) => [s.courseDataId, s]));

    return courseDataList.map((cd) => {
      const status = statusMap.get(cd.id);
      return {
        id: cd.id,
        userName: cd.userName,
        className: cd.className,
        courseName: cd.courseName,
        lessonStartTime: cd.lessonStartTime,
        weekLabel: cd.weekLabel,
        isAttended: cd.isAttended,
        isAbsent: cd.isAbsent,
        effectiveDuration: cd.effectiveDuration,
        homeworkAccuracy: cd.homeworkAccuracy,
        extensionAccuracy: cd.extensionAccuracy,
        trophyCount: cd.trophyCount,
        attendanceStatus: status?.attendanceStatus || null,
        performanceLevel: status?.performanceLevel || null,
        homeworkStatus: status?.homeworkStatus || null,
        remarks: status?.remarks || null,
        isConfirmed: status?.isConfirmed || false,
      };
    });
  }

  private async assertCourseDataOwner(courseDataId: number, teacherId: number) {
    const cd = await this.courseDataRepo.findOne({
      where: { id: courseDataId, teacherId },
      select: ['id'],
    });
    if (!cd) {
      throw new BadRequestException('无权操作该学员数据');
    }
  }

  async saveOrUpdate(courseDataId: number, teacherId: number, dto: any) {
    await this.assertCourseDataOwner(courseDataId, teacherId);

    let status = await this.statusRepo.findOne({
      where: { courseDataId, teacherId },
    });

    if (!status) {
      status = this.statusRepo.create({ courseDataId, teacherId });
    }

    status.attendanceStatus = dto.attendanceStatus;
    status.performanceLevel = dto.performanceLevel;
    status.homeworkStatus = dto.homeworkStatus;
    status.remarks = dto.remarks;
    status.isConfirmed = true;
    status.confirmedAt = new Date();

    return this.statusRepo.save(status);
  }

  async batchConfirm(ids: number[], teacherId: number) {
    for (const courseDataId of ids) {
      await this.assertCourseDataOwner(courseDataId, teacherId);
      let status = await this.statusRepo.findOne({
        where: { courseDataId, teacherId },
      });
      if (!status) {
        status = this.statusRepo.create({ courseDataId, teacherId });
      }
      status.isConfirmed = true;
      status.confirmedAt = new Date();
      await this.statusRepo.save(status);
    }
    return { message: '批量确认成功' };
  }
}
