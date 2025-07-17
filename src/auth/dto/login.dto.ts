import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@email.com',
  })
  @IsEmail()
  correo: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  contrasena: string;
}
