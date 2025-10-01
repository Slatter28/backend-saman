import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: '',
  })
  @IsEmail()
  correo: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  contrasena: string;

  // 🆕 NUEVO CAMPO
  @ApiProperty({
    description: 'ID de la bodega a la que desea acceder',
    // enum: ['principal', 'sucursal'],
    example: '',
    required: false,
  })
  @IsOptional()
  @IsEnum(['principal', 'sucursal'], {
    message: 'La bodega debe ser principal o sucursal',
  })
  bodegaId?: string;
}