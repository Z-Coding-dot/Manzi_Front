import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { ReservationSource, GuestIdType } from '@prisma/client';
export class CreateReservationDto {
  @IsUUID() propertyId!: string;
  @IsUUID() roomId!: string;
  @IsOptional() @IsUUID() bedId?: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) checkIn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) checkOut!: string;
  @IsInt() @Min(1) @Max(100) guestsCount!: number;
  @IsEnum(ReservationSource) source!: ReservationSource;
  @IsOptional() @IsUUID() guestId?: string;
  @IsOptional() @IsString() @MaxLength(120) guestName?: string;
  @IsOptional() @IsString() @MaxLength(40) guestPhone?: string;
}
export class CreateGuestDto {
  @IsUUID() propertyId!: string;
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(40) phone!: string;
  @IsOptional() @IsString() @MaxLength(120) email?: string;
  @IsOptional() @IsString() @MaxLength(80) nationality?: string;
  @IsOptional() @IsEnum(GuestIdType) idType?: GuestIdType;
}
export class ExtendReservationDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) checkOut!: string;
}
export class LinkGuestDto { @IsUUID() guestId!: string; }
export class UpdateGuestDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(120) email?: string;
  @IsOptional() @IsString() @MaxLength(80) nationality?: string;
  @IsOptional() @IsEnum(GuestIdType) idType?: GuestIdType;
}
