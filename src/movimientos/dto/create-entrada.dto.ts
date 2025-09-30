import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEntradaDto {
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
    description: 'Cantidad de productos',
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario del producto',
    example: 25.50,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  precio: number;

  @ApiPropertyOptional({
    description: 'ID del cliente/proveedor (opcional)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  clienteId?: number;

  @ApiPropertyOptional({
    description: 'Observaciones sobre el movimiento',
    example: 'Compra a proveedor ABC',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
