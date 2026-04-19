import { Controller, Get, Post, Put, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { ScriptService } from './script.service';
import { AiQueueService } from '../ai-engine/ai-queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scripts')
@UseGuards(JwtAuthGuard)
export class ScriptController {
  constructor(
    private readonly scriptService: ScriptService,
    private readonly aiQueue: AiQueueService,
  ) {}

  @Get()
  async list(@Request() req, @Query('weekLabel') weekLabel: string) {
    return this.scriptService.findByTeacher(req.user.userId, weekLabel);
  }

  @Post('batch-generate')
  async batchGenerate(@Body() dto: { ids: number[]; style?: string }, @Request() req) {
    return this.scriptService.batchGenerate(dto.ids, req.user.userId, dto.style);
  }

  @Post('generate/:courseDataId')
  async generate(
    @Param('courseDataId') courseDataId: string,
    @Body() dto: { style?: string },
    @Request() req,
  ) {
    return this.scriptService.generate(+courseDataId, req.user.userId, dto.style);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('finalContent') finalContent: string,
    @Request() req,
  ) {
    return this.scriptService.update(+id, req.user.userId, finalContent);
  }

  @Get('queue-status/:jobId')
  async queueStatus(@Param('jobId') jobId: string): Promise<any> {
    return this.aiQueue.getJobStatus(jobId);
  }
}
