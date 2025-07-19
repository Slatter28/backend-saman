import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class MovimientosRecientesDto {
  @ApiPropertyOptional({
    description: 'Número de movimientos a retornar',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class ProductosStockBajoDto {
  @ApiPropertyOptional({
    description: 'Límite de stock para considerar bajo',
    default: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  limite?: number = 5;
}
