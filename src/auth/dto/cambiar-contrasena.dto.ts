import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CambiarContrasenaDto {
  @ApiProperty({
    description: 'Nueva contraseÃ±a del usuario (mÃ­nimo 6 caracteres)',
    example: 'nuevaPassword123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'La contraseÃ±a debe tener al menos 6 caracteres' })
  contrasena: string;
}
