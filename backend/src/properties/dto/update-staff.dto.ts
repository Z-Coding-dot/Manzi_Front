import { PropertyStaffRole, StaffStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsEnum(PropertyStaffRole)
  role?: PropertyStaffRole;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;
}
