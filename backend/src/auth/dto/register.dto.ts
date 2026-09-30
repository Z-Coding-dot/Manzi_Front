import {
  IsEmail,
  IsIn,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72) // bcrypt silently truncates beyond 72 bytes — reject longer input instead
  password!: string;

  @IsOptional()
  @IsIn(['en', 'fa_AF', 'ps_AF'])
  language?: 'en' | 'fa_AF' | 'ps_AF';

  @IsOptional()
  @IsIn(['customer', 'property_owner'])
  role?: 'customer' | 'property_owner';
}
