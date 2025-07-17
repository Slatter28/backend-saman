import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsPositive,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryClienteDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Buscar por nombre del cliente',
    example: 'Empresa ABC',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de cliente',
    enum: ['proveedor', 'cliente', 'ambos'],
    example: 'cliente',
  })
  @IsOptional()
  @IsEnum(['proveedor', 'cliente', 'ambos'])
  tipo?: 'proveedor' | 'cliente' | 'ambos';

  @ApiPropertyOptional({
    description: 'Buscar por email',
    example: 'contacto@empresa.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}
