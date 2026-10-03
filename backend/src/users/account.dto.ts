import { Currency, Language } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
export class UpdateAvatarDto {
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(210000)
  avatar!: string | null;
}
export class UpdatePasswordDto {
  @IsString() @MinLength(1) @MaxLength(72) currentPassword!: string;
  @IsString() @MinLength(8) @MaxLength(72) newPassword!: string;
}
export class ConsolePreferencesDto {
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsEnum(Currency) currency?: Currency;
  @IsIn(['comfortable', 'compact']) density!: 'comfortable' | 'compact';
  @IsIn(['locale', 'iso']) dateFormat!: 'locale' | 'iso';
  @IsIn(['Asia/Kabul', 'UTC']) timeZone!: 'Asia/Kabul' | 'UTC';
  @IsIn([0, 30, 60, 120]) refreshInterval!: number;
  @IsBoolean() reducedMotion!: boolean;
}
