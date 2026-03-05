/**
 * DTO payload untuk membuat note baru.
 * Menentukan field apa saja yang boleh diterima endpoint create.
 */
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  // Judul wajib diisi, maksimal 255 char.
  @ApiProperty({ example: 'My First Note', description: 'Note title' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  // Konten opsional.
  @ApiPropertyOptional({
    example: 'This is the content of my note',
    description: 'Note content',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
