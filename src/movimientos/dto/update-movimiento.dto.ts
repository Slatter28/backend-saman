import {
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
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
    description: 'Nuevas observaciones',
    example: 'Movimiento actualizado',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
