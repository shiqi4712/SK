import { Controller, Post, Body, Request, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('excel')
  async exportExcel(
    @Body() dto: { ids?: number[]; weekLabel?: string },
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.exportService.exportExcel(
        req.user.userId,
        dto.ids,
        dto.weekLabel,
      );

      const asciiName = `scripts_${Date.now()}.xlsx`;
      const utf8Name = encodeURIComponent(`话术导出_${Date.now()}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
      res.send(buffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
