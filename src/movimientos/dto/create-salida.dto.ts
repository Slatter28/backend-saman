import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalidaDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  productoId: number;

  @ApiProperty({
    description: 'ID de la bodega',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  bodegaId: number;

  @ApiProperty({
    description: 'Cantidad de productos a sacar',
    example: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({
    description: 'ID del cliente (opcional)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  clienteId?: number;

  @ApiPropertyOptional({
    description: 'Observaciones sobre la salida',
    example: 'Venta a cliente XYZ',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
