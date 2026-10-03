import { Currency, Language } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
export class UpdateProfileDto {
  @IsOptional() @IsEmail() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsPhoneNumber() phone?: string | null;
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsEnum(Currency) currency?: Currency;
}
