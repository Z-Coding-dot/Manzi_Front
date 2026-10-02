import { PropertyStaffRole } from '@prisma/client';
import { IsEnum, IsOptional, IsPhoneNumber, IsUUID } from 'class-validator';

export class CreateStaffDto {
  @IsOptional() @IsUUID()
  userId?: string;
  @IsOptional() @IsPhoneNumber()
  phone?: string;

  @IsEnum(PropertyStaffRole)
  role!: PropertyStaffRole;
}
