import { Controller, Get, Post, Put, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { StatusService } from './status.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('status')
@UseGuards(JwtAuthGuard)
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  async list(@Request() req, @Query('weekLabel') weekLabel: string) {
    return this.statusService.findByTeacher(req.user.userId, weekLabel);
  }

  @Post('batch-confirm')
  async batchConfirm(@Body() dto: { ids: number[] }, @Request() req) {
    return this.statusService.batchConfirm(dto.ids, req.user.userId);
  }

  @Post(':courseDataId')
  async save(
    @Param('courseDataId') courseDataId: string,
    @Body() dto: any,
    @Request() req,
  ) {
    return this.statusService.saveOrUpdate(+courseDataId, req.user.userId, dto);
  }
}
