import { Controller, Get, Post, Inject, UseGuards } from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';
import { ValidatedBody } from '../common/decorators/validated-input.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
export class PageViewDto {
  @IsString()
  @MaxLength(80)
  @Matches(/^\/(?:[a-z-]+|:[a-z]+|\/)*$/)
  path!: string;
}
@Controller()
export class ViewsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  @Post('analytics/page-view') async track(
    @ValidatedBody(PageViewDto) dto: PageViewDto,
  ) {
    const day = new Date(Date.now() + 270 * 60000).toISOString().slice(0, 10);
    await this.prisma
      .$executeRaw`INSERT INTO website_views (day, path, views) VALUES (${day}::date, ${dto.path}, 1) ON CONFLICT (day, path) DO UPDATE SET views = website_views.views + 1`;
    return { recorded: true };
  }
  @Get('admin/views')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async stats() {
    const [totals, pages, daily] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ total: bigint; month: bigint; today: bigint }>
      >`SELECT COALESCE(SUM(views),0)::bigint total, COALESCE(SUM(views) FILTER (WHERE day >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kabul')::date - 29),0)::bigint AS "month", COALESCE(SUM(views) FILTER (WHERE day = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kabul')::date),0)::bigint today FROM website_views`,
      this.prisma.$queryRaw<
        Array<{ path: string; views: bigint }>
      >`SELECT path,SUM(views)::bigint views FROM website_views GROUP BY path ORDER BY views DESC LIMIT 20`,
      this.prisma.$queryRaw<
        Array<{ day: Date; views: bigint }>
      >`SELECT day,SUM(views)::bigint views FROM website_views WHERE day >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kabul')::date - 29 GROUP BY day ORDER BY day`,
    ]);
    return {
      total: Number(totals[0].total),
      month: Number(totals[0].month),
      today: Number(totals[0].today),
      pages: pages.map((p) => ({ ...p, views: Number(p.views) })),
      daily: daily.map((p) => ({
        day: p.day.toISOString().slice(0, 10),
        views: Number(p.views),
      })),
    };
  }
}
