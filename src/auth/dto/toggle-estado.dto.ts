import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleEstadoDto {
  @ApiProperty({
    description: 'Estado del usuario (true = activo, false = inactivo)',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  estado: boolean;
}
