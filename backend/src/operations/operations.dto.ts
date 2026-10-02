import { Currency, ReviewStatus, TicketCategory, TicketPriority, TicketStatus, HousekeepingStatus, MaintenanceStatus, MaintenancePriority } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
export class CashPaymentDto { @IsInt() @Min(1) @Max(2147483647) amount!: number; @IsUUID() idempotencyKey!: string; }
export class PayoutDto { @IsUUID() propertyId!: string; @IsInt() @Min(1) @Max(2147483647) amount!: number; @IsEnum(Currency) currency!: Currency; }
export class TicketDto {
  @IsOptional() @IsUUID() reservationId?: string;
  @IsEnum(TicketCategory) category!: TicketCategory;
  @IsEnum(TicketPriority) priority!: TicketPriority;
  @IsString() @MinLength(3) @MaxLength(200) subject!: string;
  @IsString() @MinLength(3) @MaxLength(5000) body!: string;
}
export class TicketUpdateDto {
  @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
  @IsOptional() @IsUUID() assignedToId?: string;
  @IsOptional() @IsString() @MaxLength(5000) response?: string;
}
export class ReviewDto { @IsInt() @Min(1) @Max(5) overallRating!: number; @IsOptional() @IsString() @MaxLength(3000) comment?: string; }
export class ModerateReviewDto { @IsEnum(ReviewStatus) status!: ReviewStatus; }
export class ReviewResponseDto { @IsString() @MinLength(1) @MaxLength(3000) ownerResponse!: string; }
export class HousekeepingUpdateDto { @IsEnum(HousekeepingStatus) status!: HousekeepingStatus; }
export class MaintenanceUpdateDto { @IsEnum(MaintenanceStatus) status!: MaintenanceStatus; }
export class MaintenanceCreateDto {
  @IsString() @MinLength(1) @MaxLength(50) roomNumber!: string;
  @IsString() @MinLength(3) @MaxLength(120) title!: string;
  @IsEnum(MaintenancePriority) priority!: MaintenancePriority;
}
