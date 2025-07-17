import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nombre del cliente o proveedor',
    example: 'Empresa ABC S.A.',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+57 300 123 4567',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'contacto@empresaabc.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    description: 'Dirección física',
    example: 'Calle 123 #45-67, Bogotá',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiProperty({
    description: 'Tipo de cliente',
    enum: ['proveedor', 'cliente', 'ambos'],
    example: 'cliente',
  })
  @IsEnum(['proveedor', 'cliente', 'ambos'], {
    message: 'El tipo debe ser proveedor, cliente o ambos',
  })
  tipo: 'proveedor' | 'cliente' | 'ambos';
}
