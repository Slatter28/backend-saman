import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan PÃ©rez',
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Correo electrÃ³nico del usuario',
    example: 'juan.perez@email.com',
  })
  @IsEmail()
  correo: string;

  @ApiProperty({
    description: 'ContraseÃ±a del usuario (mÃ­nimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'La contraseÃ±a debe tener al menos 6 caracteres' })
  contrasena: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: ['admin', 'bodeguero'],
    example: 'bodeguero',
  })
  @IsEnum(['admin', 'bodeguero'], {
    message: 'El rol debe ser admin o bodeguero',
  })
  rol: 'admin' | 'bodeguero';

  // ðŸ†• NUEVO CAMPO
  @ApiProperty({
    description: 'ID de la bodega a la que pertenece el usuario',
    enum: ['principal', 'sucursal'],
    example: 'principal',
    required: false,
  })
  @IsOptional()
  @IsEnum(['principal', 'sucursal'], {
    message: 'La bodega debe ser principal o sucursal',
  })
  bodegaId?: string;

  @ApiProperty({
    description: 'Estado del usuario (activo/inactivo)',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  estado?: boolean;
}