import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('scripts')
  async allScripts(
    @Query('teacherName') teacherName?: string,
    @Query('weekLabel') weekLabel?: string,
    @Query('className') className?: string,
  ) {
    return this.adminService.findAllScripts({ teacherName, weekLabel, className });
  }

  @Get('stats')
  async stats() {
    return this.adminService.getStats();
  }

  @Post('teachers')
  async createTeacher(@Body() dto: { name: string; employeeNo: string; password?: string }) {
    return this.adminService.createTeacher(dto);
  }

  @Get('teachers')
  async listTeachers() {
    return this.adminService.listTeachers();
  }
}
