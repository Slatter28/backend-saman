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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MovimientosService } from './movimientos.service';
import {
  CreateEntradaDto,
  CreateSalidaDto,
  UpdateMovimientoDto,
  QueryMovimientoDto,
  ExcelQueryDto,
  InventarioExcelQueryDto,
  DividirProductoDto,
  CrearComboDto,
} from './dto';
import { CustomJwtGuard } from '../auth/guards/custom-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('movimientos')
@ApiBearerAuth()
@UseGuards(CustomJwtGuard, RolesGuard)
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

  @Post('dividir')
  @Roles('admin', 'bodeguero')
  @ApiOperation({
    summary: 'Dividir producto combo en múltiples productos destino',
  })
  @ApiResponse({
    status: 201,
    description:
      'División completada: 1 salida del producto origen y N entradas en productos destino',
    schema: {
      type: 'object',
      properties: {
        salida: {
          type: 'object',
          description: 'Movimiento de salida del producto origen',
        },
        entradas: {
          type: 'array',
          description: 'Lista de movimientos de entrada en productos destino',
        },
        mensaje: {
          type: 'string',
          example:
            'División completada: Se descontaron 50 unidades de PROD001 y se agregaron 3 productos destino',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto origen, productos destino o bodega no encontrados',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async dividirProducto(
    @Body() dividirProductoDto: DividirProductoDto,
    @Request() req,
  ) {
    return this.movimientosService.dividirProducto(
      dividirProductoDto,
      req.user.sub,
    );
  }

  @Post('crear-combo')
  @Roles('admin', 'bodeguero')
  @ApiOperation({
    summary: 'Crear combo desde ingredientes (N salidas + 1 entrada)',
  })
  @ApiResponse({
    status: 201,
    description:
      'Combo creado: N salidas de ingredientes y 1 entrada del producto combo',
    schema: {
      type: 'object',
      properties: {
        salidas: {
          type: 'array',
          description: 'Lista de movimientos de salida de ingredientes',
        },
        entrada: {
          type: 'object',
          description: 'Movimiento de entrada del producto combo',
        },
        mensaje: {
          type: 'string',
          example:
            'Combo creado exitosamente: Se descontaron 2 ingredientes y se agregaron 4 unidades de COMBO-RES',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente de ingredientes o datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto combo, ingredientes o bodega no encontrados',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async crearCombo(@Body() crearComboDto: CrearComboDto, @Request() req) {
    return this.movimientosService.crearCombo(crearComboDto, req.user.sub);
  }

  @Get('excel')
  @Roles('admin', 'bodeguero')
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

  @Get('plantilla/descargar')
  @Roles('admin', 'bodeguero')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Descargar plantilla Excel para carga masiva de movimientos',
    description: 'Descarga un archivo Excel con hojas de plantilla, productos, bodegas, clientes e instrucciones para la carga offline'
  })
  @ApiResponse({
    status: 200,
    description: 'Plantilla Excel generada exitosamente',
    headers: {
      'Content-Type': {
        description: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename="plantilla_movimientos.xlsx"',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async descargarPlantilla(@Res() res: Response) {
    const buffer = await this.movimientosService.generatePlantillaExcel();

    const fileName = `plantilla_movimientos_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Post('plantilla/subir')
  @Roles('admin', 'bodeguero')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir y procesar Excel con movimientos',
    description: 'Procesa el archivo Excel con movimientos y retorna el resultado del procesamiento'
  })
  @ApiBody({
    description: 'Archivo Excel con movimientos',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx) con la plantilla llena',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Excel procesado exitosamente',
    schema: {
      type: 'object',
      properties: {
        exitosos: {
          type: 'number',
          example: 45,
          description: 'Número de movimientos creados exitosamente',
        },
        fallidos: {
          type: 'number',
          example: 2,
          description: 'Número de movimientos que fallaron',
        },
        errores: {
          type: 'array',
          items: { type: 'string' },
          example: ['Fila 3: Producto "PROD-999" no encontrado', 'Fila 5: Stock insuficiente'],
          description: 'Lista de errores encontrados',
        },
        movimientos: {
          type: 'array',
          description: 'Lista de movimientos creados exitosamente',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido o formato incorrecto' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async subirPlantilla(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    if (!file.originalname.endsWith('.xlsx')) {
      throw new Error('El archivo debe ser de tipo .xlsx');
    }

    const resultado = await this.movimientosService.procesarMovimientosExcel(
      file.buffer,
      req.user.sub,
    );

    return resultado;
  }
}
