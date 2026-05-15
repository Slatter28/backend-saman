import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProductoDto {
  @ApiPropertyOptional({
    description: 'NÃºmero de pÃ¡gina',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por pÃ¡gina',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Buscar por cÃ³digo del producto',
    example: 'PROD001',
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Buscar por descripciÃ³n del producto',
    example: 'Laptop',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de unidad de medida',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  unidadMedidaId?: number;
}
