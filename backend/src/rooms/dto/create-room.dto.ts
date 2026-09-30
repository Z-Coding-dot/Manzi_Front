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

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber!: string;

  @IsString()
  @IsNotEmpty()
  roomType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}
