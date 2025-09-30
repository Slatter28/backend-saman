import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
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

  // 🆕 NUEVO CAMPO
  @ApiProperty({
    description: 'ID de la bodega a la que desea acceder',
    enum: ['principal', 'sucursal'],
    example: 'principal',
    required: false,
  })
  @IsOptional()
  @IsEnum(['principal', 'sucursal'], {
    message: 'La bodega debe ser principal o sucursal',
  })
  bodegaId?: string;
}