import { PropertyStaffRole } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateStaffDto {
  @IsUUID()
  userId!: string;

  @IsEnum(PropertyStaffRole)
  role!: PropertyStaffRole;
}
