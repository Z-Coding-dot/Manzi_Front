import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PageDto, BannerDto, BlogDto, SettingDto } from './cms.dto.js';
type Kind = 'pages' | 'banners' | 'posts' | 'settings';
@Injectable()
export class CmsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  pages(locale: Language = 'en') { return this.prisma.cmsPage.findMany({ where: { locale, status: 'published' }, select: { slug: true, title: true, seoTitle: true, seoDescription: true, updatedAt: true } }); }
  async page(slug: string, locale: Language = 'en') { const page = await this.prisma.cmsPage.findFirst({ where: { slug, locale, status: 'published' } }); if (!page) throw new NotFoundException('Page not published in this language'); return page; }
  banners(locale: Language = 'en') { const now = new Date(); return this.prisma.cmsBanner.findMany({ where: { locale, active: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] }, orderBy: { sortOrder: 'asc' } }); }
  posts(locale: Language = 'en') { return this.prisma.blogPost.findMany({ where: { locale, status: 'published' }, select: { id: true, slug: true, title: true, coverImage: true, publishedAt: true }, orderBy: { publishedAt: 'desc' }, take: 100 }); }
  async post(slug: string, locale: Language = 'en') { const post = await this.prisma.blogPost.findFirst({ where: { slug, locale, status: 'published' } }); if (!post) throw new NotFoundException('Post not found'); return post; }
  list(kind: Kind) {
    if (kind === 'pages') return this.prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 });
    if (kind === 'banners') return this.prisma.cmsBanner.findMany({ orderBy: { sortOrder: 'asc' }, take: 100 });
    if (kind === 'posts') return this.prisma.blogPost.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 });
    return this.prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  }
  savePage(dto: PageDto, actorId: string, id?: string) {
    return this.prisma.$transaction(async tx => {
      const data = { ...dto, updatedBy: actorId };
      const page = id ? await tx.cmsPage.update({ where: { id }, data }) : await tx.cmsPage.create({ data });
      await this.audit(tx, actorId, 'CmsPage', page.id, id ? 'update' : 'create'); return page;
    });
  }
  saveBanner(dto: BannerDto, actorId: string, id?: string) {
    if (dto.startsAt && dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) throw new BadRequestException('Banner end must follow start');
    return this.prisma.$transaction(async tx => {
      const data = { ...dto, updatedBy: actorId, startsAt: dto.startsAt ? new Date(dto.startsAt) : null, endsAt: dto.endsAt ? new Date(dto.endsAt) : null };
      const banner = id ? await tx.cmsBanner.update({ where: { id }, data }) : await tx.cmsBanner.create({ data });
      await this.audit(tx, actorId, 'CmsBanner', banner.id, id ? 'update' : 'create'); return banner;
    });
  }
  savePost(dto: BlogDto, actorId: string, id?: string) {
    return this.prisma.$transaction(async tx => {
      const existing = id ? await tx.blogPost.findUnique({ where: { id } }) : null;
      const data = { ...dto, authorId: existing?.authorId ?? actorId, publishedAt: dto.status === 'published' ? existing?.publishedAt ?? new Date() : null };
      const post = id ? await tx.blogPost.update({ where: { id }, data }) : await tx.blogPost.create({ data });
      await this.audit(tx, actorId, 'BlogPost', post.id, id ? 'update' : 'create'); return post;
    });
  }
  saveSetting(dto: SettingDto, actorId: string) {
    const value = JSON.parse(dto.value) as Prisma.InputJsonValue;
    if (value === null) throw new BadRequestException('Setting value cannot be null');
    return this.prisma.$transaction(async tx => {
      const setting = await tx.platformSetting.upsert({ where: { key: dto.key }, create: { key: dto.key, value, updatedBy: actorId }, update: { value, updatedBy: actorId } });
      await this.audit(tx, actorId, 'PlatformSetting', dto.key, 'update'); return setting;
    });
  }
  remove(kind: Exclude<Kind, 'settings'>, id: string, actorId: string) {
    return this.prisma.$transaction(async tx => {
      if (kind === 'pages') await tx.cmsPage.delete({ where: { id } });
      else if (kind === 'banners') await tx.cmsBanner.delete({ where: { id } });
      else await tx.blogPost.delete({ where: { id } });
      await this.audit(tx, actorId, kind, id, 'delete'); return { success: true };
    });
  }
  private audit(tx: Prisma.TransactionClient, actorId: string, entityType: string, entityId: string, action: string) { return tx.auditLog.create({ data: { actorId, entityType, entityId, action } }); }
}
