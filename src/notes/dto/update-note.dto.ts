import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Updated Title', description: 'Note title' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated content',
    description: 'Note content',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: true, description: 'Archive status' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
