import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan PÃ©rez',
    required: false,
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({
    description: 'Correo electrÃ³nico del usuario',
    example: 'juan.perez@email.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiProperty({
    description: 'ContraseÃ±a del usuario (mÃ­nimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseÃ±a debe tener al menos 6 caracteres' })
  contrasena?: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: ['admin', 'bodeguero'],
    example: 'bodeguero',
    required: false,
  })
  @IsOptional()
  @IsEnum(['admin', 'bodeguero'], {
    message: 'El rol debe ser admin o bodeguero',
  })
  rol?: 'admin' | 'bodeguero';

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
  bodegaId?: 'principal' | 'sucursal';

  @ApiProperty({
    description: 'Estado del usuario (activo/inactivo)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
