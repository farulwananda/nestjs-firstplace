import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ example: 'My First Note', description: 'Note title' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  @ApiPropertyOptional({
    example: 'This is the content of my note',
    description: 'Note content',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
