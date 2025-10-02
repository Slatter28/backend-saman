import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
} from 'class-validator';

export class ProductoDestinoDto {
  @ApiProperty({
    description: 'ID del producto destino',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  productoId: number;

  @ApiProperty({
    description: 'Cantidad a ingresar del producto destino',
    example: 25,
  })
  @IsPositive()
  @Min(0.01)
  cantidad: number;
}

export class DividirProductoDto {
  @ApiProperty({
    description: 'ID del producto origen (combo) del cual se hará la salida',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productoOrigenId: number;

  @ApiProperty({
    description: 'ID de la bodega donde se realizará la operación',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  bodegaId: number;

  @ApiProperty({
    description: 'Cantidad total a descontar del producto origen',
    example: 50,
  })
  @IsPositive()
  @Min(0.01)
  cantidadTotal: number;

  @ApiProperty({
    description: 'Lista de productos destino con sus cantidades',
    type: [ProductoDestinoDto],
    example: [
      { productoId: 2, cantidad: 25 },
      { productoId: 6, cantidad: 10 },
      { productoId: 9, cantidad: 15 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe haber al menos un producto destino' })
  @ValidateNested({ each: true })
  @Type(() => ProductoDestinoDto)
  productosDestino: ProductoDestinoDto[];
}
