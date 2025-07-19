import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards';
import { MovimientosRecientesDto } from './dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('estadisticas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas generales del sistema',
    description:
      'Retorna el total de productos, clientes, bodegas y movimientos del día y mes actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        totalProductos: 150,
        totalClientes: 45,
        totalBodegas: 8,
        movimientosHoy: 12,
        movimientosEsteMes: 245,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getEstadisticas() {
    return this.dashboardService.getEstadisticasGenerales();
  }

  @Get('movimientos-recientes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener movimientos recientes',
    description:
      'Retorna los últimos movimientos con información de producto, bodega, cliente y usuario',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de movimientos a retornar (máximo 50)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Movimientos recientes obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 1,
          tipo: 'entrada',
          cantidad: 100,
          fecha: '2024-01-15T10:30:00.000Z',
          producto: {
            id: 1,
            descripcion: 'Laptop HP',
          },
          bodega: {
            id: 1,
            nombre: 'Bodega Central',
          },
          cliente: {
            id: 1,
            nombre: 'Empresa ABC',
          },
          usuario: {
            id: 1,
            nombre: 'Juan Pérez',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getMovimientosRecientes(@Query() query: MovimientosRecientesDto) {
    const limit = query.limit || 10;
    return this.dashboardService.getMovimientosRecientes(limit);
  }

  @Get('productos-stock-bajo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener productos con stock bajo',
    description:
      'Retorna productos cuyo stock actual está por debajo del límite especificado',
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    description: 'Límite de stock para considerar bajo',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Productos con stock bajo obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 1,
          codigo: 'PROD001',
          descripcion: 'Laptop HP',
          stock_actual: 3,
          precio_promedio: 1500.0,
        },
        {
          id: 2,
          codigo: 'PROD002',
          descripcion: 'Mouse Logitech',
          stock_actual: 2,
          precio_promedio: 25.5,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProductosStockBajo(@Query('limite') limite?: number) {
    const limiteStock = limite || 5;
    return this.dashboardService.getProductosStockBajo(limiteStock);
  }

  @Get('graficos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener datos para gráficos del dashboard',
    description:
      'Retorna datos agregados para generar gráficos: movimientos por día, entradas vs salidas, top productos y movimientos por bodega',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos para gráficos obtenidos exitosamente',
    schema: {
      example: {
        movimientosPorDia: [
          { fecha: '2024-01-15', cantidad: 12 },
          { fecha: '2024-01-16', cantidad: 8 },
        ],
        entradasVsSalidas: [
          { fecha: '2024-01-15', tipo: 'entrada', cantidad: 7 },
          { fecha: '2024-01-15', tipo: 'salida', cantidad: 5 },
        ],
        topProductosMasMovidos: [
          {
            descripcion: 'Laptop HP',
            total_movimientos: 45,
            cantidad_total: 150,
          },
        ],
        movimientosPorBodega: [
          {
            nombre: 'Bodega Central',
            total_movimientos: 120,
            entradas: 80,
            salidas: 40,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getDatosGraficos() {
    return this.dashboardService.getDatosGraficos();
  }

  @Get('inventario-resumen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener resumen de inventario por bodega',
    description:
      'Retorna un resumen del inventario actual agrupado por bodega con productos y cantidades',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de inventario obtenido exitosamente',
    schema: {
      example: [
        {
          bodega_id: 1,
          bodega_nombre: 'Bodega Central',
          total_productos: 25,
          stock_total: 1500,
          productos: [
            {
              producto_id: 1,
              producto_descripcion: 'Laptop HP',
              stock_actual: 15,
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getInventarioResumen() {
    return this.dashboardService.getInventarioResumen();
  }
}
