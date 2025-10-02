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

export class IngredienteDto {
  @ApiProperty({
    description: 'ID del producto ingrediente',
    example: 3,
  })
  @IsInt()
  @IsPositive()
  productoId: number;

  @ApiProperty({
    description: 'Cantidad del ingrediente a descontar',
    example: 2,
  })
  @IsPositive()
  @Min(0.01)
  cantidad: number;
}

export class CrearComboDto {
  @ApiProperty({
    description: 'ID de la bodega donde se realizará la operación',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  bodegaId: number;

  @ApiProperty({
    description: 'ID del producto combo que se creará (entrada)',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  productoComboId: number;

  @ApiProperty({
    description: 'Lista de ingredientes con sus cantidades (salidas)',
    type: [IngredienteDto],
    example: [
      { productoId: 3, cantidad: 2 },
      { productoId: 4, cantidad: 2 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe haber al menos un ingrediente' })
  @ValidateNested({ each: true })
  @Type(() => IngredienteDto)
  ingredientes: IngredienteDto[];
}
