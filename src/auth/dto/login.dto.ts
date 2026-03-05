/**
 * DTO untuk payload login.
 * Class-validator memastikan format email dan password wajib ada.
 */
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  // @ApiProperty: metadata untuk Swagger UI.
  // @IsEmail/@IsNotEmpty: validasi runtime payload request.
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  // Field password wajib string dan tidak boleh kosong.
  @ApiProperty({ example: 'StrongP@ss123', description: 'User password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
