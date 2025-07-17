import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UnidadesMedidaService } from './unidades-medida.service';
import {
  CreateUnidadMedidaDto,
  UpdateUnidadMedidaDto,
  QueryUnidadMedidaDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@ApiTags('unidades-medida')
@Controller('unidades-medida')
export class UnidadesMedidaController {
  constructor(private readonly unidadesMedidaService: UnidadesMedidaService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de unidades de medida con paginación y filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades de medida obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 1,
            nombre: 'und',
            descripcion: 'Unidad',
          },
          {
            id: 2,
            nombre: 'kg',
            descripcion: 'Kilogramo',
          },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  findAll(@Query() queryDto: QueryUnidadMedidaDto) {
    return this.unidadesMedidaService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una unidad de medida por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la unidad de medida',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Unidad de medida encontrada',
    schema: {
      example: {
        id: 1,
        nombre: 'und',
        descripcion: 'Unidad',
        productos: [],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Unidad de medida no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unidadesMedidaService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear una nueva unidad de medida' })
  @ApiResponse({
    status: 201,
    description: 'Unidad de medida creada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'und',
        descripcion: 'Unidad',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 409,
    description: 'Unidad de medida con este nombre ya existe',
  })
  create(@Body() createUnidadMedidaDto: CreateUnidadMedidaDto) {
    return this.unidadesMedidaService.create(createUnidadMedidaDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar una unidad de medida' })
  @ApiParam({
    name: 'id',
    description: 'ID de la unidad de medida',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Unidad de medida actualizada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'und',
        descripcion: 'Unidad actualizada',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Unidad de medida no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Unidad de medida con este nombre ya existe',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnidadMedidaDto: UpdateUnidadMedidaDto,
  ) {
    return this.unidadesMedidaService.update(id, updateUnidadMedidaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar una unidad de medida (solo administradores)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la unidad de medida',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Unidad de medida eliminada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar, tiene productos asociados',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Unidad de medida no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unidadesMedidaService.remove(id);
  }
}
