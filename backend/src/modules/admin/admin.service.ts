import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { Script } from '../script/script.entity';
import { User, UserRole, UserStatus } from '../user/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Script)
    private scriptRepo: Repository<Script>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAllScripts(filters: { teacherName?: string; weekLabel?: string; className?: string }) {
    const query = this.scriptRepo
      .createQueryBuilder('script')
      .leftJoinAndSelect('script.courseData', 'cd')
      .leftJoinAndMapOne('script.teacher', User, 'teacher', 'teacher.id = script.teacherId')
      .select([
        'script',
        'cd',
        'teacher.id',
        'teacher.name',
        'teacher.employeeNo',
        'teacher.role',
        'teacher.status',
        'teacher.createdAt',
      ])
      .orderBy('script.createdAt', 'DESC');

    if (filters.teacherName) {
      query.andWhere('teacher.name LIKE :name', { name: `%${filters.teacherName}%` });
    }

    if (filters.weekLabel) {
      query.andWhere('script.weekLabel = :weekLabel', { weekLabel: filters.weekLabel });
    }

    if (filters.className) {
      query.andWhere('cd.className LIKE :className', { className: `%${filters.className}%` });
    }

    return query.getMany();
  }

  async getStats() {
    const totalScripts = await this.scriptRepo.count();
    const totalTeachers = await this.userRepo.count({ where: { role: UserRole.TEACHER } });
    const totalEdited = await this.scriptRepo.count({ where: { isEdited: true } });

    return {
      totalScripts,
      totalTeachers,
      totalEdited,
    };
  }

  async createTeacher(dto: { name: string; employeeNo: string; password?: string }) {
    const exists = await this.userRepo.findOne({
      where: { employeeNo: dto.employeeNo },
    });

    if (exists) {
      throw new BadRequestException('该工号已存在');
    }

    const teacher = this.userRepo.create({
      name: dto.name,
      employeeNo: dto.employeeNo,
      passwordHash: await bcryptjs.hash(dto.password || '123456', 10),
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    });

    await this.userRepo.save(teacher);
    return { message: '创建成功', teacher: { id: teacher.id, name: teacher.name, employeeNo: teacher.employeeNo } };
  }

  async listTeachers() {
    return this.userRepo.find({
      where: { role: UserRole.TEACHER },
      select: ['id', 'name', 'employeeNo', 'status', 'createdAt'],
    });
  }
}
