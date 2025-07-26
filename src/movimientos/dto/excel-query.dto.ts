import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

function ToNumber() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  });
}

export class ExcelQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de movimiento',
    enum: ['entrada', 'salida'],
    example: 'entrada',
  })
  @IsOptional()
  @IsEnum(['entrada', 'salida'])
  tipo?: 'entrada' | 'salida';

  @ApiPropertyOptional({
    description: 'Filtrar por ID de producto',
    example: 1,
  })
  @IsOptional()
  @ToNumber()
  productoId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por código de producto',
    example: 'PROD001',
  })
  @IsOptional()
  @IsString()
  productoCodigo?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de bodega',
    example: 1,
  })
  @IsOptional()
  @ToNumber()
  bodegaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de cliente',
    example: 1,
  })
  @IsOptional()
  @ToNumber()
  clienteId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar desde fecha (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Filtrar hasta fecha (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de usuario',
    example: 1,
  })
  @IsOptional()
  @ToNumber()
  usuarioId?: number;
}