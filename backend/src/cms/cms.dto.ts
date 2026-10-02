import { ContentStatus, Language } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsJSON, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';
export class LocaleQueryDto { @IsOptional() @IsEnum(Language) locale?: Language; }
export class PageDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(100) slug!: string;
  @IsEnum(Language) locale!: Language;
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsString() @MaxLength(100000) body!: string;
  @IsEnum(ContentStatus) status!: ContentStatus;
  @IsOptional() @IsString() @MaxLength(200) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(500) seoDescription?: string;
}
export class BannerDto {
  @IsEnum(Language) locale!: Language;
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsString() @MaxLength(2000) body!: string;
  @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) image?: string;
  @IsOptional() @Matches(/^\/(?!\/)[a-zA-Z0-9/?=&_%#.-]*$/) link?: string;
  @IsInt() sortOrder!: number;
  @IsBoolean() active!: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}
export class BlogDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(100) slug!: string;
  @IsEnum(Language) locale!: Language;
  @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @IsString() @MaxLength(100000) body!: string;
  @IsEnum(ContentStatus) status!: ContentStatus;
  @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) coverImage?: string;
}
export class SettingDto {
  @IsString() @Matches(/^[a-z][a-z0-9_]*$/) @MaxLength(100) key!: string;
  @IsJSON() value!: string;
}
