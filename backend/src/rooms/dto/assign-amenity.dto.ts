import { IsUUID } from 'class-validator';

export class AssignAmenityDto {
  @IsUUID()
  amenityId!: string;
}
