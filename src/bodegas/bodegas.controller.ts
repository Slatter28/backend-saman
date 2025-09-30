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
import { BodegasService } from './bodegas.service';
import { CreateBodegaDto, UpdateBodegaDto, QueryBodegaDto } from './dto';
import { CustomJwtGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@ApiTags('bodegas')
@Controller('bodegas')
export class BodegasController {
  constructor(private readonly bodegasService: BodegasService) {}

  @Get()
  @UseGuards(CustomJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener lista de bodegas con paginación y filtros ',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de bodegas obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 1,
            nombre: 'Bodega Principal',
            ubicacion: 'Primer piso, Sector A',
          },
          {
            id: 2,
            nombre: 'Bodega Secundaria',
            ubicacion: 'Segundo piso, Sector B',
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
  findAll(@Query() queryDto: QueryBodegaDto) {
    return this.bodegasService.findAll(queryDto);
  }

  @Get(':id')
  @UseGuards(CustomJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener una bodega por ID ' })
  @ApiParam({
    name: 'id',
    description: 'ID de la bodega',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Bodega encontrada',
    schema: {
      example: {
        id: 1,
        nombre: 'Bodega Principal',
        ubicacion: 'Primer piso, Sector A',
        movimientos: [],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Bodega no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bodegasService.findOne(id);
  }

  @Get(':id/inventario')
  @UseGuards(CustomJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener inventario de una bodega ' })
  @ApiParam({
    name: 'id',
    description: 'ID de la bodega',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Inventario de la bodega',
    schema: {
      example: {
        bodega: {
          id: 1,
          nombre: 'Bodega Principal',
          ubicacion: 'Primer piso, Sector A',
        },
        inventario: [
          {
            producto: {
              id: 1,
              codigo: 'PROD001',
              descripcion: 'Laptop Dell Inspiron 15',
              unidadMedida: 'und',
            },
            stock: 10,
          },
        ],
        totalProductos: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Bodega no encontrada' })
  getInventario(@Param('id', ParseIntPipe) id: number) {
    return this.bodegasService.getInventarioBodega(id);
  }

  @Post()
  @UseGuards(CustomJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear una nueva bodega' })
  @ApiResponse({
    status: 201,
    description: 'Bodega creada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Bodega Principal',
        ubicacion: 'Primer piso, Sector A',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 409, description: 'Bodega con este nombre ya existe' })
  create(@Body() createBodegaDto: CreateBodegaDto) {
    return this.bodegasService.create(createBodegaDto);
  }

  @Patch(':id')
  @UseGuards(CustomJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar una bodega' })
  @ApiParam({
    name: 'id',
    description: 'ID de la bodega',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Bodega actualizada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Bodega Principal Actualizada',
        ubicacion: 'Primer piso, Sector A',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Bodega no encontrada' })
  @ApiResponse({ status: 409, description: 'Bodega con este nombre ya existe' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBodegaDto: UpdateBodegaDto,
  ) {
    return this.bodegasService.update(id, updateBodegaDto);
  }

  @Delete(':id')
  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar una bodega (solo administradores)' })
  @ApiParam({
    name: 'id',
    description: 'ID de la bodega',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Bodega eliminada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar, tiene movimientos asociados',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Bodega no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bodegasService.remove(id);
  }
}
