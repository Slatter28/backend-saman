import { IsNotEmpty, IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({
    description: 'Código único del producto',
    example: 'PROD001',
  })
  @IsNotEmpty()
  @IsString()
  codigo: string;

  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Laptop Dell Inspiron 15',
  })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'ID de la unidad de medida',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  unidadMedidaId: number;
}
