import { ValidatedBody, ValidatedQuery } from '../common/decorators/validated-input.decorator.js';
import { Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { BannerDto, BlogDto, LocaleQueryDto, PageDto, SettingDto } from './cms.dto.js';
import { CmsService } from './cms.service.js';
@Controller('cms')
export class PublicCmsController {
  constructor(@Inject(CmsService) private readonly service: CmsService) {}
  @Get('pages') pages(@ValidatedQuery(LocaleQueryDto) query: LocaleQueryDto) { return this.service.pages(query.locale); }
  @Get('pages/:slug') page(@Param('slug') slug: string, @ValidatedQuery(LocaleQueryDto) query: LocaleQueryDto) { return this.service.page(slug, query.locale); }
  @Get('banners') banners(@ValidatedQuery(LocaleQueryDto) query: LocaleQueryDto) { return this.service.banners(query.locale); }
  @Get('posts') posts(@ValidatedQuery(LocaleQueryDto) query: LocaleQueryDto) { return this.service.posts(query.locale); }
  @Get('posts/:slug') post(@Param('slug') slug: string, @ValidatedQuery(LocaleQueryDto) query: LocaleQueryDto) { return this.service.post(slug, query.locale); }
}
@Controller('admin/cms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'content_manager')
export class AdminCmsController {
  constructor(@Inject(CmsService) private readonly service: CmsService) {}
  @Get('pages') pages() { return this.service.list('pages'); }
  @Get('banners') banners() { return this.service.list('banners'); }
  @Get('posts') posts() { return this.service.list('posts'); }
  @Get('settings') @Roles('admin', 'super_admin') settings() { return this.service.list('settings'); }
  @Post('pages') createPage(@ValidatedBody(PageDto) dto: PageDto, @CurrentUser() u: AuthenticatedUser) { return this.service.savePage(dto, u.sub); }
  @Patch('pages/:id') updatePage(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(PageDto) dto: PageDto, @CurrentUser() u: AuthenticatedUser) { return this.service.savePage(dto, u.sub, id); }
  @Delete('pages/:id') deletePage(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove('pages', id, u.sub); }
  @Post('banners') createBanner(@ValidatedBody(BannerDto) dto: BannerDto, @CurrentUser() u: AuthenticatedUser) { return this.service.saveBanner(dto, u.sub); }
  @Patch('banners/:id') updateBanner(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(BannerDto) dto: BannerDto, @CurrentUser() u: AuthenticatedUser) { return this.service.saveBanner(dto, u.sub, id); }
  @Delete('banners/:id') deleteBanner(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove('banners', id, u.sub); }
  @Post('posts') createPost(@ValidatedBody(BlogDto) dto: BlogDto, @CurrentUser() u: AuthenticatedUser) { return this.service.savePost(dto, u.sub); }
  @Patch('posts/:id') updatePost(@Param('id', ParseUUIDPipe) id: string, @ValidatedBody(BlogDto) dto: BlogDto, @CurrentUser() u: AuthenticatedUser) { return this.service.savePost(dto, u.sub, id); }
  @Delete('posts/:id') deletePost(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthenticatedUser) { return this.service.remove('posts', id, u.sub); }
  @Post('settings') @Roles('super_admin') saveSetting(@ValidatedBody(SettingDto) dto: SettingDto, @CurrentUser() u: AuthenticatedUser) { return this.service.saveSetting(dto, u.sub); }
}

