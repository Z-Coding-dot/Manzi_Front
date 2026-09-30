import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  file!: string;
}
