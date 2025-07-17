import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBodegaDto {
  @ApiProperty({
    description: 'Nombre de la bodega',
    example: 'Bodega Principal',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Ubicación física de la bodega',
    example: 'Primer piso, Sector A',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ubicacion?: string;
}
