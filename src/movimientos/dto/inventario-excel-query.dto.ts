import {
  IsOptional,
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

export class InventarioExcelQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de bodega (si no se especifica, trae todas las bodegas)',
    example: 1,
  })
  @IsOptional()
  @ToNumber()
  bodegaId?: number;
}