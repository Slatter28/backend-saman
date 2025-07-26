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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { MovimientosService } from './movimientos.service';
import {
  CreateEntradaDto,
  CreateSalidaDto,
  UpdateMovimientoDto,
  QueryMovimientoDto,
  ExcelQueryDto,
  InventarioExcelQueryDto,
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

  @Get('excel')
  @Roles('admin', 'bodeguero')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Descargar reporte de movimientos en Excel' })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename="movimientos.xlsx"',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async downloadExcel(
    @Query() queryDto: ExcelQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.movimientosService.generateExcelReport(queryDto);

    const fileName = `movimientos_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('inventario-excel')
  @Roles('admin', 'bodeguero')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Descargar reporte de inventario consolidado en Excel' })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel de inventario generado exitosamente',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename="inventario.xlsx"',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async downloadInventarioExcel(
    @Query() queryDto: InventarioExcelQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.movimientosService.generateInventarioExcelReport(queryDto);

    const fileName = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get()
  @Roles('admin', 'bodeguero')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener resumen general del inventario con filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventario general obtenido exitosamente',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getInventarioGeneral(
    @Query('bodegaId') bodegaId?: string,
    @Query('productoId') productoId?: string,
    @Query('stockMinimo') stockMinimo?: string,
    @Query('soloStockBajo') soloStockBajo?: string,
    @Query('incluirCeros') incluirCeros?: string,
  ) {
    // Convertir y validar parámetros
    const filtros = {
      bodegaId: bodegaId ? parseInt(bodegaId) : undefined,
      productoId: productoId ? parseInt(productoId) : undefined,
      stockMinimo: stockMinimo ? parseFloat(stockMinimo) : undefined,
      soloStockBajo: soloStockBajo === 'true',
      incluirCeros: incluirCeros === 'true',
    };

    return this.movimientosService.getInventarioGeneral(filtros);
  }

  @Get('kardex/:productId')
  @Roles('admin', 'bodeguero')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
