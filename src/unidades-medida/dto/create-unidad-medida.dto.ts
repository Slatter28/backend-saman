import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnidadMedidaDto {
  @ApiProperty({
    description: 'Nombre de la unidad de medida',
    example: 'und',
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción de la unidad de medida',
    example: 'Unidad',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
