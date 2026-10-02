import { Currency, Language } from '@prisma/client';
import { IsEnum, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';
export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsPhoneNumber() phone?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsEnum(Currency) currency?: Currency;
}
