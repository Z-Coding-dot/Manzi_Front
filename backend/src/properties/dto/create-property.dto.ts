import { AccommodationType, Language, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  slug!: string;

  @IsEnum(AccommodationType)
  type!: AccommodationType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  address!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  district!: string;

  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  checkInTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  checkOutTime?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Language, { each: true })
  languagesSpoken?: Language[];

  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethods?: PaymentMethod[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  policies?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
