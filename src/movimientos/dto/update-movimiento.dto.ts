import {
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovimientoDto {
  @ApiPropertyOptional({
    description: 'Nueva cantidad',
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  cantidad?: number;

  @ApiPropertyOptional({
    description: 'Nuevo precio unitario',
    example: 120.0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  precio_unitario?: number;

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
