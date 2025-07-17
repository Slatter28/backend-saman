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
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto, QueryClienteDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de clientes con paginación y filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 1,
            nombre: 'Empresa ABC S.A.',
            telefono: '+57 300 123 4567',
            email: 'contacto@empresaabc.com',
            direccion: 'Calle 123 #45-67, Bogotá',
            tipo: 'cliente',
            creadoEn: '2024-01-15T10:30:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  findAll(@Query() queryDto: QueryClienteDto) {
    return this.clientesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del cliente',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    schema: {
      example: {
        id: 1,
        nombre: 'Empresa ABC S.A.',
        telefono: '+57 300 123 4567',
        email: 'contacto@empresaabc.com',
        direccion: 'Calle 123 #45-67, Bogotá',
        tipo: 'cliente',
        creadoEn: '2024-01-15T10:30:00.000Z',
        movimientos: [],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Get(':id/movimientos')
  @ApiOperation({ summary: 'Obtener historial de movimientos de un cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID del cliente',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de movimientos del cliente',
    schema: {
      example: {
        cliente: {
          id: 1,
          nombre: 'Empresa ABC S.A.',
          tipo: 'cliente',
          email: 'contacto@empresaabc.com',
          telefono: '+57 300 123 4567',
        },
        movimientos: [
          {
            id: 1,
            tipo: 'salida',
            cantidad: 5,
            precio_unitario: 100.0,
            precio_total: 500.0,
            fecha: '2024-01-15T10:30:00.000Z',
            observacion: 'Venta a cliente',
            producto: {
              id: 1,
              codigo: 'PROD001',
              descripcion: 'Laptop Dell',
            },
            bodega: {
              id: 1,
              nombre: 'Bodega Principal',
            },
            usuario: {
              id: 1,
              nombre: 'Juan Pérez',
            },
          },
        ],
        totalMovimientos: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  getMovimientos(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.getMovimientosCliente(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente creado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Empresa ABC S.A.',
        telefono: '+57 300 123 4567',
        email: 'contacto@empresaabc.com',
        direccion: 'Calle 123 #45-67, Bogotá',
        tipo: 'cliente',
        creadoEn: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 409, description: 'Cliente con este email ya existe' })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID del cliente',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Empresa ABC S.A. Actualizada',
        telefono: '+57 300 123 4567',
        email: 'contacto@empresaabc.com',
        direccion: 'Calle 123 #45-67, Bogotá',
        tipo: 'cliente',
        creadoEn: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'Cliente con este email ya existe' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar un cliente (solo administradores)' })
  @ApiParam({
    name: 'id',
    description: 'ID del cliente',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente eliminado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar, tiene movimientos asociados',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }
}
