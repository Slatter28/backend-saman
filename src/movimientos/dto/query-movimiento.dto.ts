import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsPositive,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMovimientoDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

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
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
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
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  bodegaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de cliente',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
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
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  usuarioId?: number;
}
