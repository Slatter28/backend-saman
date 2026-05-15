import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryBodegaDto {
  @ApiPropertyOptional({
    description: 'NÃºmero de pÃ¡gina',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por pÃ¡gina',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Buscar por nombre de la bodega',
    example: 'Principal',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Buscar por ubicaciÃ³n de la bodega',
    example: 'Primer piso',
  })
  @IsOptional()
  @IsString()
  ubicacion?: string;
}
