import { BedGender, BedStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateBedDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bedNumber?: string;

  @IsOptional()
  @IsEnum(BedGender)
  gender?: BedGender;

  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000000)
  price?: number;
}
