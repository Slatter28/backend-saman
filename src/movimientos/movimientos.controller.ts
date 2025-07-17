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
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { MovimientosService } from './movimientos.service';
import {
  CreateEntradaDto,
  CreateSalidaDto,
  UpdateMovimientoDto,
  QueryMovimientoDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('movimientos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Post('entrada')
  @Roles('admin', 'bodeguero')
  @ApiOperation({ summary: 'Crear nueva entrada de inventario' })
  @ApiResponse({ status: 201, description: 'Entrada creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Producto, bodega o cliente no encontrado',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async createEntrada(
    @Body() createEntradaDto: CreateEntradaDto,
    @Request() req,
  ) {
    return this.movimientosService.createEntrada(
      createEntradaDto,
      req.user.sub,
    );
  }

  @Post('salida')
  @Roles('admin', 'bodeguero')
  @ApiOperation({ summary: 'Crear nueva salida de inventario' })
  @ApiResponse({ status: 201, description: 'Salida creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o stock insuficiente',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto, bodega o cliente no encontrado',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async createSalida(@Body() createSalidaDto: CreateSalidaDto, @Request() req) {
    return this.movimientosService.createSalida(createSalidaDto, req.user.sub);
  }

  @Get()
  @Roles('admin', 'bodeguero')
  @ApiOperation({ summary: 'Obtener todos los movimientos con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos obtenida exitosamente',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAll(@Query() queryDto: QueryMovimientoDto) {
    return this.movimientosService.findAll(queryDto);
  }

  @Get('producto/:codigo')
  @Roles('admin', 'bodeguero')
  @ApiOperation({ summary: 'Obtener movimientos por código de producto' })
  @ApiParam({
    name: 'codigo',
    description: 'Código del producto',
    example: 'PROD001',
  })
  @ApiResponse({
    status: 200,
    description: 'Movimientos del producto obtenidos exitosamente',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findByProductoCodigo(@Param('codigo') codigo: string) {
    return this.movimientosService.findByProductoCodigo(codigo);
  }

  @Get('inventario')
  @Roles('admin', 'bodeguero')
  @ApiOperation({ summary: 'Obtener resumen general del inventario' })
  @ApiResponse({
    status: 200,
    description: 'Inventario general obtenido exitosamente',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getInventarioGeneral() {
    return this.movimientosService.getInventarioGeneral();
  }

  @Get('kardex/:productId')
  @Roles('admin', 'bodeguero')
  @ApiOperation({
    summary: 'Obtener kardex (historial completo) de un producto',
  })
  @ApiParam({ name: 'productId', description: 'ID del producto', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Kardex del producto obtenido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getKardexProducto(@Param('productId', ParseIntPipe) productId: number) {
    return this.movimientosService.getKardexProducto(productId);
  }

  @Get(':id')
  @Roles('admin', 'bodeguero')
  @ApiOperation({ summary: 'Obtener un movimiento por ID' })
  @ApiParam({ name: 'id', description: 'ID del movimiento', example: 1 })
  @ApiResponse({ status: 200, description: 'Movimiento obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movimientosService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar un movimiento (solo administradores)' })
  @ApiParam({ name: 'id', description: 'ID del movimiento', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Movimiento actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o stock insuficiente',
  })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovimientoDto: UpdateMovimientoDto,
  ) {
    return this.movimientosService.update(id, updateMovimientoDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar un movimiento (solo administradores)' })
  @ApiParam({ name: 'id', description: 'ID del movimiento', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Movimiento eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.movimientosService.remove(id);
    return { message: 'Movimiento eliminado exitosamente' };
  }
}
