import {
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovimientoDto {
  @ApiPropertyOptional({
    description: 'Nueva cantidad',
    example: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cantidad?: number;

  @ApiPropertyOptional({
    description: 'Nuevo precio unitario',
    example: 30.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  precio?: number;

  @ApiPropertyOptional({
    description: 'Nueva bodega asociada al movimiento',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  bodegaId?: number;

  @ApiPropertyOptional({
    description: 'Nuevas observaciones',
    example: 'Movimiento actualizado',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
