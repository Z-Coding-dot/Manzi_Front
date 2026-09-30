import { RoomStatus } from '@prisma/client';
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

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roomNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roomType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}
